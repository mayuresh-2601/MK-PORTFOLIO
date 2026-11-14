# AGENTS.md — Working Agreement for Coding Agents

**Repository:** MK-PORTFOLIO
**Scope:** Every automated coding agent or human contributor working in this repository
**Status:** Mandatory working rules
**Last updated:** 2026-11-14

This file is the entry point for any agent modifying the codebase. Read it fully before touching code. Product intent lives in [PRD.md](./PRD.md); visual rules in [DESIGN.md](./DESIGN.md); technical rules in [ARCHITECTURE.md](./ARCHITECTURE.md); data rules in [DATABASE.md](./DATABASE.md); the HTTP contract in [API.md](./API.md).

---

## 1. What this project is

A production portfolio platform with:

- a React 18 + Vite 6 single-page frontend (`client/`);
- an Express 5 + Node.js 22 REST API (`server/`);
- MySQL 8 locally and TiDB Cloud in production, four tables;
- a single environment-configured admin with JWT authentication;
- Cloudinary uploads, Google Gemini AI, optional Gmail notifications;
- Docker Compose for the local full stack;
- GitHub Actions CI/CD that deploys the API to Render after checks pass; Vercel deploys the client through Git integration.

The live system is not a demo. Treat every change as production-bound.

## 2. Before changing anything

1. Read the relevant source files. Do not infer behavior from names.
2. Check `git status --short`; the workspace may contain uncommitted owner edits. Never discard, overwrite, or stage someone else's work.
3. Confirm the current branch and recent commits (`git log -5 --oneline`).
4. Identify whether the change touches the API contract, schema, auth, uploads, deployment, or SEO. If yes, the matching document must be updated in the same change.
5. Prefer the smallest change that satisfies the requirement. This project intentionally avoids extra frameworks, services, and abstractions.

## 3. Repository map

```text
client/                     React SPA
  public/                   resume, portrait, social card, robots.txt, sitemap.xml, IndexNow key
  src/api/axios.js          single Axios instance, JWT header, 401 handling, GET retry
  src/components/common/    Navbar, Footer, SEO, AIExplainModal, StatsBand, Marquee, CountUp
  src/components/protected/ ProtectedRoute
  src/hooks/                useScrollReveal
  src/pages/public/         Home, About, Skills, Projects, Certificates, System, Contact
  src/pages/admin/          AdminLogin, AdminDashboard
  src/utils/safeUrl.js      HTTP(S)-only external URL guard
  src/index.css             design tokens and all component CSS
  vercel.json               production headers, admin noindex, SPA rewrite
  nginx.conf                Docker static serving, headers, /api proxy
server/
  server.js                 bootstrap, middleware order, health, shutdown
  config/                   db, cloudinary, email, validateEnv, databaseConfig
  routes/                   route wiring and middleware
  controllers/              request validation and orchestration
  models/                   parameterized SQL
  middleware/               auth, rate limits, upload, errors
  services/aiService.js     Gemini REST wrapper
  utils/                    validation, adminAuth, sendEmail, clientIp, messageValidation
  database/                 schema.sql, seed.sql, database Dockerfile
  scripts/                  db lifecycle, syntax check, hash, Gmail auth, email tests
  tests/                    node:test suites
docs/                       product, design, technical, and operational docs
.github/workflows/          seven-job CI/CD pipeline
docker-compose.yml          local client + API + MySQL
render.yaml                 Render blueprint
```

## 4. Standard commands

Run from the stated directory.

| Task | Command |
|---|---|
| Client dev server | `cd client && npm run dev` |
| Client lint | `cd client && npm run lint` |
| Client production build | `cd client && npm run build` |
| Client lint + build | `cd client && npm run check` |
| Server dev (watch) | `cd server && npm run dev` |
| Server syntax check | `cd server && npm run check` |
| Server tests | `cd server && npm test` |
| Database setup | `cd server && npm run db:setup` |
| Database migrate | `cd server && npm run db:migrate` |
| Database seed | `cd server && npm run db:seed` |
| Database verify | `cd server && npm run db:check` |
| Generate bcrypt hash | `cd server && npm run hash-password` |
| Gmail authorization | `cd server && npm run gmail:auth` |
| Email config check | `cd server && npm run email:check` |
| Send test email | `cd server && npm run email:test` |
| Full local stack | `docker compose up --build -d` |
| Stack status/logs | `docker compose ps` / `docker compose logs -f server` |

A change is not done until the relevant commands pass. At minimum:

- server change: `npm run check` and `npm test`;
- client change: `npm run lint` and `npm run build`;
- schema/seed change: `npm run db:check`, plus the Docker job in CI before merge;
- API contract change: tests plus [API.md](./API.md);
- security-relevant change: [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) checklist.

