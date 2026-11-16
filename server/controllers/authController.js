import {
  getAdminAuthConfig,
  getAdminMfaConfig,
  verifyAdminCredentials,
} from "../utils/adminAuth.js";
import {
  clearSessionCookie,
  getSessionConfig,
  setSessionCookie,
} from "../utils/sessionConfig.js";
import {
  cleanupSessions,
  createSession,
  revokeAllSessions,
  revokeSession,
} from "../models/sessionModel.js";
import { getClientIp } from "../utils/clientIp.js";
import {
  randomHex,
  randomToken,
  sha256,
} from "../utils/security.js";
import { verifyTotp } from "../utils/totp.js";
import {
  requestContext,
  securityEvent,
} from "../utils/securityLog.js";

/*
   Admin Login

   Exactly one email/password pair is accepted. The pair is read from the
   server environment (ADMIN_EMAIL + ADMIN_PASSWORD or ADMIN_PASSWORD_HASH),
   never from the database. Both fields are checked on every request so an
   attacker cannot tell which one was wrong from the response or its timing.

   A successful password check creates a short-lived, server-side session.
   The browser receives an opaque token in an HttpOnly cookie, never a JWT
   that JavaScript (or localStorage) can read.
*/

const MAX_EMAIL_LENGTH = 254;
const MAX_PASSWORD_LENGTH = 1024;

const safeContext = (req, extra = {}) => ({
  ...requestContext(req, {
    ip: getClientIp(req),
  }),
  ...extra,
});

export const login = async (req, res, next) => {
  try {
    const rawEmail = req.body?.email;
    const rawPassword = req.body?.password;

    // Validate types before touching the credential helpers.
    if (
      typeof rawEmail !== "string" ||
      typeof rawPassword !== "string" ||
      !rawEmail.trim() ||
      !rawPassword
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const email = rawEmail.trim().toLowerCase();
    const password = rawPassword;

    if (
      email.length > MAX_EMAIL_LENGTH ||
      password.length > MAX_PASSWORD_LENGTH
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const adminConfig = getAdminAuthConfig();

    if (!adminConfig.email || adminConfig.mode === "none") {
      console.error(
        "Authentication environment variables are missing or invalid."
      );

      return res.status(500).json({
        success: false,
        message: "Server configuration error.",
      });
    }

    const credentialsMatch = await verifyAdminCredentials(
      email,
      password
    );

    if (!credentialsMatch) {
      securityEvent(
        "auth.login.failed",
        safeContext(req, { reason: "credentials" })
      );

      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const mfa = getAdminMfaConfig();

    if (mfa.enabled) {
      const code =
        typeof req.body?.totp === "string"
          ? req.body.totp.trim()
          : "";

      if (!verifyTotp(mfa.secret, code)) {
        securityEvent(
          "auth.login.failed",
          safeContext(req, {
            reason: code ? "mfa_invalid" : "mfa_required",
          })
        );

        return res.status(401).json({
          success: false,
          mfaRequired: true,
          message: "Enter a valid 6-digit authenticator code.",
        });
      }
    }

    const sessionConfig = getSessionConfig();
    const token = randomToken(32);
    const tokenHash = sha256(token);
    const csrfToken = randomHex(32);
    const now = Date.now();
    const expiresAt = now + sessionConfig.ttlMs;

    await createSession({
      tokenHash,
      email: adminConfig.email,
      csrfToken,
      now,
      expiresAt,
    });

    // Best-effort housekeeping; never block a successful login on it.
    cleanupSessions(now - sessionConfig.retentionMs).catch(() => {});

    setSessionCookie(res, token, sessionConfig);

    securityEvent(
      "auth.login.succeeded",
      safeContext(req, {
        mfa: mfa.enabled,
        expiresAt,
      })
    );

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      csrfToken,
      expiresAt,
      mfaEnabled: mfa.enabled,
      user: {
        email: adminConfig.email,
        role: "admin",
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Login Error:", error);
    }

    next(error);
  }
};

export const getSession = async (req, res) => {
  return res.status(200).json({
    success: true,
    csrfToken: req.session.csrfToken,
    expiresAt: req.session.expiresAt,
    user: req.user,
  });
};

export const logout = async (req, res, next) => {
  try {
    const sessionConfig = getSessionConfig();

    if (req.session?.tokenHash) {
      await revokeSession(req.session.tokenHash);
    }

    clearSessionCookie(res, sessionConfig);

    securityEvent("auth.logout", safeContext(req));

    return res.status(200).json({
      success: true,
      message: "Logged out.",
    });
  } catch (error) {
    next(error);
  }
};

export const logoutAll = async (req, res, next) => {
  try {
    const sessionConfig = getSessionConfig();
    const result = await revokeAllSessions(req.user.email);

    clearSessionCookie(res, sessionConfig);

    securityEvent(
      "auth.logout_all",
      safeContext(req, { revokedSessions: result.affectedRows })
    );

    return res.status(200).json({
      success: true,
      message: "All admin sessions have been revoked.",
      revokedSessions: result.affectedRows,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  login,
  getSession,
  logout,
  logoutAll,
};
