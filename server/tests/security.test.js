import assert from "node:assert/strict";
import test from "node:test";

import {
  randomHex,
  randomToken,
  safeEqual,
  sha256,
} from "../utils/security.js";

test("sha256 is deterministic and hex encoded", () => {
  assert.equal(
    sha256("admin-session-token"),
    "41b7e11d1bdc8c66f7012e3fa5535d38dda7fd7228ced349cbdcd32563e929eb"
  );
  assert.equal(sha256("admin-session-token").length, 64);
});

test("sha256 handles non-string values", () => {
  assert.equal(sha256(null), sha256(""));
  assert.equal(sha256(123), sha256("123"));
});

test("random tokens have the requested entropy and are URL-safe", () => {
  const first = randomToken(32);
  const second = randomToken(32);

  assert.equal(first.length, 43);
  assert.match(first, /^[A-Za-z0-9_-]+$/);
  assert.notEqual(first, second);

  assert.equal(randomHex(16).length, 32);
  assert.match(randomHex(16), /^[a-f0-9]{32}$/);
});

test("safeEqual accepts only identical strings", () => {
  assert.equal(safeEqual("token-value", "token-value"), true);
  assert.equal(safeEqual("token-value", "token-valuE"), false);
  assert.equal(safeEqual("token", "token-value"), false);
  assert.equal(safeEqual(null, ""), true);
});
