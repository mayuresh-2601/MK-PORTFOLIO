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
import { sha256 } from "../utils/security.js";
import {
  SESSION_ACTIONS,
  SESSION_STATES,
  evaluateSession,
} from "../utils/sessionState.js";
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
    const now = Date.now();
    const adminConfig = getAdminAuthConfig();

    const decision = evaluateSession({
      session,
      now,
      idleMs: config.idleMs,
      adminEmail: adminConfig.email,
      method: req.method,
      submittedCsrf: String(req.get("x-csrf-token") || "").trim(),
    });

    if (decision.action === SESSION_ACTIONS.REVOKE_AND_REJECT) {
      await revokeSession(tokenHash, now);
    }

    if (decision.state === SESSION_STATES.CSRF_INVALID) {
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

    if (decision.action !== SESSION_ACTIONS.ALLOW) {
      return rejectSession(res, config, decision.reason, req);
    }

    if (now - decision.lastSeenAt > TOUCH_INTERVAL_MS) {
      await touchSession(tokenHash, now);
    }

    req.user = {
      email: session.admin_email,
      role: "admin",
    };

    req.session = {
      tokenHash,
      csrfToken: session.csrf_token,
      expiresAt: decision.expiresAt,
      lastSeenAt: decision.lastSeenAt,
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
