const express = require("express");
const { generateAiAnalysis } = require("../lib/aiAnalysis");

const router = express.Router();

router.post("/", async (req, res) => {
  const { session_id } = req.body || {};

  try {
    const payload = await generateAiAnalysis(session_id);
    return res.json(payload);
  } catch (error) {
    const status = Number(error.status || 500);
    return res.status(status).json({ error: error.message || "Failed to generate AI analysis" });
  }
});

module.exports = router;
