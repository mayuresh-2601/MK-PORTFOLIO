# Final Production Audit

**Product:** Mayuresh Kasar Portfolio ("MAYURESH.DEV")
**Audit date:** 2026-11-14
**Audit time:** 13:10–13:45 IST (07:40–08:15 UTC)
**Application commit audited:** `af48648` (`seo(home): match the optimized static title and output`)
**Live frontend:** https://mk-portfolio-phi-silk.vercel.app
**Live API:** https://mk-portfolio-api.onrender.com
**Repository:** https://github.com/mayuresh-2601/MK-PORTFOLIO
**Auditor:** Coding agent, on behalf of the owner
**Related:** [PRD.md](./PRD.md) · [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) · [DEPLOYMENT.md](./DEPLOYMENT.md) · [MONITORING.md](./MONITORING.md)

---

## 1. Verdict

# READY WITH WARNINGS

The portfolio is live, functional, secured to a credible baseline, and verified by a green seven-job pipeline plus fresh production checks. It is suitable for public use as a personal portfolio and demonstration of full-stack engineering.

It is **not** "warning-free". Five items remain open, one of which is a credential rotation that should be completed immediately:

| # | Open item | Severity | Owner action |
|---|---|---|---|
| 1 | Cloudinary API key/secret appeared in earlier tool output and has not been rotated | **High** | Rotate now |
| 2 | Gmail notifications are not configured (messages still save) | Medium | Configure OAuth or accept inbox-only |
| 3 | No automated database backup or restore drill | Medium | Define and test |
| 4 | No external uptime alerting | Medium | Add monitor |
| 5 | Focus ring contrast is 2.71:1 (pink on acid); no automated accessibility gate | Medium | Approve and fix |

Two repository/documentation warnings are also recorded:

| # | Warning | Impact |
|---|---|---|
| 6 | `README.md` still links to deleted legacy docs (`DEPLOYMENT.md`, `docs/EMAIL_SETUP.md`, `docs/FIXES.md`, `docs/RESTORE_NOTES.md`, `docs/CHANGELOG_AI_DEVOPS_UPDATE.md`, `PENDRIVE-README.md`) | Broken links in the public repo entry point |
| 7 | Root `README.md` contains an unrelated uncommitted edit and was intentionally not staged | The edit must be reviewed and committed by the owner |

No claim is made that the site ranks #1 for "portfolio" or any competitive query. Technical SEO is in place; ranking depends on competition, content, backlinks, repository signals, and time.

## 2. What was audited

- Live frontend routes and metadata.
- Live API health, readiness, content, auth rejection, and headers.
- Vercel security and noindex headers.
- Render startup and recent runtime logs.
- Latest `main` CI/CD run and all seven job results.
- Server syntax, server tests, client lint, and local build attempt.
- Secret scans of the working tree, documentation, tracked files, and git history.
- Documentation set completeness and legacy-file removal.
- Known security, operational, and accessibility risks.

Not audited:

- Formal penetration testing.
- TiDB provider backup configuration.
- Cloudinary/Gmail/Google account settings beyond app usage.
- Screen-reader regression on NVDA/VoiceOver.
- Load testing or long-duration soak testing.

## 3. Production evidence (fresh)

### 3.1 API

| Check | Result |
|---|---|
| `GET /api/health` | `200`, `status: healthy` |
| `GET /api/health/ready` | `200`, `status: ready`, `database: connected` |
| `GET /api/projects` | `200`, `count: 4` |
| `GET /api/skills` | `200`, `count: 16` |
| `GET /api/certificates` | `200`, `count: 16` |
| `GET /api/messages` without token | `401` |
| `X-Robots-Tag` | `noindex, nofollow` |
| `Cache-Control` | `no-store` |
| CSP `frame-ancestors 'none'` | Present |
| Node runtime | `v22.x` (CI smoke check) |

### 3.2 Frontend

| Check | Result |
|---|---|
| Homepage | `200` |
| Home title | `Mayuresh Kasar - Full Stack Developer Portfolio` |
| Canonical | `https://mk-portfolio-phi-silk.vercel.app/` |
| Open Graph image | `https://mk-portfolio-phi-silk.vercel.app/og-cover.jpg` |
| `/admin` | `200` |
| `/admin` `X-Robots-Tag` | `noindex, nofollow` |
| `/admin` CSP `frame-ancestors 'none'` | Present |
| `robots.txt` | Present; contains `Sitemap:` |
| `sitemap.xml` | Present; 7 URLs; no `/admin` |
| Live route audit (earlier same-day) | 0 console errors, 0 failed requests, 0 broken images, no unsafe links |

