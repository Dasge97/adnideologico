const express = require("express");
const db = require("../db");
const { incCounter } = require("../lib/metrics");

const router = express.Router();
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

router.post("/", async (req, res) => {
  const { session_id, question_id, value } = req.body || {};
  const parsedQuestionId = Number(question_id);
  const parsedValue = Number(value);

  if (!session_id || !Number.isInteger(parsedQuestionId) || !Number.isInteger(parsedValue)) {
    return res
      .status(400)
      .json({ error: "session_id, question_id and integer value are required" });
  }

  if (parsedValue < 1 || parsedValue > 7) {
    return res.status(400).json({ error: "value must be between 1 and 7" });
  }
  if (!UUID_REGEX.test(String(session_id))) {
    return res.status(400).json({ error: "session_id must be a valid UUID" });
  }

  try {
    const [sessionLookup, questionLookup] = await Promise.all([
      db.query(`SELECT finished_at FROM sessions WHERE session_id = $1`, [session_id]),
      db.query(`SELECT is_active FROM questions WHERE question_id = $1`, [parsedQuestionId]),
    ]);

    if (sessionLookup.rowCount === 0) {
      return res.status(404).json({ error: "Session not found" });
    }
    if (questionLookup.rowCount === 0) {
      return res.status(404).json({ error: "Question not found" });
    }
    if (!questionLookup.rows[0].is_active) {
      return res.status(400).json({ error: "Question is not active" });
    }
    if (sessionLookup.rows[0].finished_at) {
      return res.status(409).json({ error: "Session already finished" });
    }

    await db.query(
      `INSERT INTO answers (session_id, question_id, value)
       VALUES ($1, $2, $3)
       ON CONFLICT (session_id, question_id)
       DO UPDATE SET value = EXCLUDED.value, answered_at = NOW()`,
      [session_id, parsedQuestionId, parsedValue]
    );

    incCounter("answers_submitted");
    return res.status(201).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: "Failed to save answer" });
  }
});

module.exports = router;
