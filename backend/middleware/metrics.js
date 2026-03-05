const { incCounter, observeHistogram, renderMetrics } = require("../lib/metrics");

function normalizeRoute(req) {
  if (req.originalUrl) {
    return req.originalUrl.split("?")[0] || "/";
  }
  return req.path || "/";
}

function metricsMiddleware(req, res, next) {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const route = normalizeRoute(req);
    const statusCode = String(res.statusCode);
    const method = req.method;
    const seconds = Number(process.hrtime.bigint() - start) / 1_000_000_000;

    incCounter("http_requests_total", {
      method,
      route,
      status_code: statusCode,
    });

    observeHistogram("http_request_duration_seconds", {
      method,
      route,
      status_code: statusCode,
    }, seconds);
  });

  next();
}

function metricsEndpoint(_req, res) {
  res.setHeader("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
  return res.status(200).send(renderMetrics());
}

module.exports = {
  metricsMiddleware,
  metricsEndpoint,
};
