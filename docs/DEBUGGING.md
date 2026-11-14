# Debugging Guide

**Product:** Mayuresh Kasar Portfolio ("MAYURESH.DEV")
**Document owner:** Mayuresh Kasar
**Status:** Operational troubleshooting reference
**Version:** 1.0
**Last updated:** 2026-11-14
**Related:** [MONITORING.md](./MONITORING.md) · [DEPLOYMENT.md](./DEPLOYMENT.md) · [API.md](./API.md) · [TESTING.md](./TESTING.md)

---

## 1. First response

When something is wrong, establish scope before changing code:

1. **Is it the frontend, the API, the database, or an external service?**
2. **Is it one route, one user, or everyone?**
3. **Did it start after a deploy, a config change, or a provider incident?**
4. **Is data at risk?** If yes, stop writes and take a backup before debugging.
5. **Is it a security issue?** If a secret may be exposed, rotate it; do not paste it into logs or chat.

Use the health endpoints first:

```bash
curl -i https://mk-portfolio-api.onrender.com/api/health
curl -i https://mk-portfolio-api.onrender.com/api/health/ready
```

| Result | Meaning |
|---|---|
| Health `200`, ready `200` | API process and DB are up |
| Health `200`, ready `503` | API is up; database is unavailable |
| Health times out | Render is cold, restarting, or down |
| Both fail | API or platform outage |

## 2. Where the evidence lives

| Evidence | Location |
|---|---|
| Render runtime logs | Render dashboard → `mk-portfolio-api` → Logs |
| Vercel build/runtime | Vercel project → Deployments → Build Logs / Functions |
| CI job logs | GitHub Actions → `CI/CD Pipeline` run |
| Browser console/network | DevTools |
| API response | Status, headers, JSON `message` |
| Database | `npm run db:check`, TiDB console |
| Live headers | `curl -I` |
| Docker | `docker compose logs`, `docker compose ps` |
| Local startup | Terminal running `npm run dev` |

Do not paste tokens, cookies, `.env` contents, database URLs, or full request bodies into an issue or chat.

## 3. Startup failures

The API validates the environment before listening. A production process that exits immediately is usually a config error.

### 3.1 Read the first fatal line

Look for messages such as:

```text
Missing database environment variables: DB_HOST, DB_USER.
ADMIN_EMAIL is required.
ADMIN_PASSWORD_HASH is not a valid bcrypt hash.
JWT_SECRET must be at least 32 characters in production.
CLIENT_URL is required in production.
```

Fix the named variable in the correct environment (Render, not the repo). Do not add a default secret to make it boot.

### 3.2 Common causes

| Symptom | Cause | Fix |
|---|---|---|
| `Missing database environment variables` | Render env incomplete | Add `DB_*` values |
| `Database connection failed` | Wrong host/port/password, TLS, IP allowlist | Verify TiDB values; `DB_PORT=4000`, `DB_SSL=true` |
| `ADMIN_EMAIL is still an example address` | Placeholder left in env | Set the real admin email |
| `ADMIN_PASSWORD_HASH is not a valid bcrypt hash` | Truncated/escaped hash | Regenerate; paste as a single line |
| `CLIENT_URL is required in production` | CORS origin missing | Add the exact Vercel origin |
| Process exits with no obvious error | Platform env or start command | Check Render logs and `render.yaml` rootDir/startCommand |

### 3.3 Verify locally with the same values

Never copy production secrets to a local file. Instead, reproduce the shape with local values and run:

```bash
cd server
npm run check
npm start
```

If it starts locally but not on Render, compare env names, Node version, root directory, and start command.

## 4. Database problems

### 4.1 Readiness fails

```bash
curl -i https://mk-portfolio-api.onrender.com/api/health/ready
```

`503` means `SELECT 1` failed. Check:

- TiDB cluster status;
- database user/password;
- `DB_PORT=4000`;
- `DB_SSL=true`;
- IP allowlist (Render outbound);
- connection limit.

### 4.2 Schema problems

```bash
cd server
npm run db:check
```

It reports missing tables, missing `messages.subject`, non-nullable `certificates.image`, and non-utf8mb4 tables. Fix with:

```bash
npm run db:migrate
npm run db:check
```

If tables are missing entirely, `db:migrate` stops and asks for `db:setup`.

### 4.3 Counts are wrong

- `0` after setup: you did not run `db:seed`.
- `0` after seed: `DB_NAME` points to a different database.
- Duplicate-looking rows: seed uses fixed IDs and refreshes; admin-created rows have higher IDs.
- Messages missing: they are only visible with a valid admin token; check `/api/messages` with auth.

