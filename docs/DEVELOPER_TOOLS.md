# DEVELOPER TOOLS — MK-PORTFOLIO

**Date:** 2026-11-21
**Page:** [https://mk-portfolio-phi-silk.vercel.app/tools](https://mk-portfolio-phi-silk.vercel.app/tools)

Ten browser-based developer utilities. Every tool runs **locally in your
browser** — nothing is sent to a server, and no token is ever transmitted.

## Tools

| # | Tool | Input | Notes |
| --- | --- | --- | --- |
| 1 | JSON Formatter | JSON text | Pretty-prints and reports validity. |
| 2 | Base64 Encoder / Decoder | UTF-8 text | Uses `TextEncoder` (Unicode-safe). |
| 3 | URL Encoder / Decoder | Text | Percent-encodes and decodes. |
| 4 | HTML Entity Encoder / Decoder | HTML text | Escapes `&<>"'`. |
| 5 | Regex Tester | pattern + flags + input | Global matching, groups, zero-width-safe. |
| 6 | JWT Payload Decoder | JWT token | Decodes header and payload **without verifying the signature** — it is a developer inspection tool. |
| 7 | CSS Gradient Generator | type, angle, stops | Emits a copyable `linear-gradient()` / `radial-gradient()` string. |
| 8 | HTTP Status Reference | numeric code | Lists matching known statuses and their category. |

## Security model

All logic is in pure functions in `client/src/lib/devtools.js`:

- **JWT decoding is local-only.** `decodeJwt` never verifies the signature. It
  returns `warning` that says exactly this. Never use it as proof that a token
  is authentic.
- **No data leaves the page.** There are no network calls, no storage writes,
  and no logging of input values.
- **Malformed input is handled.** Tests in `client/tests/devtools.test.js` cover
  invalid JSON, bad Base64, malformed percent-escapes, invalid regex flags,
  bad JWTs, too-long inputs, and unknown entities.

## Testing

Run with Node's built-in runner — no dependencies required:

```powershell
Set-Location "E:\PORT\PORTFOLIO-APP\client"
node --test "tests/*.test.js"
```

Expected: `15 pass, 0 fail`.

## Sharing / deploying

The page is reachable at `/tools`. To add a new tool:

1. Add its function to `client/src/lib/devtools.js`.
2. Add a case to `Tools.jsx` (`pages/tools/Tools.jsx`) and a `ToolDefinition`.
3. Add unit tests to `client/tests/devtools.test.js`.
4. Add to the sitemap generator (`client/scripts/build-seo.mjs`).

## Known limitations

- Base64 encoding uses `btoa`/`atob`; very large inputs (>1 MB) are rejected
  for safety.
- The gradient builder validates against a small set of named CSS colours and
  the `#rgb`/`#rrggbb` hex forms.
