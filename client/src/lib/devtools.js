/**
 * Pure, dependency-free logic for the browser developer tools.
 *
 * Everything here runs locally in the browser or in Node's test runner. No
 * value ever leaves the page and nothing is persisted.
 */

export const HTTP_STATUS_CODES = [
  { code: 100, category: "Informational", label: "Continue" },
  { code: 101, category: "Informational", label: "Switching Protocols" },
  { code: 200, category: "Success", label: "OK" },
  { code: 201, category: "Success", label: "Created" },
  { code: 202, category: "Success", label: "Accepted" },
  { code: 204, category: "Success", label: "No Content" },
  { code: 206, category: "Success", label: "Partial Content" },
  { code: 301, category: "Redirection", label: "Moved Permanently" },
  { code: 302, category: "Redirection", label: "Found" },
  { code: 303, category: "Redirection", label: "See Other" },
  { code: 304, category: "Redirection", label: "Not Modified" },
  { code: 307, category: "Redirection", label: "Temporary Redirect" },
  { code: 308, category: "Redirection", label: "Permanent Redirect" },
  { code: 400, category: "Client error", label: "Bad Request" },
  { code: 401, category: "Client error", label: "Unauthorized" },
  { code: 403, category: "Client error", label: "Forbidden" },
  { code: 404, category: "Client error", label: "Not Found" },
  { code: 405, category: "Client error", label: "Method Not Allowed" },
  { code: 408, category: "Client error", label: "Request Timeout" },
  { code: 409, category: "Client error", label: "Conflict" },
  { code: 410, category: "Client error", label: "Gone" },
  { code: 413, category: "Client error", label: "Payload Too Large" },
  { code: 415, category: "Client error", label: "Unsupported Media Type" },
  { code: 418, category: "Client error", label: "I'm a teapot" },
  { code: 422, category: "Client error", label: "Unprocessable Entity" },
  { code: 429, category: "Client error", label: "Too Many Requests" },
  { code: 500, category: "Server error", label: "Internal Server Error" },
  { code: 501, category: "Server error", label: "Not Implemented" },
  { code: 502, category: "Server error", label: "Bad Gateway" },
  { code: 503, category: "Server error", label: "Service Unavailable" },
  { code: 504, category: "Server error", label: "Gateway Timeout" },
];

const MAX_INPUT_LENGTH = 1_000_000;

const tooLarge = (length) =>
  length > MAX_INPUT_LENGTH
    ? { ok: false, error: `Input is too large (${length} characters, limit ${MAX_INPUT_LENGTH}).` }
    : null;

const bytesToBase64 = (bytes) => {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
};

const base64ToBytes = (value) => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

export function encodeBase64(text) {
  const size = String(text ?? "").length;
  const limit = tooLarge(size);
  if (limit) return limit;
  try {
    return { ok: true, value: bytesToBase64(new TextEncoder().encode(String(text))) };
  } catch (error) {
    return { ok: false, error: String(error.message || error) };
  }
}

export function decodeBase64(value) {
  const input = String(value ?? "").trim();
  const limit = tooLarge(input.length);
  if (limit) return limit;
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(input) || input.length % 4 !== 0) {
    return { ok: false, error: "Not valid Base64 (expected A–Z, a–z, 0–9, +, / and = padding)." };
  }
  try {
    return { ok: true, value: new TextDecoder().decode(base64ToBytes(input)) };
  } catch {
    return { ok: false, error: "Base64 decoded to invalid UTF-8 text." };
  }
}

export function encodeUrl(text) {
  const input = String(text ?? "");
  const limit = tooLarge(input.length);
  if (limit) return limit;
  return { ok: true, value: encodeURIComponent(input) };
}

export function decodeUrl(text) {
  const input = String(text ?? "");
  const limit = tooLarge(input.length);
  if (limit) return limit;
  try {
    return { ok: true, value: decodeURIComponent(input) };
  } catch {
    return { ok: false, error: "Not a valid percent-encoded string (malformed % escape)." };
  }
}