### 3.3 Render logs

Recent startup/runtime evidence:

```text
✅ Database connected successfully.
🚀 API listening on 0.0.0.0:10000 (production).
✅ Allowed browser origins: https://mk-portfolio-phi-silk.vercel.app
🔐 Admin login: bcrypt hash.
⚠️ Email is not configured - contact messages are saved but no notification email is sent.
[auth] Failed admin login attempt from 172.200.223.69.
POST /api/auth/login 401
```

Interpretation:

- Hash-only admin mode is active.
- The database is connected.
- CORS is restricted to the exact production origin.
- Email is intentionally disabled.
- The failed login is the expected wrong-password smoke test; the real client IP is logged, not Render's private `10.x` proxy address.
- No fatal startup error or secret is present.

## 4. CI/CD evidence

Latest `main` run at audit time:

| Property | Value |
|---|---|
| Run ID | `43571698661` |
| Head SHA | `af48648ccbf80f5e508e383dc9ac21e3e29c72bc` |
| Status | completed |
| Conclusion | **success** |
| Updated | 2026-11-14T07:36:38Z |
| Jobs | **7/7 success** |

Job results:

| Job | Result |
|---|---|
| Repository Hygiene | success |
| Server Syntax & Tests | success |
| Client Lint & Build | success |
| Lint Dockerfiles | success |
| Build & Test Full Stack | success |
| Deploy API to Render | success |
| Production Smoke Tests | success |

This is the strongest single piece of production evidence: the same pipeline that gates deployment also verified the live API, frontend routes, auth rejection, CORS, security headers, robots, and sitemap.

## 5. Local verification

| Check | Result |
|---|---|
| Server tests | **35/35 passed** |
| Server app-file syntax | **45/45 passed** via `node --check` |
| Client ESLint | Passed |
| Client production build (local) | **Failed — environment-specific** |
| Dependency audit (production) | 0 vulnerabilities in client and server (same-day) |
| Secret scan (tree + docs) | Clean except the known CI `JWT_SECRET` test fixture |
| Secret scan (git history) | Clean |

### 5.1 Local build failure — honest note

The local client build failed with:

```text
fatal error: unexpected signal during runtime execution
runtime: panic before malloc heap initialized
[signal 0xc0000005]
Error: The service was stopped
```

The standalone `esbuild.exe` also crashes with the same access violation, including after `npm rebuild esbuild`. The workspace is on a **FAT32 removable drive** and the local Node is **v24.18.0**, while the project and CI target **Node 22.x**. The same client build **passed in CI on the GitHub runner** for commit `af48648`.

This is a local-toolchain/filesystem limitation, not evidence that the production build is broken. To restore local builds:

1. Use Node 22.x (`nvm use 22` or install the matching LTS).
2. Use an NTFS workspace rather than the FAT32 drive.
3. Run `npm ci` in `client/` after switching.

The production evidence is the CI build, not this local attempt.

### 5.2 Server syntax script note

`npm run check` walks `server/` recursively and filters `node_modules` **after** traversal. On this FAT32 drive, `node_modules/cloudinary/examples` contains filenames that Windows cannot represent, so the traversal throws `ENOENT`/illegal-character errors before filtering. A manual `node --check` over the 45 application files passed.

Recommended tooling fix (not applied in this documentation change): prune `node_modules` before recursion, or walk only known app directories. CI is unaffected because it runs on a clean NTFS runner.

## 6. Security posture

### Verified

- No secret in tracked files, documentation, build output, or live assets (except known placeholders/CI fixtures).
- No secret in git history per pattern scan.
- Admin authentication is server-side and hash-only in production.
- JWT is HS256 with issuer/audience/role/email checks and 12-hour expiry.
- All mutations and the message inbox require `protect`.
- SQL is parameterized; public reads use explicit columns.
- User-supplied URLs are HTTP(S)-only on server and client.
- Uploads are MIME/size limited; contact payloads are validated before upload.
- CORS is an exact origin allowlist.
- CSP includes `frame-ancestors 'none'`; `X-Frame-Options: DENY`; HSTS; nosniff; referrer and permissions policies.
- `/admin` and API are noindex.
- Production 5xx and 404 responses do not leak internals.
- Telemetry excludes hostname and environment secrets.
- Optional integrations fail gracefully.
- `npm audit --omit=dev` reports zero vulnerabilities.

