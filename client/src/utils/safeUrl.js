/**
 * Return a safe absolute HTTP(S) URL, or null.
 *
 * Project, demo, and certificate links are stored in the database and can be
 * edited from the admin dashboard. The API validates them, but the UI should
 * never turn untrusted data into a `javascript:`/`data:` navigation target if
 * an older or manually edited row contains one. Returning null lets callers
 * hide the link entirely.
 */

const SAFE_PROTOCOLS = new Set(["http:", "https:"]);

// Control characters can be used to disguise a URL in rendered output.
const hasControlCharacters = (value) => {
  for (const character of value) {
    const code = character.codePointAt(0);

    if (code <= 0x1f || code === 0x7f) {
      return true;
    }
  }

  return false;
};

export const safeExternalUrl = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  const candidate = value.trim();

  if (!candidate || candidate.length > 2048) {
    return null;
  }

  if (hasControlCharacters(candidate)) {
    return null;
  }

  let parsed;

  try {
    parsed = new URL(candidate);
  } catch {
    return null;
  }

  if (!SAFE_PROTOCOLS.has(parsed.protocol)) {
    return null;
  }

  return parsed.href;
};

export default safeExternalUrl;
