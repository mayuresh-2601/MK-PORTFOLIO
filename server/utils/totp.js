import crypto from "node:crypto";

/**
 * Minimal RFC 6238 TOTP implementation (SHA-1, 6 digits, 30-second period).
 *
 * This avoids adding an authenticator dependency to the auth path. The secret
 * is supplied by ADMIN_TOTP_SECRET and is never logged or returned.
 */

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const DEFAULT_PERIOD_SECONDS = 30;
const DEFAULT_DIGITS = 6;

const normalizeBase32 = (value) =>
  String(value ?? "")
    .toUpperCase()
    .replace(/[\s-]/g, "")
    .replace(/=+$/g, "");

export const encodeBase32 = (buffer) => {
  let bits = 0;
  let value = 0;
  let output = "";

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
};

export const decodeBase32 = (value) => {
  const normalized = normalizeBase32(value);

  if (!normalized) {
    throw new Error("TOTP secret is empty.");
  }

  let bits = 0;
  let accumulator = 0;
  const bytes = [];

  for (const character of normalized) {
    const index = BASE32_ALPHABET.indexOf(character);

    if (index === -1) {
      throw new Error("TOTP secret contains non-base32 characters.");
    }

    accumulator = (accumulator << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((accumulator >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  if (bytes.length === 0) {
    throw new Error("TOTP secret is too short.");
  }

  return Buffer.from(bytes);
};

export const isValidTotpSecret = (value) => {
  try {
    const normalized = normalizeBase32(value);

    if (normalized.length < 16) return false;

    decodeBase32(normalized);
    return true;
  } catch {
    return false;
  }
};

export const generateTotpSecret = (bytes = 20) =>
  encodeBase32(crypto.randomBytes(bytes));

const generateHotp = (key, counter, digits = DEFAULT_DIGITS) => {
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));

  const digest = crypto
    .createHmac("sha1", key)
    .update(counterBuffer)
    .digest();

  const offset = digest[digest.length - 1] & 0x0f;

  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  return String(binary % 10 ** digits).padStart(digits, "0");
};

export const generateTotp = (
  secret,
  {
    timestamp = Date.now(),
    periodSeconds = DEFAULT_PERIOD_SECONDS,
    digits = DEFAULT_DIGITS,
  } = {}
) => {
  const key = decodeBase32(secret);
  const counter = Math.floor(
    Math.trunc(timestamp / 1000) / periodSeconds
  );

  return generateHotp(key, counter, digits);
};

export const verifyTotp = (
  secret,
  code,
  {
    timestamp = Date.now(),
    periodSeconds = DEFAULT_PERIOD_SECONDS,
    digits = DEFAULT_DIGITS,
    window = 1,
  } = {}
) => {
  const normalizedCode = String(code ?? "").replace(/\s+/g, "");

  if (
    !new RegExp(`^\\d{${digits}}$`).test(normalizedCode) ||
    !isValidTotpSecret(secret)
  ) {
    return false;
  }

  const key = decodeBase32(secret);
  const currentCounter = Math.floor(
    Math.trunc(timestamp / 1000) / periodSeconds
  );

  let matched = false;

  for (let offset = -window; offset <= window; offset += 1) {
    const candidate = generateHotp(
      key,
      currentCounter + offset,
      digits
    );

    // Keep the loop constant-time enough for a six-digit human code; this is
    // not a high-volume oracle because login is separately rate-limited.
    if (
      candidate.length === normalizedCode.length &&
      crypto.timingSafeEqual(
        Buffer.from(candidate),
        Buffer.from(normalizedCode)
      )
    ) {
      matched = true;
    }
  }

  return matched;
};

export const buildOtpAuthUrl = ({
  secret,
  accountName = "admin",
  issuer = "Mayuresh Kasar Portfolio",
}) => {
  const label = `${issuer}:${accountName}`;

  return (
    `otpauth://totp/${encodeURIComponent(label)}` +
    `?secret=${encodeURIComponent(secret)}` +
    `&issuer=${encodeURIComponent(issuer)}` +
    `&algorithm=SHA1&digits=${DEFAULT_DIGITS}` +
    `&period=${DEFAULT_PERIOD_SECONDS}`
  );
};

export default {
  encodeBase32,
  decodeBase32,
  isValidTotpSecret,
  generateTotpSecret,
  generateTotp,
  verifyTotp,
  buildOtpAuthUrl,
};
