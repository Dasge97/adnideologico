const express = require("express");
const db = require("../db");
const { toAxisScores } = require("../lib/scoring");
const { incCounter } = require("../lib/metrics");

const router = express.Router();
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function loadAxisScoresRows(sessionId) {
  const { rows } = await db.query(
    `SELECT ax.code,
            score_data.axis_score
     FROM axes ax
     LEFT JOIN (
       SELECT q.axis_id,
              SUM(
                (CASE WHEN q.is_reversed THEN -1 ELSE 1 END)
                * ((a.value - 4)::numeric / 3)
                * q.weight
              ) / NULLIF(SUM(q.weight), 0) AS axis_score
       FROM answers a
       INNER JOIN questions q ON q.question_id = a.question_id
       WHERE a.session_id = $1
       GROUP BY q.axis_id
     ) AS score_data ON score_data.axis_id = ax.axis_id
     ORDER BY ax.axis_id`,
    [sessionId]
  );

  return rows;
}

router.post("/session", async (req, res) => {
  const { ip_hash = null, user_agent = null } = req.body || {};

  try {
    const { rows } = await db.query(
      `INSERT INTO sessions (ip_hash, user_agent)
       VALUES ($1, $2)
       RETURNING session_id`,
      [ip_hash, user_agent]
    );

    incCounter("sessions_started");
    res.status(201).json({ session_id: rows[0].session_id });
  } catch (error) {
    res.status(500).json({ error: "Failed to create session" });
  }
});

router.post("/finish", async (req, res) => {
  const { session_id } = req.body || {};

  if (!session_id) {
    return res.status(400).json({ error: "session_id is required" });
  }
  if (!UUID_REGEX.test(String(session_id))) {
    return res.status(400).json({ error: "session_id must be a valid UUID" });
  }

  try {
    const existingSession = await db.query(
      `SELECT session_id, finished_at
       FROM sessions
       WHERE session_id = $1`,
      [session_id]
    );

    if (existingSession.rowCount === 0) {
      return res.status(404).json({ error: "Session not found" });
    }
    if (existingSession.rows[0].finished_at) {
      const rows = await loadAxisScoresRows(session_id);
      return res.json(toAxisScores(rows));
    }

    const { rows: progressRows } = await db.query(
      `SELECT
         (SELECT COUNT(*)::int
          FROM answers a
          INNER JOIN questions q ON q.question_id = a.question_id
          WHERE a.session_id = $1
            AND q.is_active = TRUE) AS answered_count,
         (SELECT COUNT(*)::int FROM questions WHERE is_active = TRUE) AS total_questions`,
      [session_id]
    );

    const progress = progressRows[0];
    if (progress.answered_count < progress.total_questions) {
      return res.status(400).json({
        error: `Incomplete test: ${progress.answered_count}/${progress.total_questions} answered`,
      });
    }

    const rows = await loadAxisScoresRows(session_id);

    await db.query(
      `UPDATE sessions
       SET finished_at = NOW()
       WHERE session_id = $1`,
      [session_id]
    );

    incCounter("sessions_finished");
    return res.json(toAxisScores(rows));
  } catch (error) {
    return res.status(500).json({ error: "Failed to finish session" });
  }
});

module.exports = router;
