# Implementation Plan

**Product:** Mayuresh Kasar Portfolio ("MAYURESH.DEV")
**Document owner:** Mayuresh Kasar
**Status:** Execution plan and current baseline
**Version:** 1.0
**Last updated:** 2026-11-14
**Inputs:** [PRD.md](./PRD.md) · [ARCHITECTURE.md](./ARCHITECTURE.md) · [DATABASE.md](./DATABASE.md) · [API.md](./API.md)

---

## 1. Purpose

This plan describes how the portfolio was built, what is already in production, what remains, and in what order future work should proceed. It is not a wish list: items marked **Done** are implemented and verified, items marked **Next** are approved follow-ups, and items marked **Approval** require the owner's decision before work starts.

## 2. Current baseline (verified 2026-11-14)

| Area | State | Evidence |
|---|---|---|
| Public routes | Done | Live browser audit of all routes: 0 console errors, 0 failed requests, 0 broken images |
| Database content | Done | Production counts: 4 projects, 16 skills, 16 certificates |
| Admin auth | Done | Hash-only bcrypt login verified; startup log reports bcrypt hash mode |
| Admin CRUD | Done | CI Docker integration tests update project, skill, and certificate |
| Contact inbox | Done | `/api/messages` returns `401` without a token |
| Contact form | Done | Server validation and persistence tested; email optional |
| AI endpoints | Done | Gemini `gemini-3.5-flash-lite`, 20 s timeout, 10 req/min |
| System telemetry | Done | Live CPU/memory/uptime/runtime/git; no hostname |
| Cloudinary | Done | Production cloud `dyjerqrqy`; uploads verified and temporary assets removed |
| Email notifications | Blocked | Gmail OAuth values not configured; messages still save |
| SEO | Done | Per-route metadata, sitemap, robots, JSON-LD, 1200×630 social card, IndexNow key |
| Security hardening | Done | Real client IP, generic errors, noindex, CSP, explicit columns, safe URLs |
| Dependency audit | Done | `npm audit --omit=dev`: zero vulnerabilities for client and server |
| CI/CD | Done | Run `43362202013`: 7/7 jobs, including Render deploy and production smoke |
| Accessibility | Partial | Keyboard/reduced-motion present; focus-ring contrast and automated axe are gaps |
| Backups | Not done | No automated application-level backup or restore drill |
| Monitoring/alerting | Partial | Health checks and logs only; no external uptime alerting |

## 3. Delivery phases

### Phase 0 — Foundation (Done)

**Goal:** A working full-stack skeleton with a real database.

| Task | Output | Status |
|---|---|---|
| Scaffold React + Vite client | `client/` builds and runs | Done |
| Scaffold Express API | `server/` starts and serves health | Done |
| Define schema | `projects`, `skills`, `certificates`, `messages` | Done |
| Seed baseline content | `seed.sql` idempotent baseline | Done |
| Connect TiDB Cloud | TLS pool, `SELECT 1` at boot | Done |
| Local Docker stack | Nginx + API + MySQL | Done |

**Exit criteria:** local site renders database content; `/api/health/ready` returns ready.

### Phase 1 — Public portfolio (Done)

**Goal:** All visitor-facing routes with real content and states.

| Task | Output | Status |
|---|---|---|
| Home, About, Skills, Projects, Certificates, Contact | Seven public routes + 404 | Done |
| Kinetic Brutalism design system | Tokens, buttons, cards, panels, responsive rules | Done |
| Data fetching and states | Loading, empty, error, retry | Done |
| Safe external links | Server + client HTTP(S) guard | Done |
| Resume and portrait assets | Served from `client/public/` | Done |
| Mobile navigation | Focus-trapped full-screen dialog | Done |
| Reduced motion and skip link | CSS and shell support | Done |

**Exit criteria:** no dead ends; keyboard journey works; no horizontal scroll at 320 px.

