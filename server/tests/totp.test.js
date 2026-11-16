import assert from "node:assert/strict";
import test from "node:test";

import {
  buildOtpAuthUrl,
  decodeBase32,
  encodeBase32,
  generateTotp,
  generateTotpSecret,
  isValidTotpSecret,
  verifyTotp,
} from "../utils/totp.js";

/*
 * RFC 6238 test vectors use the ASCII secret "12345678901234567890".
 * Base32 of that string is GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ.
 */
const RFC_SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

test("base32 round-trips binary data", () => {
  const original = Buffer.from("portfolio-totp-secret", "utf8");

  assert.deepEqual(decodeBase32(encodeBase32(original)), original);
});

test("base32 decoding tolerates spaces, dashes and lowercase", () => {
  const secret = "gezd gnbv-gy3t qojq gezd gnbv gy3t qojq";

  assert.equal(decodeBase32(secret).toString("ascii"), "12345678901234567890");
});

test("generated secrets are valid and long enough", () => {
  const secret = generateTotpSecret();

  assert.equal(secret.length, 32);
  assert.ok(isValidTotpSecret(secret));
  assert.notEqual(secret, generateTotpSecret());
});

test("invalid secrets are rejected", () => {
  assert.equal(isValidTotpSecret(""), false);
  assert.equal(isValidTotpSecret("SHORT"), false);
  assert.equal(isValidTotpSecret("AAAAAAAAAAAAAAAA1"), false);
});

test("RFC 6238 SHA-1 vector at T=59", () => {
  assert.equal(
    generateTotp(RFC_SECRET, { timestamp: 59_000, digits: 8 }),
    "94287082"
  );

  assert.equal(
    verifyTotp(RFC_SECRET, "94287082", {
      timestamp: 59_000,
      digits: 8,
    }),
    true
  );
});

test("the verification window accepts the previous and next code", () => {
  const now = 1_700_000_000_000;
  const previous = generateTotp(RFC_SECRET, {
    timestamp: now - 30_000,
  });
  const next = generateTotp(RFC_SECRET, {
    timestamp: now + 30_000,
  });

  assert.equal(verifyTotp(RFC_SECRET, previous, { timestamp: now }), true);
  assert.equal(verifyTotp(RFC_SECRET, next, { timestamp: now }), true);
});

test("a code outside the window or with the wrong shape is rejected", () => {
  const now = 1_700_000_000_000;

  assert.equal(
    verifyTotp(RFC_SECRET, "000000", { timestamp: now }),
    false
  );
  assert.equal(verifyTotp(RFC_SECRET, "12345", { timestamp: now }), false);
  assert.equal(verifyTotp(RFC_SECRET, "abcdef", { timestamp: now }), false);
  assert.equal(verifyTotp("NOT-BASE32", "123456", { timestamp: now }), false);
});

test("a secret with spaces is accepted at verification time", () => {
  const now = 1_700_000_000_000;
  const code = generateTotp(RFC_SECRET, { timestamp: now });
  const spaced = RFC_SECRET.match(/.{1,4}/g).join(" ");

  assert.equal(verifyTotp(spaced, code, { timestamp: now }), true);
});

test("the otpauth URL contains the account and issuer", () => {
  const url = buildOtpAuthUrl({
    secret: RFC_SECRET,
    accountName: "owner@gmail.com",
  });

  assert.match(url, /^otpauth:\/\/totp\//);
  assert.match(url, /secret=GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ/);
  assert.match(url, /digits=6/);
  assert.match(url, /period=30/);
  assert.match(url, /issuer=Mayuresh%20Kasar%20Portfolio/);
});
