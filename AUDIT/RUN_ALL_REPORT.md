# RUN ALL REPORT

**Date:** 24 November 2026
**Branch:** `main`
**Code commit verified in production:** `d27983f`
**Report commit:** docs-only, committed after the verification above; it does not change runtime code
**Gate source:** working tree at `d27983f`, plus a disposable Docker reproduction of the CI stack
**Source of truth:** `E:\PORT\PORTFOLIO-APP`
**Production site:** `https://mk-portfolio-phi-silk.vercel.app`
**Production API:** `https://mk-portfolio-api.onrender.com`
**Operator:** OpenCode agent, on behalf of Mayuresh Kasar

Labels used in this report:

- `[VERIFIED]` — executed in this session and observed directly.
- `[INFERRED]` — follows from verified evidence but was not separately executed.
- `[UNVERIFIED]` — not executed or not observable with available access.
- `[BLOCKED]` — cannot be completed without owner action, credentials, or approval.

---

## 1. Final state

`[VERIFIED]` The blog, tools, legal pages, security hardening, and CI fixes are merged to
`main` and deployed as one site:

| Item | Evidence |
|------|----------|
| Merge commit | `e3270e4` — `merge: ship blog, tools, legal pages and security hardening to production` |
| CI fixes | `5dc1591` (bcrypt CI hash), `6e0d672` (SameSite validation), `d27983f` (Compose hash escaping and smoke routes) |
| CI run | `45314859476` — **success** for all jobs |
| API deployment | Render reports commit `d27983f`, health `healthy`, database `connected`, 14 projects |
| Frontend deployment | Vercel commit status `success`; production serves the new routes |
| Production smoke tests | GitHub Actions job **success** |

`[VERIFIED]` The live site now exposes:

```text
/       200
/blog   200   Technical Blog - Architecture and Development Practice
/tools  200   Developer Tools
/privacy 200  Privacy Policy
/this-route-does-not-exist 404
```

`[VERIFIED]` The production sitemap contains 22 URLs, `robots.txt` points at the production
sitemap, and `/admin` returns `X-Robots-Tag: noindex, nofollow`.

`[VERIFIED]` No paid traffic, bot traffic, fake analytics, or purchased views were used.
The 500-views-per-day goal is **not yet achieved**; section 8 describes the honest path.

---

## 2. Local gate results

| # | Gate | Command | Result | Evidence |
|---|------|---------|--------|----------|
| 1 | Server syntax | `npm run check` in `server/` | **PASS** | `Syntax check passed for 71 server files.` |
| 2 | Server tests | `npm test` in `server/` | **PASS** | `120` tests, `120` pass, `0` fail |
| 3 | Client tests | `npm test` in `client/` | **PASS** | `29` tests, `29` pass, `0` fail |
| 4 | Client lint | `npm run lint` in `client/` | **PASS** | ESLint exited `0` with no findings |
| 5 | Production build | `npm run build` in `client/` | **PASS** | Vite built `1924` modules in `6.57s` |
| 6 | SEO artifact build | part of `npm run build` | **PASS** | `build-seo: 2 blog posts, 22 sitemap URLs, 25 route documents` |
| 7 | Client dependency audit | `npm audit` in `client/` | **PASS** | `found 0 vulnerabilities` |
| 8 | Server dependency audit | `npm audit` in `server/` | **PASS** | `found 0 vulnerabilities` |
| 9 | Clean URLs and 404s | local static server against `dist/` | **PASS** | `22/22` checks passed |
| 10 | Docker CI stack | disposable copy of the repo | **PASS** | Database, API, and client healthy; API, auth, CSRF, SQL, and frontend checks passed |

`[VERIFIED]` No test was skipped, cancelled, or marked as passed without execution.

### Build output

```text
dist/index.html                    7.03 kB   | gzip:   1.90 kB
dist/assets/index-BFGR1hk5.js    382.76 kB  | gzip: 121.16 kB
dist/assets/index-BBOmPA4J.css    54.98 kB  | gzip:  10.77 kB
dist/assets/*.woff2, *.woff       14 files   | total assets: 715,879 bytes
built in 6.57s
build-seo: 2 blog posts, 22 sitemap URLs, 25 route documents
```

