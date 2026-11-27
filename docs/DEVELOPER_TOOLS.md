# DEVELOPER TOOLS — MK-PORTFOLIO

**Date:** 2026-11-27
**Page:** [https://mk-portfolio-phi-silk.vercel.app/tools](https://mk-portfolio-phi-silk.vercel.app/tools)

Twelve browser-based developer utilities. Every tool runs **locally in your
browser** — nothing is sent to a server, and no token is ever transmitted.

## Tools

| # | Tool | Input | Notes |
| --- | --- | --- | --- |
| 1 | JSON Formatter | JSON text | Pretty-prints and reports validity. |
| 2 | Base64 Encoder / Decoder | UTF-8 text | Uses `TextEncoder` (Unicode-safe). |
| 3 | URL Encoder / Decoder | Text | Percent-encodes and decodes. |
| 4 | HTML Entity Encoder / Decoder | HTML text | Escapes `&<>"'`. |
| 5 | Regex Tester | pattern + flags + input | Global matching, groups, zero-width-safe. |
| 6 | JWT Payload Decoder | JWT token | Decodes header and payload, displays `iat`/`nbf`/`exp` and expiry state, and **does not verify the signature**. |
| 7 | UUID v4 Generator | none | RFC 4122 version 4 UUID from `crypto.getRandomValues`. Identifiers, not secrets. |
| 8 | SHA Hash Generator | UTF-8 text | SHA-256, SHA-384 or SHA-512 hex digest through Web Crypto. |
| 9 | Unix Timestamp Converter | seconds, milliseconds or ISO 8601 | Shows Unix seconds, milliseconds, UTC, ISO 8601 and local time. |
| 10 | WCAG Contrast Checker | foreground + background hex | Reports the ratio and WCAG 2.2 AA/AAA results for normal text, large text and UI components. |
| 11 | CSS Gradient Generator | type, angle, stops | Emits a copyable `linear-gradient()` / `radial-gradient()` string. |
| 12 | HTTP Status Reference | numeric code | Lists matching known statuses and their category. |

## Security model

All logic is in pure functions in `client/src/lib/devtools.js`:

- **JWT decoding is local-only.** `decodeJwt` never verifies the signature. It
  returns a `warning` that says exactly this. Never use it as proof that a token
  is authentic.
- **No data leaves the page.** There are no network calls, no storage writes,
  and no logging of input values.
- **Hashing is not password storage.** The SHA tools are one-way digests. The
  UI states that passwords need a salted, slow KDF such as bcrypt, scrypt or
  Argon2.
- **UUIDs are identifiers.** The generator uses the platform CSPRNG and sets the
  RFC 4122 version and variant bits. A UUID is not a bearer token.
- **Contrast checks use opaque hex colours.** Translucent colours cannot be
  evaluated without compositing them against a known backdrop.
- **Malformed input is handled.** Tests in `client/tests/devtools.test.js` cover
  invalid JSON, bad Base64, malformed percent-escapes, invalid regex flags,
  bad JWTs, unsupported hashes, malformed timestamps, invalid colours,
  too-long inputs, and unknown entities.

## Testing

Run with Node's built-in runner — no dependencies required:

```powershell
Set-Location "E:\PORT\PORTFOLIO-APP\client"
node --test "tests/*.test.js"
```

Expected: `38 pass, 0 fail` across the client suites. The developer-tool cases
are in `client/tests/devtools.test.js`; `taxonomy.test.js` and
`seo-build.test.js` cover the blog and generated route documents.

## Sharing / deploying

The page is reachable at `/tools`. To add a new tool:

1. Add its function to `client/src/lib/devtools.js`.
2. Add a case to `Tools.jsx` (`pages/tools/Tools.jsx`) and a `ToolDefinition`.
3. Add unit tests to `client/tests/devtools.test.js`.
4. Add the tool name to the `/tools` description in `client/scripts/build-seo.mjs`
   and the CI metadata markers if the visible copy changes.

## Known limitations

- Base64 encoding uses `btoa`/`atob`; very large inputs (>1 MB) are rejected
  for safety.
- The gradient builder validates against a small set of named CSS colours and
  the `#rgb`/`#rrggbb` hex forms.
- The contrast checker accepts `#rgb` and `#rrggbb` only.
- Timestamp input with up to 10 digits is read as seconds; longer numeric input
  is read as milliseconds.
- The JWT decoder shows claims but cannot prove that a token was issued by a
  trusted party.