### Phase 2 — Admin and content management (Done)

**Goal:** Owner can manage content without a redeploy.

| Task | Output | Status |
|---|---|---|
| Environment-configured admin | `ADMIN_EMAIL` + hash/password | Done |
| JWT login | HS256, issuer/audience, 12 h default | Done |
| Protected routes | Server `protect` + client `ProtectedRoute` | Done |
| Project CRUD + image upload | Multipart, Cloudinary, 5 MB | Done |
| Skill CRUD | Name + 0–100 level | Done |
| Certificate CRUD + optional image | Issuer, link, image | Done |
| Message inbox | Read/delete, admin-only | Done |
| Dashboard feedback | Success/error banner, refresh, edit mode | Done |

**Exit criteria:** CI proves login, unauthorized rejection, and updates against the Docker stack.

### Phase 3 — Integrations (Done / Blocked)

| Task | Output | Status |
|---|---|---|
| Cloudinary uploads | `portfolio/<year>/<month>`, MIME/size limits | Done |
| Gemini explanations | Skill, certificate, portfolio Q&A | Done |
| Gmail API path | OAuth refresh-token client, MIME message | Built, not configured |
| SMTP fallback | Nodemailer transport for local use | Built, disabled on Render |
| Message-first email | Save → attempt email → return 201 | Done |
| Optional-integration warnings | Startup warnings, graceful 502/503 | Done |

**Exit criteria:** core site works with every optional integration absent. Gmail completion requires real OAuth values (Approval/Blocked).

### Phase 4 — SEO and sharing (Done)

| Task | Output | Status |
|---|---|---|
| Per-route metadata | Title, description, canonical, OG, Twitter | Done |
| Static shell metadata | Crawlable fallback in `index.html` | Done |
| Structured data | Person, WebSite, ProfilePage | Done |
| Sitemap and robots | Public routes only; admin disallowed | Done |
| Social card | 1200×630 landscape image | Done |
| IndexNow key | `client/public/a4a20cec102278b8da74b3c53c282f30.txt` | Done |
| API/admin noindex | Vercel header + Express `X-Robots-Tag` | Done |

**Exit criteria:** live checks confirm metadata, sitemap, robots, and noindex headers.

### Phase 5 — Security and operations (Done)

| Task | Output | Status |
|---|---|---|
| Startup env validation | Fail fast on missing/insecure production config | Done |
| CORS allowlist | Exact origins, optional previews | Done |
| Header hardening | Helmet, CSP, HSTS, frame denial | Done |
| Rate limits | API, auth, messages, AI, system | Done |
| Real client IP | Cloudflare/Render-aware resolution | Done |
| Error normalization | Generic parser/404/5xx | Done |
| Log sanitization | No raw objects, tokens, hostnames | Done |
| Secret scans | Tree, history, build, live assets | Done |
| Dependency audit | Zero production vulnerabilities | Done |

**Exit criteria:** scans clean; production headers verified; no secret in client bundle.

### Phase 6 — CI/CD and production verification (Done)

| Task | Output | Status |
|---|---|---|
| Seven-job pipeline | Hygiene → server → client → Dockerfile → stack → deploy → smoke | Done |
| Render deploy via API | `autoDeploy: false`, CI-triggered | Done |
| Vercel Git integration | Automatic frontend deploys | Done |
| Production smoke tests | Health, content, auth, CORS, routes, headers, SEO | Done |
| Live route audit | Playwright across public/admin/404 | Done |

**Exit criteria:** green `main` run deploys and verifies both live services.

### Phase 7 — Documentation (In progress)

