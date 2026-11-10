import { rateLimit } from "express-rate-limit";

/**
 * Shared rate limiters.
 *
 * Render sits behind a proxy, and `app.set("trust proxy", 1)` makes
 * express-rate-limit use the real client IP. Limits are intentionally
 * generous for normal browsing and strict for login/contact abuse.
 */

const jsonHandler = (message) => (req, res) => {
  res.status(429).json({
    success: false,
    message,
  });
};

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip: (req) =>
    req.method === "OPTIONS" ||
    req.path === "/health" ||
    req.path === "/health/ready" ||
    // Telemetry polls continuously on the /system page. It has its own
    // limiter below so a single dashboard tab cannot exhaust the shared
    // API budget.
    req.path === "/system",
  handler: jsonHandler(
    "Too many requests. Please try again in a few minutes."
  ),
});

export const systemLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: jsonHandler(
    "Too many telemetry requests. Please wait a minute and try again."
  ),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: jsonHandler(
    "Too many login attempts. Please wait 15 minutes and try again."
  ),
});

export const messageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: jsonHandler(
    "Too many messages sent. Please wait a few minutes and try again."
  ),
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: jsonHandler(
    "Too many AI requests. Please wait a minute and try again."
  ),
});
