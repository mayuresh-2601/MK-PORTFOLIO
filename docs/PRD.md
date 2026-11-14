# Product Requirements Document (PRD)

**Product:** Mayuresh Kasar Portfolio ("MAYURESH.DEV")
**Document owner:** Mayuresh Kasar
**Status:** Source of truth for product scope
**Version:** 1.0
**Last updated:** 2026-11-14
**Live site:** https://mk-portfolio-phi-silk.vercel.app
**Live API:** https://mk-portfolio-api.onrender.com
**Repository:** https://github.com/mayuresh-2601/MK-PORTFOLIO

Related documents: [DESIGN.md](./DESIGN.md) · [ARCHITECTURE.md](./ARCHITECTURE.md) · [DATABASE.md](./DATABASE.md) · [API.md](./API.md) · [AGENTS.md](./AGENTS.md)

---

## 1. Problem

A resume and a static portfolio page show claims, not evidence. Recruiters and hiring managers need to answer three questions quickly:

1. Can this person build and ship real software?
2. Is the work relevant to the role?
3. How do I verify it and contact them?

Most candidate portfolios fail because they are:

- visually generic and indistinguishable from templates;
- stale, because every content change needs a code deploy;
- unable to prove operational competence beyond a list of logos;
- slow, inaccessible, or weak in search/social previews;
- built with insecure demo-grade authentication and APIs.

The owner also needs a low-friction way to update projects, skills, certificates, and contact messages without editing code or exposing admin credentials.

## 2. Value proposition

> One link that proves full-stack ability: a fast, distinctive public portfolio backed by a real, secured admin CMS, a live API, and observable production operations.

The product combines:

- a memorable **Kinetic Brutalism** identity that is not a generic SaaS template;
- database-driven projects, skills, and certificates;
- a private, single-admin dashboard for content and message management;
- optional AI explainers that make technical credentials approachable;
- a live System page showing real server telemetry;
- production-grade security, SEO, CI/CD, Docker, and deployment evidence.

## 3. Target users

| Persona | Needs | Success signal |
|---|---|---|
| Recruiter / hiring manager | Fast evidence of skills, projects, credentials, and contact details | Understands the candidate and finds a project or contact action in under two minutes |
| Engineering peer / interviewer | Technical depth, code links, live demos, operational proof | Opens GitHub/demo links and the System page without friction |
| Freelance client | Confidence, relevant work, easy contact | Sends a project enquiry through the contact form |
| Site owner / admin | Secure content and inbox management without redeploys | Adds or edits content and reads messages from `/admin/dashboard` |
| Search engine / social crawler | Crawlable, canonical, descriptive metadata | Indexes public routes and renders correct link previews |

## 4. Goals and non-goals

### Goals

| ID | Goal | Measure |
|---|---|---|
| G1 | Present credible full-stack work | All public routes reachable; projects and credentials visible |
| G2 | Let the owner update content safely | Admin can create, edit, and delete projects, skills, certificates; read/delete messages |
| G3 | Keep the public and admin surfaces secure | No secrets in the client; server-side authorization on every mutation; hardened headers |
| G4 | Be discoverable and shareable | Per-route metadata, sitemap, robots, structured data, 1200×630 social card |
| G5 | Demonstrate operational competence | Live telemetry, health checks, CI/CD, production deployment |
| G6 | Stay cheap and maintainable | Single admin, four tables, one API service, one static frontend, no unnecessary infrastructure |

### Non-goals

- Multi-user registration, social profiles, comments, or messaging between visitors.
- Payments, subscriptions, e-commerce, or invoices.
- A general-purpose CMS, blog engine, or media library.
- Native mobile applications.
- Real-time chat, WebSockets, or push notifications.
- A full analytics or CRM platform.
- Ranking guarantees for competitive search terms.

## 5. Assumptions

Each assumption is explicit and should be validated before it becomes a hard requirement.

