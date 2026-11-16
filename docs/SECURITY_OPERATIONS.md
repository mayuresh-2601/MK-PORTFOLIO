# Security Operations

**Product:** Mayuresh Kasar Portfolio ("MAYURESH.DEV")
**Document owner:** Mayuresh Kasar
**Status:** Operational runbook
**Version:** 1.0
**Last updated:** 2026-11-16
**Related:** [AUTHENTICATION.md](./AUTHENTICATION.md) · [DATA_RETENTION.md](./DATA_RETENTION.md) · [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md) · [MONITORING.md](./MONITORING.md)

---

## 1. Security controls in the application

| Area | Control | Where |
|---|---|---|
| Admin session | Opaque HttpOnly cookie, SHA-256 hash in DB, revocable | `utils/sessionConfig.js`, `models/sessionModel.js` |
| CSRF | Exact Origin/Referer + per-session `X-CSRF-Token` | `utils/origin.js`, `middleware/authMiddleware.js` |
| MFA | Optional RFC 6238 TOTP | `utils/totp.js` |
| Passwords | bcrypt preferred, constant-time plain fallback | `utils/adminAuth.js` |
| Login abuse | 10 failed attempts/15 min/IP | `middleware/rateLimiters.js` |
| Contact abuse | Honeypot, minimum fill time, link/email flood checks | `utils/spamGuard.js` |
| Upload content | Magic-byte validation; optional fail-closed ClamAV | `utils/fileSignature.js`, `utils/malwareScan.js` |
| AI cost | Per-minute, per-IP daily, global daily, kill switch | `middleware/rateLimiters.js`, `routes/aiRoutes.js` |
| API headers | `default-src 'none'`, DENY framing, nosniff, HSTS | `server/server.js` |
| Browser headers | Narrow CSP, COOP/CORP, no MIME sniffing | `client/vercel.json`, `client/nginx.conf` |
| Telemetry | No host, OS, runtime, Docker or git-branch fingerprint | `controllers/systemController.js` |
| Containers | Non-root, read-only, dropped caps, internal DB network | `server/Dockerfile`, `client/Dockerfile`, `docker-compose.yml` |
| Supply chain | CodeQL, Dependabot, Gitleaks, Trivy, npm audit, ZAP | `.github/` |
| Logs | JSON security events without secrets | `utils/securityLog.js` |

## 2. Production environment checklist

Render → `mk-portfolio-api` → Environment:

- [ ] `ADMIN_EMAIL` is the real owner address.
- [ ] `ADMIN_PASSWORD_HASH` is set; `ADMIN_PASSWORD` is absent.
- [ ] `ADMIN_TOTP_SECRET` is set (run `npm run mfa:setup`).
- [ ] `JWT_SECRET` and `JWT_EXPIRES_IN` are removed.
- [ ] `CLIENT_URL=https://mk-portfolio-phi-silk.vercel.app` (exact, no slash).
- [ ] `ALLOW_VERCEL_PREVIEWS=false` unless preview logins are needed.
- [ ] `SESSION_TTL_MINUTES=120`, `SESSION_IDLE_MINUTES=30`,
      `SESSION_RETENTION_DAYS=7`.
- [ ] `SESSION_COOKIE_SECURE=true`.
- [ ] `SESSION_COOKIE_SAMESITE=lax` is recommended with the Vercel `/api`
      rewrite (or leave the production default `none`).
- [ ] `AI_ENABLED=true`; `AI_DAILY_LIMIT=50`; `AI_GLOBAL_DAILY_LIMIT=500`.
- [ ] `CLAMAV_HOST` is set if a scanner is reachable, otherwise unset.
- [ ] `DB_USER` is a least-privilege account, not `root`.
- [ ] Vercel no longer has `VITE_API_BASE_URL` (the client ignores it).

Never paste secret values into issues, commit messages, screenshots, or this
repository. Use the provider dashboard.

## 3. Session and credential operations

### 3.1 Sign out every device

Admin dashboard → **Log out all**. This sets `revoked_at` on every active row
for the admin email. The current browser also clears its cookie.

If the dashboard is unavailable, revoke directly:

```sql
UPDATE admin_sessions
SET revoked_at = UNIX_TIMESTAMP() * 1000
WHERE admin_email = ?
  AND revoked_at IS NULL;
```

### 3.2 Rotate the admin password

1. `cd server && npm run hash-password -- "new long unique password"`.
2. Update `ADMIN_PASSWORD_HASH` in Render; remove `ADMIN_PASSWORD`.
3. Redeploy/restart.
4. Sign in with the new password and MFA.
5. Log out all.

