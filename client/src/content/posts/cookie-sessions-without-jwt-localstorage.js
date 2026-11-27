export default {
  slug: "cookie-sessions-without-jwt-localstorage",
  title: "Cookie Sessions Without the JWT Tax",
  description:
    "How the admin area uses an opaque HttpOnly cookie, a SHA-256 token hash in MySQL, absolute and idle timeouts, and a per-session CSRF token instead of a JWT in localStorage.",
  date: "2026-11-23",
  tags: ["Security", "Node.js", "Cookies", "CSRF"],
  category: "Security",
  blocks: [
    {
      type: "p",
      text: "The admin area is one environment-configured account with full CRUD access. That makes its session design worth more attention than the rest of the portfolio. The implementation does not put a JWT in localStorage. It issues an opaque random token in an HttpOnly cookie and stores only the token's SHA-256 hash in the database.",
    },
    { type: "h2", id: "browser", text: "What the browser receives" },
    {
      type: "p",
      text: "A successful POST /api/auth/login returns the CSRF token, the absolute expiry timestamp and the admin identity. It does not return the session token. The token exists only in the Set-Cookie response header, with attributes that keep JavaScript and other origins away from it.",
    },
    {
      type: "code",
      lang: "http",
      code: "Set-Cookie: __Host-portfolio_session=<opaque token>;\n  HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=7200",
    },
    {
      type: "p",
      text: "The cookie is host-only because no Domain attribute is set. In production the Secure flag is on and the __Host- prefix enforces Secure, Path=/ and no Domain. Local Docker runs over plain HTTP, so it uses the unprefixed portfolio_session name with Secure=false.",
    },
    {
      type: "p",
      text: "The browser never reads the session token in application code. The admin client stores the CSRF token in memory or session state and sends it as X-CSRF-Token on state-changing requests. The CSRF token is not a bearer credential on its own: it only matters together with the session cookie.",
    },
    { type: "h2", id: "database", text: "What the database stores" },
    {
      type: "p",
      text: "The admin_sessions table has a CHAR(64) primary key called token_hash, the admin email, a CHAR(64) csrf_token, three BIGINT millisecond timestamps and a nullable revoked_at. The cookie token is 32 random bytes encoded with base64url; the database receives sha256(token), never the token itself.",
    },
    {
      type: "code",
      lang: "sql",
      code: "CREATE TABLE admin_sessions (\n  token_hash CHAR(64) NOT NULL PRIMARY KEY,\n  admin_email VARCHAR(254) NOT NULL,\n  csrf_token CHAR(64) NOT NULL,\n  created_at BIGINT NOT NULL,\n  last_seen_at BIGINT NOT NULL,\n  expires_at BIGINT NOT NULL,\n  revoked_at BIGINT NULL DEFAULT NULL\n);",
    },
    {
      type: "p",
      text: "A database dump therefore does not hand an attacker a working cookie. The token has 256 bits of entropy, so a fast hash is enough; the point is to make the stored value unusable, not to slow down a password guess.",
    },
    { type: "h2", id: "timeouts", text: "Absolute and idle timeouts" },
    {
      type: "p",
      text: "The default session lives for 120 minutes from login and expires after 30 minutes without activity. The first is an absolute limit; the second is an idle limit. Both are checked on every authenticated request. When either is exceeded, the row is revoked and the cookie is rejected.",
    },
    {
      type: "p",
      text: "The values are bounded at startup: SESSION_TTL_MINUTES and SESSION_IDLE_MINUTES must be integers from 5 to 1440, and the idle window cannot be longer than the absolute TTL. SESSION_RETENTION_DAYS controls how long expired or revoked rows remain for audit before cleanup.",
    },
    {
      type: "code",
      lang: "js",
      code: "if (now >= expiresAt) {\n  return reject(SESSION_STATES.EXPIRED, SESSION_ACTIONS.REVOKE_AND_REJECT);\n}\n\nif (now - lastSeenAt > idleMs) {\n  return reject(\n    SESSION_STATES.IDLE_TIMEOUT,\n    SESSION_ACTIONS.REVOKE_AND_REJECT\n  );\n}",
    },
    { type: "h2", id: "csrf", text: "CSRF is a second lock" },
    {
      type: "p",
      text: "Cookies are sent automatically, which is convenient and also the reason CSRF exists. The API uses three layers: SameSite=Lax on the cookie, a trusted-origin guard on every request, and a per-session CSRF token required in X-CSRF-Token for POST, PUT, PATCH and DELETE. GET, HEAD and OPTIONS are treated as safe methods and do not require the header.",
    },
    {
      type: "p",
      text: "The CSRF check is a synchronizer token, not a double-submit cookie. The expected value lives in the session row and is compared with a constant-time equality helper. The client gets the value from login or GET /api/auth/session and includes it on the next mutation.",
    },
    {
      type: "code",
      lang: "js",
      code: "if (\n  csrfRequired &&\n  (!submittedCsrf || !safeEqual(submittedCsrf, session.csrf_token))\n) {\n  return reject(SESSION_STATES.CSRF_INVALID);\n}",
    },
    {
      type: "callout",
      variant: "note",
      title: "Two different jobs",
      text: "HttpOnly protects the session token from page JavaScript. CSRF protection stops another site from making the browser use that cookie. One does not replace the other.",
    },
    { type: "h2", id: "revocation", text: "Revocation is immediate" },
    {
      type: "p",
      text: "Logout sets revoked_at on the current row and clears the cookie. Logout-all revokes every session for the admin email. Changing ADMIN_EMAIL also invalidates old rows because the session owner no longer matches the configured identity. The next request with an old cookie receives 401, without waiting for an expiry timestamp.",
    },
    {
      type: "p",
      text: "This is the main reason the project did not choose a stateless JWT. A JWT can be verified without a database round trip, but revocation needs a denylist or a very short lifetime. A server-side session needs a lookup on every protected request, but the lookup is the revocation mechanism.",
    },
    {
      type: "p",
      text: "One operational detail follows from that design: the session row is tied to the admin email, not to the password hash. Rotating the password does not by itself invalidate existing sessions. After a credential change, use logout-all or clear the admin_sessions rows so old cookies stop working.",
    },
    { type: "h2", id: "state-machine", text: "One state machine, nine outcomes" },
    {
      type: "p",
      text: "The decision logic is a pure function, evaluateSession, rather than a set of conditionals spread across middleware. It distinguishes an unknown token, a revoked row, an invalid timestamp, an absolute expiry, an idle timeout, a changed admin email, an invalid CSRF token and an active session. The middleware handles a missing cookie before it calls the function.",
    },
    {
      type: "p",
      text: "Keeping the ordering explicit makes the security behavior testable without a database. The session model handles SQL; the middleware reads the cookie, calls the state machine and sends the appropriate 401 or 403 response.",
    },
    { type: "h2", id: "next", text: "The next layer: MFA and a narrow admin surface" },
    {
      type: "p",
      text: "ADMIN_TOTP_SECRET optionally adds a six-digit authenticator code after the password check. MFA is a warning, not a fatal error, in production, because the site can still be secure without it; enabling it is a deployment decision. The admin API is also excluded from search at the response-header layer and never appears in the sitemap.",
    },
    {
      type: "list",
      ordered: false,
      items: [
        "The login response has no token field; the session token is only in the cookie.",
        "The cookie is HttpOnly, Secure in production, SameSite=Lax and host-only.",
        "Only the SHA-256 hash of the session token is stored.",
        "Unsafe methods require the session's CSRF token in X-CSRF-Token.",
        "Logout revokes the row immediately; logout-all revokes every session.",
        "Session TTL, idle time and retention are validated at startup.",
      ],
    },
    {
      type: "p",
      text: "The CI job proves the important parts against the Docker stack: login succeeds without exposing a token field, the cookie is HttpOnly, protected routes accept it, a state change without X-CSRF-Token returns 403, a request from an untrusted origin returns 403, and a revoked cookie returns 401. Those checks are more useful than a claim that the design is secure.",
    },
  ],
};