| ID | Assumption | Impact if wrong |
|---|---|---|
| A1 | One owner/admin is sufficient; no visitor accounts are needed | A multi-user model would require a `users` table, roles, password reset, and audit logging |
| A2 | Content volume is small (tens of projects/skills/certificates, hundreds of messages) | Pagination and search would move from future work to MVP |
| A3 | A single API instance is sufficient for current traffic | In-memory rate limits and telemetry polling assumptions change under horizontal scaling |
| A4 | Public telemetry is acceptable and does not reveal secrets | The System page would need authentication or reduced fields |
| A5 | Cloudinary is the approved media host | Local or S3 storage would require new upload and cleanup paths |
| A6 | Gmail is optional; saving the message is the primary success condition | If email becomes mandatory, delivery monitoring and retries are required |
| A7 | AI is an enhancement, not a core journey | A Gemini outage must not block portfolio browsing or contact |
| A8 | The production stack remains Vercel + Render + TiDB Cloud | A different host changes CORS, proxy, TLS, and deployment steps |

## 6. Decisions requiring owner approval

These are product or operational decisions, not implementation details.

| ID | Decision | Current state | Why approval is needed |
|---|---|---|---|
| D1 | Keep a single environment-configured admin instead of a user database | Implemented | Changes security model and data requirements |
| D2 | Show live host telemetry publicly | Implemented without hostname | Exposes platform, Node version, git commit, CPU, memory |
| D3 | Store the admin JWT in `localStorage` | Implemented | Convenient, but any XSS becomes token theft; an HttpOnly cookie is safer |
| D4 | Rotate the Cloudinary upload credential | Outstanding | A credential used during development must be treated as exposed until rotated |
| D5 | Keep email notifications disabled until real Gmail OAuth values exist | Implemented as disabled | No placeholder credentials are added; messages are still saved |
| D6 | Do not configure any MCP server without an approved use case | No MCP server configured | MCP tools expand the agent's access and must follow least privilege |
| D7 | Define message retention and backup policy | Not yet formalized | Contact messages contain personal data |
| D8 | Verify Google Search Console / Bing Webmaster and submit sitemaps | Manual, owner account required | Cannot be completed by the coding agent |

## 7. Core user journeys

### J1 — Recruiter evaluates the candidate

1. Lands on `/` from a search result, LinkedIn, or GitHub.
2. Sees name, role, location, portrait, resume download, and primary actions.
3. Opens `/projects`, scans featured work, and follows a demo or source link.
4. Opens `/skills` and optionally asks AI to explain a skill.
5. Opens `/certificates` to verify credentials.
6. Contacts the owner or downloads the resume.

**Success:** the visitor reaches a project, credential, or contact action without a dead end.

### J2 — Engineering peer inspects operational proof

1. Opens `/system`.
2. Sees CPU, memory, uptime, environment, Node version, and deployed commit.
3. Optionally asks the AI assistant about the owner's DevOps experience.
4. Returns to projects or contact.

**Success:** telemetry loads or shows a clear, non-blocking cold-start message.

### J3 — Visitor sends a message

1. Opens `/contact`.
2. Completes name, email, subject, and message.
3. Submits once; the button enters a sending state.
4. Sees a success confirmation or a specific validation/server error.
5. The message is persisted even if email delivery fails.

**Success:** a valid message returns `201` and appears in the admin inbox.

### J4 — Admin signs in

1. Opens `/admin`.
2. Enters the configured admin email and password.
3. Receives a short-lived JWT and is routed to `/admin/dashboard`.
4. Invalid credentials show a generic error without revealing which field was wrong.
5. An expired/invalid token returns the user to `/admin`.

**Success:** only the configured admin can mutate content.

### J5 — Admin updates content

1. Opens the dashboard and loads projects, skills, certificates, and messages in parallel.
2. Adds or edits a project with an image and optional links.
3. Adds or edits a skill with a 0–100 level.
4. Adds or edits a certificate with optional image and credential link.
5. Deletes an item after the action is confirmed by the UI flow.
6. Refreshes public pages and sees the change.

