# Deployment Runbook

**Product:** Mayuresh Kasar Portfolio ("MAYURESH.DEV")
**Document owner:** Mayuresh Kasar
**Status:** Source of truth for production deployment
**Version:** 1.1
**Last updated:** 2026-11-22
**Live frontend:** https://mk-portfolio-phi-silk.vercel.app
**Live API:** https://mk-portfolio-api.onrender.com

**Related:** [PROJECT_SETUP.md](./PROJECT_SETUP.md) · [ARCHITECTURE.md](./ARCHITECTURE.md) · [MONITORING.md](./MONITORING.md) · [SECURITY_AUDIT.md](./SECURITY_AUDIT.md)

---

## 1. Production topology

```text
GitHub main
  ├─ Vercel Git integration → builds client/ → static CDN
  └─ GitHub Actions (7 jobs)
       ├─ hygiene, server, client, Dockerfile lint, Docker stack
       ├─ Render deploy hook → server/ on Node 22
       └─ production smoke tests → Vercel + Render

Browser → Vercel (React SPA)
Browser → Render (Express API, /api)
Render  → TiDB Cloud (MySQL over TLS)
Render  → Cloudinary / Gemini / Gmail (optional)
```

| Layer | Platform | Configuration |
|---|---|---|
| Frontend | Vercel | Root `client`, Vite, `npm run build`, output `dist` |
| API | Render | Root `server`, `npm ci`, `npm start`, health `/api/health` |
| Database | TiDB Cloud | MySQL-compatible, port 4000, TLS |
| CI/CD | GitHub Actions | `.github/workflows/docker-ci.yml` |
| Media | Cloudinary | Cloud `dyjerqrqy` (rotate credentials) |

Deployment order for a first-time setup: **database → API → frontend → CI secret → smoke tests**.

## 2. Prerequisites

- GitHub repository access with permission to push `main`.
- Vercel project access.
- Render account and API key.
- TiDB Cloud cluster and database user.
- Cloudinary account (optional for text-only content).
- Google AI Studio key (optional).
- Google Cloud OAuth client (optional email).
- GitHub repository secret `RENDER_DEPLOY_HOOK_URL`.

Do not store any of these values in the repository.

## 3. Environment contract

### 3.1 Render API

Required:

| Variable | Notes |
|---|---|
| `NODE_ENV=production` | Enables production validation and error behavior |
| `CLIENT_URL` | Exact Vercel origin, no trailing slash |
| `DB_HOST` | TiDB host |
| `DB_PORT=4000` | TiDB port |
| `DB_USER` | Database user |
| `DB_PASSWORD` | Secret |
| `DB_NAME=portfolio` | Database name |
| `DB_SSL=true` | TLS required |
| `ADMIN_EMAIL` | Real admin email |
| `ADMIN_PASSWORD_HASH` | bcrypt hash; required in production |

> **Breaking change before this branch deploys:** production validation now
> rejects a plain `ADMIN_PASSWORD`. If Render still has only that variable,
> generate a hash with `npm run hash-password`, set
> `ADMIN_PASSWORD_HASH`, remove `ADMIN_PASSWORD`, and restart before
> deploying. Otherwise the API will refuse to start. This is an owner action;
> the repository cannot verify the live Render environment.

Optional:

| Variable | Notes |
|---|---|
| `DB_CONNECTION_LIMIT=10` | 1–20 |
| `ALLOW_VERCEL_PREVIEWS=false` | Keep false unless previews are needed |
| `SESSION_TTL_MINUTES=120` | Absolute session lifetime, 5–1440 |
| `SESSION_IDLE_MINUTES=30` | Idle timeout, cannot exceed the absolute lifetime |
| `SESSION_COOKIE_SAMESITE=lax` | First-party via `/api`; `none` is explicit opt-in |
| `UPLOAD_TIMEOUT_MS=30000` | Abort a stalled Cloudinary upload; 504 on timeout |
| `CLOUD_NAME`, `CLOUD_API_KEY`, `CLOUD_API_SECRET` | Uploads |
| `GEMINI_API_KEY` | AI |
| `EMAIL_USER`, `EMAIL_TRANSPORT` | Email |
| `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN` | Gmail API |
| `EMAIL_PASS` | SMTP only; do not set on Render free tier |

### 3.2 Vercel frontend

No frontend API-origin variable is required. The browser calls same-origin
`/api`, and `client/vercel.json` rewrites that path to the Render API so the
session cookie remains first-party. `VITE_PROXY_TARGET` is local-only.

