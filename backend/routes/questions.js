const express = require("express");
const db = require("../db");

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT question_id, axis_id, ordinal, context, statement
       FROM questions
       WHERE is_active = TRUE
       ORDER BY ordinal ASC`
    );

    const data = rows.map((q) => ({
      ...q,
      scale: {
        min: 1,
        max: 7,
        neutral: 4,
      },
    }));

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

module.exports = router;