### Open

| Item | Severity | Status |
|---|---|---|
| Cloudinary credential rotation | High | Open |
| JWT in `localStorage` | Medium | Accepted; approval to change |
| No MFA | Medium | Accepted |
| No server-side token revocation | Medium | Accepted |
| No backup/restore drill | Medium | Open |
| No uptime alerting | Medium | Open |
| In-memory rate limits | Low | Accepted |
| Broad CSP `connect-src`/`img-src` | Low | Accepted |
| `style-src 'unsafe-inline'` | Low | Accepted |
| Public telemetry | Low | Accepted by product |
| No admin audit log | Low | Accepted |
| No malware scan on uploads | Low | Accepted |
| No Cloudinary cleanup on delete | Low | Accepted |

Full detail: [SECURITY_AUDIT.md](./SECURITY_AUDIT.md).

## 7. Accessibility posture

Implemented:

- semantic landmarks and one `h1` per page;
- skip link;
- visible labels and `aria-label` on icon buttons;
- focus traps for modal and mobile navigation;
- Escape and focus restoration;
- `role="status"` / `role="alert"` for feedback;
- progressbar semantics;
- `aria-current="page"`;
- reduced-motion support;
- responsive layout from 320 px.

Open:

- focus ring pink-on-acid is **2.71:1** (fails the 3:1 UI/focus threshold);
- white-on-pink is **3.18:1** (large text only; avoid body text);
- gray-on-acid is **4.11:1** (avoid body text);
- no axe/Lighthouse CI gate;
- no documented screen-reader regression;
- 200%/400% zoom reflow not formally verified.

Do not claim WCAG 2.2 AA conformance until these are closed and verified.

## 8. SEO and discoverability

Ready:

- per-route title, description, canonical, Open Graph, and Twitter metadata;
- static crawlable fallback and structured data (Person, WebSite, ProfilePage);
- `robots.txt` with sitemap;
- `sitemap.xml` with seven public URLs and no admin;
- 1200×630 social card;
- IndexNow key file deployed;
- API/admin noindex;
- clean semantic routes and internal links.

Not complete:

- Google Search Console and Bing Webmaster verification/submission require owner accounts;
- IndexNow submission is manual;
- backlinks, repository stars, and content freshness are outside code control;
- no ranking guarantee.

## 9. Documentation state

### Delivered

Twenty documents in `docs/`:

1. `PRD.md`
2. `DESIGN.md`
3. `ARCHITECTURE.md`
4. `DATABASE.md`
5. `API.md`
6. `AGENTS.md`
7. `IMPLEMENTATION_PLAN.md`
8. `PROJECT_SETUP.md`
9. `FEATURE_DEVELOPMENT.md`
10. `DATABASE_BACKEND.md`
11. `AUTHENTICATION.md`
12. `MCP.md`
13. `INTEGRATIONS.md`
14. `TESTING.md`
15. `DEBUGGING.md`
16. `SECURITY_AUDIT.md`
17. `CODE_REVIEW.md`
18. `DEPLOYMENT.md`
19. `MONITORING.md`
20. `FINAL_PRODUCTION_AUDIT.md` (this file)

### Removed

- Root `DEPLOYMENT.md`
- Root `PENDRIVE-README.md`
- `docs/CHANGELOG_AI_DEVOPS_UPDATE.md`
- `docs/EMAIL_SETUP.md`
- `docs/FIXES.md`
- `docs/RESTORE_NOTES.md`

`README.md` was preserved, including its unrelated uncommitted edit. It was not staged or overwritten.

### Warning

`README.md` still references the removed files in its Documentation table, its Email Notifications section, and its project structure. These links are now broken. The owner must approve an update; it was deliberately not made because the file contains unrelated uncommitted work.

### MCP state

No MCP server, config, resource, or template is present. No application dependency references MCP. Adding one requires written approval and least-privilege review. See [MCP.md](./MCP.md).

## 10. Backup and recovery

- TiDB Cloud is the system of record.
- Repository seeds are baseline content, **not** a backup.
- No automated application-level backup job exists.
- No restore drill has been completed.
- Cloudinary assets are outside database backups.
- Contact messages and attachments have no formal retention policy.

This is a material operational gap. A portfolio can tolerate a rebuild of public content; it cannot reconstruct a lost contact message or a client enquiry. Define a backup cadence, store encrypted backups separately, and complete a restore drill before treating the system as fully production-grade.

## 11. Monitoring and alerting

Exists:

