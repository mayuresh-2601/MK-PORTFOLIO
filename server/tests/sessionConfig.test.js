import assert from "node:assert/strict";
import test from "node:test";

import {
  clearSessionCookie,
  getSessionConfig,
  getSessionCookieOptions,
  readSessionCookie,
  setSessionCookie,
} from "../utils/sessionConfig.js";

const MANAGED_KEYS = [
  "NODE_ENV",
  "SESSION_TTL_MINUTES",
  "SESSION_IDLE_MINUTES",
  "SESSION_RETENTION_DAYS",
  "SESSION_COOKIE_SECURE",
  "SESSION_COOKIE_SAMESITE",
];

const originalEnv = Object.fromEntries(
  MANAGED_KEYS.map((key) => [key, process.env[key]])
);

const setEnv = (overrides = {}) => {
  for (const key of MANAGED_KEYS) delete process.env[key];

  for (const [key, value] of Object.entries(overrides)) {
    process.env[key] = value;
  }
};

test.beforeEach(() => setEnv());

test.after(() => {
  for (const key of MANAGED_KEYS) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
});

test("defaults are short-lived and suitable for local HTTP", () => {
  const config = getSessionConfig();

  assert.equal(config.production, false);
  assert.equal(config.ttlMinutes, 120);
  assert.equal(config.idleMinutes, 30);
  assert.equal(config.ttlMs, 120 * 60 * 1000);
  assert.equal(config.idleMs, 30 * 60 * 1000);
  assert.equal(config.retentionMs, 7 * 24 * 60 * 60 * 1000);
  assert.equal(config.secure, false);
  assert.equal(config.sameSite, "lax");
  assert.equal(config.cookieName, "portfolio_session");
});

test("production defaults to Secure, SameSite=None, __Host- cookie", () => {
  const config = getSessionConfig();

  process.env.NODE_ENV = "production";

  const production = getSessionConfig();

  assert.equal(production.secure, true);
  assert.equal(production.sameSite, "none");
  assert.equal(production.cookieName, "__Host-portfolio_session");
  assert.notEqual(config.cookieName, production.cookieName);
});

test("custom lifetimes are applied", () => {
  setEnv({
    SESSION_TTL_MINUTES: "60",
    SESSION_IDLE_MINUTES: "10",
    SESSION_RETENTION_DAYS: "3",
  });

  const config = getSessionConfig();

  assert.equal(config.ttlMinutes, 60);
  assert.equal(config.idleMinutes, 10);
  assert.equal(config.retentionMs, 3 * 24 * 60 * 60 * 1000);
});

test("out-of-range lifetimes are clamped to safe bounds", () => {
  setEnv({
    SESSION_TTL_MINUTES: "-5",
    SESSION_IDLE_MINUTES: "99999",
    SESSION_RETENTION_DAYS: "0",
  });

  const config = getSessionConfig();

  assert.equal(config.ttlMinutes, 5);
  assert.equal(config.idleMinutes, 5);
  assert.equal(config.retentionMs, 24 * 60 * 60 * 1000);
});

test("the idle timeout cannot exceed the absolute lifetime", () => {
  setEnv({
    SESSION_TTL_MINUTES: "30",
    SESSION_IDLE_MINUTES: "120",
  });

  const config = getSessionConfig();

  assert.equal(config.ttlMinutes, 30);
  assert.equal(config.idleMinutes, 30);
});

test("SameSite=None without Secure fails closed", () => {
  setEnv({
    SESSION_COOKIE_SAMESITE: "none",
    SESSION_COOKIE_SECURE: "false",
  });

  assert.throws(
    () => getSessionConfig(),
    /requires SESSION_COOKIE_SECURE=true/
  );
});

test("an unknown SameSite value falls back safely", () => {
  setEnv({ SESSION_COOKIE_SAMESITE: "sometimes" });

  assert.equal(getSessionConfig().sameSite, "lax");

  process.env.NODE_ENV = "production";

  assert.equal(getSessionConfig().sameSite, "none");
});

test("the secure cookie flag can be explicitly disabled for CI", () => {
  process.env.NODE_ENV = "production";
  process.env.SESSION_COOKIE_SECURE = "false";
  process.env.SESSION_COOKIE_SAMESITE = "lax";

  const config = getSessionConfig();

  assert.equal(config.secure, false);
  assert.equal(config.cookieName, "portfolio_session");
});

test("cookie options are HttpOnly, path-scoped and not domain-scoped", () => {
  const config = getSessionConfig();
  const options = getSessionCookieOptions(config, config.ttlMs);

  assert.equal(options.httpOnly, true);
  assert.equal(options.path, "/");
  assert.equal(options.maxAge, config.ttlMs);
  assert.equal(Object.hasOwn(options, "domain"), false);
});

test("the cookie can be set, read back and cleared", () => {
  const config = getSessionConfig();
  const calls = [];

  const res = {
    cookie(name, value, options) {
      calls.push({ name, value, options });
    },
    clearCookie(name, options) {
      calls.push({ name, cleared: true, options });
    },
  };

  setSessionCookie(res, "opaque-token", config);

  assert.equal(calls[0].name, config.cookieName);
  assert.equal(calls[0].value, "opaque-token");
  assert.equal(calls[0].options.httpOnly, true);

  const header = `${config.cookieName}=opaque-token; other=value`;

  assert.equal(
    readSessionCookie({ headers: { cookie: header } }, config),
    "opaque-token"
  );

  assert.equal(
    readSessionCookie(
      { headers: { cookie: `${config.cookieName}=a%20b` } },
      config
    ),
    "a b"
  );

  assert.equal(
    readSessionCookie(
      { headers: { cookie: `${config.cookieName}=%E0%A4%A` } },
      config
    ),
    ""
  );

  assert.equal(readSessionCookie({ headers: {} }, config), "");
  assert.equal(readSessionCookie(undefined, config), "");

  clearSessionCookie(res, config);

  assert.equal(calls[1].name, config.cookieName);
  assert.equal(calls[1].cleared, true);
});
