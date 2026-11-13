import net from "node:net";

/**
 * Resolve the real visitor IP.
 *
 * The public deployment sits behind Cloudflare, which terminates the TCP
 * connection and then forwards the request to Render. Express' `req.ip`
 * therefore resolves to a private Render proxy address (10.x.x.x), which makes
 * every visitor share a single rate-limit bucket and writes useless data to
 * the security logs.
 *
 * Cloudflare sets `CF-Connecting-IP` to the address of the visitor that
 * connected to its edge. The header cannot be spoofed by clients because
 * Cloudflare overwrites it, but it is only meaningful when the request really
 * came through Cloudflare. `cf-ray` is always added by the edge, so both
 * headers must be present before the value is trusted. Anything else falls
 * back to Express' own resolution.
 */

const CF_CONNECTING_IP_HEADER = "cf-connecting-ip";
const CF_RAY_HEADER = "cf-ray";
const MAX_IP_LENGTH = 45; // Longest possible IPv6 textual representation.

const normalizeIp = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  const candidate = value.trim();

  if (!candidate || candidate.length > MAX_IP_LENGTH) {
    return null;
  }

  // Express sometimes reports IPv4 clients as IPv4-mapped IPv6 addresses
  // (`::ffff:203.0.113.10`). Normalize those so logs and keys stay stable.
  const unwrapped = candidate.startsWith("::ffff:")
    ? candidate.slice("::ffff:".length)
    : candidate;

  return net.isIP(unwrapped) ? unwrapped : null;
};

export const getClientIp = (req) => {
  if (!req || typeof req !== "object") {
    return "unknown";
  }

  const headers = req.headers || {};

  // Only trust Cloudflare headers when the request carries the edge marker.
  if (
    typeof headers[CF_RAY_HEADER] === "string" &&
    headers[CF_RAY_HEADER].trim()
  ) {
    const cloudflareIp = normalizeIp(headers[CF_CONNECTING_IP_HEADER]);

    if (cloudflareIp) {
      return cloudflareIp;
    }
  }

  return normalizeIp(req.ip) || "unknown";
};

export default getClientIp;
