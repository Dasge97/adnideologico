function maskSessionId(value) {
  if (typeof value !== "string" || value.length < 8) return null;
  return `${value.slice(0, 8)}...`;
}

function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    const sessionId = maskSessionId(
      (req.body && req.body.session_id) || (req.query && req.query.session_id) || req.headers["x-session-id"]
    );

    const log = {
      timestamp: new Date().toISOString(),
      level: "info",
      message: "http_request",
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      duration_ms: Number(durationMs.toFixed(2)),
      ip: req.ip,
      session_id: sessionId,
    };

    // eslint-disable-next-line no-console
    console.log(JSON.stringify(log));
  });

  next();
}

module.exports = {
  requestLogger,
};
