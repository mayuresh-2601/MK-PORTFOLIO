/**
 * Structured security events.
 *
 * Logs are JSON lines so a log collector can index them, but only primitive,
 * non-secret fields are ever serialized. Passwords, cookies, session tokens,
 * CSRF tokens, API keys and request bodies must never be added here.
 */

const SENSITIVE_KEY_PATTERN =
  /pass(word)?|secret|token|cookie|authorization|csrf|api[-_]?key|credential|session/i;

const MAX_VALUE_LENGTH = 240;

const sanitizeValue = (value) => {
  if (value === null || value === undefined) return undefined;

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value.slice(0, MAX_VALUE_LENGTH);
  }

  return undefined;
};

const sanitizeDetails = (details = {}) => {
  const result = {};

  for (const [key, value] of Object.entries(details)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) continue;

    const safe = sanitizeValue(value);

    if (safe !== undefined) result[key] = safe;
  }

  return result;
};

const write = (method, level, event, details) => {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...sanitizeDetails(details),
  };

  console[method](JSON.stringify(entry));
};

export const securityEvent = (event, details = {}) => {
  write("warn", "security", event, details);
};

export const securityError = (event, details = {}) => {
  write("error", "security", event, details);
};

export const requestContext = (req, extra = {}) => ({
  requestId: req?.id,
  method: req?.method,
  path: req?.originalUrl?.split("?")[0],
  ip: req?.clientIp,
  ...extra,
});

export default {
  securityEvent,
  securityError,
  requestContext,
};
