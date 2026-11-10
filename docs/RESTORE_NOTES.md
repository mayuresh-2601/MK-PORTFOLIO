# Restore Notes — Missing Files Rebuilt

> **Historical document (reviewed 2026-11-09).** This records the original restore
> after the pendrive was lost. Current setup is documented in
> [README](../README.md), [DEPLOYMENT](../DEPLOYMENT.md), and
> [PENDRIVE-README](../PENDRIVE-README.md). The gaps listed in section 6 have
> since been resolved.

This project was restored from GitHub after the original pendrive was lost.
GitHub does not store gitignored files, so the local `.env` files and a few
public assets had to be recreated. Everything below is now present in the repo.

---

## 1. Files that were missing and are now restored

| File | Why it was missing | What to do |
|---|---|---|
| `server/.env` | Gitignored, never in GitHub | Fill in your real DB, JWT, admin, Cloudinary, email, and Gemini values |
| `client/.env` | Gitignored, never in GitHub | Not required by default; copy `client/.env.example` only if overriding the Vite proxy |
| `client/.env.example` | Never committed | Safe to keep in Git as documentation |
| `.env` (root) | Gitignored, never in GitHub | Local Docker Compose DB password/name |
| `.env.example` (root) | Never committed | Safe to keep in Git as documentation |
| `client/public/placeholder-project.png` | Never committed, but referenced by `Projects.jsx` | Replaced the broken image fallback |
| `client/public/robots.txt` | Never committed | SEO crawler rules |
| `client/public/sitemap.xml` | Never committed | SEO sitemap |
| `LICENSE` | Never committed, README claimed MIT | MIT license for Mayuresh Kasar |
| `.nvmrc` | Never committed | Pins Node.js 22 LTS |
| `server/scripts/generateAdminHash.js` | Never existed | Generates the bcrypt hash for admin login |

---

## 2. Secrets you must re-enter (they cannot be recovered)

The original `.env` values were on the lost pendrive. Nothing in GitHub can
recover them. Re-create them from the providers:

1. **Database** — TiDB Cloud / MySQL host, port, user, password, database name.
2. **JWT_SECRET** — generate a new one:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
3. **Admin password** — set `ADMIN_PASSWORD` to a plain-text password of at
   least 12 characters, or generate an optional bcrypt hash:
   ```bash
   cd server
   npm run hash-password -- "your-strong-password"
   ```
   Paste the printed `ADMIN_PASSWORD_HASH=...` line into `server/.env`. If both
   forms are set, the hash wins. Only `ADMIN_EMAIL` + this password can access
   `/admin`.
4. **Cloudinary** — cloud name, API key, API secret.
5. **Email** — Gmail address and app password.
6. **Gemini** — free API key from https://aistudio.google.com/app/apikey

---

## 3. Local run checklist

```bash
# Terminal 1 — backend
cd server
npm install
npm run dev

# Terminal 2 — frontend
cd client
npm install
npm run dev
```

Expected backend output:
```
✅ Database connected successfully.
🚀 Server running on http://localhost:5000
```

Then open http://localhost:5173.

---

## 4. Docker Compose checklist

```bash
# From the repo root
cp .env.example .env        # Windows: copy .env.example .env
docker compose up --build
```

Docker Compose now overrides the server's DB settings to point at the local
`db` container automatically (`DB_HOST=db`, `DB_PORT=3306`,
`DB_USER=root`, `DB_SSL=false`), using the root `.env` password/name.
You still need real values in `server/.env` for JWT, admin, Cloudinary, email,
and Gemini.

Open http://localhost.

---

## 5. Production (Render + Vercel) checklist

Render environment variables (backend):
```
PORT=5000
CLIENT_URL=https://portfolio-app-tau-lac.vercel.app
DB_HOST=...
DB_PORT=4000
DB_USER=...
DB_PASSWORD=...
DB_NAME=...
DB_SSL=true
JWT_SECRET=...
JWT_EXPIRES_IN=12h
ADMIN_EMAIL=...
ADMIN_PASSWORD=...            # 12+ chars, or use ADMIN_PASSWORD_HASH
ADMIN_PASSWORD_HASH=...       # optional bcrypt; wins if both are set
CLOUD_NAME=...
CLOUD_API_KEY=...
CLOUD_API_SECRET=...
EMAIL_USER=...
GMAIL_CLIENT_ID=...           # Gmail API over HTTPS (Render free)
GMAIL_CLIENT_SECRET=...
GMAIL_REFRESH_TOKEN=...
EMAIL_TRANSPORT=auto
EMAIL_PASS=...                # optional SMTP App Password (local/paid)
GEMINI_API_KEY=...
```

Vercel environment variable (frontend):
```
VITE_API_BASE_URL=https://your-render-service.onrender.com
```

**Important:** if your Vercel URL is not `portfolio-app-tau-lac.vercel.app`,
update it in:
- `client/index.html` (canonical + Open Graph)
- `client/public/robots.txt` (sitemap URL)
- `client/public/sitemap.xml` (all `<loc>` entries)
- Render's `CLIENT_URL`

---

## 6. Production-hardening update (2026-11-09)

The gaps listed in the original restore are now resolved:

- Contact `subject` is validated, stored in `messages.subject`, and included in email notifications.
- The admin dashboard has a protected contact inbox with delete support.
- Auth, contact, and AI routes are rate-limited.
- The release was validated with a 28-check API suite and a 50-check browser E2E run.
- Fresh schema, idempotent seed, and an idempotent migration live in `server/database/`.
- Certificate artwork is optional; Cloudinary is optional and uploads degrade to `503`.

Remaining product enhancement (non-blocking): the admin UI creates and deletes projects
and certificates but does not expose inline editing. The project update API is available
for a future UI.
