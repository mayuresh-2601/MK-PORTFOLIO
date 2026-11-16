import crypto from "node:crypto";

/**
 * Small security primitives shared by sessions, CSRF checks and tests.
 * Keep them dependency-free so the auth path has a minimal supply chain.
 */

export const sha256 = (value) =>
  crypto.createHash("sha256").update(String(value ?? ""), "utf8").digest("hex");

export const randomToken = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("base64url");

export const randomHex = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");

/**
 * Constant-time comparison for values of the same length. Fixed-length
 * session/CSRF tokens always take the same code path; a length mismatch is
 * rejected before timingSafeEqual, which would otherwise throw.
 */
export const safeEqual = (left, right) => {
  const a = Buffer.from(String(left ?? ""), "utf8");
  const b = Buffer.from(String(right ?? ""), "utf8");

  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
};

export default {
  sha256,
  randomToken,
  randomHex,
  safeEqual,
};
