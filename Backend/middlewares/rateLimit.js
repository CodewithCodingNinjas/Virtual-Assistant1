// Minimal in-memory sliding-window rate limiter. Zero dependencies.
// Protects the assistant endpoint (which fans out to a paid LLM API) from abuse.
// Keyed by authenticated user id when available, else by client IP.
// NOTE: in-memory state is per-process; for multi-instance/serverless deployments
// back this with Redis. Documented as a known limitation.
export function rateLimit({ windowMs = 60_000, max = 20 } = {}) {
  const hits = new Map(); // key -> number[] (timestamps)

  return (req, res, next) => {
    const key = req.userId || req.ip || "anon";
    const now = Date.now();
    const windowStart = now - windowMs;

    const arr = (hits.get(key) || []).filter((t) => t > windowStart);
    if (arr.length >= max) {
      const retryAfter = Math.ceil((arr[0] + windowMs - now) / 1000);
      res.set("Retry-After", String(retryAfter));
      return res.status(429).json({
        message: "Too many requests. Please slow down.",
        retryAfter,
      });
    }
    arr.push(now);
    hits.set(key, arr);

    // Opportunistic cleanup to bound memory.
    if (hits.size > 5000) {
      for (const [k, v] of hits) {
        const live = v.filter((t) => t > windowStart);
        if (live.length === 0) hits.delete(k);
        else hits.set(k, live);
      }
    }
    next();
  };
}

export default rateLimit;