### 3.3 Rotate MFA

1. `cd server && npm run mfa:setup`.
2. Update `ADMIN_TOTP_SECRET` in Render.
3. Restart, add the new account, test, then log out all.

### 3.4 Recovery when the authenticator is lost

1. Run `npm run mfa:setup` on a trusted machine.
2. Add the new secret to the authenticator first.
3. Update `ADMIN_TOTP_SECRET` in Render and restart.
4. Sign in with password + new code.
5. Log out all.

If Render access is also lost, use the provider account recovery process and
then rotate every credential listed in [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md).

## 4. Database least privilege

The API needs DML only at runtime. Schema changes should use a separate
migration account. Example for MySQL 8 / TiDB:

```sql
-- Runtime API account
CREATE USER 'portfolio_api'@'%' IDENTIFIED BY '<strong-random-password>';
GRANT SELECT, INSERT, UPDATE, DELETE ON portfolio.* TO 'portfolio_api'@'%';

-- Migration account (used only for db:setup / db:migrate)
CREATE USER 'portfolio_migrator'@'%' IDENTIFIED BY '<different-random-password>';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, DROP
  ON portfolio.* TO 'portfolio_migrator'@'%';

FLUSH PRIVILEGES;
```

Notes:

- Docker Compose intentionally uses local MySQL `root`; that stack is for
  local verification only and binds the DB port to `127.0.0.1`.
- TiDB Cloud may restrict `CREATE USER`. If so, use the provider's SQL user
  management and grant the same table privileges.
- Do not grant `GRANT OPTION`, `FILE`, `PROCESS`, or server-wide privileges.
- Set `DB_USER=portfolio_api` on Render. Run migrations manually with the
  migration account, not from the public runtime.

**Live activation is owner-blocked:** the production DB user must be changed
in the TiDB/Render dashboard and the API restarted. Until then, treat the
current production DB user as over-privileged.

## 5. Backups and restore drills

### 5.1 Create and verify a logical backup

Run from `server/` with the target database environment loaded:

```bash
npm run db:backup -- backups/production-2026-11-16.json
npm run db:verify -- backups/production-2026-11-16.json
```

The backup is JSON with schema and rows. A `.sha256` sidecar is written next
to it. The exporter deliberately omits `admin_sessions`: those rows are
useless after a restore and contain hashed credentials.

**Never commit backups.** `server/backups/` and `backups/` are gitignored.

### 5.2 Rehearse a restore

Use a scratch database, never production first:

```bash
# Create an empty scratch database using an admin/migration account
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p \
  -e "CREATE DATABASE IF NOT EXISTS portfolio_restore_test"

# Point the restore at the scratch DB (do not change production env)
DB_NAME=portfolio_restore_test \
  npm run db:restore -- backups/production-2026-11-16.json --yes --replace

DB_NAME=portfolio_restore_test npm run db:check
```

PowerShell:

```powershell
$env:DB_NAME = "portfolio_restore_test"
npm run db:restore -- backups/production-2026-11-16.json --yes --replace
npm run db:check
Remove-Item Env:DB_NAME
```

The restore script:

- requires `--yes`;
- verifies the SHA-256 sidecar;
- refuses `NODE_ENV=production` without `--allow-production`;
- recreates tables with `--replace`, otherwise replaces rows table by table;
- never restores `admin_sessions`.

### 5.3 Local Docker drill

```bash
docker compose up -d db
# Wait for healthy, then use DB_HOST=127.0.0.1 DB_PORT=3307
# DB_USER=root DB_PASSWORD=<root .env value> DB_NAME=<root .env value>
```

Because `server/.env` may point at TiDB, always override `DB_HOST`, `DB_PORT`,
`DB_USER`, `DB_PASSWORD`, and `DB_NAME` for a local drill. Do not print the
password. After the drill, remove the overrides.

### 5.4 Retention

Keep at least 7 daily, 4 weekly and 3 monthly backups outside the repository.
Store them encrypted at rest and restrict access to the owner. Re-test one
restore per quarter.

Production TiDB also has provider backups; the application backup is a
portable second copy, not a replacement for provider PITR.

## 6. Malware scanning

### 6.1 Local ClamAV

```bash
docker compose --profile scanning up -d clamav
```

Then set `CLAMAV_HOST=clamav` in `server/.env` and restart the API. ClamAV's
first definition download can take several minutes.

### 6.2 Production