**Success:** changes persist in MySQL/TiDB and render on the public site.

### J6 — Admin manages the inbox

1. Opens the contact inbox.
2. Reads name, email, subject, message, and timestamp.
3. Replies by email or deletes the message.
4. The list refreshes after deletion.

**Success:** messages are visible only with a valid admin token.

### J7 — Search/social discovery

1. A crawler requests a public route.
2. The SPA shell, per-route metadata, canonical URL, sitemap, and robots file are available.
3. A social scraper reads the Open Graph/Twitter card and 1200×630 image.

**Success:** metadata is correct for each public route; admin and API are not indexed.

## 8. User stories and acceptance criteria

| ID | Story | Acceptance criteria |
|---|---|---|
| US-01 | As a visitor, I can understand who the owner is and what they do from the homepage | Name, role, location, summary, portrait, resume, and project/contact actions are present; page has one clear `h1` |
| US-02 | As a visitor, I can browse projects | Loading, error, empty, and populated states exist; links are absolute HTTP(S) only; images have fallbacks |
| US-03 | As a visitor, I can browse skills and see proficiency | Skills render with a name, level, progress semantics, and AI action; empty/error states are actionable |
| US-04 | As a visitor, I can browse certificates and verify them | Issuer, optional image, and safe credential link render; empty/error states are actionable |
| US-05 | As a visitor, I can ask AI to explain a skill or certificate | A modal opens with loading, success, and error states; closing restores focus; repeated requests are rate-limited |
| US-06 | As a visitor, I can view live system metrics | Metrics refresh about every 5 seconds; a cold-start/API failure shows a non-blocking message; no hostname is exposed |
| US-07 | As a visitor, I can contact the owner | Required fields are validated; success and error messages are announced; the submit button is disabled while sending |
| US-08 | As the admin, I can sign in securely | Credentials are checked server-side; JWT is HS256 with issuer/audience; failures are generic and rate-limited |
| US-09 | As the admin, I can manage projects | Create requires title, description, image; update supports partial fields; delete is authorized; links are validated |
| US-10 | As the admin, I can manage skills and certificates | Name/title and level/link validation apply; changes persist; unauthorized requests return `401` |
| US-11 | As the admin, I can read and delete messages | The inbox requires a valid token; deletion requires a valid ID; timestamps are shown |
| US-12 | As a search engine, I can crawl public pages but not admin/API | Public routes have canonical metadata; `/admin` and API responses send noindex directives; robots disallows admin |
| US-13 | As the owner, I can deploy safely | CI passes before Render deploys; production smoke tests validate content, auth, CORS, headers, and frontend routes |
| US-14 | As the owner, I can recover from a bad release | Render and Vercel support rollback; database changes are forward-only and require a backup before destructive work |

## 9. Features and functional requirements

### 9.1 Public portfolio

| ID | Requirement | Priority |
|---|---|---|
| FR-P-01 | Home page presents identity, role, location, summary, portrait, resume, projects CTA, and contact CTA | Must |
| FR-P-02 | About page presents biography, facts, availability, resume, and project CTA | Must |
| FR-P-03 | Skills page lists database-driven skills with level and AI explainer | Must |
| FR-P-04 | Projects page lists database-driven projects with safe GitHub/demo links and image fallback | Must |
| FR-P-05 | Certificates page lists database-driven certificates with optional image and safe credential link | Must |
| FR-P-06 | Contact page provides direct email/GitHub/LinkedIn links and a validated message form | Must |
| FR-P-07 | System page shows CPU, memory, uptime, environment, Node version, git commit, and AI assistant | Should |
| FR-P-08 | Unknown routes render a branded 404 with a path home | Must |
| FR-P-09 | Navigation exposes all public sections; mobile menu traps focus and closes on route change/Escape | Must |
| FR-P-10 | Footer exposes navigation, social links, resume, and ownership notice | Must |

