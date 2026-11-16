import assert from "node:assert/strict";
import test from "node:test";

import {
  getAllowedOrigins,
  getRequestOrigin,
  isAllowedOrigin,
  normalizeOrigin,
  requireTrustedOrigin,
} from "../utils/origin.js";

const MANAGED_KEYS = ["NODE_ENV", "CLIENT_URL", "ALLOW_VERCEL_PREVIEWS"];
const originalEnv = Object.fromEntries(
  MANAGED_KEYS.map((key) => [key, process.env[key]])
);

const setEnv = (overrides = {}) => {
  for (const key of MANAGED_KEYS) delete process.env[key];

  for (const [key, value] of Object.entries({
    NODE_ENV: "test",
    CLIENT_URL: "https://portfolio.example.com, https://www.portfolio.example.com/",
    ALLOW_VERCEL_PREVIEWS: "false",
    ...overrides,
  })) {
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

const makeRequest = ({
  method = "POST",
  origin,
  referer,
} = {}) => ({
  method,
  id: "test-request",
  clientIp: "203.0.113.10",
  originalUrl: "/api/messages?debug=1",
  get(name) {
    if (name === "origin") return origin;
    if (name === "referer") return referer;
    return undefined;
  },
});

const runMiddleware = (req) =>
  new Promise((resolve) => {
    const res = {
      statusCode: 200,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(body) {
        this.body = body;
        resolve({ next: false, status: this.statusCode, body });
        return this;
      },
    };

    const result = requireTrustedOrigin(req, res, () =>
      resolve({ next: true, status: 200, body: null })
    );

    if (result && typeof result.then === "function") {
      result.catch((error) => resolve({ error }));
    }
  });

test("normalizeOrigin trims whitespace and one trailing slash", () => {
  assert.equal(
    normalizeOrigin("  https://example.com/  "),
    "https://example.com"
  );
  assert.equal(normalizeOrigin(null), "");
});

test("CLIENT_URL is parsed into a clean allowlist", () => {
  assert.deepEqual(getAllowedOrigins(), [
    "https://portfolio.example.com",
    "https://www.portfolio.example.com",
  ]);
});

test("an exact configured origin is allowed in production", () => {
  assert.equal(
    isAllowedOrigin("https://portfolio.example.com", { production: true }),
    true
  );
});

test("unknown, null and malformed origins are rejected", () => {
  assert.equal(
    isAllowedOrigin("https://evil.example", { production: true }),
    false
  );
  assert.equal(isAllowedOrigin("null", { production: true }), false);
  assert.equal(isAllowedOrigin("", { production: true }), false);
});

test("localhost is only trusted outside production", () => {
  assert.equal(
    isAllowedOrigin("http://localhost:5173", { production: false }),
    true
  );
  assert.equal(
    isAllowedOrigin("http://localhost:5173", { production: true }),
    false
  );
});

test("Vercel previews require the explicit opt-in", () => {
  const preview = "https://mk-portfolio-preview.vercel.app";

  assert.equal(isAllowedOrigin(preview, { production: true }), false);

  process.env.ALLOW_VERCEL_PREVIEWS = "true";

  assert.equal(isAllowedOrigin(preview, { production: true }), true);
  assert.equal(
    isAllowedOrigin("https://vercel.app.evil.example", { production: true }),
    false
  );
});

test("Origin is preferred and Referer is the fallback", () => {
  assert.equal(
    getRequestOrigin(
      makeRequest({
        origin: "https://portfolio.example.com/",
        referer: "https://other.example/page",
      })
    ),
    "https://portfolio.example.com"
  );

  assert.equal(
    getRequestOrigin(
      makeRequest({ referer: "https://portfolio.example.com/contact?x=1" })
    ),
    "https://portfolio.example.com"
  );

  assert.equal(
    getRequestOrigin(makeRequest({ referer: "not a url" })),
    ""
  );
});

test("safe methods bypass the origin requirement", async () => {
  const result = await runMiddleware(makeRequest({ method: "GET" }));

  assert.equal(result.next, true);
});

test("a trusted Origin passes in production", async () => {
  process.env.NODE_ENV = "production";

  const result = await runMiddleware(
    makeRequest({ origin: "https://portfolio.example.com" })
  );

  assert.equal(result.next, true);
});

test("a trusted Referer passes when Origin is absent", async () => {
  process.env.NODE_ENV = "production";

  const result = await runMiddleware(
    makeRequest({ referer: "https://portfolio.example.com/contact" })
  );

  assert.equal(result.next, true);
});

test("a cross-site Origin is rejected with 403", async () => {
  process.env.NODE_ENV = "production";

  const result = await runMiddleware(
    makeRequest({ origin: "https://evil.example" })
  );

  assert.equal(result.next, false);
  assert.equal(result.status, 403);
  assert.equal(result.body.success, false);
});

test("a production state change without Origin or Referer is rejected", async () => {
  process.env.NODE_ENV = "production";

  const result = await runMiddleware(makeRequest());

  assert.equal(result.next, false);
  assert.equal(result.status, 403);
});

test("development tooling may omit Origin", async () => {
  const result = await runMiddleware(makeRequest());

  assert.equal(result.next, true);
});