const HTML_ENTITIES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function encodeHtml(text) {
  return String(text ?? "").replace(/[&<>"']/g, (char) => HTML_ENTITIES[char]);
}

const NAMED_HTML_ENTITIES = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

export function decodeHtml(text) {
  return String(text ?? "").replace(
    /&(#[0-9]+|#[xX][0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g,
    (original, entity) => {
      if (entity.startsWith("#")) {
        const isHex = entity[1] === "x" || entity[1] === "X";
        const code = Number.parseInt(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10);
        if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) {
          return original;
        }
        try {
          return String.fromCodePoint(code);
        } catch {
          return original;
        }
      }
      const named = NAMED_HTML_ENTITIES[entity.toLowerCase()];
      return named === undefined ? original : named;
    }
  );
}

export function validateJson(input) {
  const text = String(input ?? "");
  const limit = tooLarge(text.length);
  if (limit) return limit;
  if (text.trim() === "") {
    return { ok: false, error: "Nothing to validate — the input is empty." };
  }
  try {
    JSON.parse(text);
    return { ok: true, error: null };
  } catch (error) {
    return { ok: false, error: String(error.message || error) };
  }
}

export function formatJson(input, indent = 2) {
  const text = String(input ?? "");
  const limit = tooLarge(text.length);
  if (limit) return limit;
  if (text.trim() === "") {
    return { ok: false, error: "Nothing to format — the input is empty." };
  }
  try {
    return { ok: true, value: JSON.stringify(JSON.parse(text), null, indent) };
  } catch (error) {
    return { ok: false, error: String(error.message || error) };
  }
}

const SAFE_FLAGS = /^[dgimsuvy]{0,10}$/;

export function testRegex({ pattern, flags = "", input }) {
  const limit = tooLarge(String(input ?? "").length);
  if (limit) return limit;
  if (typeof pattern !== "string" || pattern === "") {
    return { ok: false, error: "Enter a regular expression pattern." };
  }
  if (!SAFE_FLAGS.test(flags)) {
    return { ok: false, error: "Invalid flags. Allowed: d g i m s u v y." };
  }
  let regex;
  try {
    regex = new RegExp(pattern, flags);
  } catch (error) {
    return { ok: false, error: `Invalid regular expression: ${error.message}` };
  }

  const matches = [];
  const global = flags.includes("g");
  let match;
  let guard = 0;
  const maxMatches = 1000;
  while (guard < maxMatches) {
    match = regex.exec(String(input ?? ""));
    if (!match) break;
    matches.push({
      index: match.index,
      match: match[0],
      groups: match.slice(1),
    });
    if (match[0] === "") {
      regex.lastIndex += 1;
    }
    if (!global) break;
    guard += 1;
  }
  return { ok: true, matches, truncated: guard >= maxMatches };
}

const base64UrlToBytes = (value) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return base64ToBytes(padded);
};

const numericDate = (value) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const milliseconds = value * 1000;
  const date = new Date(milliseconds);
  if (Number.isNaN(date.getTime())) return null;
  return { seconds: value, iso: date.toISOString() };
};

/**
 * Decode a JWT payload locally. This does NOT verify the signature: it only
 * shows the header, payload and standard time claims so a developer can
 * inspect their own token.
 */
export function decodeJwt(token, { now = Date.now() } = {}) {
  const value = String(token ?? "").trim();
  const limit = tooLarge(value.length);
  if (limit) return limit;
  if (value === "") {
    return { ok: false, error: "Paste a JWT to decode it.", warning: null };
  }
  const parts = value.split(".");
  if (parts.length !== 3) {
    return {
      ok: false,
      error: "A JWT has three dot-separated parts (header.payload.signature).",
      warning: null,
    };
  }
  const decodePart = (part, label) => {
    try {
      return { ok: true, value: JSON.parse(new TextDecoder().decode(base64UrlToBytes(part))) };
    } catch {
      return { ok: false, error: `Could not decode the ${label} segment.` };
    }
  };
  const header = decodePart(parts[0], "header");
  if (!header.ok) return { ok: false, error: header.error, warning: null };
  const payload = decodePart(parts[1], "payload");
  if (!payload.ok) return { ok: false, error: payload.error, warning: null };

  const nowSeconds = Number.isFinite(Number(now)) ? Number(now) / 1000 : Date.now() / 1000;
  const issuedAt = numericDate(payload.value.iat);
  const expiresAt = numericDate(payload.value.exp);
  const notBefore = numericDate(payload.value.nbf);

  return {
    ok: true,
    header: header.value,
    payload: payload.value,
    error: null,
    times: {
      issuedAt,
      expiresAt,
      notBefore,
      expired: expiresAt ? nowSeconds >= expiresAt.seconds : null,
      notYetValid: notBefore ? nowSeconds < notBefore.seconds : null,
      expiresInSeconds: expiresAt
        ? Math.round(expiresAt.seconds - nowSeconds)
        : null,
    },
    warning:
      "Decoded locally. The signature was NOT verified — never treat this as proof that a token is authentic.",
  };
}

