/**
 * Contact-form anti-spam heuristics.
 *
 * These run after the normal field validation and before any file is sent to
 * Cloudinary. They intentionally reject cheap automated submissions without
 * making the form difficult for a real person:
 *   - hidden honeypot field must stay empty
 *   - the form must be open for a minimum time
 *   - a message may not contain dozens of links/addresses
 */

export const HONEYPOT_FIELD = "website";
export const MIN_FORM_TIME_MS = 2500;
export const MAX_LINKS = 4;
export const MAX_EMAILS = 5;
export const MAX_SCANNED_MESSAGE_LENGTH = 5000;

const URL_PATTERN = /\bhttps?:\/\/|\bwww\./gi;
const EMAIL_PATTERN = /[^\s@]+@[^\s@]+\.[^\s@]+/g;

export const checkContactSpam = (body = {}) => {
  const honeypot = body?.[HONEYPOT_FIELD];

  if (typeof honeypot === "string" && honeypot.trim()) {
    return {
      ok: false,
      status: 400,
      message: "Submission rejected.",
    };
  }

  const startedAt = Number(body?.formStartedAt);

  if (Number.isFinite(startedAt) && startedAt > 0) {
    const elapsed = Date.now() - startedAt;

    // A clock skew or a missing value should not punish a real visitor; only
    // an implausibly fast submission is rejected.
    if (elapsed >= 0 && elapsed < MIN_FORM_TIME_MS) {
      return {
        ok: false,
        status: 400,
        message: "Please take a moment and submit the form again.",
      };
    }
  }

  // Field validation caps messages at 5000 characters before this heuristic
  // runs. Bound the scan anyway so the patterns never see an unbounded string.
  const message = String(body?.message || "").slice(
    0,
    MAX_SCANNED_MESSAGE_LENGTH
  );

  const links = (message.match(URL_PATTERN) || []).length;
  const emails = (message.match(EMAIL_PATTERN) || []).length;

  if (links > MAX_LINKS || emails > MAX_EMAILS) {
    return {
      ok: false,
      status: 400,
      message:
        "This message contains too many links or email addresses. Please shorten it or contact me directly by email.",
    };
  }

  return { ok: true };
};

export default checkContactSpam;