- Render health check on `/api/health`;
- readiness endpoint with database check;
- CI production smoke on every deploy;
- Render/Vercel/CI logs;
- public telemetry page.

Missing:

- external uptime monitor;
- alert channel;
- error tracking/APM;
- scheduled smoke tests between deploys;
- Cloudinary/Gemini quota alerts;
- backup success alerts.

The owner may learn about an outage from a visitor. Add at least one external monitor for the site and readiness endpoint, with an alert that reaches the owner's phone or inbox.

## 12. Release readiness by dimension

| Dimension | Rating | Notes |
|---|---|---|
| Core functionality | Ready | All routes, CRUD, contact, AI, telemetry verified |
| Security | Ready with warnings | Strong baseline; rotate Cloudinary; consider HttpOnly cookie |
| Data integrity | Warning | No backup/restore drill |
| Availability | Ready with warnings | Free-tier cold start; no alerting |
| Performance | Ready | Warm pages fast; no load test |
| Accessibility | Warning | Focus contrast and no automated gate |
| SEO | Ready | Technical SEO complete; indexing/ranking not guaranteed |
| CI/CD | Ready | 7/7 jobs green; deploy gated |
| Documentation | Ready with warning | 20 docs; README links need owner update |
| Operations | Warning | Logs exist; alerts and backups do not |
| Cost | Ready | Free/low-cost tiers; watch quotas |

## 13. Required actions before calling it "fully production-grade"

### Immediate

- [ ] Rotate Cloudinary API key/secret; update Render; verify upload; revoke old key.

### This month

- [ ] Define and run a database backup + restore drill.
- [ ] Add external uptime monitoring and an alert channel.
- [ ] Review and commit the existing `README.md` edit; update its doc links.
- [ ] Submit the sitemap to Google Search Console and Bing Webmaster.

### Next UI change

- [ ] Replace the focus ring with a higher-contrast two-layer indicator.
- [ ] Add an automated axe/Lighthouse check to CI.

### Next auth change

- [ ] Decide on HttpOnly cookie + CSRF vs. current `localStorage` token.
- [ ] If adopted, implement login/logout, CSRF, and tests as one coordinated change.

### When email is required

- [ ] Configure Gmail API OAuth values.
- [ ] Send a real test message and confirm delivery.
- [ ] Add delivery-failure monitoring.

## 14. Rollback readiness

| Layer | Rollback |
|---|---|
| Frontend | Vercel promote previous deployment, or revert commit |
| API | Render redeploy previous commit, or revert and let CI deploy |
| Database | Restore backup into a new database; forward-only migrations have no down path |
| Static assets | Vercel immutable assets + `index.html` no-cache |
| API cache | `no-store`; nothing to purge |

The rollback path exists but the database path is unproven without a restore drill. That is why data integrity is rated "Warning".

## 15. Final determination

The application is **live, functional, and safe enough for a public personal portfolio**. The engineering evidence is strong: real database content, server-side auth, hardened headers, validated inputs, graceful optional integrations, a seven-job pipeline, and fresh production verification.

It is **not** a guarantee of uptime, accessibility conformance, search ranking, or data recoverability. Those require operational work that code alone cannot provide.

**Production status:** APPROVED FOR PUBLIC PORTFOLIO USE WITH THE LISTED WARNINGS.

**Next review trigger:** after Cloudinary rotation, after any auth change, after any schema change, or within 90 days — whichever comes first.

---

## Appendix A — Evidence index

| Evidence | Value |
|---|---|
| Audited commit | `af48648` |
| CI run | `43571698661` |
| CI result | 7/7 success |
| API health | `healthy` |
| API readiness | `ready`, DB `connected` |
| Content counts | 4 projects / 16 skills / 16 certificates |
| Messages without token | `401` |
| Admin mode | bcrypt hash |
| Admin noindex | Present |
| API noindex/no-store | Present |
| Sitemap URLs | 7, no admin |
| Server tests | 35/35 |
| Server syntax (app files) | 45/45 |
| Client lint | Pass |
| Client build | Pass in CI; local esbuild crash on FAT32/Node 24 |
| Secret scans | Tree/docs clean except CI fixture; history clean |
| Dependency audit | 0 production vulnerabilities |

## Appendix B — Document control

- This audit reflects the state at the date/time above.
- Production changes after that time require a new verification pass.
- The documentation commit that includes this file is docs-only; it must still pass the seven-job pipeline before being considered released.
- Do not treat this document as a security certification or a ranking guarantee.