/**
 * Human-readable duration for JWT time claims. The sign is discarded; callers
 * decide whether the value is in the future or the past.
 */
export function formatDuration(seconds) {
  const value = Number(seconds);
  if (!Number.isFinite(value)) return "";
  const total = Math.abs(Math.round(value));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainder = total % 60;
  const parts = [];

  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (remainder && parts.length < 2) parts.push(`${remainder}s`);

  return parts.slice(0, 2).join(" ") || "0s";
}

/**
 * Generate an RFC 4122 version 4 UUID from the platform CSPRNG. Version and
 * variant bits are set explicitly; the remaining 122 bits are random.
 */
export function generateUuidV4() {
  const cryptoApi = globalThis.crypto;

  if (!cryptoApi?.getRandomValues) {
    return {
      ok: false,
      error: "Secure random values are unavailable in this browser context.",
    };
  }

  const bytes = new Uint8Array(16);
  cryptoApi.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
  const value = [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-");

  return { ok: true, value };
}

export const HASH_ALGORITHMS = ["SHA-256", "SHA-384", "SHA-512"];

/**
 * Hash UTF-8 text with the Web Crypto API. The input and digest stay in the
 * page; only the chosen algorithm name is validated against a fixed list.
 */
export async function hashText(text, algorithm = "SHA-256") {
  const input = String(text ?? "");
  const limit = tooLarge(input.length);
  if (limit) return limit;

  if (!HASH_ALGORITHMS.includes(algorithm)) {
    return {
      ok: false,
      error: `Unsupported hash algorithm. Use ${HASH_ALGORITHMS.join(", ")}.`,
    };
  }

  if (!globalThis.crypto?.subtle) {
    return {
      ok: false,
      error: "Web Crypto is unavailable in this browser context.",
    };
  }

  try {
    const digest = await globalThis.crypto.subtle.digest(
      algorithm,
      new TextEncoder().encode(input)
    );
    const value = Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, "0")
    ).join("");

    return {
      ok: true,
      algorithm,
      value,
      bits: digest.byteLength * 8,
    };
  } catch (error) {
    return { ok: false, error: String(error.message || error) };
  }
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}(?:[T ].+)?$/;

/**
 * Convert Unix seconds, Unix milliseconds or an ISO 8601 date into the
 * representations developers usually need. Numeric input with up to 10 digits
 * is read as seconds; longer numeric input is read as milliseconds.
 */
export function inspectTimestamp(input) {
  const text = String(input ?? "").trim();
  const limit = tooLarge(text.length);
  if (limit) return limit;
  if (!text) {
    return { ok: false, error: "Enter a Unix timestamp or an ISO 8601 date." };
  }

  let milliseconds;
  let unit;

  if (/^-?\d+$/.test(text)) {
    const numeric = Number(text);
    if (!Number.isSafeInteger(numeric)) {
      return { ok: false, error: "Timestamp is outside the safe integer range." };
    }
    const digits = text.replace(/^[+-]/, "").replace(/^0+/, "").length;
    if (digits <= 10) {
      milliseconds = numeric * 1000;
      unit = "Unix seconds";
    } else {
      milliseconds = numeric;
      unit = "Unix milliseconds";
    }
  } else if (ISO_DATE.test(text)) {
    milliseconds = new Date(text).getTime();
    unit = "ISO 8601";
  } else {
    return {
      ok: false,
      error: "Use Unix seconds, Unix milliseconds, or an ISO 8601 date such as 2026-11-26T12:00:00Z.",
    };
  }

  const date = new Date(milliseconds);
  if (Number.isNaN(date.getTime())) {
    return { ok: false, error: "That timestamp is outside the supported date range." };
  }

  return {
    ok: true,
    unit,
    milliseconds,
    seconds: Math.floor(milliseconds / 1000),
    iso: date.toISOString(),
    utc: date.toUTCString(),
  };
}

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const NAMED_COLORS = new Set([
  "transparent", "currentcolor", "black", "white", "red", "lime", "blue",
  "yellow", "cyan", "magenta", "silver", "gray", "maroon", "olive", "green",
  "purple", "teal", "navy", "orange", "pink",
]);

const isColor = (value) => {
  const color = String(value ?? "").trim();
  return HEX_COLOR.test(color) || NAMED_COLORS.has(color.toLowerCase());
};