`[VERIFIED]` Fonts are self-hosted. The build does not fetch Google Fonts at runtime.

### Test coverage highlights

`[VERIFIED]` Server tests cover:

- Admin authentication: bcrypt precedence, plaintext rejection in production, placeholder
  rejection, invalid-hash rejection, timing-safe comparison, and fail-closed production
  verification.
- Session configuration: `SameSite=Lax` default, `Secure` in production, `__Host-` cookie,
  `SameSite=None` opt-in, lifetime clamping, idle timeout, and cookie options.
- Session state machine: missing, revoked, expired, and idle sessions; malformed timestamps;
  admin-email changes; CSRF enforcement.
- Upload handling: Cloudinary URL parsing, timeout cleanup, MIME/extension validation,
  renamed executables, ZIP-as-DOCX, and disguised HTML/SVG.
- Contact validation and spam controls: field validation, honeypot, timing, link flood,
  and email flood.
- Origin/Referer enforcement, pagination, crypto helpers, TOTP, environment validation,
  Gmail message construction, and log sanitisation.

`[VERIFIED]` Client tests cover:

- Developer-tool pure logic: JSON, Base64, URL, HTML, regex, JWT, and CSS gradients.
- Blog taxonomy: slug matching for tags and categories.
- SEO build: route generation, directory indexes, `404.html`, sitemap exclusions,
  article metadata replacement, 404 `noindex`, JSON-LD preservation, XML escaping,
  RFC 822 dates, `llms.txt` exclusions, and `vercel.json` clean URLs with no SPA catch-all.

---

## 3. Build artifact verification

`[VERIFIED]` The following files exist in `client/dist` after the build:

| Artifact | Result |
|----------|--------|
| Route index documents | `24` (`/`, about, accessibility, admin, admin/dashboard, blog, 2 categories, 2 posts, 6 tags, certificates, contact, privacy, projects, skills, system, terms, tools) |
| `404.html` | Present, served as the real 404 document |
| Total HTML documents | `25` (`24` route indexes + `404.html`) |
| `sitemap.xml` | `22` URLs |
| `rss.xml` | Present |
| `llms.txt` | Present |
| `robots.txt` | Present |
| `manifest.json` | Present |
| `.well-known/security.txt` | Present |

`[VERIFIED]` `sitemap.xml` excludes `/admin`, `/admin/dashboard`, and `/404`.

`[VERIFIED]` `404.html` contains `<meta name="robots" content="noindex, nofollow" />`.
The canonical link is removed from `404.html`.

`[VERIFIED]` `/admin` and `/admin/dashboard` are `noindex` route documents and are not in
the sitemap.

---

## 4. Live production verification

`[VERIFIED]` The live Vercel deployment was checked directly on 24 November 2026:

| Route | Status | Notes |
|-------|--------|-------|
| `/` | `200` | Home page |
| `/blog` | `200` | Title `Technical Blog - Architecture and Development Practice` |
| `/blog/how-i-built-my-full-stack-developer-portfolio` | `200` | Published post |
| `/tools` | `200` | Developer tools |
| `/privacy` | `200` | Privacy policy |
| `/sitemap.xml` | `200` | 22 `<loc>` entries |
| `/rss.xml` | `200` | RSS feed |
| `/llms.txt` | `200` | Language-model summary |
| `/this-route-does-not-exist` | `404` | No SPA catch-all |
| `/admin` | `200` | `X-Robots-Tag: noindex, nofollow` |

`[VERIFIED]` Production security headers include:

```text
Content-Security-Policy: default-src 'self'; base-uri 'self'; object-src 'none';
  frame-ancestors 'none'; form-action 'self'; script-src 'self';
  style-src 'self' 'unsafe-inline'; img-src 'self' data: https://res.cloudinary.com;
  font-src 'self'; connect-src 'self'; manifest-src 'self'; media-src 'none';
  worker-src 'none'; upgrade-insecure-requests
Strict-Transport-Security: max-age=63072000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
```

`[VERIFIED]` The production API reports:

```json
{
  "deployment": { "commit": "d27983f" },
  "status": "healthy"
}
```

`[VERIFIED]` `/api/health/ready` reports `success: true` and `database: connected`.
`/api/projects` returns 14 rows.

