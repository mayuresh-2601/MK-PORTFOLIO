import { safeEqual } from "./security.js";

/*
   Session state machine.

   Authentication has a small number of states, and each one has a different
   response: some reject without touching the database, some revoke the row,
   and one allows the request. Keeping the decision in one pure function makes
   the ordering explicit and testable without a database.
*/

export const SESSION_STATES = Object.freeze({
  MISSING_COOKIE: "missing_cookie",
  NOT_FOUND: "not_found",
  REVOKED: "revoked",
  INVALID_TIMESTAMP: "invalid_timestamp",
  EXPIRED: "expired",
  IDLE_TIMEOUT: "idle_timeout",
  ADMIN_CHANGED: "admin_changed",
  CSRF_INVALID: "csrf_invalid",
  ACTIVE: "active",
});

export const SESSION_ACTIONS = Object.freeze({
  ALLOW: "allow",
  REJECT: "reject",
  REVOKE_AND_REJECT: "revoke_and_reject",
});

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export const isSafeMethod = (method) =>
  SAFE_METHODS.has(String(method || "").toUpperCase());

const reject = (state, action = SESSION_ACTIONS.REJECT) => ({
  state,
  action,
  reason: state,
});

/**
 * Evaluate one session row against the current clock and request.
 *
 * `session` is the row returned by `findSessionByToken`, or null when the
 * cookie's token hash is unknown. The returned `action` tells the caller
 * whether to allow the request, reject it, or revoke the row first.
 */
export const evaluateSession = ({
  session,
  now = Date.now(),
  idleMs,
  adminEmail = "",
  method = "GET",
  submittedCsrf = "",
  csrfRequired = !isSafeMethod(method),
} = {}) => {
  if (!session) {
    return reject(SESSION_STATES.NOT_FOUND);
  }

  if (session.revoked_at) {
    return reject(SESSION_STATES.REVOKED);
  }

  const expiresAt = Number(session.expires_at);
  const lastSeenAt = Number(session.last_seen_at);

  if (
    !Number.isFinite(now) ||
    !Number.isFinite(expiresAt) ||
    !Number.isFinite(lastSeenAt) ||
    !Number.isFinite(idleMs) ||
    idleMs <= 0
  ) {
    return reject(
      SESSION_STATES.INVALID_TIMESTAMP,
      SESSION_ACTIONS.REVOKE_AND_REJECT
    );
  }

  if (now >= expiresAt) {
    return reject(SESSION_STATES.EXPIRED, SESSION_ACTIONS.REVOKE_AND_REJECT);
  }

  if (now - lastSeenAt > idleMs) {
    return reject(
      SESSION_STATES.IDLE_TIMEOUT,
      SESSION_ACTIONS.REVOKE_AND_REJECT
    );
  }

  // The session belongs to the single env-configured admin. If the owner
  // changes ADMIN_EMAIL, all old sessions die immediately.
  const sessionEmail = String(session.admin_email || "").trim().toLowerCase();
  const configuredEmail = String(adminEmail || "").trim().toLowerCase();

  if (!configuredEmail || sessionEmail !== configuredEmail) {
    return reject(
      SESSION_STATES.ADMIN_CHANGED,
      SESSION_ACTIONS.REVOKE_AND_REJECT
    );
  }

  if (
    csrfRequired &&
    (!submittedCsrf || !safeEqual(submittedCsrf, session.csrf_token))
  ) {
    return reject(SESSION_STATES.CSRF_INVALID);
  }

  return {
    state: SESSION_STATES.ACTIVE,
    action: SESSION_ACTIONS.ALLOW,
    reason: null,
    expiresAt,
    lastSeenAt,
  };
};

export default {
  SESSION_STATES,
  SESSION_ACTIONS,
  isSafeMethod,
  evaluateSession,
};
