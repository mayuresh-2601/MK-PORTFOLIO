import crypto from "node:crypto";

import bcrypt from "bcryptjs";

/*
   Admin credential verification.

   The admin account is deliberately environment-based: there is exactly one
   email/password pair, and it never touches the database. `ADMIN_PASSWORD_HASH`
   (bcrypt) is preferred for production, but `ADMIN_PASSWORD` is supported so a
   plain secret can live in the server-only `.env` file. Both paths are compared
   in constant time:
     - plain text: SHA-256 + timingSafeEqual (hides length and content timing)
     - bcrypt:    bcrypt.compare
*/

export const MIN_ADMIN_PASSWORD_LENGTH = 12;

const MAX_PASSWORD_LENGTH = 1024;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BCRYPT_PATTERN = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

const PLACEHOLDER_PATTERN =
  /^(replace[-_ ]?with|change[-_ ]?me|paste[-_ ]?your|your[-_ ]|example)/i;

const COMMON_PASSWORDS = new Set([
  "123456789012",
  "adminadmin12",
  "changeme1234",
  "letmein12345",
  "password",
  "password123",
  "password1234",
  "qwertyuiop12",
  "welcome12345",
]);

const normalizeEmail = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const safeEqual = (left, right) => {
  const leftDigest = crypto
    .createHash("sha256")
    .update(String(left ?? ""), "utf8")
    .digest();

  const rightDigest = crypto
    .createHash("sha256")
    .update(String(right ?? ""), "utf8")
    .digest();

  return crypto.timingSafeEqual(leftDigest, rightDigest);
};

/**
 * Read the single admin identity from the environment.
 *
 * If both password forms are present, the bcrypt hash wins. That makes it
 * safe to keep an old hash while testing a new plain password, and matching
 * the precedence documented in `.env.example`.
 */
export const getAdminAuthConfig = () => {
  const email = normalizeEmail(process.env.ADMIN_EMAIL);
  const hash = String(process.env.ADMIN_PASSWORD_HASH || "").trim();
  const password = String(process.env.ADMIN_PASSWORD ?? "");

  return {
    email,
    hash,
    password,
    mode: hash ? "hash" : password ? "plain" : "none",
  };
};

/**
 * Verify the submitted email and password against the env-configured admin.
 *
 * Every comparison runs even when the email is wrong, so response timing does
 * not reveal whether the email exists. The caller always returns the same
 * generic 401 message.
 */
export const verifyAdminCredentials = async (
  candidateEmail,
  candidatePassword
) => {
  const config = getAdminAuthConfig();

  if (!config.email || config.mode === "none") {
    return false;
  }

  if (
    typeof candidateEmail !== "string" ||
    typeof candidatePassword !== "string"
  ) {
    return false;
  }

  const email = normalizeEmail(candidateEmail);
  const password = candidatePassword;

  if (
    !email ||
    !password ||
    email.length > 254 ||
    password.length > MAX_PASSWORD_LENGTH
  ) {
    return false;
  }

  let passwordMatches = false;

  if (config.mode === "hash") {
    try {
      passwordMatches = await bcrypt.compare(password, config.hash);
    } catch {
      passwordMatches = false;
    }
  } else {
    passwordMatches = safeEqual(password, config.password);
  }

  const emailMatches = safeEqual(email, config.email);

  return emailMatches && passwordMatches;
};

/**
 * Validate the admin configuration at startup.
 *
 * Returns errors (fatal) and warnings (non-fatal). This catches placeholder
 * values before a public deployment accidentally ships with a known password.
 */
export const validateAdminAuthConfig = ({
  production = false,
} = {}) => {
  const errors = [];
  const warnings = [];

  const { email, hash, password, mode } = getAdminAuthConfig();

  if (!email) {
    errors.push("ADMIN_EMAIL is required.");
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.push("ADMIN_EMAIL must be a valid email address.");
  } else if (email.endsWith("@example.com")) {
    errors.push(
      "ADMIN_EMAIL is still an example address. Use your real Gmail address."
    );
  } else if (PLACEHOLDER_PATTERN.test(email)) {
    errors.push(
      "ADMIN_EMAIL is still a placeholder. Use your real Gmail address."
    );
  }

  if (mode === "none") {
    errors.push(
      "Set ADMIN_PASSWORD (plain text in .env) or ADMIN_PASSWORD_HASH (bcrypt) for admin login."
    );
  }

  if (mode === "hash") {
    if (!BCRYPT_PATTERN.test(hash)) {
      errors.push(
        "ADMIN_PASSWORD_HASH is not a valid bcrypt hash. " +
          'Generate one with: npm run hash-password -- "your-password"'
      );
    }

    if (password) {
      warnings.push(
        "Both ADMIN_PASSWORD_HASH and ADMIN_PASSWORD are set. " +
          "The bcrypt hash takes precedence; remove ADMIN_PASSWORD to avoid ambiguity."
      );
    }
  }

  if (mode === "plain") {
    if (password.length < MIN_ADMIN_PASSWORD_LENGTH) {
      errors.push(
        `ADMIN_PASSWORD must be at least ${MIN_ADMIN_PASSWORD_LENGTH} characters long.`
      );
    }

    if (password.length > MAX_PASSWORD_LENGTH) {
      errors.push(
        `ADMIN_PASSWORD must be ${MAX_PASSWORD_LENGTH} characters or fewer.`
      );
    }

    if (!password.trim()) {
      errors.push("ADMIN_PASSWORD must not be blank.");
    }

    if (
      PLACEHOLDER_PATTERN.test(password) ||
      COMMON_PASSWORDS.has(password.toLowerCase())
    ) {
      errors.push(
        "ADMIN_PASSWORD is still a placeholder or a commonly used password. " +
          "Choose a unique password of at least 12 characters."
      );
    }

    if (password !== password.trim()) {
      warnings.push(
        "ADMIN_PASSWORD has leading or trailing whitespace. " +
          "Wrap it in single quotes in server/.env so dotenv preserves it."
      );
    }

    if (email && password.toLowerCase() === email.toLowerCase()) {
      errors.push("ADMIN_PASSWORD must not be the same as ADMIN_EMAIL.");
    }

    const characterClasses = [
      /[a-z]/,
      /[A-Z]/,
      /\d/,
      /[^A-Za-z0-9]/,
    ].filter((pattern) => pattern.test(password)).length;

    if (characterClasses < 2) {
      warnings.push(
        "ADMIN_PASSWORD uses only one character type. " +
          "A longer passphrase or a mix of letters, numbers, and symbols is stronger."
      );
    }

    if (production) {
      warnings.push(
        "ADMIN_PASSWORD is stored in plain text in the environment. " +
          "The env file is server-only, but ADMIN_PASSWORD_HASH is safer if you can generate one."
      );
    }
  }

  return { errors, warnings };
};

export default {
  getAdminAuthConfig,
  verifyAdminCredentials,
  validateAdminAuthConfig,
};
