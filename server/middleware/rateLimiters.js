import { ipKeyGenerator, rateLimit } from "express-rate-limit";

import { getClientIp } from "../utils/clientIp.js";
import { securityEvent } from "../utils/securityLog.js";

/**
 * Shared rate limiters.
 *
 * Express cannot see the visitor's address directly: Render terminates the
 * request on a private proxy address. `getClientIp` resolves the real address
 * from Cloudflare's edge headers, and `ipKeyGenerator` keeps IPv6 clients in
 * the same subnet bucket so they cannot rotate addresses to bypass a limit.
 * Limits are intentionally generous for normal browsing and strict for
 * login/contact/AI abuse.
 *
 * The daily AI counters are in-memory. They reset on a deploy or Render
 * restart, so they are a cost brake rather than a billing guarantee. The
 * per-minute limiter remains the hard burst control.
 */

const clientIpKey = (req) => ipKeyGenerator(getClientIp(req));

const positiveInteger = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const jsonHandler = (message, event) => (req, res) => {
  securityEvent(
    "rate_limit.exceeded",
    {
      requestId: req.id,
      limiter: event,
      ip: getClientIp(req),
      method: req.method,
      path: String(req.originalUrl || "").split("?")[0],
    }
  );

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
    "Too many requests. Please try again in a few minutes.",
    "api"
  ),
});

export const systemLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  keyGenerator: clientIpKey,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: jsonHandler(
    "Too many telemetry requests. Please wait a minute and try again.",
    "system"
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
    "Too many login attempts. Please wait 15 minutes and try again.",
    "auth"
  ),
});

export const messageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  keyGenerator: clientIpKey,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: jsonHandler(
    "Too many messages sent. Please wait a few minutes and try again.",
    "contact"
  ),
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  keyGenerator: clientIpKey,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: jsonHandler(
    "Too many AI requests. Please wait a minute and try again.",
    "ai_burst"
  ),
});

export const aiDailyLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  limit: positiveInteger(process.env.AI_DAILY_LIMIT, 50),
  keyGenerator: clientIpKey,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: jsonHandler(
    "You have reached today's AI usage limit. Please try again tomorrow.",
    "ai_daily"
  ),
});

export const aiGlobalDailyLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  limit: positiveInteger(process.env.AI_GLOBAL_DAILY_LIMIT, 500),
  keyGenerator: () => "global",
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: jsonHandler(
    "The AI assistant has reached its daily capacity. Please try again later.",
    "ai_global_daily"
  ),
});

/**
 * Emergency kill switch. Set AI_ENABLED=false to stop all paid model calls
 * without redeploying code. Unset or true keeps the feature available.
 */
export const requireAiEnabled = (req, res, next) => {
  const disabled = /^(false|0|no|off)$/i.test(
    String(process.env.AI_ENABLED || "").trim()
  );

  if (!disabled) return next();

  securityEvent("ai.disabled_request", {
    requestId: req.id,
    ip: getClientIp(req),
    path: String(req.originalUrl || "").split("?")[0],
  });

  return res.status(503).json({
    success: false,
    message: "The AI assistant is temporarily unavailable.",
  });
};
