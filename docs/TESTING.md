# Testing Strategy

**Product:** Mayuresh Kasar Portfolio ("MAYURESH.DEV")
**Document owner:** Mayuresh Kasar
**Status:** Source of truth for verification
**Version:** 1.1
**Last updated:** 2026-11-22
**Related:** [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) · [DEBUGGING.md](./DEBUGGING.md) · [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 1. Testing philosophy

Test the paths that can lose data, expose data, or stop the site:

- authentication and authorization;
- input validation and upload handling;
- database writes and schema compatibility;
- payment-free but abuse-prone public endpoints (contact, AI);
- production configuration and headers;
- the deploy pipeline itself.

Do not chase coverage percentages. This project has a small surface and no dedicated QA team; tests must be fast, deterministic, and meaningful.

## 2. Test layers

| Layer | Tool | Location | Runs in CI |
|---|---|---|---|
| Server syntax | custom `checkSyntax.js` | `server/scripts` | Yes |
| Server unit | `node:test` + `assert` | `server/tests/*.test.js` | Yes |
| Client unit | `node:test` + `assert` | `client/tests/*.test.js` | Yes |
| Client static | ESLint | `client/` | Yes |
| Client build | Vite + SEO generator | `client/` | Yes |
| Dockerfile lint | Hadolint | three Dockerfiles | Yes |
| Full stack integration | Docker Compose + curl + jq | workflow | Yes |
| Production smoke | curl + Node script | workflow | Yes |
| Live route audit | Playwright (operator) | outside repo | Manual |
| Secret scan | ripgrep/git history/bundle scan | operator | Manual + CI hygiene |

## 3. Server tests

### 3.1 Files and focus

| File | Focus |
|---|---|
| `adminAuth.test.js` | Plain and bcrypt paths, hash precedence, production plaintext rejection, validation |
| `sessionState.test.js` | Pure allow/reject/revoke state machine: revocation, expiry, idle timeout, admin change, CSRF |
| `sessionConfig.test.js` | Cookie defaults, SameSite, clamping, `__Host-` prefix, set/read/clear |
| `email.test.js` | Email config/transport selection, Gmail client and MIME behavior |
| `validateEnv.test.js` | Required env values, production rules, origins, placeholders |
| `messageValidation.test.js` | Contact payload types, defaults, lengths, email format |
| `clientIp.test.js` | Real client IP resolution from proxy headers |
| `origin.test.js` | Origin/Referer allowlist and CSRF-adjacent request checks |
| `security.test.js` | Hashing, token entropy, constant-time comparison |
| `totp.test.js` | RFC 6238 vectors and clock-skew window |
| `fileSignature.test.js` | Magic-byte validation and disguised uploads |
| `spamGuard.test.js` | Honeypot, timing, link/email flood checks |
| `errorMiddleware.test.js` | Production error normalization and log redaction |
| `pagination.test.js` | Page/limit parsing and clamping |
| `cloudinaryAsset.test.js` | Cloudinary URL parsing and orphan cleanup |

Current baseline: **119 tests passing** across 15 files.

### 3.2 Commands

```bash
cd server
npm run check   # syntax over all server JS files
npm test        # node --test "tests/*.test.js"
```

`npm run check` currently covers 71 files.

### 3.3 Rules for new tests

- Use `node:test` and `node:assert/strict`; no new test framework.
- No network calls, real database, or production credentials.
- Save/restore `process.env` keys touched by a test.
- Cover the boundary: empty, wrong type, maximum length, one over, missing, malformed.
- Cover the security property, not only the happy path (for example, wrong email with correct password must fail).
- Do not assert on exact log text unless the text is a contract.
- Keep tests independent; order must not matter.

### 3.4 Gaps

- No controller/model tests with a mocked pool.
- No test for the 401 interceptor in the browser.
- No rate-limit integration test in unit suites (the Docker job exercises login limits).
- No test that the middleware itself wires every state-machine decision to the
  correct HTTP response; the pure decision function is covered, the wiring is
  reviewed manually.
- No upload-timeout test with a mocked Cloudinary stream.

Add these before expanding the auth, upload, or rate-limit surface.

## 4. Client checks

```bash
cd client
npm test          # node --test "tests/*.test.js"
npm run lint
npm run build
```

Client unit suites:

| File | Focus |
|---|---|
| `devtools.test.js` | JSON, Base64, URL/HTML, regex, JWT decode and time claims, UUID v4, SHA hashes, timestamps, WCAG contrast, gradient builder, zero-width regex safety |
| `taxonomy.test.js` | Slug matching for tags/categories and canonical label recovery |
| `seo-build.test.js` | Route documents, directory indexes, sitemap exclusion, metadata replacement, 404 noindex, RSS, llms.txt, `vercel.json` clean URLs |

Current baseline: **38 tests passing**.

What the build must prove:

- `dist/index.html` exists and the React root is present;
- `dist/404.html` exists and is `noindex`;
- every public route, post and taxonomy page has a directory-index document;
- `dist/sitemap.xml` has 39 URLs and no `/admin`, `/api` or `/404`;
- `dist/rss.xml` and `dist/llms.txt` exist and exclude private routes;
- `.well-known/security.txt` and `manifest.json` are copied;
- per-page SEO markers survive minification;
- the production API URL is baked in when configured;
- no server secret appears in the bundle;
- assets are emitted under `dist/assets`.

ESLint covers React, hooks, and refresh rules. The unit suites cover pure
logic; there is still no browser component test or committed E2E suite.

### Manual client checks

- All public routes render, including `/privacy`, `/terms`, `/accessibility`
  and every `/tools` tool.
- Unknown route renders the 404.
- Admin login and dashboard render.
- Loading, empty, error, and retry states.
- Mobile menu focus trap, Escape, route-change close.
- Skip link.
- Reduced motion.
- 320 px, 768 px, 1024 px, 1440 px.
- No horizontal scroll.
- Images have alt text and fallbacks.
- Forms have labels and announced errors.

## 5. Docker stack tests

The CI `docker-stack` job is the closest thing to an end-to-end test. It:

1. creates CI env files;
2. validates `docker compose config`;
3. builds all images;
4. verifies images contain no `.env` or build output;
5. starts MySQL, API, and Nginx;
6. waits for `/api/health/ready`;
7. applies `schema.sql` and `seed.sql` to a second database (`portfolio_alt`) and checks counts;
8. runs `db:check`;
9. tests public API resources and message auth;
10. tests login success/failure and protected updates;
11. tests frontend routes, `/api` proxy, and security headers;
12. uploads logs on failure;
13. tears down volumes.

Local equivalent:

```bash
docker compose up --build -d
docker compose ps
docker compose logs -f server
docker compose down -v
```

This job catches schema/name coupling, proxy mistakes, auth wiring, and container-only failures that unit tests cannot.

## 6. Production smoke tests

The final CI job verifies the live system:

| Check | Expected |
|---|---|
| API health | `200`, healthy |
| API readiness | `200`, database connected |
| Node version | `v22.x` |
| Projects/skills/certificates | Non-zero counts |
| `/api/messages` without a cookie | `401` |
| Login with CI credentials | `200` + HttpOnly session cookie + CSRF token |
| Wrong password | `401` |
| Protected mutation without `X-CSRF-Token` | `403` |
| CORS preflight | Expected allow origin; disallowed origin rejected |
| Vercel routes | Home and deep links return the app shell |
| Security headers | CSP, HSTS, frame denial, nosniff, referrer, permissions |
| `/admin` noindex | `X-Robots-Tag: noindex, nofollow` |
| `robots.txt` | Present, excludes `/admin` and `/api`, points to sitemap |
| `sitemap.xml` | Present, valid, and has no private URLs |
| `rss.xml` / `llms.txt` | Present and free of private URLs |
| Unknown path | HTTP `404`, not a 200 SPA shell |

Production smoke tests use CI-only credentials; they do not print tokens.

## 7. Live browser audit

Performed with Playwright against the deployed site:

- every public route, `/admin`, `/admin/dashboard`, and a 404 path;
- console errors;
- failed requests;
- broken images;
- unsafe links (`javascript:`, missing `rel` on external targets);
- page titles and headings.

Latest result: **0 console errors, 0 failed requests, 0 broken images, no unsafe links** across all routes.

This audit is not committed as an automated suite. If it becomes recurring, move it into the repo with a deterministic server and no credentials.

## 8. Security testing

Run before every release that touches auth, headers, uploads, or dependencies:

```bash
# Dependency audit (production dependencies)
cd client && npm audit --omit=dev
cd ../server && npm audit --omit=dev

# Tracked-file secret scan (adjust patterns locally; never print matches)
git ls-files | Select-String -Pattern '\.env$|\.pem$|\.key$|id_rsa'

# History scan (use a dedicated scanner; do not print secrets)
# Build-output scan
# Live bundle scan
```

Also verify:

- no `ADMIN_PASSWORD` in the client bundle;
- no server secret in `dist/`;
- no `.env` in Docker images;
- `/admin` and `/api` noindex headers;
- CSP has no `unsafe-eval`; `frame-ancestors 'none'`;
- CORS rejects an unlisted origin;
- upload rejects wrong MIME and oversize files;
- malformed JSON returns `400`, not `500`;
- unknown API route returns a generic `404`;
- production 5xx does not include a stack.

Detailed checklist: [SECURITY_AUDIT.md](./SECURITY_AUDIT.md).

## 9. Accessibility testing

Current manual checks:

- keyboard-only navigation;
- visible focus;
- skip link;
- semantic headings;
- form labels and error announcements;
- modal and mobile-menu focus traps;
- `prefers-reduced-motion`;
- contrast against the documented palette.

Known issues:

- focus ring pink-on-acid is 2.71:1;
- white-on-pink is 3.18:1 (avoid normal text);
- gray-on-acid is 4.11:1 (avoid body text);
- no automated axe/Lighthouse gate;
- no documented screen-reader regression run;
- zoom/reflow at 200%/400% not formally verified.

Do not claim WCAG conformance until these are addressed and an automated check is in CI.

## 10. Performance testing

No load test or Lighthouse budget is enforced. Current expectations:

- warm public pages feel immediate;
- API reads return quickly at four-table scale;
- client build stays small enough for a portfolio;
- Render cold start is the dominant delay and is handled with a 60-second timeout and a clear state.

If performance work starts:

1. capture a baseline (Lighthouse mobile/desktop, API timings);
2. change one thing;
3. compare;
4. record the result;
5. avoid adding caching without invalidation design.

## 11. Database testing

- `npm run db:check` after every migration.
- Apply SQL to an arbitrary database name in CI.
- Verify counts after seed: 4 / 16 / 16.
- Test create/update/delete against a disposable row.
- Test partial-update semantics (omitted vs empty).
- Test nullable certificate image.
- Test `messages.subject` default.
- Never run destructive tests against production.

Restore drills are not yet automated; see [DATABASE.md](./DATABASE.md).

## 12. Test data rules

- Use obvious disposable values (`TEMP-TEST-<timestamp>`).
- Delete test rows after verification.
- Never use a real visitor's message or email in a test.
- Never commit a production dump.
- Never use production admin credentials in a local test.
- CI credentials are generated per run and are not production values.

## 13. CI pipeline as a test

The seven jobs are part of the test suite:

1. Repository Hygiene
2. Server Syntax & Tests
3. Client Lint & Build
4. Lint Dockerfiles
5. Build & Test Full Stack
6. Deploy API to Render
7. Production Smoke Tests

A change is not verified until the pipeline result is known. A green local run does not prove the Docker or production path.

## 14. Release test checklist

- [ ] Server syntax and 119 tests pass.
- [ ] Client 38 tests, lint and build pass.
- [ ] Build emitted 39 sitemap URLs, 42 route documents and `404.html`.
- [ ] No new dependency vulnerability.
- [ ] Secret scan clean (tree, history, build, live assets).
- [ ] API contract unchanged or documented.
- [ ] Schema migration idempotent and verified.
- [ ] Docker stack job green if containers/schema changed.
- [ ] Public routes and admin flow manually checked.
- [ ] Accessibility spot check (keyboard, focus, reduced motion).
- [ ] Production smoke green after deploy.
- [ ] Live headers and noindex verified.
- [ ] Render logs free of new fatal errors.
- [ ] Documentation updated.

## 15. Known testing limitations

| Limitation | Impact | Mitigation |
|---|---|---|
| No client component tests | UI regressions rely on lint/build/manual checks | Add targeted tests for critical components |
| No repository E2E suite | Live audit is not reproducible in CI | Add Playwright with deterministic data |
| No upload-timeout integration test | Timeout wiring is only reviewed | Mock the Cloudinary stream in a test |
| No axe/Lighthouse gate | Accessibility can regress silently | Add CI check |
| No load test | Unknown behavior under traffic | Test before a launch spike |
| No backup restore drill | Recovery is unproven | Schedule a drill |
| No uptime monitor | Outages may be discovered late | Add external monitoring |
| No visual regression | CSS changes can break layouts | Manual breakpoint review |
| Gmail not configured | Notification path untested in production | Configure and send a real test |

These are documented gaps, not hidden assumptions. Close them in the order that matches risk: backups, monitoring, accessibility automation, then client tests.
