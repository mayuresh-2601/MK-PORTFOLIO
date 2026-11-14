# Project Setup

**Product:** Mayuresh Kasar Portfolio ("MAYURESH.DEV")
**Document owner:** Mayuresh Kasar
**Status:** Reproducible local setup guide
**Version:** 1.0
**Last updated:** 2026-11-14
**Related:** [ARCHITECTURE.md](./ARCHITECTURE.md) · [DATABASE.md](./DATABASE.md) · [AUTHENTICATION.md](./AUTHENTICATION.md) · [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 1. Scope

This guide takes a clean machine to a running local copy of the portfolio: React client, Express API, and MySQL database. It also covers the Docker alternative and the checks that prove the setup is healthy.

It does not configure production. Use [DEPLOYMENT.md](./DEPLOYMENT.md) for Vercel, Render, TiDB Cloud, and GitHub Actions.

## 2. Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Node.js | 22.x | `.nvmrc` and `engines` specify 22.x; CI uses Node 22 |
| npm | 10+ | `npm ci` uses the lockfiles |
| Git | Recent | Needed for clone and version display |
| MySQL | 8.0+ | Local native install, or TiDB Cloud |
| Docker Desktop | Latest | Optional; required only for the Compose stack |
| Browser | Modern evergreen | Chrome/Edge/Firefox/Safari |

Optional accounts/services:

- **TiDB Cloud** — managed MySQL-compatible database.
- **Cloudinary** — image and attachment uploads.
- **Google AI Studio** — Gemini API key.
- **Google Cloud** — Gmail API OAuth client (optional notifications).

No Python, Redis, message broker, or global CLI is required.

### Windows notes

- Use PowerShell for the copy commands shown.
- If the repository is on a FAT32 removable drive (`E:`), the native Node/MySQL workflow works, but Docker bind mounts can behave incorrectly. The project works around this by baking SQL into the database image. Prefer an NTFS workspace for Docker builds.
- Long paths can exceed Windows limits in `node_modules`; enable long-path support or keep the repo near the drive root.

## 3. Clone and inspect

```bash
git clone https://github.com/mayuresh-2601/MK-PORTFOLIO.git
cd MK-PORTFOLIO
```

Check the expected top-level layout:

```text
client/  server/  docs/  .github/  docker-compose.yml  render.yaml  README.md
```

Do not proceed if a real `.env` file is already present from an unknown source; inspect it without printing secrets and rotate anything that may have leaked.

## 4. Environment files

The project uses three separate files so server secrets never enter the browser bundle.

| File | Purpose | Committed? | Template |
|---|---|---|---|
| `.env` (root) | Docker Compose database values only | No | `.env.example` |
| `client/.env` | Public Vite variables | No | `client/.env.example` |
| `server/.env` | API, DB, auth, upload, email, AI secrets | No | `server/.env.example` |

Rules:

- Never commit a real `.env`.
- Never put a server secret in a `VITE_*` variable; Vite embeds it in public JavaScript.
- `*.env.example` files contain placeholders only and are safe to commit.
- CI fails if a real env file is tracked.

### 4.1 Root `.env` (Docker only)

```powershell
Copy-Item .env.example .env
```

```env
DB_PASSWORD=portfolio_local_dev_password
DB_NAME=portfolio
```

These are local values. Do not reuse them in production.

### 4.2 `server/.env`

```powershell
Copy-Item server/.env.example server/.env
```

Minimum local values:

```env
NODE_ENV=development
PORT=5000
HOST=0.0.0.0

CLIENT_URL=http://localhost:5173
ALLOW_VERCEL_PREVIEWS=false

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-local-password
DB_NAME=portfolio
DB_SSL=false
DB_CONNECTION_LIMIT=10

JWT_SECRET=replace-with-a-long-random-string
JWT_EXPIRES_IN=12h
ADMIN_EMAIL=your-admin@example.com
ADMIN_PASSWORD=replace-with-a-strong-password
```

For TiDB Cloud instead of local MySQL:

```env
DB_HOST=your-tidb-host
DB_PORT=4000
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=portfolio
DB_SSL=true
```

Generate a JWT secret locally without printing it into a commit:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Optional server values:

```env
# Cloudinary (uploads return 503 until all three exist)
CLOUD_NAME=your-cloud-name
CLOUD_API_KEY=your-api-key
CLOUD_API_SECRET=your-api-secret

# Gemini (AI returns 502 until this exists)
GEMINI_API_KEY=your-gemini-key

# Gmail API notifications (optional)
EMAIL_USER=your-address@gmail.com
GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-client-secret
GMAIL_REFRESH_TOKEN=your-refresh-token
EMAIL_TRANSPORT=auto
```

`ADMIN_PASSWORD_HASH` is preferred over `ADMIN_PASSWORD`. The hash wins when both are present.

### 4.3 `client/.env`

```powershell
Copy-Item client/.env.example client/.env
```

```env
VITE_API_BASE_URL=
VITE_PROXY_TARGET=http://localhost:5000
```

Leave `VITE_API_BASE_URL` empty for local development. Vite proxies `/api` to `VITE_PROXY_TARGET`. In production, `VITE_API_BASE_URL` is set to the Render origin.

## 5. Install dependencies

Use `npm ci` for a clean, lockfile-exact install.

```bash
cd server
npm ci

cd ../client
npm ci
```

If `npm ci` fails because the lockfile is out of sync, run `npm install` in that package, verify the change, and commit the lockfile deliberately. Do not delete the lockfile.

## 6. Prepare the database

### Option A — local MySQL 8

1. Start MySQL.
2. Create a database user with access to `portfolio`.
3. Set the `DB_*` values in `server/.env` (`DB_PORT=3306`, `DB_SSL=false`).
4. Run:

```bash
cd server
npm run db:setup
npm run db:seed
npm run db:check
```

### Option B — TiDB Cloud

1. Create a Starter/Dedicated cluster.
2. Create a database user.
3. Allow the client IP (and Render's outbound IPs for production).
4. Set `DB_PORT=4000` and `DB_SSL=true`.
5. Run the same three commands.

### What the commands do

| Command | Behavior |
|---|---|
| `db:setup` | Creates the database if permitted and applies `schema.sql` with `CREATE TABLE IF NOT EXISTS` |
| `db:migrate` | Idempotent upgrade for existing databases (`messages.subject`, nullable certificate image, utf8mb4, legacy cleanup) |
| `db:seed` | Inserts/refreshes 4 projects, 16 skills, 16 certificates |
| `db:check` | Verifies tables, columns, charset, and prints row counts |

`db:setup` does not seed. Run `db:seed` after it on a fresh database.

Expected baseline counts: projects 4, skills 16, certificates 16.

Do not run `db:setup` or `db:seed` against a production database without a backup and owner approval.

## 7. Start the API

```bash
cd server
npm run dev
```

`npm run dev` uses `node --watch server.js`.

Expected startup output includes a database connection confirmation and an admin auth mode line. With a bcrypt hash configured, it reports:

```text
🔐 Admin login: bcrypt hash.
```

Optional integrations produce warnings, not fatal errors:

```text
Cloudinary is not configured - uploads return 503.
Email is not configured - contact messages are saved but no notification email is sent.
GEMINI_API_KEY is not configured - AI endpoints return 502.
```

Verify:

```bash
curl http://localhost:5000/api/health
curl http://localhost:5000/api/health/ready
curl http://localhost:5000/api/projects
```

- Healthy process: `200` with `"status": "healthy"`.
- Ready database: `200` with `"status": "ready"`.
- Projects: `200` with `count` and `data`.

If the API starts but readiness fails, fix the database before touching the client.

## 8. Start the client

In a second terminal:

```bash
cd client
npm run dev
```

Open <http://localhost:5173>. The admin login is at <http://localhost:5173/admin>.

The Vite proxy forwards `/api` to `http://localhost:5000`, so the browser stays same-origin and CORS is not involved in local development.

## 9. Verify the local install

### Public pages

- `/` renders hero, stats, and capability cards.
- `/projects` shows 4 seeded projects.
- `/skills` shows 16 seeded skills.
- `/certificates` shows 16 seeded certificates.
- `/system` loads telemetry (CPU values may be 0 on Windows; expected).
- `/contact` submits a message.
- An unknown path renders the branded 404.

### Admin

1. Open `/admin`.
2. Sign in with `ADMIN_EMAIL` and the configured password.
3. Confirm the dashboard loads projects, skills, certificates, and messages.
4. Create and delete a disposable skill (for example `TEMP-TEST`) to prove writes work.
5. Sign out.

Do not leave test content in a shared or production database.

### Database

```bash
cd server
npm run db:check
```

### Quality gates

```bash
cd client
npm run lint
npm run build

cd ../server
npm run check
npm test
```

Server tests use `node:test` and require no network or production credentials.

## 10. Docker alternative

The Compose stack runs three services:

| Service | Image | Host port | Internal |
|---|---|---|---|
| `client` | Multi-stage Node build → Nginx | `80` | `80` |
| `server` | Node 22 Alpine | `5000` | `5000` |
| `db` | MySQL 8 with baked schema/seed | `3307` | `3306` |

### Start

1. Create the root Docker env:

```powershell
Copy-Item .env.example .env
```

2. Create the server env:

```powershell
Copy-Item server/.env.example server/.env
```

3. Set `JWT_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in `server/.env`. Compose overrides `DB_*`, so those values do not need to match the container.

4. Build and start:

```bash
docker compose up --build -d
```

5. Verify:

| URL | Purpose |
|---|---|
| <http://localhost> | Site through Nginx |
| <http://localhost:5000/api/health> | API liveness |
| <http://localhost:5000/api/health/ready> | API + DB readiness |
| `localhost:3307` | MySQL from the host |

### Logs and shutdown

```bash
docker compose ps
docker compose logs -f server
docker compose logs -f db
docker compose down
```

### Reset the local database

```bash
docker compose down -v
docker compose up --build -d
```

The volume removal deletes local data. Never run `-v` against anything you need to keep.

### Why SQL is baked into the image

`server/database/Dockerfile` copies `schema.sql` and `seed.sql` into `/docker-entrypoint-initdb.d/` at build time. This avoids Windows/FAT32 bind-mount issues where SQL files can appear empty inside the container. Do not reintroduce runtime SQL bind mounts without testing on the target filesystem.

## 11. Common setup failures

| Symptom | Likely cause | Fix |
|---|---|---|
| API exits at startup with an env error | Missing required value or placeholder in production mode | Fill `server/.env`; placeholders are rejected in production |
| `ECONNREFUSED` on API start | MySQL is not running or wrong host/port | Start MySQL; check `DB_HOST`/`DB_PORT` |
| TLS error connecting to TiDB | `DB_SSL=false` or wrong port | Use `DB_PORT=4000`, `DB_SSL=true` |
| `db:setup` permission error | User cannot create the database | Create it manually, grant rights, or use an admin user for setup only |
| Seed shows 0 rows | Schema applied to a different database name | Check `DB_NAME`; SQL contains no `USE` statement |
| Browser calls Render instead of local API | `client/.env` still has production `VITE_API_BASE_URL` | Set it empty and restart the dev server |
| CORS error in the browser | `CLIENT_URL` does not match the exact origin | Use the exact scheme/host/port, no trailing slash |
| `503` on upload | Cloudinary not configured | Add all three Cloudinary values and restart |
| `502` from AI | Missing/invalid Gemini key or provider outage | Set `GEMINI_API_KEY`; check provider quota |
| Contact saves but no email | Gmail not configured | Expected; configure Gmail API or rely on the inbox |
| Docker db starts empty | Old volume or old image | `docker compose build --no-cache db`, then `docker compose down -v` and up |
| `npm ci` lockfile error | `package.json` and lockfile diverged | Run `npm install`, verify, commit the lockfile |
| Port 5000/5173/80 in use | Another process is bound | Stop it or change the port consistently |

## 12. File and permission hygiene

- `.gitignore` must continue to exclude `.env`, `node_modules/`, `dist/`, logs, `.vercel/`, and local databases.
- Do not commit `client/dist` or `server/coverage`.
- Do not commit screenshots that contain tokens, admin data, or personal messages.
- Keep `server/.env.example` and `client/.env.example` updated when a new variable is added.
- Exercise least privilege: the runtime database user needs DML on the four tables, not DDL. Use a separate credential for schema changes if possible.

## 13. Setup completion checklist

- [ ] Node 22 and npm 10+ available.
- [ ] Repository cloned; no unexpected `.env` present.
- [ ] `server/.env`, `client/.env`, and (for Docker) root `.env` created from templates.
- [ ] Database reachable; schema and seed applied.
- [ ] `db:check` reports the expected tables and counts.
- [ ] API `/api/health` and `/api/health/ready` return success.
- [ ] Client loads on 5173 and calls the API through the proxy.
- [ ] Admin login and a disposable CRUD write succeed.
- [ ] `npm run check` (server) and `npm test` pass.
- [ ] `npm run lint` and `npm run build` (client) pass.
- [ ] No secret is staged by `git status`.