### 9.2 Admin

| ID | Requirement | Priority |
|---|---|---|
| FR-A-01 | `/admin` accepts only the configured admin email/password | Must |
| FR-A-02 | Successful login returns a JWT and routes to `/admin/dashboard` | Must |
| FR-A-03 | Dashboard loads projects, skills, certificates, and messages; a partial load failure is reported without crashing the page | Must |
| FR-A-04 | Admin can create, edit, and delete projects, skills, and certificates | Must |
| FR-A-05 | Admin can read and delete contact messages | Must |
| FR-A-06 | Admin routes are protected client-side and server-side; client protection is convenience, not security | Must |
| FR-A-07 | Admin pages are `noindex, nofollow` and excluded from the sitemap | Must |
| FR-A-08 | Logout removes the local token and returns to `/admin` | Must |

### 9.3 Contact and notifications

| ID | Requirement | Priority |
|---|---|---|
| FR-C-01 | Accept `name`, `email`, `subject`, `message`; subject defaults to "Portfolio Contact Form" | Must |
| FR-C-02 | Validate types, required fields, email format, and length before database write | Must |
| FR-C-03 | Persist the message before attempting email; email failure must not fail the submission | Must |
| FR-C-04 | Validate the payload before uploading an attachment to avoid orphan assets | Must |
| FR-C-05 | Support optional JPG/PNG/WEBP/PDF/DOC/DOCX attachment up to 10 MB | Should |
| FR-C-06 | Send notification through Gmail API when configured, SMTP when configured, otherwise skip | Should |
| FR-C-07 | Rate-limit submissions to 5 per 15 minutes per client IP | Must |

### 9.4 AI

| ID | Requirement | Priority |
|---|---|---|
| FR-AI-01 | Explain a skill using its name and optional level | Should |
| FR-AI-02 | Explain a certificate using its title and issuer | Should |
| FR-AI-03 | Answer questions about the owner using only the supplied context | Should |
| FR-AI-04 | Keep the Gemini key server-side; never send it to the browser | Must |
| FR-AI-05 | Use a 20-second timeout, bounded output, and 10 requests/minute per IP | Must |
| FR-AI-06 | Return a clear `502` when the provider is unavailable; do not block the rest of the site | Must |

### 9.5 System telemetry

| ID | Requirement | Priority |
|---|---|---|
| FR-S-01 | Return platform, architecture, Node version, host uptime, process uptime, CPU cores/model/load, memory, Docker status, git commit/branch | Should |
| FR-S-02 | Never expose hostname, environment variables, tokens, or filesystem paths | Must |
| FR-S-03 | Cache git/Docker metadata for five minutes and collapse concurrent refreshes | Should |
| FR-S-04 | Rate-limit telemetry separately from the shared API budget | Must |

### 9.6 SEO, UX, and accessibility

| ID | Requirement | Priority |
|---|---|---|
| FR-X-01 | Each public route sets title, description, canonical, Open Graph, and Twitter metadata | Must |
| FR-X-02 | `robots.txt` and `sitemap.xml` point at production and exclude admin | Must |
| FR-X-03 | Homepage includes Person, WebSite, and ProfilePage structured data | Must |
| FR-X-04 | Social card is 1200×630 and referenced by all routes | Must |
| FR-X-05 | `<noscript>` provides crawlable identity, summary, and navigation | Should |
| FR-X-06 | Skip link, visible focus, semantic headings, labeled forms, and modal focus management are present | Must |
| FR-X-07 | Motion respects `prefers-reduced-motion` | Must |
| FR-X-08 | Layout works at 320 px through desktop widths without horizontal scrolling | Must |

### 9.7 Security and operations

