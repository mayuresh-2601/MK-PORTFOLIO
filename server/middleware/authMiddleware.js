import { getAdminAuthConfig } from "../utils/adminAuth.js";
import {
  findSessionByToken,
  revokeSession,
  touchSession,
} from "../models/sessionModel.js";
import {
  clearSessionCookie,
  getSessionConfig,
  readSessionCookie,
} from "../utils/sessionConfig.js";
import {
  safeEqual,
  sha256,
} from "../utils/security.js";
import {
  requestContext,
  securityError,
  securityEvent,
} from "../utils/securityLog.js";
import { getClientIp } from "../utils/clientIp.js";

/*
   Cookie-session authentication

   The browser sends an opaque session token in an HttpOnly cookie. Only the
   SHA-256 hash exists in the database, so revoking a row immediately kills
   the session. There is no JWT in localStorage and no bearer token fallback.

   State-changing requests must also present the session's CSRF token in
   X-CSRF-Token. The global origin guard is the first line of defense; this
   header is the second.
*/

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const TOUCH_INTERVAL_MS = 60 * 1000;

const rejectSession = (res, config, reason, req) => {
  clearSessionCookie(res, config);

  securityEvent(
    "auth.session.rejected",
    requestContext(req, {
      ip: getClientIp(req),
      reason,
    })
  );

  return res.status(401).json({
    success: false,
    message: "Session expired. Please sign in again.",
  });
};

export const protect = async (req, res, next) => {
  try {
    const config = getSessionConfig();
    const token = readSessionCookie(req, config);

    if (!token) {
      return rejectSession(res, config, "missing_cookie", req);
    }

    const tokenHash = sha256(token);
    const session = await findSessionByToken(tokenHash);

    if (!session) {
      return rejectSession(res, config, "not_found", req);
    }

    const now = Date.now();
    const expiresAt = Number(session.expires_at);
    const lastSeenAt = Number(session.last_seen_at);

    if (session.revoked_at) {
      return rejectSession(res, config, "revoked", req);
    }

    if (!Number.isFinite(expiresAt) || now >= expiresAt) {
      await revokeSession(tokenHash, now);
      return rejectSession(res, config, "expired", req);
    }

    if (
      !Number.isFinite(lastSeenAt) ||
      now - lastSeenAt > config.idleMs
    ) {
      await revokeSession(tokenHash, now);
      return rejectSession(res, config, "idle_timeout", req);
    }

    const adminConfig = getAdminAuthConfig();

    if (!adminConfig.email || session.admin_email !== adminConfig.email) {
      await revokeSession(tokenHash, now);
      return rejectSession(res, config, "admin_changed", req);
    }

    if (!SAFE_METHODS.has(String(req.method || "").toUpperCase())) {
      const submittedCsrf = String(
        req.get("x-csrf-token") || ""
      ).trim();

      if (
        !submittedCsrf ||
        !safeEqual(submittedCsrf, session.csrf_token)
      ) {
        securityEvent(
          "auth.csrf.rejected",
          requestContext(req, {
            ip: getClientIp(req),
            method: req.method,
            path: req.originalUrl?.split("?")[0],
          })
        );

        return res.status(403).json({
          success: false,
          code: "CSRF_TOKEN_INVALID",
          message:
            "Request verification failed. Refresh the page and try again.",
        });
      }
    }

    if (now - lastSeenAt > TOUCH_INTERVAL_MS) {
      await touchSession(tokenHash, now);
    }

    req.user = {
      email: session.admin_email,
      role: "admin",
    };

    req.session = {
      tokenHash,
      csrfToken: session.csrf_token,
      expiresAt,
      lastSeenAt,
    };

    return next();
  } catch (error) {
    securityError("auth.session.error", requestContext(req, {
      ip: getClientIp(req),
      error: error.message,
    }));

    return next(error);
  }
};

export default protect;
