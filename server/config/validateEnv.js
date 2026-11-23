import { validateAdminAuthConfig } from "../utils/adminAuth.js";
import { getEmailConfig } from "./email.js";

/*
   Startup environment validation.

   Fatal errors stop the process before it can serve a broken or insecure
   deployment. Warnings are printed but do not block startup (for example,
   optional Cloudinary or Gemini integrations).
*/

const PLACEHOLDER_PATTERN =
  /^(your[-_]|replace[-_]|change[-_]?me|paste[-_]|example)/i;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BOOLEAN_PATTERN = /^(true|false|1|0|yes|no|on|off)$/i;
const SAME_SITE_VALUES = new Set(["lax", "strict", "none"]);

const readInteger = (key) => {
  if (!hasValue(process.env[key])) return null;

  const value = Number(process.env[key]);

  return Number.isInteger(value) ? value : NaN;
};

const VALID_EMAIL_TRANSPORTS = new Set([
  "auto",
  "smtp",
  "gmail-api",
  "gmail",
  "none",
]);

const isPlaceholder = (value) => {
  const cleaned = String(value ?? "").trim();
  return !cleaned || PLACEHOLDER_PATTERN.test(cleaned);
};

const hasValue = (value) => Boolean(String(value ?? "").trim());

const validateOrigins = (rawOrigins, production, errors, warnings) => {
  if (!hasValue(rawOrigins)) {
    if (production) {
      errors.push(
        "CLIENT_URL is required in production (comma-separated exact browser origins)."
      );
    }
    return;
  }

  const origins = String(rawOrigins)
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);

  if (origins.length === 0) {
    errors.push("CLIENT_URL does not contain a valid origin.");
    return;
  }

  const seen = new Set();

  for (const origin of origins) {
    if (seen.has(origin)) {
      warnings.push(`CLIENT_URL contains a duplicate origin: ${origin}`);
    }
    seen.add(origin);

    let parsed;

    try {
      parsed = new URL(origin);
    } catch {
      errors.push(
        `CLIENT_URL contains an invalid URL: "${origin}". ` +
          "Use an exact origin such as https://your-site.vercel.app (no path)."
      );
      continue;
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
      errors.push(
        `CLIENT_URL must use http:// or https://, got: ${origin}`
      );
      continue;
    }

    if (
      parsed.pathname !== "/" ||
      parsed.search ||
      parsed.hash
    ) {
      warnings.push(
        `CLIENT_URL should be an origin only (no path, query or hash): ${origin}`
      );
    }

    const isLocal =
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1";

    if (production && parsed.protocol !== "https:" && !isLocal) {
      errors.push(
        `CLIENT_URL must use HTTPS in production: ${origin}`
      );
    }

    if (production && isLocal) {
      warnings.push(
        `CLIENT_URL points at localhost in production (${origin}). ` +
          "This is fine for Docker/CI smoke tests, but a public deployment must use its real HTTPS origin."
      );
    }
  }
};