| Task | Output | Status |
|---|---|---|
| Product and design docs | `PRD.md`, `DESIGN.md` | Done |
| Technical docs | `ARCHITECTURE.md`, `DATABASE.md`, `API.md` | Done |
| Agent and planning docs | `AGENTS.md`, `IMPLEMENTATION_PLAN.md` | Done |
| Setup and feature docs | `PROJECT_SETUP.md`, `FEATURE_DEVELOPMENT.md`, `DATABASE_BACKEND.md`, `AUTHENTICATION.md` | In progress |
| Integration, testing, debugging | `MCP.md`, `INTEGRATIONS.md`, `TESTING.md`, `DEBUGGING.md` | In progress |
| Security, review, deployment, monitoring, audit | `SECURITY_AUDIT.md`, `CODE_REVIEW.md`, `DEPLOYMENT.md`, `MONITORING.md`, `FINAL_PRODUCTION_AUDIT.md` | In progress |
| Remove legacy docs | Six approved files | Pending |

## 4. Remaining work

### 4.1 Next (recommended, no new product scope)

| ID | Task | Why | Effort | Risk |
|---|---|---|---|---|
| N1 | Rotate the Cloudinary API key/secret in the Cloudinary console, update Render, verify upload | A development credential must be treated as exposed | 15 min | Medium — uploads break if mistyped |
| N2 | Configure real Gmail OAuth values and send a test message | Completes the notification path | 30–60 min | Low — messages already persist |
| N3 | Add a higher-contrast focus indicator (ink outer ring + pink inner ring) | Pink-on-acid is 2.71:1 | 1 h | Low |
| N4 | Add an automated accessibility check (axe or Lighthouse) to CI | Current coverage is manual | 2–4 h | Low |
| N5 | Add external uptime monitoring with an alert channel | Render/Vercel do not alert the owner today | 30 min | Low |
| N6 | Define and implement a database backup + restore drill | No verified recovery path | 2–4 h | Medium |
| N7 | Define contact-message retention and deletion policy | Messages contain personal data | Decision + 1 h | Low |
| N8 | Update `README.md` links to the new documentation set | README currently references deleted legacy docs | 15 min | Low — owner edit must be preserved |
| N9 | Submit sitemap to Google Search Console and Bing Webmaster | Technical SEO is ready; indexing requires owner accounts | 15 min | Low |

> N8 is deliberately owner-gated: the root `README.md` contains an unrelated uncommitted edit. Do not overwrite or stage it without the owner's confirmation.

### 4.2 Approval required (product or security decisions)

| ID | Decision | Recommendation | Impact |
|---|---|---|---|
| A1 | Move the admin JWT from `localStorage` to an HttpOnly, Secure, SameSite cookie | Approve; add CSRF protection | Requires auth middleware, login/logout, and Axios credential changes |
| A2 | Keep the System telemetry public | Approve current state; it demonstrates real ops | Privacy exposure is limited to platform/runtime metrics |
| A3 | Add MFA for the single admin | Defer until a second factor is practical | Adds complexity to a one-user system |
| A4 | Add MCP tooling for coding agents | Defer; no use case has been approved | Expands agent access; see [MCP.md](./MCP.md) |
| A5 | Add analytics | Defer; not needed for the product goal | Privacy and consent implications |
| A6 | Add pagination/search to the inbox | Defer until messages exceed a few hundred | API and UI work |
| A7 | Add multiple admins/roles | Defer; contradicts the single-admin design | New tables, invites, password reset, audit log |

### 4.3 Explicitly out of scope

- Visitor accounts, comments, social graph, direct messaging.
- Payments, subscriptions, e-commerce.
- Blog/CMS expansion, rich-text editor, scheduled publishing.
- Native apps, PWA offline mode, push notifications.
- Microservices, queues, Redis, WebSockets.
- A guaranteed #1 search ranking.
- Enterprise observability or on-call rotation.

## 5. Work breakdown for a typical change

Use this sequence for any non-trivial change:

