/**
 * Shared input validation helpers.
 *
 * Controllers validate length and URL shape before data reaches MySQL/TiDB.
 * Keeping the rules here makes the public contact form and the admin CRUD
 * endpoints behave consistently.
 */

export const isSafeHttpUrl = (value) => {
  if (typeof value !== "string" || !value.trim()) return false;

  try {
    const url = new URL(value.trim());

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

/**
 * Trim an optional string and enforce a maximum length.
 * Returns `null` when the value is missing, and `undefined` when the value is
 * not a string or is too long. Callers can therefore reject malformed JSON
 * (numbers, arrays, objects) with a 400 instead of crashing on `.trim()`.
 */
export const normalizeOptionalText = (value, maxLength) => {
  if (value === undefined || value === null) return null;

  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();

  if (!trimmed) return null;

  if (trimmed.length > maxLength) return undefined;

  return trimmed;
};

/**
 * Trim a required value and enforce a maximum length.
 * Returns `null` when empty/missing and `undefined` when too long, so the
 * caller can distinguish "missing" from "too long" in its error message.
 */
export const normalizeRequiredText = (value, maxLength) => {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();

  if (!trimmed) return null;

  if (trimmed.length > maxLength) return undefined;

  return trimmed;
};