Render cannot start a sidecar from this Compose file. Options:

1. Run clamd on a private host reachable from Render and set
   `CLAMAV_HOST` + `CLAMAV_PORT`.
2. Leave `CLAMAV_HOST` unset and rely on magic-byte validation + Cloudinary's
   own processing. Uploads still reject mismatched content.

When configured, uploads **fail closed**: a scanner outage returns `503`
rather than accepting an unscanned file. Watch for
`upload.scanner.unavailable` and `upload.malware.rejected` events.

## 7. AI cost controls

| Control | Default | Effect |
|---|---|---|
| `AI_ENABLED` | `true` | `false` makes every AI route return `503` immediately |
| Per-minute limiter | 10/IP | Burst protection |
| `AI_DAILY_LIMIT` | 50/IP/day | Daily per-visitor budget |
| `AI_GLOBAL_DAILY_LIMIT` | 500/day | Whole-service budget |
| Input caps | 100 chars (skill name), 2,000 chars (question) | Bounds paid tokens |

Daily counters are in-memory and reset on restart. They are cost brakes, not
billing guarantees. Set a Google Cloud budget/quota on the Gemini key as the
outer limit. Rotate the key if usage is unexplained.

## 8. Security headers and CSP

API (`/api/*`): `Content-Security-Policy: default-src 'none'; base-uri 'none';
form-action 'none'; frame-ancestors 'none'`, plus `X-Frame-Options: DENY`,
`X-Content-Type-Options: nosniff`, `Referrer-Policy`, HSTS.

Browser (Vercel/Nginx): `default-src 'self'; script-src 'self'; style-src
'self' 'unsafe-inline'; img-src 'self' data: https://res.cloudinary.com;
connect-src 'self'; frame-ancestors 'none'; object-src 'none'`.

`connect-src 'self'` is only possible because the frontend uses the
same-origin `/api` rewrite. If an integration needs another origin, add that
exact origin, not `https:`.

Verify:

```bash
curl -sI https://mk-portfolio-api.onrender.com/api/health
curl -sI https://mk-portfolio-phi-silk.vercel.app/
curl -s https://mk-portfolio-phi-silk.vercel.app/api/health
```

## 9. Log events to watch

Search Render logs for:

| Event | Meaning |
|---|---|
| `auth.login.failed` | Bad credentials or MFA; reason field distinguishes |
| `auth.login.succeeded` | New session; monitor unexpected logins |
| `auth.session.rejected` | Expired/revoked/missing cookie/admin changed |
| `auth.csrf.rejected` | Missing/wrong CSRF header |
| `origin.rejected` | Cross-site state change blocked |
| `rate_limit.exceeded` | Limiter name identifies auth/contact/AI |
| `upload.signature.rejected` | Disguised file blocked |
| `upload.malware.rejected` | Scanner found malware |
| `upload.scanner.unavailable` | Fail-closed upload outage |
| `ai.disabled_request` | Kill switch blocked a paid call |

Set a Render log alert or an external log drain for `security` level if
available. Do not add request bodies, cookies, emails, tokens or keys to logs.

## 10. CI security workflows

| Workflow | Trigger | What it does |
|---|---|---|
| `docker-ci.yml` | push/PR/manual | npm audit, tests, Docker stack, auth/CSRF/revocation checks, deploy + smoke |
| `codeql.yml` | push/PR/weekly | JavaScript security-extended analysis |
| `gitleaks.yml` | push/PR/weekly | Full-history secret scan |
| `trivy.yml` | push/PR/weekly | Lockfile/IaC and container image CVEs |
| `zap-baseline.yml` | weekly/manual | Passive OWASP ZAP scan of production |
| Dependabot | weekly | Grouped npm, Actions and Docker update PRs |

A high/critical advisory with a fix fails the audit/Trivy job. Review, update,
and redeploy rather than disabling the check.

## 11. Quarterly checklist

- [ ] Restore a backup into a scratch database and run `db:check`.
- [ ] Confirm the Render DB user is least privilege.
- [ ] Review Dependabot and CodeQL alerts.
- [ ] Run the ZAP baseline and triage FAIL findings.
- [ ] Confirm MFA works and the recovery secret is stored safely.
- [ ] Rotate the Gemini key and Cloudinary keys if exposure is suspected.
- [ ] Verify no secret appears in `git log -p` or the working tree.
- [ ] Confirm HSTS, CSP and cookie attributes on production.
- [ ] Review Render/Vercel access lists and remove stale sessions.
- [ ] Re-read [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md) with the owner.