export const validateEnvironment = ({
  production = process.env.NODE_ENV === "production",
} = {}) => {
  const errors = [];
  const warnings = [];

  const requiredEnv = [
    "DB_HOST",
    "DB_USER",
    "DB_NAME",
    "ADMIN_EMAIL",
  ];

  const missing = requiredEnv.filter(
    (key) => !hasValue(process.env[key])
  );

  // Empty passwords are valid for local MySQL; the variable must exist.
  if (process.env.DB_PASSWORD === undefined) {
    missing.push("DB_PASSWORD");
  }

  if (missing.length > 0) {
    errors.push(
      `Missing environment variables: ${missing.join(", ")}`
    );
  }

  if (hasValue(process.env.PORT)) {
    const port = Number(process.env.PORT);

    if (
      !Number.isInteger(port) ||
      port < 1 ||
      port > 65535
    ) {
      errors.push("PORT must be an integer between 1 and 65535.");
    }
  }

  if (
    hasValue(process.env.DB_HOST) &&
    isPlaceholder(process.env.DB_HOST)
  ) {
    errors.push(
      "DB_HOST is still a placeholder. Set your TiDB or MySQL host."
    );
  }

  if (
    hasValue(process.env.DB_USER) &&
    isPlaceholder(process.env.DB_USER)
  ) {
    errors.push(
      "DB_USER is still a placeholder. Set your TiDB or MySQL user."
    );
  }

  if (
    hasValue(process.env.DB_NAME) &&
    isPlaceholder(process.env.DB_NAME)
  ) {
    errors.push(
      "DB_NAME is still a placeholder. Set your TiDB or MySQL database name."
    );
  }

  // An empty DB_PASSWORD is valid for local MySQL, but a placeholder must
  // never reach a deployment.
  if (
    hasValue(process.env.DB_PASSWORD) &&
    isPlaceholder(process.env.DB_PASSWORD)
  ) {
    errors.push(
      "DB_PASSWORD is still a placeholder. Set your TiDB or MySQL password."
    );
  }

  if (hasValue(process.env.DB_PORT)) {
    const port = Number(process.env.DB_PORT);

    if (
      !Number.isInteger(port) ||
      port < 1 ||
      port > 65535
    ) {
      errors.push("DB_PORT must be an integer between 1 and 65535.");
    }
  }

  if (
    hasValue(process.env.DB_SSL) &&
    !BOOLEAN_PATTERN.test(process.env.DB_SSL.trim())
  ) {
    errors.push("DB_SSL must be true or false.");
  }

  if (hasValue(process.env.DB_CONNECTION_LIMIT)) {
    const limit = Number(process.env.DB_CONNECTION_LIMIT);

    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 20
    ) {
      errors.push(
        "DB_CONNECTION_LIMIT must be an integer between 1 and 20."
      );
    }
  }

  if (hasValue(process.env.JWT_SECRET)) {
    warnings.push(
      "JWT_SECRET is no longer used. Admin authentication now uses revocable server-side cookie sessions; remove it from the environment after verifying the cookie flow."
    );
  }

  const sessionTtl = readInteger("SESSION_TTL_MINUTES");
  const sessionIdle = readInteger("SESSION_IDLE_MINUTES");
  const sessionRetention = readInteger("SESSION_RETENTION_DAYS");

  for (const [key, value, min, max] of [
    ["SESSION_TTL_MINUTES", sessionTtl, 5, 1440],
    ["SESSION_IDLE_MINUTES", sessionIdle, 5, 1440],
    ["SESSION_RETENTION_DAYS", sessionRetention, 1, 90],
  ]) {
    if (value === null) continue;

    if (!Number.isInteger(value) || value < min || value > max) {
      errors.push(
        `${key} must be an integer between ${min} and ${max}.`
      );
    }
  }

  if (
    Number.isInteger(sessionTtl) &&
    Number.isInteger(sessionIdle) &&
    sessionIdle > sessionTtl
  ) {
    errors.push(
      "SESSION_IDLE_MINUTES cannot be longer than SESSION_TTL_MINUTES."
    );
  }

  if (
    hasValue(process.env.SESSION_COOKIE_SECURE) &&
    !BOOLEAN_PATTERN.test(process.env.SESSION_COOKIE_SECURE.trim())
  ) {
    errors.push("SESSION_COOKIE_SECURE must be true or false.");
  }

  const secureCookie =
    hasValue(process.env.SESSION_COOKIE_SECURE)
      ? /^(true|1|yes|on)$/i.test(
          process.env.SESSION_COOKIE_SECURE.trim()
        )
      : production;

  if (production && !secureCookie) {
    warnings.push(
      "SESSION_COOKIE_SECURE=false in production. Use HTTPS and Secure cookies for any public deployment; the override exists only for local Docker/CI."
    );
  }

  const sameSite = String(
    process.env.SESSION_COOKIE_SAMESITE || ""
  )
    .trim()
    .toLowerCase();

  if (sameSite && !SAME_SITE_VALUES.has(sameSite)) {
    errors.push(
      "SESSION_COOKIE_SAMESITE must be lax, strict or none."
    );
  }

  // The session cookie is first-party because the browser reaches the API
  // through the site's own /api proxy. Match sessionConfig.js: Lax is the
  // default in every environment, and `none` is an explicit opt-in.
  const effectiveSameSite = sameSite || "lax";

  if (effectiveSameSite === "none" && !secureCookie) {
    errors.push(
      "SESSION_COOKIE_SAMESITE=none requires a Secure cookie. Set SESSION_COOKIE_SECURE=true or use sameSite=lax with the same-origin /api proxy."
    );
  }

  if (hasValue(process.env.AI_ENABLED) &&
    !BOOLEAN_PATTERN.test(process.env.AI_ENABLED.trim())) {
    errors.push("AI_ENABLED must be true or false.");
  }

  for (const [key, min, max] of [
    ["AI_DAILY_LIMIT", 1, 1000],
    ["AI_GLOBAL_DAILY_LIMIT", 1, 100000],
  ]) {
    const value = readInteger(key);

    if (value === null) continue;

    if (!Number.isInteger(value) || value < min || value > max) {
      errors.push(
        `${key} must be an integer between ${min} and ${max}.`
      );
    }
  }

  if (hasValue(process.env.CLAMAV_PORT)) {
    const port = readInteger("CLAMAV_PORT");

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      errors.push("CLAMAV_PORT must be an integer between 1 and 65535.");
    }
  }

  const adminValidation = validateAdminAuthConfig({ production });
  errors.push(...adminValidation.errors);
  warnings.push(...adminValidation.warnings);

  validateOrigins(
    process.env.CLIENT_URL,
    production,
    errors,
    warnings
  );

  if (
    hasValue(process.env.ALLOW_VERCEL_PREVIEWS) &&
    !BOOLEAN_PATTERN.test(
      process.env.ALLOW_VERCEL_PREVIEWS.trim()
    )
  ) {
    errors.push("ALLOW_VERCEL_PREVIEWS must be true or false.");
  }

  const requestedTransport = String(
    process.env.EMAIL_TRANSPORT || "auto"
  )
    .trim()
    .toLowerCase();

  if (!VALID_EMAIL_TRANSPORTS.has(requestedTransport)) {
    errors.push(
      "EMAIL_TRANSPORT must be auto, smtp, gmail-api, or none."
    );
  }

  const emailConfig = getEmailConfig();

  if (
    requestedTransport === "gmail-api" ||
    requestedTransport === "gmail"
  ) {
    if (!emailConfig.gmailApiConfigured) {
      errors.push(
        "EMAIL_TRANSPORT=gmail-api requires EMAIL_USER, GMAIL_CLIENT_ID, " +
          "GMAIL_CLIENT_SECRET and GMAIL_REFRESH_TOKEN."
      );
    }
  } else if (requestedTransport === "smtp") {
    if (!emailConfig.smtpConfigured) {
      errors.push(
        "EMAIL_TRANSPORT=smtp requires EMAIL_USER and EMAIL_PASS."
      );
    }
  } else if (requestedTransport === "auto") {
    if (!emailConfig.configured) {
      warnings.push(
        "Email is not configured. Contact messages are still saved, but no notification email is sent."
      );
    }
  }

  if (emailConfig.transport === "smtp" && process.env.RENDER) {
    warnings.push(
      "Render free web services block outbound SMTP ports 25/465/587. " +
        "Configure Gmail API OAuth values (GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN) " +
        "or upgrade the Render instance before relying on email notifications."
    );
  }

  if (
    hasValue(process.env.GMAIL_REFRESH_TOKEN) &&
    process.env.GMAIL_REFRESH_TOKEN.trim().startsWith("ya29.")
  ) {
    warnings.push(
      "GMAIL_REFRESH_TOKEN looks like an access token (ya29...). Use the long-lived refresh token from `npm run gmail:auth`."
    );
  }

  if (
    hasValue(process.env.GMAIL_CLIENT_ID) &&
    !process.env.GMAIL_CLIENT_ID.trim().endsWith(
      ".apps.googleusercontent.com"
    )
  ) {
    warnings.push(
      "GMAIL_CLIENT_ID usually ends with .apps.googleusercontent.com. Check that you copied the OAuth client ID."
    );
  }

  if (
    hasValue(process.env.GMAIL_CLIENT_SECRET) &&
    !process.env.GMAIL_CLIENT_SECRET.trim().startsWith("GOCSPX-")
  ) {
    warnings.push(
      "GMAIL_CLIENT_SECRET usually starts with GOCSPX-. Check that you copied the OAuth client secret."
    );
  }

  if (hasValue(process.env.EMAIL_USER)) {
    if (!EMAIL_PATTERN.test(process.env.EMAIL_USER.trim())) {
      warnings.push("EMAIL_USER does not look like a valid email address.");
    } else if (isPlaceholder(process.env.EMAIL_USER)) {
      warnings.push(
        "EMAIL_USER is still a placeholder; email notifications are disabled."
      );
    }
  }

  for (const key of [
    "CLOUD_NAME",
    "CLOUD_API_KEY",
    "CLOUD_API_SECRET",
  ]) {
    if (
      hasValue(process.env[key]) &&
      isPlaceholder(process.env[key])
    ) {
      warnings.push(`${key} is still a placeholder; uploads will fail.`);
    }
  }

  const cloudinaryValues = [
    process.env.CLOUD_NAME,
    process.env.CLOUD_API_KEY,
    process.env.CLOUD_API_SECRET,
  ].filter(hasValue);

  if (cloudinaryValues.length > 0 && cloudinaryValues.length < 3) {
    warnings.push(
      "Cloudinary is partially configured. Set all three CLOUD_* values or none."
    );
  }

  if (
    hasValue(process.env.GEMINI_API_KEY) &&
    isPlaceholder(process.env.GEMINI_API_KEY)
  ) {
    warnings.push(
      "GEMINI_API_KEY is still a placeholder; AI endpoints will return 502."
    );
  }

  return { errors, warnings };
};

export default validateEnvironment;