### 4.4 Slow queries

At current scale, slowness is usually a cold start or network latency, not SQL. Check:

- API latency vs database latency;
- TiDB console metrics;
- pool saturation (many concurrent requests);
- whether the process is still cold.

Do not add indexes or caching without a measurement.

## 5. Render cold starts

Render's free tier idles. The first request can take 30–60 seconds.

Expected behavior:

- the client shows a loading state for up to 60 seconds;
- one idempotent GET may retry after 2 seconds;
- mutations are never retried automatically;
- `/system` shows a non-blocking warning if telemetry fails.

If a request times out:

1. Open `/api/health` directly in a browser.
2. Wait for it to return.
3. Retry the page.
4. If it never wakes, check Render status and logs.

Do not "fix" this by increasing the Axios timeout indefinitely or adding aggressive retries.

## 6. CORS errors

Browser message examples:

```text
Access to XMLHttpRequest at 'https://mk-portfolio-api.onrender.com/api/...'
from origin 'https://...' has been blocked by CORS policy
```

Check:

1. `CLIENT_URL` in Render contains the exact origin: scheme + host, no trailing slash.
2. The deployed frontend origin has not changed (Vercel preview vs production).
3. `ALLOW_VERCEL_PREVIEWS` is only `true` if previews are intentionally allowed.
4. The request is not sending credentials from an unlisted origin.
5. The API was redeployed after the env change.

Verify with curl:

```bash
curl -i -X OPTIONS https://mk-portfolio-api.onrender.com/api/projects \
  -H "Origin: https://mk-portfolio-phi-silk.vercel.app" \
  -H "Access-Control-Request-Method: GET"
```

A disallowed origin intentionally receives no CORS headers, not a `500`.

## 7. Admin login problems

| Symptom | Check |
|---|---|
| `401 Invalid email or password.` | Exact email/hash or password; email is lowercased; password is not trimmed |
| `400 Email and password are required.` | Empty field or wrong JSON type |
| `429` | Auth limiter; wait 15 minutes or use a different network |
| `500 Server configuration error.` | `JWT_SECRET` or `ADMIN_EMAIL` missing at runtime |
| Login succeeds but dashboard redirects | Token not stored, or first API call returned `401` |
| Old token stops working | `JWT_SECRET` or `ADMIN_EMAIL` changed; sign in again |
| Startup warns both password forms set | Remove `ADMIN_PASSWORD`; hash wins |

Verify hash mode in logs:

```text
🔐 Admin login: bcrypt hash.
```

Do not log the hash, password, or token to debug this.

## 8. Upload failures

| Status | Meaning | Action |
|---|---|---|
| `503` | Cloudinary not configured | Add all three values in Render; restart |
| `502` | Cloudinary rejected/failed | Check provider status, credentials, format |
| `413` | File too large | Image ≤ 5 MB; attachment ≤ 10 MB |
| `400` | Unsupported type or malformed field | Use JPG/PNG/WEBP; attachments may be PDF/DOC/DOCX |
| Image broken after upload | Asset deleted or URL wrong | Inspect the stored URL; re-upload |

Check the Render log line:

```text
Cloudinary upload failed: <message>
```

It should not include the secret. If it does, treat the credential as exposed.

## 9. Contact form problems

### Message not saved

- Check `400` validation messages.
- Check `429` (5 per 15 minutes).
- Check database readiness.
- Check server logs for a 500.

### Message saved but no email

Expected until Gmail is configured. Look for:

```text
Email is not configured - contact messages are saved but no notification email is sent.
```

or a send failure. The `201` is correct because persistence succeeded. Do not make the API return an error for a notification failure.

### Gmail-specific errors

| Error | Cause | Fix |
|---|---|---|
| `invalid_grant` | Refresh token expired/revoked | Rerun `npm run gmail:auth`; publish consent screen |
| `redirect_uri_mismatch` | Wrong OAuth client type | Use a Desktop client |
| `insufficientPermissions` | Missing `gmail.send` scope | Reauthorize with the correct scope |
| SMTP timeout on Render | Port blocked on free tier | Use `EMAIL_TRANSPORT=gmail-api` |

## 10. AI failures

`502 AI assistant is temporarily unavailable.` means the provider call failed or the key is missing.

Check:

