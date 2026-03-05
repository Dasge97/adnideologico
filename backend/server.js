require("dotenv").config();

const express = require("express");
const cors = require("cors");

const questionsRoutes = require("./routes/questions");
const sessionRoutes = require("./routes/session");
const answersRoutes = require("./routes/answers");
const feedbackRoutes = require("./routes/feedback");
const analyticsRoutes = require("./routes/analytics");
const aiAnalysisRoutes = require("./routes/aiAnalysis");
const { createRateLimit } = require("./middleware/rateLimit");
const { requestLogger } = require("./middleware/requestLogger");
const { metricsMiddleware, metricsEndpoint } = require("./middleware/metrics");

const app = express();
const PORT = Number(process.env.PORT || 3001);

app.use(cors());
app.use(express.json());
app.use(requestLogger);
app.use(metricsMiddleware);

const writeLimiter = createRateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000),
  max: Number(process.env.RATE_LIMIT_MAX_WRITE || 120),
});
const finishLimiter = createRateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000),
  max: Number(process.env.RATE_LIMIT_MAX_FINISH || 30),
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});
app.get("/metrics", metricsEndpoint);

app.use("/api/questions", questionsRoutes);
app.use("/api/answer", writeLimiter, answersRoutes);
app.use("/api/feedback", writeLimiter, feedbackRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/ai-analysis", finishLimiter, aiAnalysisRoutes);
app.use("/api/finish", finishLimiter);
app.use("/api", sessionRoutes);

app.use((err, _req, res, _next) => {
  res.status(500).json({ error: err.message || "Unexpected server error" });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`ADN Ideologico backend listening on port ${PORT}`);
});
