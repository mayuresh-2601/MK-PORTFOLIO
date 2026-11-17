# Incident Response and Recovery

**Product:** Mayuresh Kasar Portfolio ("MAYURESH.DEV")
**Document owner:** Mayuresh Kasar
**Status:** Incident runbook
**Version:** 1.0
**Last updated:** 2026-11-16
**Related:** [SECURITY_OPERATIONS.md](./SECURITY_OPERATIONS.md) · [AUTHENTICATION.md](./AUTHENTICATION.md) · [DATA_RETENTION.md](./DATA_RETENTION.md) · [MONITORING.md](./MONITORING.md)

---

## 1. Severity

| Level | Examples | First response |
|---|---|---|
| SEV-1 | Admin account takeover, database credentials leaked, malware served, site defaced | Contain immediately; rotate everything; restore from a verified backup |
| SEV-2 | Session/CSRF bypass, secret committed to Git, unexplained AI spend, upload scanner down | Contain within hours; rotate affected credentials; deploy a fix |
| SEV-3 | Repeated failed logins, spam wave, single endpoint outage, ZAP/Trivy high finding | Triage within a day; apply rate limits/updates |
| SEV-4 | Warning-level scan finding, cosmetic header gap, stale dependency | Schedule in the next maintenance window |

When unsure, treat it as one level higher until evidence says otherwise.

## 2. First 15 minutes

1. **Write down the time, what was observed, and the affected URL/service.**
   Do not paste secrets or visitor data into the incident note.
2. **Preserve evidence:** export relevant Render/Vercel/GitHub logs and the
   current `admin_sessions` rows before deleting anything.
3. **Contain the admin path:**
   - sign in if possible and click **Log out all**;
   - if not, update `ADMIN_PASSWORD_HASH` and `ADMIN_TOTP_SECRET` in Render;
   - restart the API.
4. **Stop paid abuse:** set `AI_ENABLED=false` in Render.
5. **Stop upload abuse:** unset `CLAMAV_HOST` only if the scanner itself is the
   problem; otherwise leave it fail-closed. If malicious files are being
   served, disable uploads by removing Cloudinary credentials or making the
   upload route unavailable.
6. **Check the database:** confirm the DB user, grants, table counts and recent
   messages. Do not run destructive SQL until a fresh backup exists.

## 3. Containment playbooks

### 3.1 Suspected admin takeover

- Log out all sessions.
- Rotate `ADMIN_PASSWORD_HASH` and `ADMIN_TOTP_SECRET`.
- Remove `JWT_SECRET` if it is still present.
- Review Render audit/activity logs and `admin_sessions` for unexpected IPs and
  timestamps.
- Review content changes (projects, skills, certificates, messages) since the
  first suspicious login.
- Revert unauthorized content from a verified backup; do not restore sessions.

### 3.2 Leaked secret (GitHub, screenshot, log, chat)

Assume the secret is public the moment it left private storage.

| Secret | Rotation |
|---|---|
| `ADMIN_PASSWORD_HASH` / `ADMIN_PASSWORD` | Generate a new hash, update Render, log out all |
| `ADMIN_TOTP_SECRET` | `npm run mfa:setup`, update Render, re-enroll |
| `GEMINI_API_KEY` | Delete the key in Google AI Studio, create a new one, update Render, set a budget |
| `CLOUD_API_KEY` / `CLOUD_API_SECRET` | Rotate in Cloudinary, update Render, verify uploads |
| `GMAIL_CLIENT_SECRET` / `GMAIL_REFRESH_TOKEN` | Revoke the OAuth grant, run `npm run gmail:auth` again |
| `EMAIL_PASS` | Revoke the Gmail app password and create a new one |
| DB password | Change the DB user password, update Render, restart, verify readiness |
| `RENDER_DEPLOY_HOOK_URL` | Regenerate the hook in Render, update the GitHub secret |
| GitHub token | Revoke, reissue, update repository secrets |

After rotation, run the production smoke checks and confirm no old credential
still works. If the secret was committed, remove it from the working tree,
add it to `.gitignore` if needed, and treat Git history as compromised. A
history rewrite is optional but does not undo the leak; rotation is mandatory.

### 3.3 Contact-form spam wave

