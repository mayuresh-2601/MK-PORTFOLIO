import {
  requestContext,
  securityEvent,
} from "./securityLog.js";

/**
 * Browser-origin policy shared by CORS and CSRF protection.
 *
 * Cookie-authenticated state changes require a trusted Origin (or Referer
 * fallback). This blocks a malicious site from submitting a cross-site form
 * with the admin cookie attached, even though the API accepts cookies.
 */

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export const normalizeOrigin = (value) =>
  String(value ?? "").trim().replace(/\/$/, "");

export const getAllowedOrigins = () =>
  String(process.env.CLIENT_URL || "")
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean);

export const isLocalDevOrigin = (origin) => {
  if (process.env.NODE_ENV === "production") return false;

  return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(
    normalizeOrigin(origin)
  );
};

export const isAllowedOrigin = (
  origin,
  { production = process.env.NODE_ENV === "production" } = {}
) => {
  const candidate = normalizeOrigin(origin);

  if (!candidate || candidate === "null") return false;

  if (getAllowedOrigins().includes(candidate)) return true;
  if (!production && isLocalDevOrigin(candidate)) return true;

  const allowVercelPreviews = /^(true|1|yes|on)$/i.test(
    process.env.ALLOW_VERCEL_PREVIEWS || ""
  );

  if (
    allowVercelPreviews &&
    /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(candidate)
  ) {
    return true;
  }

  return false;
};

export const getRequestOrigin = (req) => {
  const origin = normalizeOrigin(req.get?.("origin"));

  if (origin) return origin;

  const referer = req.get?.("referer");

  if (!referer) return "";

  try {
    return normalizeOrigin(new URL(referer).origin);
  } catch {
    return "";
  }
};

export const requireTrustedOrigin = (req, res, next) => {
  if (SAFE_METHODS.has(String(req.method || "").toUpperCase())) {
    return next();
  }

  const origin = getRequestOrigin(req);
  const production = process.env.NODE_ENV === "production";

  // Development tools such as curl often omit Origin. Production state
  // changes must always prove where they came from.
  if (!origin && !production) {
    return next();
  }

  if (origin && isAllowedOrigin(origin, { production })) {
    return next();
  }

  securityEvent("origin.rejected", requestContext(req, {
    origin: origin || "(missing)",
  }));

  return res.status(403).json({
    success: false,
    message: "Request origin is not allowed.",
  });
};

export default {
  getAllowedOrigins,
  isAllowedOrigin,
  getRequestOrigin,
  requireTrustedOrigin,
};
