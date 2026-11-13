import { ipKeyGenerator, rateLimit } from "express-rate-limit";

import { getClientIp } from "../utils/clientIp.js";

/**
 * Shared rate limiters.
 *
 * Express cannot see the visitor's address directly: Render terminates the
 * request on a private proxy address. `getClientIp` resolves the real address
 * from Cloudflare's edge headers, and `ipKeyGenerator` keeps IPv6 clients in
 * the same subnet bucket so they cannot rotate addresses to bypass a limit.
 * Limits are intentionally generous for normal browsing and strict for
 * login/contact abuse.
 */

const clientIpKey = (req) => ipKeyGenerator(getClientIp(req));

const jsonHandler = (message) => (req, res) => {
  res.status(429).json({
    success: false,
    message,
  });
};

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  keyGenerator: clientIpKey,
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
  keyGenerator: clientIpKey,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: jsonHandler(
    "Too many telemetry requests. Please wait a minute and try again."
  ),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  keyGenerator: clientIpKey,
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
  keyGenerator: clientIpKey,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: jsonHandler(
    "Too many messages sent. Please wait a few minutes and try again."
  ),
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  keyGenerator: clientIpKey,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: jsonHandler(
    "Too many AI requests. Please wait a minute and try again."
  ),
});