- Confirm `messageLimiter` and `spamGuard` are active.
- Add a temporary edge/WAF rule if the provider supports it.
- Do not raise the limit; identify the pattern (IP, link flood, honeypot) and
  delete spam rows in bulk by ID.
- If the wave is volumetric, disable the contact form temporarily rather than
  letting the table grow unchecked.
- Do not publish the blocked IPs or message contents.

### 3.4 AI spend spike

- Set `AI_ENABLED=false` immediately.
- Check Gemini usage/billing and the key in use.
- Review `rate_limit.exceeded` events (`ai_burst`, `ai_daily`,
  `ai_global_daily`).
- Rotate the Gemini key if it may have leaked.
- Lower `AI_DAILY_LIMIT` / `AI_GLOBAL_DAILY_LIMIT` before re-enabling.
- Add a Google Cloud budget and quota if not already present.

### 3.5 Malicious upload

- Confirm whether the file was served by Cloudinary; if so, delete the asset.
- Preserve the upload metadata and scanner event, not the file contents.
- Leave `CLAMAV_HOST` configured; fix the scanner and re-test.
- If the scanner was down and fail-open was observed, treat it as a code bug
  and deploy the fail-closed path before re-enabling uploads.
- Review the admin account that uploaded it.

### 3.6 Database corruption or accidental deletion

1. Stop writes (put the API in maintenance, or set an invalid DB credential).
2. Take a fresh logical backup if the DB is readable.
3. Rehearse the restore into a scratch database first.
4. Restore production only with `--allow-production` and an explicit
   `--replace`, then run `npm run db:check`.
5. Verify public pages, admin login, contact submission, and uploads.
6. Record what was lost between the backup and the incident.

## 4. Recovery validation

After any containment or restore, verify:

- [ ] `/api/health` is `200` and `/api/health/ready` is `200`.
- [ ] The site loads; projects, skills and certificates render.
- [ ] Admin login requires password + MFA (if configured).
- [ ] The session cookie is HttpOnly, Secure, and has no Domain attribute.
- [ ] A failed login sets no cookie.
- [ ] A state change without `X-CSRF-Token` returns `403`.
- [ ] A bad Origin returns `403`.
- [ ] Logout makes the old cookie return `401`.
- [ ] Contact form submits with a normal message and is rate-limited.
- [ ] Uploads are rejected for a fake image and the scanner is reachable.
- [ ] AI is either intentionally disabled or responding within limits.
- [ ] Public telemetry exposes no host/runtime/git details.
- [ ] Security headers and CSP match [SECURITY_OPERATIONS.md §8](./SECURITY_OPERATIONS.md#8-security-headers-and-csp).
- [ ] No new secrets appear in the working tree or `git log -p`.

## 5. Communication

- Do not publish incident details while credentials or visitor data may still
  be exposed.
- If visitor contact data was accessed, notify affected people plainly: what
  happened, what data, what was done, what they should do.
- Do not claim that no data was accessed unless the logs prove it.
- Avoid naming the vulnerability until a fix is deployed.
- Keep a timeline of decisions, not a copy of secrets or message contents.

## 6. Post-incident

Within 7 days:

1. Write a short timeline: detection, containment, recovery, verification.
2. Identify the root cause and the missing control.
3. Add a regression test or CI check for the failure.
4. Update this runbook and [SECURITY_OPERATIONS.md](./SECURITY_OPERATIONS.md).
5. Rotate any credential that was not already rotated.
6. Confirm backups are current and a restore has been tested.
7. Close the incident only when the fix is deployed and verified in production.

## 7. Useful commands

```bash
# Health and headers
curl -s https://mk-portfolio-api.onrender.com/api/health/ready
curl -sI https://mk-portfolio-api.onrender.com/api/health
curl -sI https://mk-portfolio-phi-silk.vercel.app/

# Verify the same-origin API proxy
curl -s https://mk-portfolio-phi-silk.vercel.app/api/health

# Backup before any destructive action
cd server
npm run db:backup -- backups/incident-$(date +%Y%m%d-%H%M%S).json
npm run db:verify -- backups/incident-<timestamp>.json
```

Never run `db:restore --allow-production` without a fresh verified backup and
an explicit target `DB_NAME`.