### 3.3 GitHub Actions

| Name | Type | Purpose |
|---|---|---|
| `RENDER_DEPLOY_HOOK_URL` | Secret | Trigger Render deploys |
| `PRODUCTION_API_URL` | Variable (optional) | Defaults to the live API |
| `PRODUCTION_SITE_URL` | Variable (optional) | Defaults to the live site |

Never put the Render key in `render.yaml`, a workflow file, or a document.

## 4. Database deployment

1. Create a TiDB Cloud Starter/Dedicated cluster.
2. Create a database user with DML rights on the four content tables and `admin_sessions`.
3. Create `portfolio` (or the chosen `DB_NAME`).
4. Allow Render's outbound connections.
5. From a trusted machine with production values **temporarily** in a local, gitignored shell environment:

```bash
cd server
npm run db:setup
npm run db:seed
npm run db:check
```

6. Expected counts: projects 4, skills 16, certificates 16.
7. Remove the temporary production credentials from the local shell/history.

Do not run `db:setup` or `db:seed` against production casually. `db:seed` refreshes baseline rows by fixed ID; it is not a general content sync.

### Migrations

- Forward-only and idempotent.
- Run `npm run db:migrate` then `npm run db:check`.
- Back up before destructive changes.
- No down migration.

## 5. Render API deployment

### 5.1 Blueprint or manual service

`render.yaml` defines:

```yaml
type: web
name: mk-portfolio-api
runtime: node
plan: free
rootDir: server
buildCommand: npm ci
startCommand: npm start
healthCheckPath: /api/health
autoDeploy: false
```

If using the dashboard:

1. New → Web Service → connect the repository.
2. Root Directory: `server`.
3. Runtime: Node.
4. Build: `npm ci`.
5. Start: `npm start`.
6. Health check: `/api/health`.
7. Add the environment variables from section 3.1.
8. Set auto-deploy **off**. CI triggers deploys.

### 5.2 Why `autoDeploy: false`

Render's native GitHub App is not installed on the repository. Deployments are triggered by the workflow after all CI jobs pass, preventing a red build from reaching production.

### 5.3 First deploy verification

```bash
curl -i https://mk-portfolio-api.onrender.com/
curl -i https://mk-portfolio-api.onrender.com/api/health
curl -i https://mk-portfolio-api.onrender.com/api/health/ready
curl -i https://mk-portfolio-api.onrender.com/api/projects
```

Expected:

- root: service identity JSON;
- health: `200`, `"status": "healthy"`;
- ready: `200`, `"status": "ready"`;
- projects: `200` with `count` and `data`.

Check logs for:

```text
Database connected successfully
API listening on 0.0.0.0:<port> (production)
🔐 Admin login: bcrypt hash.
```

Optional-integration warnings are expected when those services are absent.

### 5.4 Render ports and timeouts

- Render injects `PORT`; the app binds `HOST=0.0.0.0`.
- `server.keepAliveTimeout = 65000`, `headersTimeout = 66000`, above Render's 60-second proxy timeout.
- The app trusts one proxy hop and resolves the real client IP from Cloudflare/Render headers.
- Graceful shutdown handles `SIGINT`/`SIGTERM` and closes the pool.

## 6. Vercel frontend deployment

### 6.1 Project settings

