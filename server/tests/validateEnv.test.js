import assert from "node:assert/strict";
import test from "node:test";

import { validateEnvironment } from "../config/validateEnv.js";

/*
 * These tests exercise the startup guard that stops a deployment with
 * placeholder infrastructure values or a weak auth configuration.
 */

const MANAGED_KEYS = [
  "PORT",
  "CLIENT_URL",
  "ALLOW_VERCEL_PREVIEWS",
  "DB_HOST",
  "DB_PORT",
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME",
  "DB_SSL",
  "DB_CONNECTION_LIMIT",
  "JWT_SECRET",
  "JWT_EXPIRES_IN",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
  "ADMIN_PASSWORD_HASH",
  "EMAIL_USER",
  "EMAIL_PASS",
  "EMAIL_TRANSPORT",
  "GMAIL_CLIENT_ID",
  "GMAIL_CLIENT_SECRET",
  "GMAIL_REFRESH_TOKEN",
  "CLOUD_NAME",
  "CLOUD_API_KEY",
  "CLOUD_API_SECRET",
  "GEMINI_API_KEY",
];

const originalEnv = Object.fromEntries(
  MANAGED_KEYS.map((key) => [key, process.env[key]])
);

const BASE_ENV = {
  PORT: "5000",
  CLIENT_URL: "https://portfolio.example.com",
  DB_HOST: "127.0.0.1",
  DB_PORT: "3306",
  DB_USER: "portfolio",
  DB_PASSWORD: "",
  DB_NAME: "portfolio",
  DB_SSL: "false",
  DB_CONNECTION_LIMIT: "10",
  JWT_SECRET:
    "9f4c1e7a2b8d5f0c3a6e9b2d7f4c1a8e5b0d3f6c9a2e7b4d1f8c5a0e3b6d9f2c",
  JWT_EXPIRES_IN: "12h",
  ADMIN_EMAIL: "owner@gmail.com",
  ADMIN_PASSWORD: "A-very-long-test-password-2026!",
  EMAIL_TRANSPORT: "none",
};

const setEnv = (overrides = {}) => {
  for (const key of MANAGED_KEYS) {
    delete process.env[key];
  }

  for (const [key, value] of Object.entries({
    ...BASE_ENV,
    ...overrides,
  })) {
    process.env[key] = value;
  }
};

test.beforeEach(() => setEnv());

test.after(() => {
  for (const key of MANAGED_KEYS) {
    if (originalEnv[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = originalEnv[key];
    }
  }
});

test("a complete production configuration passes", () => {
  const result = validateEnvironment({ production: true });

  assert.deepEqual(result.errors, []);
});

test("placeholder database hosts are fatal", () => {
  setEnv({ DB_HOST: "your-db-host" });

  const result = validateEnvironment({ production: true });

  assert.ok(
    result.errors.some((error) => error.includes("DB_HOST is still a placeholder"))
  );
});

test("placeholder database users are fatal", () => {
  setEnv({ DB_USER: "your-db-user" });

  const result = validateEnvironment({ production: true });

  assert.ok(
    result.errors.some((error) => error.includes("DB_USER is still a placeholder"))
  );
});

test("invalid ports are fatal", () => {
  setEnv({ PORT: "not-a-port" });

  const result = validateEnvironment({ production: true });

  assert.ok(
    result.errors.some((error) => error.includes("PORT must be an integer"))
  );
});

test("a short production JWT secret is fatal", () => {
  setEnv({ JWT_SECRET: "too-short" });

  const result = validateEnvironment({ production: true });

  assert.ok(
    result.errors.some((error) => error.includes("at least 32 characters"))
  );
});

test("a zero JWT lifetime is fatal", () => {
  setEnv({ JWT_EXPIRES_IN: "0" });

  const result = validateEnvironment({ production: true });

  assert.ok(
    result.errors.some((error) => error.includes("greater than zero"))
  );
});

test("production requires an explicit CLIENT_URL", () => {
  setEnv({ CLIENT_URL: "" });

  const result = validateEnvironment({ production: true });

  assert.ok(
    result.errors.some((error) => error.includes("CLIENT_URL is required"))
  );
});

test("non-HTTPS production origins are fatal", () => {
  setEnv({ CLIENT_URL: "http://portfolio.example.com" });

  const result = validateEnvironment({ production: true });

  assert.ok(
    result.errors.some((error) => error.includes("must use HTTPS"))
  );
});

test("a partial Gmail API configuration is fatal when forced", () => {
  setEnv({
    EMAIL_TRANSPORT: "gmail-api",
    EMAIL_USER: "owner@gmail.com",
    GMAIL_CLIENT_ID: "client-id.apps.googleusercontent.com",
  });

  const result = validateEnvironment({ production: true });

  assert.ok(
    result.errors.some((error) =>
      error.includes("requires EMAIL_USER, GMAIL_CLIENT_ID")
    )
  );
});

test("a placeholder sender address warns without blocking startup", () => {
  setEnv({
    EMAIL_TRANSPORT: "auto",
    EMAIL_USER: "your-real-email@gmail.com",
  });

  const result = validateEnvironment({ production: true });

  assert.deepEqual(result.errors, []);
  assert.ok(
    result.warnings.some((warning) =>
      warning.includes("EMAIL_USER is still a placeholder")
    )
  );
});

test("unconfigured optional integrations only warn", () => {
  setEnv({
    EMAIL_TRANSPORT: "auto",
    CLOUD_NAME: "",
    CLOUD_API_KEY: "",
    CLOUD_API_SECRET: "",
    GEMINI_API_KEY: "",
  });

  const result = validateEnvironment({ production: true });

  assert.deepEqual(result.errors, []);
  assert.ok(
    result.warnings.some((warning) => warning.includes("Email is not configured"))
  );
});