| ID | Requirement | Priority |
|---|---|---|
| FR-SEC-01 | No secret is committed, bundled into client assets, or returned by the API | Must |
| FR-SEC-02 | API sends CSP, `X-Frame-Options: DENY`, nosniff, HSTS, Referrer-Policy, and Permissions-Policy | Must |
| FR-SEC-03 | CORS allows only configured exact origins (plus localhost in development and optional Vercel previews) | Must |
| FR-SEC-04 | SQL uses parameterized queries and explicit public columns | Must |
| FR-SEC-05 | User-controlled URLs are limited to HTTP(S) on the server and re-checked on the client | Must |
| FR-OPS-01 | `/api/health` proves the process is alive; `/api/health/ready` proves the database answers | Must |
| FR-OPS-02 | CI runs hygiene, syntax/tests, client lint/build, Dockerfile lint, full Docker stack, deploy, and smoke tests | Must |
| FR-OPS-03 | Production deploys only after CI passes on `main` | Must |

## 10. Pages and screens

| Route | Screen | Access | Primary actions |
|---|---|---|---|
| `/` | Home | Public | View work, download resume, start a project |
| `/about` | About | Public | Download resume, see work |
| `/skills` | Skills | Public | Ask AI about a skill |
| `/projects` | Projects | Public | Open source/demo links |
| `/certificates` | Certificates | Public | View credential, ask AI |
| `/system` | Live System | Public | View telemetry, ask AI |
| `/contact` | Contact | Public | Email, GitHub, LinkedIn, submit message |
| `/admin` | Admin login | Public form, restricted credentials | Sign in |
| `/admin/dashboard` | Admin dashboard | Authenticated admin | Create/edit/delete content, read/delete messages |
| `*` | 404 | Public | Return home |

## 11. Roles and permissions

| Capability | Visitor | Admin | System |
|---|---|---|---|
| View public pages | Yes | Yes | — |
| Read projects, skills, certificates | Yes | Yes | — |
| Read system telemetry | Yes | Yes | — |
| Submit contact message | Yes | Yes | — |
| Use AI explainers | Yes | Yes | — |
| Read contact messages | No | Yes | — |
| Create/update/delete content | No | Yes | — |
| Delete messages | No | Yes | — |
| Trigger deployment | No | Via Git/CI only | CI |
| Access database | No | No direct access | API only |

There is exactly one admin identity, configured through server environment variables. Role checks are enforced server-side by the JWT middleware.

## 12. Data requirements

| Entity | Purpose | Sensitive? | Retention |
|---|---|---|---|
| Project | Portfolio case study with image and links | No | Until removed by admin |
| Skill | Technology and proficiency level | No | Until removed by admin |
| Certificate | Credential, issuer, optional image/link | No | Until removed by admin |
| Message | Contact enquiry with name, email, subject, body | Yes — personal data | Owner-defined; not yet formalized |

Detailed columns, indexes, and ownership are defined in [DATABASE.md](./DATABASE.md). Secrets and admin credentials are never stored in the application database.

## 13. Integrations

| Integration | Purpose | Required? | Current behavior |
|---|---|---|---|
| Cloudinary | Project/certificate images and contact attachments | Optional | Configured in production; uploads return `503` if credentials are absent |
| Google Gemini | AI explainers and portfolio Q&A | Optional | Configured when `GEMINI_API_KEY` exists; `502` on failure |
| Gmail API / SMTP | Contact notification email | Optional | Disabled until real OAuth/SMTP values exist; messages still save |
| TiDB Cloud | Production MySQL-compatible database | Required | TLS connection pool |
| Vercel | Static frontend hosting | Required | Git integration, security headers, SPA rewrites |
| Render | API hosting | Required | Health check, CI-triggered deploys |
| GitHub Actions | CI/CD and production smoke tests | Required | Seven jobs on `main` |
| IndexNow | Search-engine URL submission | Optional | Key file deployed; submission is manual/operational |

No inbound webhooks are used. Integration details and failure behavior are in [INTEGRATIONS.md](./INTEGRATIONS.md) and [API.md](./API.md).

