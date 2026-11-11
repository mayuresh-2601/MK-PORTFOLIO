# Deploying the Portfolio: Vercel + Render + TiDB Cloud

This guide takes a fresh machine to the live architecture:

```
Visitor → Vercel (React SPA) → Render (Express API) → TiDB Cloud (MySQL)
```

The repository is already configured for this split. You need accounts on
[Vercel](https://vercel.com), [Render](https://render.com), and
[TiDB Cloud](https://tidbcloud.com), plus optional Cloudinary, Gmail, and
Gemini credentials.

---

## 1. Create the TiDB Cloud database

1. Create a **TiDB Cloud Starter** (or Dedicated) cluster.
2. Open **Connect** and copy:
   - Host
   - Port (`4000` for the public endpoint)
   - User (usually includes a prefix, e.g. `3ABCDEF.root`)
   - Password
   - Database name (create one named `portfolio` if the console asks)
3. Keep TLS enabled. The API uses `DB_SSL=true` and validates the server
   certificate.
4. If your cluster has an IP allowlist, allow Render egress. The simplest
   starter setup is `0.0.0.0/0`; restrict it later if you move to a paid
   plan with static egress IPs.

> TiDB Cloud Serverless may not grant `CREATE DATABASE`. Create the database
> in the TiDB console first, then run the migration against it.

## 2. Configure and seed locally

From `server/`:

```bash
npm install
cp .env.example .env
```

Fill in `DB_HOST`, `DB_PORT=4000`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`,
`DB_SSL=true`, `JWT_SECRET`, `ADMIN_EMAIL`, and **one** of
`ADMIN_PASSWORD` (plain text, 12+ characters) or `ADMIN_PASSWORD_HASH`
(bcrypt). Only that exact email/password pair can access `/admin`.

Generate a JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

The plain-text option is the simplest:

```env
ADMIN_EMAIL=your-real-admin@gmail.com
ADMIN_PASSWORD='your-long-unique-password'
```

If you prefer a bcrypt hash (optional; it wins when both are set):

```bash
npm run hash-password -- "your-strong-password"
```

> **Docker Compose and bcrypt:** in `server/.env`, wrap the hash in single
> quotes (`ADMIN_PASSWORD_HASH='$2b$12$...'`). Compose interpolates `$` in
> unquoted env-file values, which would corrupt the hash. Dotenv strips the
> quotes for `npm run dev`. In Render's dashboard, paste the raw hash
> **without** quotes. The same quoting advice applies to a plain
> `ADMIN_PASSWORD` containing `$`, `#`, or spaces.

Then create and verify the schema:

```bash
npm run db:setup     # fresh database: creates tables
npm run db:seed      # imports the 4 projects, 16 skills, 16 certificates
npm run db:check     # verifies tables, columns, charset, row counts
npm run check        # syntax-checks every server file
```

For an **existing** database created by an older version of this project:

```bash
npm run db:migrate   # adds messages.subject, nullable certificate images,
                     # utf8mb4, and removes the unused users table
npm run db:seed
npm run db:check
```

`db:seed` is idempotent: it refreshes the baseline rows by primary key and
never deletes content added later through the admin dashboard.

## 3. Configure Gmail delivery

The contact form saves every message to TiDB first. Email notification is
best-effort, so a mail failure never loses a submission.

> **Step-by-step walkthrough:** [`docs/EMAIL_SETUP.md`](docs/EMAIL_SETUP.md)
> covers the Google Cloud screens, the one-time token script, Render variables,
> production verification, and troubleshooting.

### Which transport?

| Hosting | Transport | Why |
|---|---|---|
| Local development | Gmail SMTP App Password **or** Gmail API | Both work locally |
| Render **free** | **Gmail API over HTTPS** | Render free blocks outbound SMTP ports 25/465/587 |
| Render paid | Gmail SMTP App Password **or** Gmail API | Both work |

### Gmail API (recommended for Render free)

1. Open [Google Cloud Console](https://console.cloud.google.com/) and create
   or select a project.
2. **APIs & Services → Library → Gmail API → Enable.**
3. **OAuth consent screen:**
   - User type: **External**
   - Add your Gmail address as a **test user**
   - Scopes: `openid`, `email`,
     `https://www.googleapis.com/auth/gmail.send`
   - For a refresh token that does not expire after 7 days, set the
     publishing status to **In production**. Google will show an
     "unverified app" warning; that is expected for personal use.
4. **Credentials → Create credentials → OAuth client ID → Desktop app.**
5. Put the client ID and secret in `server/.env`:

   ```env
   EMAIL_USER=your-real-email@gmail.com
   GMAIL_CLIENT_ID=...apps.googleusercontent.com
   GMAIL_CLIENT_SECRET=GOCSPX-...
   EMAIL_TRANSPORT=auto
   ```

6. Authorize once from `server/`:

   ```bash
   npm run gmail:auth
   ```

   The script opens a local callback page, exchanges the code, and writes
   `GMAIL_REFRESH_TOKEN`, `EMAIL_USER`, and `EMAIL_TRANSPORT=gmail-api` to
   `server/.env`. The token is never printed to the terminal. Restart the
   API after the script finishes so it reads the new values.

7. Verify without sending, then send a test:

   ```bash
   npm run email:check
   npm run email:test
   ```

### Gmail SMTP with an App Password

Use this for local development or a paid Render instance:

1. Enable 2-Step Verification on the Google account.
2. Create an App Password at <https://myaccount.google.com/apppasswords>.
3. Set:

   ```env
   EMAIL_USER=your-real-email@gmail.com
   EMAIL_PASS=your-16-character-app-password
   EMAIL_TRANSPORT=smtp
   ```

4. Run `npm run email:check` and `npm run email:test`.

> **Render free tier:** outbound traffic to SMTP ports 25, 465, and 587 is
> blocked. An App Password will time out there — use the Gmail API path or
> upgrade the Render instance.

## 4. Deploy the API to Render

### Option A — Blueprint (recommended)

1. Push this repository to GitHub.
2. In Render: **New → Blueprint**, select the repo.
3. Render reads [`render.yaml`](render.yaml) and creates `portfolio-api`.
4. Enter every `sync: false` value in the dashboard:

| Variable | Value |
|---|---|
| `DB_HOST` | TiDB host |
| `DB_USER` | TiDB user |
| `DB_PASSWORD` | TiDB password |
| `DB_NAME` | `portfolio` |
| `JWT_SECRET` | 32+ random characters |
| `ADMIN_EMAIL` | your real admin Gmail address |
| `ADMIN_PASSWORD` | plain-text password, 12+ chars (or leave blank if using a hash) |
| `ADMIN_PASSWORD_HASH` | optional bcrypt hash; wins if both are set |
| `CLIENT_URL` | Vercel URL (fill after step 5, then redeploy) |
| `CLOUD_NAME` / `CLOUD_API_KEY` / `CLOUD_API_SECRET` | optional Cloudinary |
| `EMAIL_USER` | Gmail sender address |
| `GMAIL_CLIENT_ID` / `GMAIL_CLIENT_SECRET` / `GMAIL_REFRESH_TOKEN` | Gmail API (recommended on free tier) |
| `EMAIL_TRANSPORT` | `auto`, `gmail-api`, or `smtp` |
| `EMAIL_PASS` | optional Gmail App Password (local/paid SMTP only) |
| `GEMINI_API_KEY` | optional Gemini key |

### Option B — Manual Web Service

- Root directory: `server`
- Build command: `npm ci`
- Start command: `npm start`
- Health check path: `/api/health`
- Add the same environment variables.

### Verify the API

```bash
curl https://YOUR-API.onrender.com/api/health
curl https://YOUR-API.onrender.com/api/health/ready
curl https://YOUR-API.onrender.com/api/projects
```

- `/api/health` returns `200` as soon as the process is up.
- `/api/health/ready` returns `200` only when TiDB responds.
- `/api/projects` should return the seeded content.

The first request after idle can take 30–60 seconds on Render's free plan.
The client waits 60 seconds and retries a failed GET once.

### Automatic API deployment (GitHub Actions)

Render's GitHub App is not installed on this repository, so `render.yaml`
keeps `autoDeploy: false`. Instead, the workflow in
[`.github/workflows/docker-ci.yml`](.github/workflows/docker-ci.yml) deploys
the API through Render's REST API after every green push to `main`:

1. Add the Render API key as a repository secret:
   **Settings → Secrets and variables → Actions → New repository secret**
   named `RENDER_API_KEY`.
2. Optional repository variables (defaults already point at the live site):

   | Variable | Default |
   |---|---|
   | `RENDER_SERVICE_ID` | `srv-dbpcjf6gekts73aoovng` |
   | `PRODUCTION_API_URL` | `https://mk-portfolio-api.onrender.com` |
   | `PRODUCTION_SITE_URL` | `https://mk-portfolio-phi-silk.vercel.app` |

The pipeline runs, in order:

- repository hygiene (no tracked `.env`, `node_modules`, `dist`, or logs)
- server syntax check and unit tests on Node.js 22
- client ESLint and production build
- Dockerfile lint
- full Docker Compose stack with a real MySQL instance, including a check
  that `schema.sql` / `seed.sql` work under an arbitrary `DB_NAME`
- admin login, protected routes, API validation, frontend headers, and proxy
- Render deploy, waiting until the deploy reports `live`
- production smoke tests against Render and Vercel

The Vercel frontend deploys automatically from the same push through its
native Git integration; the smoke-test job waits for that build to appear.

## 5. Deploy the frontend to Vercel

1. Import the repository in Vercel.
2. Set **Root Directory** to `client`.
3. Framework preset: **Vite**.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Add an environment variable for **Production** (and Preview if desired):

```
VITE_API_BASE_URL=https://YOUR-API.onrender.com
```

No trailing slash. This value is baked into the static build, so redeploy
after changing it.

7. Deploy, then copy the production URL (for example
   `https://your-project.vercel.app`).

## 6. Connect the two origins

Back in Render, set:

```
CLIENT_URL=https://your-project.vercel.app
```

Redeploy the API. CORS now allows only that origin (plus localhost in
development). If you want every `*.vercel.app` preview deployment to work,
set `ALLOW_VERCEL_PREVIEWS=true`; exact production origins are safer.

## 7. Production smoke test

- [ ] `/` loads and the hero/stat counters render
- [ ] `/projects`, `/skills`, `/certificates` show TiDB content
- [ ] `/system` shows live CPU/memory/uptime from Render
- [ ] `/contact` submits and returns a success message
- [ ] The message appears in `TiDB → messages` **and** in the admin inbox
- [ ] `/admin` login works with `ADMIN_EMAIL` + your password
- [ ] Admin can add/delete a skill and see it on `/skills`
- [ ] Admin can add a certificate **without** an image
- [ ] Admin can delete a contact message
- [ ] AI explain returns an answer when `GEMINI_API_KEY` is set; otherwise
      a graceful "temporarily unavailable" message
- [ ] Uploads return a clear `503` only if Cloudinary is intentionally absent
- [ ] Browser console has no CORS or mixed-content errors

## 8. Environment reference

| Variable | Required | Notes |
|---|---|---|
| `DB_HOST`, `DB_USER`, `DB_NAME` | yes | TiDB connection |
| `DB_PASSWORD` | yes (may be empty) | Must be defined |
| `DB_PORT` | no | Default `4000` |
| `DB_SSL` | no | Defaults to true in production |
| `DB_CONNECTION_LIMIT` | no | Default 10, capped at 20 |
| `JWT_SECRET` | yes | 32+ characters in production |
| `ADMIN_EMAIL` | yes | The only admin identity |
| `ADMIN_PASSWORD` or `ADMIN_PASSWORD_HASH` | one of them | Plain text (12+ chars) or bcrypt; hash wins if both |
| `ADMIN_PASSWORD_HASH` | no | Optional bcrypt alternative |
| `CLIENT_URL` | yes in production | Comma-separated exact origins |
| `ALLOW_VERCEL_PREVIEWS` | no | `true` to allow `*.vercel.app` |
| `CLOUD_*` | no | Uploads return `503` when absent |
| `EMAIL_USER` | no | Sender Gmail address |
| `GMAIL_*` | no | Gmail API over HTTPS (free-tier friendly) |
| `EMAIL_PASS` | no | Gmail SMTP App Password (local/paid only) |
| `EMAIL_TRANSPORT` | no | `auto` (default), `gmail-api`, or `smtp` |
| `GEMINI_API_KEY` | no | AI returns `502` when absent |

## 9. Common problems

| Symptom | Fix |
|---|---|
| Render deploy exits immediately | Check logs for `Missing environment variables` — `DB_PASSWORD` must be defined even if empty. Startup also rejects placeholder `DB_HOST`, a weak/placeholder `ADMIN_PASSWORD`, and a short `JWT_SECRET` |
| `/api/health/ready` returns 503 | Wrong TiDB host/user/password, database doesn't exist, TLS disabled, or IP allowlist blocks Render |
| Browser CORS error | `CLIENT_URL` must exactly match the Vercel origin, no trailing slash; redeploy Render after changing it |
| Login always fails | Make sure `ADMIN_EMAIL` matches exactly and `ADMIN_PASSWORD` is the same 12+ character value (or regenerate `ADMIN_PASSWORD_HASH` with `npm run hash-password -- "..."`). If both are set, the hash wins |
| Email times out on Render free | SMTP ports 25/465/587 are blocked. Configure `GMAIL_*` and `EMAIL_TRANSPORT=gmail-api`, then run `npm run email:check` locally |
| Email auth fails | Gmail API: re-run `npm run gmail:auth` after revoking old access. SMTP: use a 16-character App Password, not the normal Gmail password |
| Images fail to upload | Cloudinary credentials missing/invalid — the API intentionally keeps running and returns `503`/`502` for uploads only |
| AI modal says unavailable | `GEMINI_API_KEY` missing or invalid; the rest of the site is unaffected |
| Frontend calls the wrong API | `VITE_API_BASE_URL` is baked at build time — change it in Vercel and redeploy |
| Database tables missing | Run `npm run db:setup` (fresh) or `npm run db:migrate` (existing), then `npm run db:seed` |

## 10. Rollback

- **Vercel:** Project → Deployments → select the previous build → Promote.
- **Render:** Service → Events → select a previous deploy → Rollback.
- **Database:** `db:seed` restores the baseline content; schema changes are
  additive and forward-only. Take a TiDB backup before a migration if you
  have data you cannot recreate.