`[VERIFIED]` GitHub Actions run `45314859476` completed with conclusion `success`:

```text
Repository Hygiene          success
Server Syntax & Tests       success
Client Lint & Build         success
Lint Dockerfiles            success
Build & Test Full Stack     success
Deploy API to Render        success
Production Smoke Tests      success
```

`[VERIFIED]` Vercel reports commit status `success` for `d27983f`
("Deployment has completed").

---

## 5. CI failure root cause and fix

`[VERIFIED]` The Docker job failed repeatedly at **Start Containers**, before the Render
deploy could run. The job log itself is admin-only, so the failure was reproduced locally
with a disposable copy of the repository and the exact CI environment.

Root cause:

- Docker Compose interpolates `$` inside `env_file` values.
- A bcrypt hash contains several `$` segments, so the CI hash was corrupted before it
  reached the server.
- The server correctly rejected the invalid hash at startup.
- The API container exited, its health check failed, and `docker compose up -d` failed
  because the client depends on a healthy API.

Fix (`d27983f`):

- The CI-only hash is now single-quoted in `server/.env`, so Compose passes it literally.
- The `Start Containers` step now prints `docker compose ps` and `docker compose logs` on
  failure, so the next failure is visible without admin log access.
- The production smoke test now expects `/blog`, `/tools`, `/privacy`, and a real blog post
  to return `200`, and an unknown route to return `404` instead of the old SPA fallback.

`[VERIFIED]` The full Docker stack was rebuilt locally with the corrected environment:
database, API, and client became healthy; admin login, CSRF/origin checks, protected
routes, skill/certificate/project updates, logout revocation, SQL against an arbitrary
database name, and frontend security headers all passed.

`[VERIFIED]` A second CI bug was fixed in `6e0d672`: `validateEnv.js` still defaulted
production `SameSite` to `none`, while `sessionConfig.js` defaults to `lax`. The validator
now matches the session configuration, with a regression test. Server tests are `120/120`.

---

## 6. Security and data safety

`[VERIFIED]` No secret was read, printed, or committed. `.env` files remain ignored and
untouched. The CI reproduction used disposable, fake CI values in a temporary directory.

`[VERIFIED]` The production admin login rejects wrong credentials with `401` (verified by
the production smoke tests). The admin area is `noindex` and excluded from the sitemap.

`[VERIFIED]` Production uses HTTPS with HSTS, a restrictive CSP, `X-Frame-Options: DENY`,
and `X-Content-Type-Options: nosniff`.

`[VERIFIED]` No production database schema change, column drop, table drop, or data
deletion was performed. Docker/SQL tests ran against disposable containers only.

`[VERIFIED]` `npm audit` reports zero vulnerabilities in both the client and server
packages.

---

## 7. Remaining owner actions

1. **Submit the site to search engines.** Add the production property to Google Search
   Console and Bing Webmaster Tools, verify it, and submit
   `https://mk-portfolio-phi-silk.vercel.app/sitemap.xml`. The Search Console verification
   file is already in `client/public`.
2. **Approve analytics.** GA4 is disabled by default. Enabling it requires a documented
   CSP change and owner approval; without analytics there is no reliable way to measure
   the 500/day goal.
3. **Publish and distribute content.** The site has 2 blog posts. A sustainable 500/day
   requires a repeatable publishing cadence, real search intent, internal links, and
   distribution to relevant communities.
4. **Rotate the Cloudinary API key** and complete the provider's email verification.
5. **Re-authorize Gmail OAuth** or move the OAuth app out of Testing mode so refresh
   tokens do not expire every seven days.
6. **Approve optional test dependencies** (Playwright/axe/k6) if browser, accessibility,
   or load tests should run in CI.

`[BLOCKED]` Render deploy logs still require a dashboard login or API token. The public
`/api/system` endpoint proves the deployed commit and health, so this does not block
verification.

---

## 8. Traffic goal: 500 views per day

`[UNVERIFIED]` **500 views/day is not achieved.** No analytics property is enabled, so
there is no measured baseline. No paid, bot, or fake traffic was used.

`[INFERRED]` 500 views/day is about 15,000 views per month. For a new personal site this
normally takes months of indexing, content, and distribution. Code alone cannot produce
it.

