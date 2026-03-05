const express = require("express");
const db = require("../db");
const { incCounter } = require("../lib/metrics");

const router = express.Router();
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

router.post("/", async (req, res) => {
  const { session_id = null, message } = req.body || {};

  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "message is required" });
  }
  if (session_id !== null && !UUID_REGEX.test(String(session_id))) {
    return res.status(400).json({ error: "session_id must be a valid UUID when provided" });
  }

  try {
    if (session_id) {
      const sessionLookup = await db.query(`SELECT 1 FROM sessions WHERE session_id = $1`, [session_id]);
      if (sessionLookup.rowCount === 0) {
        return res.status(404).json({ error: "Session not found" });
      }
    }

    await db.query(
      `INSERT INTO feedback_messages (session_id, message)
       VALUES ($1, $2)`,
      [session_id, message.trim()]
    );

    incCounter("feedback_submitted");
    return res.status(201).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: "Failed to save feedback" });
  }
});

module.exports = router;