## 5. Non-negotiable invariants

1. **No secret in the browser.** Only `VITE_*` variables may be public. Never import server config into `client/`.
2. **No secret in git.** Do not create, stage, print, or commit real `.env` files, API keys, tokens, passwords, hashes, connection strings, PEM files, or dumps. Use placeholders in `.env.example`.
3. **Server-side authorization.** Every mutation and the message inbox must use `protect`. Client route guards are convenience only.
4. **Parameterized SQL.** Use `db.execute` with placeholders. Never interpolate user input. Public reads use explicit columns, not `SELECT *`.
5. **Validate before upload.** Public message payloads must pass `validateMessagePayload` before Cloudinary is called.
6. **Safe URLs.** Any user-supplied URL must be absolute HTTP(S) on the server and re-checked with `safeExternalUrl` on the client.
7. **No internals in errors.** Production 5xx returns `Internal Server Error`. Do not echo SQL, stacks, paths, hostnames, parser internals, or the requested path.
8. **Optional integrations fail open.** Cloudinary, Gemini, and Gmail failures must not break browsing, content reads, or message persistence.
9. **Persist before notify.** Contact messages are saved before any email attempt.
10. **No indexing of private surfaces.** `/admin` and `/api` must keep `noindex`; do not add them to the sitemap or link them publicly.
11. **CI gates production.** Render deploys only after all CI jobs pass on `main`. Do not bypass with direct deploy commands unless the owner explicitly requests an emergency deploy.
12. **No unapproved features.** Do not add analytics, chat, payments, user accounts, MCP servers, or new third-party services without explicit owner approval.

## 6. Coding conventions

### JavaScript and React

- ES modules only; no CommonJS in application code.
- Functional React components with hooks. No class components.
- Keep page-local state in the page. Do not introduce Redux, Zustand, React Query, or a context provider without a concrete need.
- Reuse `SEO`, `AIExplainModal`, `ProtectedRoute`, `safeExternalUrl`, and existing CSS classes. Do not fork a component for a one-off style.
- Use `lucide-react` icons. Icon-only buttons need `aria-label`.
- Preserve the existing comment style: short, explanatory, and focused on intent. Do not add noise comments.

### CSS

- All design tokens live in `client/src/index.css` under `:root`. Do not scatter new hex values.
- Use existing `.btn`, `.tag`, `.brutal-card`, `.state-panel`, form, and page classes.
- Respect the palette contrast rules in [DESIGN.md](./DESIGN.md). Ink on acid/pink, white on ink. Do not use white body text on pink or gray body text on acid.
- Every new interactive element needs hover, focus-visible, active, and disabled states.
- Any new animation must be disabled under `prefers-reduced-motion: reduce`.
- Layout must work from 320 px upward with no horizontal scroll.

### Server

- Controllers validate input and return explicit status codes; models only run SQL.
- Reuse `normalizeRequiredText`, `normalizeOptionalText`, and `isSafeHttpUrl` from `server/utils/validation.js`.
- Reuse the existing limiters; do not create a new limiter without updating [API.md](./API.md).
- Use `next(error)` for unexpected failures; let the global handler normalize them.
- Keep startup validation strict in production and warnings non-fatal for optional services.
- Never log request bodies, tokens, credentials, message contents, or full error objects.

## 7. Change workflows

### Adding or changing an API endpoint

1. Update the route, controller, and model.
2. Add validation and, if public and abuse-prone, a rate limiter.
3. Add or update tests.
4. Update [API.md](./API.md) and, if the data shape changes, [DATABASE.md](./DATABASE.md).
5. Run server checks.
6. Verify the production smoke tests still cover the affected behavior.

### Changing the schema

1. Update `server/database/schema.sql` for new installations.
2. Add an idempotent migration path in `server/scripts/database.js` for existing databases.
3. Update `seed.sql` only if baseline content changes.
4. Update [DATABASE.md](./DATABASE.md) and [API.md](./API.md).
5. Run `db:migrate`, `db:seed` if needed, and `db:check` against a disposable database.
6. Confirm the CI Docker job applies SQL to an arbitrary database name.
7. Back up production before destructive DDL. There is no down migration.

### Changing the UI

1. Reuse an existing pattern or extend the design system in `index.css`.
2. Check mobile, keyboard, focus, reduced motion, and contrast.
3. Add loading, empty, and error states if data is involved.
4. Update [DESIGN.md](./DESIGN.md) if a new pattern is introduced.
5. Run lint and build; inspect the production build, not only dev.

### Changing deployment or environment variables

