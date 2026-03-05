function createRateLimit({ windowMs, max }) {
  const bucket = new Map();

  return function rateLimit(req, res, next) {
    const now = Date.now();
    if (bucket.size > 10_000) {
      for (const [bucketKey, value] of bucket.entries()) {
        if (value.resetAt <= now) bucket.delete(bucketKey);
      }
    }

    const routeKey = `${req.method}:${req.baseUrl || req.path}`;
    const key = `${req.ip}:${routeKey}`;
    const hit = bucket.get(key);

    if (!hit || hit.resetAt <= now) {
      bucket.set(key, { count: 1, resetAt: now + windowMs });
      res.setHeader("X-RateLimit-Limit", String(max));
      res.setHeader("X-RateLimit-Remaining", String(max - 1));
      return next();
    }

    if (hit.count >= max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((hit.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfterSeconds));
      res.setHeader("X-RateLimit-Limit", String(max));
      res.setHeader("X-RateLimit-Remaining", "0");
      return res.status(429).json({ error: "Too many requests. Please retry shortly." });
    }

    hit.count += 1;
    bucket.set(key, hit);
    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader("X-RateLimit-Remaining", String(Math.max(0, max - hit.count)));
    return next();
  };
}

module.exports = {
  createRateLimit,
};