1. **Clarify** — restate the requirement, identify affected routes/files, confirm scope.
2. **Design** — decide whether the change extends an existing pattern or needs a new one; record approvals.
3. **Implement server** — validation → controller → model → route; preserve status codes and envelopes.
4. **Implement client** — data fetch, states, accessibility, responsive layout.
5. **Test** — unit, syntax, build, Docker stack where relevant.
6. **Document** — update the matching doc(s) and this plan if scope changes.
7. **Review** — use [CODE_REVIEW.md](./CODE_REVIEW.md).
8. **Deploy** — commit, push, watch CI, verify production.
9. **Observe** — check logs, health, and smoke results; record incidents in [MONITORING.md](./MONITORING.md).

## 6. Milestones and acceptance

### M1 — Public portfolio ready

- All public routes render real data.
- Keyboard navigation and reduced motion work.
- No horizontal scroll at 320 px.
- **Acceptance:** live route audit clean.

### M2 — Admin ready

- Login succeeds only with configured credentials.
- CRUD and inbox work with a valid token.
- Unauthorized requests return `401`.
- **Acceptance:** CI Docker auth/update tests pass.

### M3 — Production ready

- Environment validation passes with production secrets.
- Health and readiness return healthy/ready.
- Headers, CORS, and noindex verified.
- **Acceptance:** seven-job CI green; production smoke passes.

### M4 — Discoverable

- Metadata, canonical, OG/Twitter, sitemap, robots, JSON-LD live.
- Social card renders at 1200×630.
- IndexNow key returns 200.
- **Acceptance:** live checks and social preview validation.

### M5 — Documentation ready

- Twenty documents cover product, design, architecture, data, API, agents, setup, features, auth, MCP, integrations, testing, debugging, security, review, deployment, monitoring, and final audit.
- Legacy docs removed.
- Links resolve.
- **Acceptance:** doc review + link check + commit.

## 7. Risk register and mitigations

| Risk | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|
| Cloudinary credential misuse | Medium | Quota/data abuse | Rotate now, restrict keys, monitor usage | Owner |
| Gmail never configured | Medium | No email alerts | Inbox remains source of truth; configure when ready | Owner |
| Render cold start confuses visitors | High | Slow first load | 60 s timeout, one GET retry, clear states | Done |
| TiDB outage/data loss | Low | Site content unavailable | Provider backups + documented restore drill | Owner |
| JWT theft via XSS | Low | Admin compromise | Strict CSP, short expiry, consider HttpOnly cookie | Approval |
| In-memory rate limits bypassed on scale | Low | Abuse | Single instance today; move to shared store before scaling | Future |
| Focus ring fails contrast | High | Accessibility issue | Approve double ring | Next |
| README links break after doc cleanup | High | Confusing repo entry | Update README with owner approval | Next |
| Search ranking stays low | Medium | Less traffic | Content, backlinks, stars, Search Console, time | Owner |
| FAT32 workspace breaks Docker | Medium | Local stack fails | Use NTFS workspace for Docker builds | Known |

## 8. Verification checklist per release

- [ ] `cd server && npm run check && npm test`
- [ ] `cd client && npm run lint && npm run build`
- [ ] `docker compose config` and, if Docker files changed, full stack job
- [ ] `npm audit --omit=dev` in `client/` and `server/`
- [ ] No secret in `git status`, diff, build output, or live assets
- [ ] API contract unchanged or documented
- [ ] Schema migration idempotent and backed up
- [ ] Accessibility/responsive spot check
- [ ] Docs updated
- [ ] CI green
- [ ] Production health, headers, content, and routes verified
- [ ] Render logs free of new fatal errors

## 9. Definition of done for the documentation milestone

- All 20 documents exist in `docs/` with the approved names.
- Each document uses real paths, endpoints, commands, and values.
- Assumptions and approvals are explicitly labeled.
- No application code is changed by the documentation work.
- The six approved legacy Markdown files are deleted.
- `README.md` is preserved; its unrelated edit is not staged.
- Relative links resolve.
- The docs commit is pushed, CI passes, and the final production audit reflects fresh evidence.