| Setting | Value |
|---|---|
| Root Directory | `client` |
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm ci` |
| Node Version | 22.x |

Do not set a cross-site API origin. The `/api` rewrite in `client/vercel.json`
keeps the session cookie first-party for both Production and Preview.

### 6.2 What the client build and `client/vercel.json` provide

- `cleanUrls: true` and `trailingSlash: false`.
- A route-specific HTML document for every public page, blog post and
  taxonomy page, generated by `client/scripts/build-seo.mjs`.
- A real `404.html` for unknown paths. There is no SPA catch-all rewrite, so
  unknown URLs return HTTP 404 instead of a soft 404.
- The only rewrite is `/api/*` → the Render API.
- Security headers on all routes.
- `X-Robots-Tag: noindex, nofollow` on `/admin` and `/admin/*`.
- Immutable caching for `/assets/*`; `no-cache` for `/index.html`.

Do not add a catch-all rewrite: it would turn every unknown URL into a 200
and hide real 404s. Do not remove the admin noindex headers. New public
routes must be added to `client/scripts/build-seo.mjs` or they will not get a
document, canonical URL or sitemap entry.

### 6.3 Verification

```bash
curl -I https://mk-portfolio-phi-silk.vercel.app/
curl -I https://mk-portfolio-phi-silk.vercel.app/admin
curl -I https://mk-portfolio-phi-silk.vercel.app/projects
curl -I https://mk-portfolio-phi-silk.vercel.app/a4a20cec102278b8da74b3c53c282f30.txt
```

Check:

- `200` for public routes and the IndexNow key file;
- `X-Robots-Tag: noindex, nofollow` on `/admin`;
- CSP includes `frame-ancestors 'none'`;
- HSTS, nosniff, frame denial, referrer, permissions headers;
- deep links return the route-specific document with the correct `<title>`
  and canonical URL;
- an unknown path returns `404`, not the homepage shell.

## 7. CI/CD pipeline

Workflow: `.github/workflows/docker-ci.yml`

Triggers: push/PR to `main`, manual dispatch.

| # | Job | Fails when |
|---|---|---|
| 1 | Repository Hygiene | A real env file/build output is tracked |
| 2 | Server Syntax & Tests | Syntax or test failure |
| 3 | Client Lint & Build | Lint/build failure or missing SEO markers |
| 4 | Lint Dockerfiles | Hadolint warning |
| 5 | Build & Test Full Stack | Compose, DB, API, auth, proxy, or header failure |
| 6 | Deploy API to Render | Missing/invalid key, Render API failure |
| 7 | Production Smoke Tests | Live health/content/auth/CORS/header/SEO failure |

Deploy and smoke jobs depend on the earlier jobs. A pull request runs checks but does not deploy.

### Manual dispatch

Use the GitHub Actions UI → CI/CD Pipeline → Run workflow on `main`. It follows the same path as a push.

## 8. Release procedure

1. **Confirm scope** and that the PR/commit is reviewed.
2. **Run local gates**:
   ```bash
   cd server && npm run check && npm test
   cd ../client && npm test && npm run lint && npm run build
   ```
   The client build must print the expected post, sitemap-URL and route-document
   counts (currently `6 blog posts`, `39 sitemap URLs`, `42 route documents`), and
   must emit `404.html` plus the route directories.
3. **Check secrets**: no `.env`, keys, dumps, or build output staged.
4. **Push to `main`**.
5. **Watch CI** until all seven jobs pass.
6. **Confirm Vercel** deployed the same commit.
7. **Confirm Render** deployed after CI (workflow calls the Render API).
8. **Run post-deploy checks**:
   - health and readiness;
   - public counts;
   - login with the real admin (manual, no credentials in shell history);
   - `/admin` noindex;
   - API no-store/noindex;
   - homepage title/canonical;
   - Render logs free of fatal errors.
9. **Submit IndexNow** if public URLs changed.
10. **Record** the release and any incident.

## 9. Post-deploy verification commands

```bash
# API
curl -fsS https://mk-portfolio-api.onrender.com/api/health
curl -fsS https://mk-portfolio-api.onrender.com/api/health/ready
curl -fsS https://mk-portfolio-api.onrender.com/api/projects

# Auth rejection
curl -i https://mk-portfolio-api.onrender.com/api/messages

# Headers
curl -I https://mk-portfolio-api.onrender.com/api/projects
curl -I https://mk-portfolio-phi-silk.vercel.app/admin

# SEO and discovery
curl -fsS https://mk-portfolio-phi-silk.vercel.app/robots.txt
curl -fsS https://mk-portfolio-phi-silk.vercel.app/sitemap.xml
curl -fsS https://mk-portfolio-phi-silk.vercel.app/rss.xml
curl -fsS https://mk-portfolio-phi-silk.vercel.app/llms.txt
curl -fsS https://mk-portfolio-phi-silk.vercel.app/.well-known/security.txt

# A route document and a real 404
curl -fsS https://mk-portfolio-phi-silk.vercel.app/about | Select-String '<title>'
curl -i https://mk-portfolio-phi-silk.vercel.app/does-not-exist
```

Expected: health/ready `200`; messages `401`; API `X-Robots-Tag` and `Cache-Control: no-store`; admin noindex; robots/sitemap/RSS/llms/security.txt present; `/about` has the About title; unknown path returns `404`.

## 10. Rollback

### Frontend

- Vercel → Deployments → select the last known-good deployment → Promote/Rollback.
- Or revert the commit on `main` and let Vercel rebuild.

### API

- Render → service → Deploys → redeploy the last known-good deploy, or revert the commit and let CI deploy.
- Do not use the Render shell to patch production code; changes will be lost on the next deploy.

### Database

- Schema changes are forward-only. If a migration is bad:
  1. stop writes if possible;
  2. restore the pre-migration backup into a new database;
  3. verify with `db:check`;
  4. point the API at the restored database;
  5. reconcile data created after the backup.
- Never attempt an unreviewed destructive repair during an incident.

### Cache

- Vercel assets are immutable; `index.html` is `no-cache`. A rollback should take effect on the next page load.
- API responses are `no-store`, so there is no API cache to purge.

## 11. Free-tier constraints

| Constraint | Effect | Mitigation |
|---|---|---|
| Render idles after inactivity | 30–60 s first request | 60 s client timeout, loading state, one GET retry |
| Render free SMTP blocked | Email over SMTP fails | Gmail API over HTTPS |
| Single Render instance | In-memory rate limits are per instance | Accept at current scale |
| TiDB Serverless limits | Connection/row limits | Pool capped at 20; monitor |
| Vercel build minutes | Limited builds | Avoid unnecessary redeploys |

## 12. Environment change procedure

1. Change the value in Render/Vercel, not in git.
2. Redeploy/restart the affected service.
3. Verify the dependent feature.
4. If the value is a secret, rotate the old one and record the date.
5. If the variable is new, add it to the correct `.env.example` with a placeholder and update this document.
6. If the variable is removed, confirm no code references it (`grep`) and update the template/docs.

## 13. Deployment troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Render deploy fails immediately | Env validation error | Read the first fatal log line; fix the named variable |
| API starts but readiness 503 | DB unreachable | Check TiDB host/port/TLS/IP allowlist |
| Browser calls a cross-site API | A custom build still bakes in an API origin | Remove `VITE_API_BASE_URL` and rebuild; `/api` must stay same-origin |
| CORS error | `CLIENT_URL` mismatch | Exact origin, no trailing slash; redeploy Render |
| Admin login 401 | Hash/password mismatch | Verify `ADMIN_EMAIL` and hash; check startup mode |
| Uploads 503 | Cloudinary not configured | Add all three values |
| AI 502 | Gemini key/quota | Check key and model availability |
| Email not sent | Gmail not configured | Configure OAuth or accept inbox-only |
| CI deploy job can't authenticate | `RENDER_DEPLOY_HOOK_URL` missing/revoked | Regenerate the hook in Render and update the GitHub secret |
| Smoke test fails on headers | Vercel/Render config regression | Diff `vercel.json`/`server.js` against the last green commit |
| Deep link 404 | No generated document for that route, or `cleanUrls` disabled | Add the route to `build-seo.mjs`; confirm `cleanUrls: true` |
| Unknown path returns 200 | A catch-all rewrite was re-added | Remove it; keep only the `/api` rewrite |
| API refuses to start: plain admin password | `ADMIN_PASSWORD` set in production | Replace it with `ADMIN_PASSWORD_HASH` and restart |

## 14. Security requirements for deployment

- Never paste secrets into a workflow, issue, PR, screenshot, or doc.
- Use `ADMIN_PASSWORD_HASH`, not a plain password, in production. A plain
  `ADMIN_PASSWORD` is rejected at startup and at login.
- Keep `CLIENT_URL` exact.
- Keep `ALLOW_VERCEL_PREVIEWS` off unless needed.
- Keep Render auto-deploy off; CI must gate production.
- Keep `/admin` and API noindex.
- Keep CSP/HSTS/frame denial intact.
- Rotate any credential that appears in output.
- Review Render logs after every deploy for unexpected auth attempts or provider errors.

## 15. Deployment checklist

- [ ] Database reachable and seeded.
- [ ] Render env complete; `ADMIN_PASSWORD_HASH` set; no plain `ADMIN_PASSWORD`.
- [ ] Session cookie is Secure and SameSite=Lax unless cross-site is intentional.
- [ ] Vercel env points to the Render API.
- [ ] Client build emitted 39 sitemap URLs and 42 route documents, including `404.html`.
- [ ] `RENDER_DEPLOY_HOOK_URL` secret present.
- [ ] Local server/client gates pass.
- [ ] No secret staged.
- [ ] Push to `main`.
- [ ] Seven CI jobs pass.
- [ ] Vercel and Render both on the same commit.
- [ ] Health/readiness `200`.
- [ ] Public content counts correct.
- [ ] `/admin` noindex; API no-store/noindex.
- [ ] CSP/HSTS/frame denial verified.
- [ ] Admin login verified manually.
- [ ] Render logs clean.
- [ ] IndexNow submitted if URLs changed.
- [ ] Release recorded.