1. Update the relevant template: root `.env.example`, `client/.env.example`, or `server/.env.example` (placeholders only).
2. Update `render.yaml`, `client/vercel.json`, or the workflow only if the platform contract changes.
3. Update [DEPLOYMENT.md](./DEPLOYMENT.md) and [ARCHITECTURE.md](./ARCHITECTURE.md).
4. Never put a real secret in a blueprint, workflow, or document.
5. Confirm CI still passes and the Render env var list remains complete.

## 8. Testing expectations

- Server unit tests use `node:test` and live in `server/tests/`.
- Tests must not require production credentials or network access.
- Cover validation boundaries, auth failure modes, and security regressions.
- Do not weaken or delete a test to make a change pass. Fix the behavior or explain why the test is obsolete.
- There is no browser E2E suite in the repository. If you add one, keep it deterministic and do not commit credentials.
- Manual production verification is allowed and encouraged, but do not create test data in production unless the owner approves cleanup.

Detailed strategy: [TESTING.md](./TESTING.md).

## 9. Git and commit rules

- Work on `main` only when the owner requests direct commits; otherwise use a feature branch.
- Stage files explicitly. Do not use `git add -A` when unrelated edits exist.
- Never stage `.env`, `.vercel/`, `node_modules/`, `dist/`, logs, dumps, or screenshots containing secrets.
- Commit messages use a conventional prefix and a short imperative summary:
  - `feat(scope): ...`
  - `fix(scope): ...`
  - `docs(scope): ...`
  - `chore(scope): ...`
  - `security(scope): ...`
- Keep commits focused. Do not mix an unrelated README edit with code or docs.
- Do not force-push `main`, rewrite published history, or delete tags without explicit approval.
- After pushing to `main`, watch the CI run. A push is not complete until the pipeline result is known.

## 10. Security rules for agents

- Do not print environment variable values, tokens, connection strings, or credential files into chat or logs. If a secret appears in output, treat it as exposed and flag rotation; do not repeat it.
- Do not create new credentials, OAuth clients, API keys, or accounts on the owner's behalf.
- Do not disable security controls (CORS, Helmet, rate limits, validation, auth) to make a test pass.
- Do not weaken CSP, add `unsafe-inline`/`unsafe-eval`, or relax `frame-ancestors`.
- Do not expose `os.hostname()`, environment variables, filesystem paths, or database details in telemetry or errors.
- Do not add a package with a known vulnerability or an unmaintained dependency. Run `npm audit --omit=dev`.
- Do not add an MCP server, browser extension, or external agent tool without an approved use case, scoped permissions, and documentation. See [MCP.md](./MCP.md).

## 11. Documentation rules

- `docs/` is the source of truth. Keep it consistent with code in the same change.
- Use real file paths, endpoint names, commands, and values from the repository. Do not invent features.
- Label assumptions, approval items, and unresolved risks explicitly. Do not present a recommendation as implemented.
- Keep `README.md` as the public entry point. Do not delete or overwrite it as part of documentation maintenance.
- Relative links must resolve inside the repository. Do not link to deleted files.
- Do not include real secrets, personal contact data beyond what is already public, or production message contents.

## 12. Deployment rules

- Production frontend: <https://mk-portfolio-phi-silk.vercel.app>
- Production API: <https://mk-portfolio-api.onrender.com>
- Render service: `mk-portfolio-api`, `autoDeploy: false`.
- CI triggers Render after all jobs pass; Vercel deploys from Git.
- Do not trigger a manual Render deploy unless CI is green or the owner explicitly approves an emergency.
- Do not run `db:setup`, `db:migrate`, or `db:seed` against production without a backup and owner approval.
- After deployment, verify:
  - `/api/health` and `/api/health/ready`;
  - public content counts;
  - `/admin` returns the noindex header;
  - API returns `X-Robots-Tag` and `Cache-Control: no-store`;
  - the frontend title and routes render;
  - Render logs show no new fatal errors.
- Update [DEPLOYMENT.md](./DEPLOYMENT.md) if a step or platform setting changes.

## 13. Stop and ask

Stop and request owner approval before:

- adding a new dependency, service, database table, or background job;
- changing authentication, token storage, or password handling;
- changing the public API contract in a breaking way;
- deleting data, tables, assets, or documents beyond an explicitly approved list;
- rotating or creating credentials;
- enabling Gmail, Cloudinary, Gemini, MCP, analytics, or any new integration;
- making a destructive production change;
- rewriting git history or force-pushing;
- claiming a security, accessibility, SEO, or ranking guarantee that the evidence does not support.

## 14. Definition of done

A change is complete when:

- the behavior is implemented and matches the requirement;
- relevant checks pass;
- security invariants are preserved;
- loading, empty, error, and disabled states are handled where applicable;
- accessibility and responsive behavior are checked;
- documentation is updated;
- no secret or unrelated file is staged;
- CI passes after push;
- production is verified if the change is deployed.
