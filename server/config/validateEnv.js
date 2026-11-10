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
const JWT_EXPIRY_PATTERN = /^\d+(ms|s|m|h|d|w|y)?$/i;

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
    "JWT_SECRET",
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

  const jwtSecret = String(
    process.env.JWT_SECRET || ""
  ).trim();

  if (jwtSecret) {
    if (isPlaceholder(jwtSecret)) {
      errors.push(
        "JWT_SECRET is still a placeholder. Generate a random secret with: " +
          'node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"'
      );
    }

    if (production && jwtSecret.length < 32) {
      errors.push(
        "JWT_SECRET must be at least 32 characters in production."
      );
    } else if (!production && jwtSecret.length < 32) {
      warnings.push(
        "JWT_SECRET is shorter than 32 characters. Use a longer random value before deploying."
      );
    }

    if (new Set(jwtSecret).size < 10) {
      warnings.push(
        "JWT_SECRET has very little character variety. Use a random value."
      );
    }
  }

  if (hasValue(process.env.JWT_EXPIRES_IN)) {
    const expiry = process.env.JWT_EXPIRES_IN.trim();

    if (!JWT_EXPIRY_PATTERN.test(expiry)) {
      errors.push(
        "JWT_EXPIRES_IN must look like 30m, 12h, 7d, or a number of seconds."
      );
    } else if (/^\d+$/.test(expiry) && Number(expiry) <= 0) {
      errors.push("JWT_EXPIRES_IN must be greater than zero.");
    } else if (/^0+[a-z]+$/i.test(expiry)) {
      errors.push("JWT_EXPIRES_IN must be greater than zero.");
    } else if (/^(\d+)(d|w|y)$/i.test(expiry)) {
      const amount = Number(expiry.replace(/[a-z]+$/i, ""));
      const unit = expiry.replace(/^\d+/, "").toLowerCase();
      const days =
        unit === "d" ? amount : unit === "w" ? amount * 7 : amount * 365;

      if (days > 30) {
        warnings.push(
          "JWT_EXPIRES_IN is longer than 30 days. Shorter admin sessions are safer."
        );
      }
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
