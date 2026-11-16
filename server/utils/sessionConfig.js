/**
 * Session and cookie configuration.
 *
 * The admin session is an opaque random token stored in an HttpOnly cookie.
 * The database stores only its SHA-256 hash, so a database leak does not
 * expose usable session tokens. Cookies are host-only (no Domain attribute),
 * which also makes the Vercel `/api` proxy a first-party cookie.
 */

const parseBoolean = (value, fallback) => {
  if (value === undefined || value === null || value === "") return fallback;

  if (/^(true|1|yes|on)$/i.test(String(value).trim())) return true;
  if (/^(false|0|no|off)$/i.test(String(value).trim())) return false;

  return fallback;
};

const parseMinutes = (value, fallback, minimum, maximum) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) return fallback;

  return Math.min(maximum, Math.max(minimum, Math.trunc(parsed)));
};

const VALID_SAME_SITE = new Set(["lax", "strict", "none"]);

export const getSessionConfig = () => {
  const production = process.env.NODE_ENV === "production";

  const ttlMinutes = parseMinutes(
    process.env.SESSION_TTL_MINUTES,
    120,
    5,
    1440
  );

  const idleMinutes = parseMinutes(
    process.env.SESSION_IDLE_MINUTES,
    30,
    5,
    ttlMinutes
  );

  const retentionDays = parseMinutes(
    process.env.SESSION_RETENTION_DAYS,
    7,
    1,
    90
  );

  const secure = parseBoolean(
    process.env.SESSION_COOKIE_SECURE,
    production
  );

  const requestedSameSite = String(
    process.env.SESSION_COOKIE_SAMESITE || (production ? "none" : "lax")
  )
    .trim()
    .toLowerCase();

  const sameSite = VALID_SAME_SITE.has(requestedSameSite)
    ? requestedSameSite
    : production
      ? "none"
      : "lax";

  // A SameSite=None cookie without Secure is rejected by browsers. Failing
  // loudly here is safer than issuing a cookie that silently never persists.
  if (sameSite === "none" && !secure) {
    throw new Error(
      "SESSION_COOKIE_SAMESITE=none requires SESSION_COOKIE_SECURE=true."
    );
  }

  return {
    production,
    ttlMs: ttlMinutes * 60 * 1000,
    idleMs: idleMinutes * 60 * 1000,
    ttlMinutes,
    idleMinutes,
    retentionMs: retentionDays * 24 * 60 * 60 * 1000,
    secure,
    sameSite,
    // __Host- enforces Secure, Path=/ and no Domain. It is only valid when
    // the cookie is actually Secure; local HTTP Docker uses the plain name.
    cookieName: secure
      ? "__Host-portfolio_session"
      : "portfolio_session",
  };
};

export const getSessionCookieOptions = (config, maxAge) => ({
  httpOnly: true,
  secure: config.secure,
  sameSite: config.sameSite,
  path: "/",
  ...(maxAge === undefined ? {} : { maxAge }),
});

export const setSessionCookie = (res, token, config) => {
  res.cookie(
    config.cookieName,
    token,
    getSessionCookieOptions(config, config.ttlMs)
  );
};

export const clearSessionCookie = (res, config) => {
  res.clearCookie(
    config.cookieName,
    getSessionCookieOptions(config)
  );
};

export const readSessionCookie = (req, config) => {
  const header = req?.headers?.cookie;

  if (typeof header !== "string" || !header) return "";

  for (const part of header.split(";")) {
    const separator = part.indexOf("=");

    if (separator < 0) continue;

    const name = part.slice(0, separator).trim();

    if (name !== config.cookieName) continue;

    const value = part.slice(separator + 1).trim();

    try {
      return decodeURIComponent(value);
    } catch {
      return "";
    }
  }

  return "";
};

export default {
  getSessionConfig,
  getSessionCookieOptions,
  setSessionCookie,
  clearSessionCookie,
  readSessionCookie,
};