1. `GEMINI_API_KEY` exists in Render.
2. The key is valid and the project has quota.
3. The model `gemini-3.5-flash-lite` is available to that key.
4. The request is under 10/minute.
5. Render logs show a provider error without the key.

AI is optional. Do not block the page or retry aggressively. The rest of the site must remain usable.

## 11. Frontend problems

### Blank page

1. Check the browser console for a JavaScript error.
2. Check the Network tab for a failed JS/CSS asset.
3. Confirm Vercel built the latest commit.
4. Confirm `index.html` references the emitted assets.
5. Check the CSP for a blocked script.

### API calls go to the wrong origin

- Local: `client/.env` must have `VITE_API_BASE_URL=` empty and the dev server restarted.
- Production: Vercel must have `VITE_API_BASE_URL=https://mk-portfolio-api.onrender.com`.
- Changing a Vite env var requires a rebuild, not just a refresh.

### Deep link returns 404

Vercel/Nginx must rewrite unknown paths to `index.html`. Check `client/vercel.json` and `client/nginx.conf`. The SPA route itself returns HTTP 200 with a client-rendered 404 state for unknown paths; do not confuse the shell response with the rendered state.

### Styling/layout regression

- Check the breakpoint (320/640/820/1024/1180 px).
- Check for a long unbroken URL or title causing overflow.
- Check that a new class uses existing tokens.
- Check reduced-motion behavior.

## 12. Docker problems

| Symptom | Cause | Fix |
|---|---|---|
| `Cannot connect to the Docker daemon` | Docker Desktop stopped | Start it and wait for the engine |
| MySQL starts without tables | Old image/volume | `docker compose build --no-cache db`, then `down -v` and up |
| API cannot reach DB | Wrong host/port in container | Compose uses service name `db`, internal `3306` |
| Port already allocated | Another process uses 80/5000/3307 | Stop it or change the mapping |
| Frontend `/api` 502 | API not ready | Check `docker compose logs -f server` |
| Changes not reflected | Old image/build | Rebuild with `--build` |

The SQL files are baked into the DB image specifically because Windows/FAT32 bind mounts can appear empty inside the container.

## 13. CI failures

Open the failed job and read the first error, not the last.

| Job | Common failure |
|---|---|
| Repository Hygiene | A `.env`, `dist`, or `node_modules` is tracked |
| Server Syntax & Tests | Syntax error, failing test, missing env-independent default |
| Client Lint & Build | Lint error, import error, missing SEO marker |
| Lint Dockerfiles | Hadolint warning |
| Build & Test Full Stack | Compose config, service health, SQL, auth, or header test |
| Deploy API to Render | Missing/invalid `RENDER_API_KEY`, service ID, API failure |
| Production Smoke Tests | Live content/header/route/auth mismatch |

Use the uploaded Docker logs artifact when the stack job fails. Do not re-run blindly; fix the cause.

## 14. Secret exposure response

If a secret appears in output, a commit, a build, or a live asset:

1. **Do not repeat it.**
2. Identify the secret and its scope.
3. Revoke/rotate it in the provider console.
4. Update the production environment.
5. Redeploy and verify the dependent feature.
6. Remove the secret from the working tree.
7. If it was committed, rewrite history only with owner approval; assume it is compromised regardless.
8. Record the incident and the rotation date.

A secret in a chat transcript, screenshot, or terminal scrollback is exposed. Rotation is the fix, not deletion.

## 15. Performance debugging

Measure before changing:

- browser Network waterfall;
- API response time (warm vs cold);
- database time;
- payload size;
- image sizes;
- render-blocking assets.

Likely wins at current scale:

- image compression/format;
- fewer large responses;
- cache headers for static assets;
- avoiding unnecessary re-renders.

Do not add Redis, a CDN layer, or a service worker without evidence and an operational plan.

## 16. Incident record template

```text
Date/time:
Detected by:
Symptom:
Scope (site/API/DB/admin):
Last deploy/change:
Health/readiness:
Relevant logs (redacted):
Root cause:
Fix:
Verification:
Data impact:
Secret impact:
Follow-up:
Owner:
```

Store incidents outside the public repository if they contain sensitive details.

## 17. Escalation rules

Escalate to the owner immediately when:

- production data may be lost or corrupted;
- a secret may be exposed;
- admin access is suspected compromised;
- the site is down for all users;
- a deploy is failing repeatedly;
- a fix requires a destructive database change;
- a third-party provider reports a breach affecting the project.

Do not attempt an unreviewed production database repair during an incident. Stabilize, back up, then fix.