## 14. Loading, empty, and error states

### Required behavior

| Area | Loading | Empty | Error |
|---|---|---|---|
| Projects | Spinner + "Loading projects" panel | "No projects available" with explanation | "Failed to load projects", message, Try again |
| Skills | Spinner + "Loading stack" panel | "No skills available" with explanation | "Failed to load skills", message, Try again |
| Certificates | Spinner + "Loading certificates" panel | "No certificates available" with explanation | "Failed to load certificates", message, Try again |
| Contact | Disabled fields + "Sending message…" | Not applicable | Specific API message or generic retry message, announced with `role="alert"` |
| Admin data | Global busy state disables actions | "No projects/skills/certificates/messages yet" | Feedback banner with API message; partial load failure reported |
| AI modal | "Thinking it through…" | Not applicable | Provider/rate-limit message inside the modal |
| System | Placeholder dashes + "Waiting…" | Not applicable | Non-blocking cold-start/API warning; page remains usable |
| 404 | Not applicable | Not applicable | Branded 404 with home action |

### Rules

- A failed optional integration must not blank the page.
- Errors must not expose stack traces, SQL, secrets, or internal paths in production.
- Empty states must explain how content appears (admin dashboard).
- Retry actions must be explicit; no infinite silent retries.
- Only safe idempotent `GET` requests may retry automatically after a cold-start/network failure.

## 15. Non-functional requirements

| Category | Requirement | Verification |
|---|---|---|
| Security | No secrets in tracked files or client bundles; server-side authorization; hardened headers; rate limits; input validation | Secret scans, header checks, API tests, dependency audit |
| Performance | Warm public pages should feel immediate; API reads should return within 1 second at current data volume; frontend build should stay small enough for a portfolio | CI build, production smoke, browser audit |
| Availability | Public site should tolerate API cold starts with clear states; health endpoints must reflect process/database status | `/api/health`, `/api/health/ready`, production smoke |
| Accessibility | WCAG 2.2 AA intent: semantics, labels, focus, keyboard, reduced motion, contrast | Manual review + browser audit; automated axe run is a gap |
| SEO | Correct per-route metadata, canonical URLs, sitemap, robots, structured data, social card | Live metadata checks, CI SEO markers |
| Privacy | Collect only contact data; do not log message bodies or tokens; do not expose hostnames | Code review, log inspection |
| Maintainability | Small dependency set, layered server, reusable client components, documented rules | Lint, tests, docs review |
| Compatibility | Modern evergreen browsers; Node.js 22.x; MySQL 8+/TiDB | CI matrix on Node 22; Docker MySQL 8 |
| Cost | Free/low-cost tiers acceptable; no unnecessary services | Deployment review |

## 16. MVP scope and out-of-scope items

### MVP — current production baseline

- Public Home, About, Skills, Projects, Certificates, System, Contact, 404.
- Database-driven project, skill, and certificate content.
- Single-admin JWT authentication with bcrypt production hash.
- Admin CRUD for content; inbox read/delete.
- Contact persistence with optional attachment and optional email notification.
- AI explainers and portfolio Q&A.
- Live telemetry.
- Per-route SEO, sitemap, robots, structured data, social card.
- Security headers, rate limits, validation, safe URLs, noindex for admin/API.
- Docker local stack and CI/CD with production smoke tests.

### Out of scope for this release

- Visitor accounts, comments, likes, following, or direct messaging.
- Multi-admin roles, invitations, password reset, MFA.
- Blog, rich-text editor, scheduled publishing, content versioning.
- Payments, invoices, subscriptions, e-commerce.
- Native apps, PWA offline mode, push notifications.
- Full-text search, tag filters, pagination.
- Analytics dashboard, CRM, marketing automation.
- Automated media cleanup, CDN transformations, AV scanning.
- Dedicated APM, on-call rotation, or enterprise observability.
- A guaranteed #1 ranking for the term “portfolio”.

