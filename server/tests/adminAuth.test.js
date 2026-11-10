import assert from "node:assert/strict";
import test from "node:test";

import bcrypt from "bcryptjs";

import {
  getAdminAuthConfig,
  validateAdminAuthConfig,
  verifyAdminCredentials,
} from "../utils/adminAuth.js";

const MANAGED_KEYS = [
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
  "ADMIN_PASSWORD_HASH",
];

const originalEnv = Object.fromEntries(
  MANAGED_KEYS.map((key) => [key, process.env[key]])
);

const clearAdminEnv = () => {
  for (const key of MANAGED_KEYS) {
    delete process.env[key];
  }
};

const setAdminEnv = (values) => {
  clearAdminEnv();

  for (const [key, value] of Object.entries(values)) {
    process.env[key] = value;
  }
};

test.beforeEach(clearAdminEnv);

test.after(() => {
  for (const key of MANAGED_KEYS) {
    if (originalEnv[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = originalEnv[key];
    }
  }
});

test("plain-text env password accepts only the exact credentials", async () => {
  setAdminEnv({
    ADMIN_EMAIL: "Owner@Gmail.com",
    ADMIN_PASSWORD: "A-very-long-test-password-2026!",
  });

  assert.equal(
    await verifyAdminCredentials(
      "owner@gmail.com",
      "A-very-long-test-password-2026!"
    ),
    true
  );

  assert.equal(
    await verifyAdminCredentials(
      "owner@gmail.com",
      "wrong-password-2026!"
    ),
    false
  );

  assert.equal(
    await verifyAdminCredentials(
      "someone@gmail.com",
      "A-very-long-test-password-2026!"
    ),
    false
  );
});

test("bcrypt hash mode accepts the matching password", async () => {
  const hash = await bcrypt.hash(
    "A-very-long-test-password-2026!",
    4
  );

  setAdminEnv({
    ADMIN_EMAIL: "owner@gmail.com",
    ADMIN_PASSWORD_HASH: hash,
  });

  assert.equal(
    await verifyAdminCredentials(
      "owner@gmail.com",
      "A-very-long-test-password-2026!"
    ),
    true
  );

  assert.equal(
    await verifyAdminCredentials(
      "owner@gmail.com",
      "wrong-password-2026!"
    ),
    false
  );
});

test("bcrypt hash takes precedence when both forms are set", async () => {
  const hash = await bcrypt.hash("hash-wins-2026!", 4);

  setAdminEnv({
    ADMIN_EMAIL: "owner@gmail.com",
    ADMIN_PASSWORD: "plain-loses-2026!",
    ADMIN_PASSWORD_HASH: hash,
  });

  assert.equal(
    await verifyAdminCredentials("owner@gmail.com", "hash-wins-2026!"),
    true
  );

  assert.equal(
    await verifyAdminCredentials(
      "owner@gmail.com",
      "plain-loses-2026!"
    ),
    false
  );
});

test("password comparison handles different lengths safely", async () => {
  setAdminEnv({
    ADMIN_EMAIL: "owner@gmail.com",
    ADMIN_PASSWORD: "A-very-long-test-password-2026!",
  });

  assert.equal(
    await verifyAdminCredentials("owner@gmail.com", "short"),
    false
  );

  assert.equal(
    await verifyAdminCredentials("owner@gmail.com", "x".repeat(2000)),
    false
  );
});

test("getAdminAuthConfig reports the selected mode", () => {
  setAdminEnv({
    ADMIN_EMAIL: "owner@gmail.com",
    ADMIN_PASSWORD: "A-very-long-test-password-2026!",
  });

  assert.equal(getAdminAuthConfig().mode, "plain");

  setAdminEnv({
    ADMIN_EMAIL: "owner@gmail.com",
    ADMIN_PASSWORD_HASH:
      "$2b$12$MM.M8B/gxoDRm.rt0HZ.oOyIBD29Y21uTjFtPmwxCregLh6DXGZXa",
  });

  assert.equal(getAdminAuthConfig().mode, "hash");
});

test("validation rejects short, placeholder, and missing passwords", () => {
  setAdminEnv({ ADMIN_EMAIL: "owner@gmail.com" });

  assert.ok(
    validateAdminAuthConfig().errors.some((error) =>
      error.includes("ADMIN_PASSWORD")
    )
  );

  setAdminEnv({
    ADMIN_EMAIL: "owner@gmail.com",
    ADMIN_PASSWORD: "short",
  });

  assert.ok(
    validateAdminAuthConfig().errors.some((error) =>
      error.includes("at least 12")
    )
  );

  setAdminEnv({
    ADMIN_EMAIL: "owner@gmail.com",
    ADMIN_PASSWORD: "PASTE_YOUR_ADMIN_PASSWORD_HERE",
  });

  assert.ok(
    validateAdminAuthConfig().errors.some((error) =>
      error.includes("placeholder")
    )
  );
});

test("validation rejects a placeholder admin email", () => {
  setAdminEnv({
    ADMIN_EMAIL: "your-real-admin@gmail.com",
    ADMIN_PASSWORD: "A-very-long-test-password-2026!",
  });

  assert.ok(
    validateAdminAuthConfig().errors.some((error) =>
      error.includes("ADMIN_EMAIL is still a placeholder")
    )
  );
});

test("validation accepts a strong plain password and warns in production", () => {
  setAdminEnv({
    ADMIN_EMAIL: "owner@gmail.com",
    ADMIN_PASSWORD: "A-very-long-test-password-2026!",
  });

  const result = validateAdminAuthConfig({ production: true });

  assert.equal(result.errors.length, 0);
  assert.ok(
    result.warnings.some((warning) =>
      warning.includes("plain text")
    )
  );
});

test("validation rejects an invalid bcrypt hash", () => {
  setAdminEnv({
    ADMIN_EMAIL: "owner@gmail.com",
    ADMIN_PASSWORD_HASH: "not-a-bcrypt-hash",
  });

  assert.ok(
    validateAdminAuthConfig().errors.some((error) =>
      error.includes("valid bcrypt hash")
    )
  );
});