const parseHexColor = (value) => {
  const text = String(value ?? "").trim();
  if (!HEX_COLOR.test(text)) return null;
  let hex = text.slice(1);
  if (hex.length === 3) {
    hex = Array.from(hex, (char) => char + char).join("");
  }
  const numeric = Number.parseInt(hex, 16);
  return {
    r: (numeric >> 16) & 0xff,
    g: (numeric >> 8) & 0xff,
    b: numeric & 0xff,
  };
};

const toHex = ({ r, g, b }) =>
  `#${[r, g, b]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;

const linearChannel = (channel) => {
  const value = channel / 255;
  return value <= 0.04045
    ? value / 12.92
    : ((value + 0.055) / 1.055) ** 2.4;
};

const relativeLuminance = ({ r, g, b }) =>
  0.2126 * linearChannel(r) +
  0.7152 * linearChannel(g) +
  0.0722 * linearChannel(b);

/**
 * WCAG 2.2 contrast ratio for two opaque hex colours. Thresholds are SC
 * 1.4.3 (AA), 1.4.6 (AAA) and 1.4.11 (non-text UI).
 */
export function checkContrast(foreground, background) {
  const fg = parseHexColor(foreground);
  const bg = parseHexColor(background);

  if (!fg || !bg) {
    return {
      ok: false,
      error: "Use opaque hex colours in #rgb or #rrggbb form for both values.",
    };
  }

  const fgLuminance = relativeLuminance(fg);
  const bgLuminance = relativeLuminance(bg);
  const ratio =
    (Math.max(fgLuminance, bgLuminance) + 0.05) /
    (Math.min(fgLuminance, bgLuminance) + 0.05);

  return {
    ok: true,
    ratio,
    ratioText: ratio.toFixed(2),
    foreground: toHex(fg),
    background: toHex(bg),
    normalTextAA: ratio >= 4.5,
    normalTextAAA: ratio >= 7,
    largeTextAA: ratio >= 3,
    largeTextAAA: ratio >= 4.5,
    uiComponents: ratio >= 3,
  };
}

export function buildGradient({ type = "linear", angle = 90, stops = [] } = {}) {
  const cleanStops = stops.filter((stop) => stop && stop.color);
  if (cleanStops.length < 2) {
    return { ok: false, error: "Add at least two colour stops." };
  }
  for (const stop of cleanStops) {
    if (!isColor(stop.color)) {
      return { ok: false, error: `"${stop.color}" is not a recognised colour (use #rgb, #rrggbb or a CSS colour name).` };
    }
  }
  const parts = cleanStops.map((stop) => {
    const position = Number.isFinite(Number(stop.position)) ? Number(stop.position) : null;
    return position === null ? stop.color : `${stop.color} ${position}%`;
  });
  const css =
    type === "radial"
      ? `radial-gradient(circle, ${parts.join(", ")})`
      : `linear-gradient(${Number(angle) || 90}deg, ${parts.join(", ")})`;
  return { ok: true, css, background: css };
}

export const TOOL_DEFINITIONS = [
  { id: "json", name: "JSON Formatter", description: "Pretty-print and inspect JSON." },
  { id: "base64", name: "Base64 Encoder / Decoder", description: "Encode and decode UTF-8 text." },
  { id: "url", name: "URL Encoder / Decoder", description: "Percent-encode URLs and query values." },
  { id: "html", name: "HTML Entity Encoder / Decoder", description: "Escape and unescape HTML entities." },
  { id: "regex", name: "Regex Tester", description: "Test a pattern with live matches." },
  { id: "jwt", name: "JWT Payload Decoder", description: "Inspect a token header, payload and time claims locally." },
  { id: "uuid", name: "UUID v4 Generator", description: "Create an RFC 4122 version 4 UUID with secure randomness." },
  { id: "hash", name: "SHA Hash Generator", description: "Hash UTF-8 text with SHA-256, SHA-384 or SHA-512." },
  { id: "timestamp", name: "Unix Timestamp Converter", description: "Convert Unix seconds, milliseconds and ISO 8601 dates." },
  { id: "contrast", name: "WCAG Contrast Checker", description: "Measure a colour pair against WCAG 2.2 AA and AAA thresholds." },
  { id: "gradient", name: "CSS Gradient Generator", description: "Build a linear or radial gradient." },
  { id: "http", name: "HTTP Status Reference", description: "Look up common status codes." },
];