## 17. Success criteria

### Product and quality

| Criterion | Target | Current evidence |
|---|---|---|
| All public routes render | 100% of defined routes | Live browser audit of all routes: 0 console errors, 0 failed requests, 0 broken images |
| Public content available | Projects ≥ 4, skills ≥ 16, certificates ≥ 16 | Production API counts verified |
| Admin mutation path works | Login + protected CRUD + inbox | CI Docker integration tests and production auth smoke tests pass |
| Contact journey works | Valid message returns `201` and persists | API validation tests and Docker stack checks pass |
| Security scans | No real secrets in tree, history, build, or live assets | Secret scans clean except documented placeholders/test fixtures |
| Dependency audit | 0 known production vulnerabilities | `npm audit --omit=dev` for client and server |
| CI reliability | All required jobs pass before deploy | 7/7 jobs passing on recent `main` runs |
| Production health | Health and readiness return healthy/ready | Smoke tests verify process and database |
| SEO basics | Metadata, sitemap, robots, JSON-LD, social card live | Live checks passed |
| Accessibility | No known blocker; keyboard and reduced-motion support | Manual review; automated axe is still a gap |

### Explicitly not guaranteed

- Ranking position for “portfolio” or any competitive keyword.
- Search Console/Bing verification without the owner's account.
- Email delivery while Gmail is unconfigured.
- AI availability during provider outages or quota exhaustion.
- Zero-downtime during Render cold starts or free-tier restarts.

## 18. Risks and dependencies

| Risk | Impact | Mitigation |
|---|---|---|
| Cloudinary credential compromise | Unauthorized uploads/quota abuse | Rotate credentials, restrict keys, monitor usage, validate before upload |
| Gemini quota/outage | AI features fail | Timeouts, 502, rate limit; core site independent |
| Gmail OAuth not configured | No notification email | Messages persist; admin inbox is source of truth |
| Render free-tier cold start | Slow first API request | 60s client timeout, one GET retry, clear loading states |
| In-memory rate limiting | Bypass across instances/restarts | Single instance today; move to shared store before scaling |
| JWT in localStorage | Token theft via XSS | Strict CSP, no unsafe scripts, short expiry; consider HttpOnly cookies |
| No automated backup/restore drill | Data loss risk | Provider backups + scheduled logical dumps + restore test |
| SEO competition | Low ranking despite technical SEO | Content, backlinks, repo stars, Search Console, time |
| Single admin | Key-person dependency | Secure credential escrow and documented recovery |
| FAT32/removable-drive development | Docker/path issues on Windows | Keep the project on a local NTFS workspace for Docker builds |

## 19. Open questions and approvals

1. **D3:** Should the admin token move to an HttpOnly, Secure, SameSite cookie with CSRF protection?
2. **D4:** When will Cloudinary credentials be rotated, and who confirms completion?
3. **D5:** Is Gmail notification required for launch, or is the admin inbox sufficient?
4. **D7:** What is the retention period for contact messages, and who owns deletion?
5. **D8:** Which uptime/alerting service will be approved, and to which channel should alerts go?
6. **Accessibility:** Should the focus indicator be changed to a higher-contrast double ring?
7. **Content:** Should the public System page remain public indefinitely?

## 20. Change control

- This PRD is the product source of truth. Changes to scope, roles, data collection, or success criteria require owner approval.
- Design and technical changes must remain consistent with [DESIGN.md](./DESIGN.md), [ARCHITECTURE.md](./ARCHITECTURE.md), [DATABASE.md](./DATABASE.md), [API.md](./API.md), and [AGENTS.md](./AGENTS.md).
- Security-relevant changes require the checks in [SECURITY_AUDIT.md](./SECURITY_AUDIT.md).
- Production readiness is assessed in [FINAL_PRODUCTION_AUDIT.md](./FINAL_PRODUCTION_AUDIT.md).