A realistic, zero-cost plan:

### Week 1 — make the site measurable and indexable

- Verify the site in Google Search Console and Bing Webmaster Tools.
- Submit the sitemap and request indexing for `/`, `/blog`, `/tools`, and the two posts.
- Enable GA4 only after owner approval and the CSP update; otherwise use Search Console
  impressions/clicks as the baseline.
- Confirm `robots.txt`, canonicals, Open Graph tags, and the 404 page in the live site.

### Weeks 2–6 — publish for real search intent

- Publish 2 useful posts per week. Each post should answer a query someone actually
  searches for, with code, screenshots, and a clear takeaway.
- Link every post to the projects, tools, and contact page.
- Add a short "related posts" block and keep tag/category pages useful.
- Share each post once on LinkedIn/X and in one relevant community where self-promotion
  is allowed. Do not spam.

### Months 2–3 — earn distribution

- Turn the best posts into short guides, diagrams, or open-source examples.
- Answer relevant questions on developer forums with a link only when it genuinely helps.
- Ask for links from communities, newsletters, and other developers who publish similar
  work.
- Refresh the posts that get impressions but low click-through; improve titles and
  introductions.

### Measure monthly

- Search Console: impressions, clicks, CTR, average position.
- GA4 (if enabled): engaged sessions, top landing pages, referral sources.
- Double down on the pages that already earn impressions; delete or merge pages that
  earn none after 60–90 days.

`[INFERRED]` A realistic early target is steady organic impressions first, then 50–100
views/day, then 500/day as content and links accumulate. Any promise of 500/day in a fixed
short period would be fabricated.

---

## 9. Commands run

```powershell
# Server gates
cd E:\PORT\PORTFOLIO-APP\server
npm ci
npm run check
npm test

# Client gates
cd E:\PORT\PORTFOLIO-APP\client
npm test
npm run lint
npm run build
npm audit

# Server audit
cd E:\PORT\PORTFOLIO-APP\server
npm audit

# CI reproduction (disposable copy)
robocopy E:\PORT\PORTFOLIO-APP C:\Users\Dell\AppData\Local\Temp\opencode\docker-repro `
  /MIR /XD .git node_modules dist coverage /XF .env /NFL /NDL /NJH /NJS /NP
docker compose -f docker-compose.yml -f repro.override.yml build
docker compose -f docker-compose.yml -f repro.override.yml up -d
# health, admin auth, CSRF, SQL, and frontend checks
docker compose -f docker-compose.yml -f repro.override.yml down -v

# Merge and deploy
git checkout main
git merge --no-ff feature/100k-organic-growth
git push origin main

# Production verification
curl.exe -sS -o NUL -w "%{http_code}" https://mk-portfolio-phi-silk.vercel.app/blog
curl.exe -sS https://mk-portfolio-phi-silk.vercel.app/sitemap.xml
curl.exe -sS https://mk-portfolio-api.onrender.com/api/system
curl.exe -sS https://mk-portfolio-api.onrender.com/api/health/ready
```

`[VERIFIED]` All local gates, the Docker reproduction, the merge, the push, the CI run,
the Render deployment, and the production smoke tests exited successfully.

---

## 10. Summary

`[VERIFIED]` The repository passes every executed gate:

- 71 server files pass syntax checking.
- 120/120 server tests pass.
- 29/29 client tests pass.
- ESLint passes.
- The production build emits 25 HTML documents, 22 sitemap URLs, RSS, `llms.txt`,
  `robots.txt`, the manifest, and `security.txt`.
- `npm audit` reports zero vulnerabilities in both packages.
- 22/22 clean-URL, route, and 404 checks pass.
- The full Docker CI stack starts and passes API, auth, SQL, and frontend checks.
- CI run `45314859476` is green, including the Render deploy and production smoke tests.
- Production runs API commit `d27983f` and the new Vercel build.
- `/blog`, `/tools`, and `/privacy` are live; unknown routes return `404`; `/admin` is
  `noindex`.

`[UNVERIFIED]` The 500-views-per-day goal is not achieved and is not claimed. The next
step is measurable growth work: indexing, analytics approval, consistent publishing, and
honest distribution.
