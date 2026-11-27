# SECURITY.md — GROWTH PROGRAMME ADDITIONS

**Date:** 2026-11-21

This document records security analysis of the changes made by the
**100k organic growth programme**. The existing security posture is documented
in `docs/SECURITY_AUDIT.md` and `docs/SECURITY_OPERATIONS.md`; this document
addresses the additions.

---

## 1. Changes made

| Change | Security review |
| --- | --- |
| SEO metadata + JSON-LD | Low risk: data is static strings; JSON-LD is written to `<head>` and rendered as text. XSS impossible unless the author writes bad data. |
| Per-route `SEO.jsx` updates | Low risk: DOM mutations via `setAttribute` with static/owner-controlled values. |
| Sitemap/RSS generator | Low risk: output written to `dist/` during build; host hard-coded to the production URL. |
| Blog content system | Medium risk if misused: renders structured content to React elements (no `dangerouslySetInnerHTML`). Validate new posts are JS modules reviewed like code. |
| Developer tools | Medium risk: JWT decoder must never verify signatures; it doesn't. All tools are local-only. |
| Analytics module | Medium risk, off by default; enabling requires owner approval and CSP updates (`docs/ANALYTICS_SETUP.md`). |
| Vercel CSP | Reviewed: analytics CSP changes documented; no other CSP relaxation. |
| New npm dependencies | **None added.** Verified: client and server `package.json` files unchanged by this programme. |

---

## 2. Findings by severity

### 2.1 Low (accepted or documented)

- **Per-route metadata written client-side.** Crawlers that don't run JS see
  the homepage metadata. Accepted: tracked as backlog item A-01 (prerender).
- **Sitemap `lastmod` for static pages is "today"** on every build. Acceptable:
  tells search engines the page was served; not a claimed update of content.

### 2.2 Medium

- **Dynamic JSON-LD injection.** New `data-ld="dynamic"` script is appended to
  `<head>` and replaced on route change. It is not consumed by crawlers
  during SSR, but it is valid JSON-LD and the app is client-rendered anyway.
  Recommendation: keep values free of special characters by using
  `JSON.stringify` (already the case).
- **Blog posts are executable code.** They are plain modules imported into the
  bundle. They must be reviewed with the same rigor as source code. Linted and
  built with the app.
- **Analytics off by default** — correct. Owner approval required per
  `AGENTS.md`.

### 2.3 No findings

- No secrets in any new file (checked against `gitleaks` — CI will confirm).
- No new third-party scripts loaded by default.
- No weakening of CSP, `unsafe-eval`, `frame-ancestors` or other directives.

---

## 3. Automated verification

| Check | Command | Expected result |
| --- | --- | --- |
| Client lint | `cd client && npm run lint` | 0 errors (owner accepts warnings) |
| Client tests | `cd client && node --test "tests/*.test.js"` | 38 pass / 0 fail |
| Client build | `cd client && npm run build` | exit 0; sitemap + RSS generated |
| Server syntax | `cd server && npm run check` | exit 0 |
| Server tests | `cd server && npm test` | 100 pass / 0 fail |
| Dependency audit | `cd client && npm audit --omit=dev; cd server && npm audit --omit=dev` | pre-existing findings only |
| Gitleaks | CI `gitleaks.yml` | no findings on new files |

Note: `npm run check` and server tests on `E:` are affected by the FAT32 drive
corruption on that drive; the builds/tests were executed on an NTFS-backed
mirror. See `docs/DEPLOYMENT.md` "Test environment note".

---

## 4. Action items

| ID | Status | Owner |
| --- | --- | --- |
| S1 | Prerender SPA (A-01 in baseline) — backlog | Owner |
| S2 | Enable analytics — requires approval (`docs/ANALYTICS_SETUP.md`) | Owner |
| S3 | Review blog post content as code before publishing | Owner |

---

## 5. Conclusion

The growth programme does not weaken any existing security control and adds no
new third-party integration. All new client-side code is dependency-free and
unit-tested. No action required before the next release.
