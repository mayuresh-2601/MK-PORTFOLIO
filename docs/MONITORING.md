# Monitoring and Operations

**Product:** Mayuresh Kasar Portfolio ("MAYURESH.DEV")
**Document owner:** Mayuresh Kasar
**Status:** Current observability and recommended operations
**Version:** 1.0
**Last updated:** 2026-11-14
**Related:** [DEPLOYMENT.md](./DEPLOYMENT.md) · [DEBUGGING.md](./DEBUGGING.md) · [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) · [TESTING.md](./TESTING.md)

---

## 1. Current monitoring stack

| Layer | What exists | What does not exist |
|---|---|---|
| API liveness | Render health check on `/api/health` | External uptime monitor |
| API readiness | `/api/health/ready` runs `SELECT 1` | Synthetic multi-region checks |
| CI production smoke | Health, content, auth, CORS, routes, headers, SEO | Scheduled smoke runs (only on deploy) |
| Logs | Render runtime logs, CI logs, Vercel build logs | Centralized log search/retention policy |
| Telemetry | Public `/system` page (CPU, memory, uptime, runtime, git) | APM, tracing, error tracking |
| Database | TiDB console metrics (provider) | Application-level slow-query alerts |
| Frontend | Vercel deployment status | Real-user monitoring / Web Vitals |
| Alerts | None | Email/SMS/Slack alerting |
| Backups | Provider-dependent | Application backup job and restore drill |

**Honest status:** the system is observable when someone looks, but it is not proactively monitored. An outage may be discovered by a visitor before the owner.

## 2. Health endpoints

### Liveness — `GET /api/health`

```json
{
  "success": true,
  "status": "healthy",
  "uptime": 3600,
  "timestamp": "2026-11-14T07:30:00.000Z"
}
```

- Proves the Node process is alive and serving.
- Does not touch the database.
- Not rate-limited.
- Used by Render's health check.

### Readiness — `GET /api/health/ready`

```json
{
  "success": true,
  "status": "ready",
  "database": "connected",
  "timestamp": "2026-11-14T07:30:00.000Z"
}
```

- Runs `SELECT 1`.
- Returns `503` with `database: "unavailable"` when the DB fails.
- Not rate-limited.
- Use this for external monitors.

### Root — `GET /`

Returns service identity, environment, and timestamp. Not rate-limited. Useful for a quick manual check; not a substitute for readiness.

## 3. Logs

### Render API logs

Dashboard → `mk-portfolio-api` → Logs. The Render REST API can also read logs:

```text
GET /v1/logs?ownerId=<owner>&resource=<service>&direction=backward&limit=<n>
```

The `resource` parameter is required. Keep the API key out of shell history and documentation.

### Log content

Morgan records method, path, status, response size, timing, and resolved client IP. It does not log request bodies. Authentication logs record success/failure and the resolved IP, never the email, password, hash, or token.

### Lines to watch

Startup:

```text
✅ MySQL / TiDB database connected successfully.
🚀 API listening on 0.0.0.0:<port> (production)
🔐 Admin login: bcrypt hash.
```

Expected optional-integration warnings:

```text
Cloudinary is not configured - uploads return 503.
Email is not configured - contact messages are saved but no notification email is sent.
GEMINI_API_KEY is not configured - AI endpoints return 502.
```

Failure signals:

```text
❌ Database connection failed.
Cloudinary upload failed: <message>
[auth] Failed admin login attempt from <ip>.
Authentication Error: ...
```

A burst of failed logins is a signal to review rate limiting and consider an IP block. A repeated Cloudinary failure is a credential/provider issue. A database failure at startup should fail the deploy rather than serve traffic.

### Vercel

- Deployments → Build Logs for build failures.
- No runtime server logs because the app is static.
- Check the deployment commit matches `main`.

### CI

- GitHub Actions run logs.
- Docker logs are uploaded as an artifact when the stack job fails.
- Production smoke output is the canonical post-deploy health record.

## 4. Public telemetry (`/system`)

The page polls `GET /api/system` every 5 seconds while open. It displays:

- platform, architecture, Node version;
- host uptime and process uptime;
- CPU cores, model, load percentage;
- total/used/free memory and percentage;
- Docker detection and version;
- git commit and branch.

It intentionally excludes hostname, environment variables, paths, tokens, and database details. Git/Docker metadata is cached for five minutes and concurrent misses collapse into one refresh, so polling does not spawn a process per request.

**Limitations:**

- CPU load is Linux/macOS-oriented; Windows local values can be 0.
- It is a snapshot, not a time series.
- It is public; anyone can view it.
- It is not an alerting system.

## 5. What to monitor (recommended)

These are proposals, not current automation.

| Signal | Source | Suggested threshold | Action |
|---|---|---|---|
| API readiness | External monitor `/api/health/ready` every 1–5 min | 2 consecutive failures | Alert owner |
| Frontend home | External monitor every 5 min | 2 consecutive non-200 | Alert owner |
| API latency | Synthetic request | p95 > 2 s warm | Investigate DB/Render |
| Error rate | Render logs | > 1% 5xx over 15 min | Investigate |
| Auth failures | Render logs | > 20 failed logins/15 min | Review abuse |
| AI failures | Logs | > 20% 502 over 15 min | Check Gemini quota |
| Upload failures | Logs | Any sustained 502/503 | Check Cloudinary |
| Email failures | Logs | Any sustained failure after Gmail is enabled | Check OAuth |
| Database connections | TiDB console | Near pool/plan limit | Tune pool/plan |
| Certificate expiry | Vercel/DNS | < 30 days | Renew/verify |
| Backups | Provider | Missed schedule | Investigate immediately |
| Disk/storage | N/A (no persistent disk) | — | — |

### Suggested SLOs (not yet committed)

| Indicator | Target |
|---|---|
| Frontend availability | 99.5% monthly |
| API readiness availability | 99.0% monthly (free tier) |
| Warm API p95 latency | < 1 s |
| Contact persistence success | > 99% of valid submissions |
| Deploy success rate | > 95% |
| Restore drill | Quarterly |

Free-tier cold starts make strict latency SLOs misleading. Measure warm requests separately.

## 6. Alert channels (approval required)

The owner must choose a channel before alerting is implemented:

- email to the admin address;
- a phone/SMS provider;
- a chat webhook;
- a status page.

Do not add a monitoring service that receives production data without a privacy review. The monitor should only receive HTTP status, latency, and a health payload.

## 7. Routine operations

### Daily (or after each deploy)

- [ ] `/api/health` and `/api/health/ready` return `200`.
- [ ] Homepage and `/projects` load.
- [ ] No new fatal Render log lines.
- [ ] CI/deploy status is green.

### Weekly

- [ ] Review Render logs for repeated 5xx, auth failures, upload/AI/email errors.
- [ ] Check TiDB storage/connection metrics.
- [ ] Check Vercel deployment status and build failures.
- [ ] Confirm the admin inbox is reachable and messages are present.
- [ ] Check Cloudinary usage/quota if uploads are active.

### Monthly

- [ ] Run `npm audit --omit=dev` in both packages.
- [ ] Review dependency updates and security advisories.
- [ ] Verify a backup exists and is recent.
- [ ] Review admin credential age and rotation plan.
- [ ] Check Search Console/Bing for coverage errors.
- [ ] Review the public telemetry for unexpected platform changes.
- [ ] Re-run a live route audit if UI changed.

### Quarterly

- [ ] Complete a restore drill into a staging database.
- [ ] Review access to GitHub, Vercel, Render, TiDB, Cloudinary, and Google.
- [ ] Rotate credentials that are due.
- [ ] Review incident records and update this document.
- [ ] Re-check CSP, headers, CORS, and noindex.

## 8. Incident response

### Severity

| Severity | Definition | Response |
|---|---|---|
| SEV-1 | Site or API down for everyone; data loss; credential compromise | Immediate owner action; stabilize first |
| SEV-2 | Major feature broken (admin, contact, uploads); elevated errors | Fix within the day |
| SEV-3 | Minor feature/UX issue; workaround exists | Normal backlog |
| SEV-4 | Cosmetic or informational | Backlog |

### Sequence

1. **Detect and confirm** — reproduce with health endpoints and a browser.
2. **Scope** — frontend, API, database, or provider.
3. **Stabilize** — roll back the last deploy if it correlates; do not debug on a broken production path.
4. **Protect data** — stop writes and back up if corruption is possible.
5. **Fix** — smallest safe change; use CI when possible.
6. **Verify** — health, readiness, the affected journey, and logs.
7. **Communicate** — if users are affected, update the owner/status channel.
8. **Record** — timeline, cause, fix, follow-up.
9. **Learn** — add a test, monitor, or guardrail.

### Rollback first

If a deploy caused the incident, roll back before investigating. Vercel can promote a previous deployment; Render can redeploy a known-good commit. Database changes are forward-only, so restore from backup if the migration is the cause.

## 9. Capacity and cost

| Resource | Current | Watch |
|---|---|---|
| Render | Free, single instance | Cold starts, memory, restarts |
| TiDB | Serverless/plan limits | Connections, storage, rows |
| Cloudinary | Free/plan quota | Uploads, transformations, storage |
| Gemini | Free/quota | Requests, tokens, 429/502 |
| Vercel | Free/plan | Build minutes, bandwidth |
| GitHub Actions | Free minutes | Docker builds are the heaviest job |

There is no autoscaling, queue, or cache. If traffic grows, the first bottlenecks are likely Render cold starts/concurrency, then database connections, then media quota.

## 10. Data retention and privacy

- Contact messages contain personal data; the inbox is admin-only.
- There is no formal retention policy yet. Define one and delete expired messages.
- Email copies live in the owner's mailbox outside the app.
- Contact attachments may remain in Cloudinary after the message is deleted.
- Backups containing messages must be encrypted and access-controlled.
- Do not log message bodies or sender emails.

## 11. Monitoring gaps and approvals

| Gap | Risk | Approval needed |
|---|---|---|
| No external uptime monitor | Late outage detection | Choose provider/channel |
| No error tracking (Sentry or similar) | Harder debugging | Privacy/cost review |
| No APM/tracing | Limited latency diagnosis | Cost review |
| No scheduled smoke tests | Regressions between deploys | CI schedule |
| No backup verification | Unproven recovery | Backup policy |
| No Web Vitals/RUM | Unknown real-user performance | Privacy review |
| No alert for failed logins | Abuse may go unnoticed | Log-based alert |
| No Cloudinary quota alert | Upload outage risk | Provider alert |
| No Gemini quota alert | AI outage risk | Provider alert |

## 12. Operational checklist for a release

- [ ] CI green (7/7).
- [ ] Health and readiness verified.
- [ ] Public content and admin login verified.
- [ ] Headers/noindex verified.
- [ ] Logs show no new fatal errors.
- [ ] Error rate normal for 15 minutes after deploy.
- [ ] Rollback target identified.
- [ ] Release recorded.

## 13. Incident record template

```text
Incident ID:
Severity:
Start time:
Detection:
Affected surface:
Last deploy:
Symptoms:
Health/readiness:
Logs (redacted):
Root cause:
Mitigation:
Resolution:
Data impact:
Secret impact:
Follow-up actions:
Owner:
```

Store records privately if they contain infrastructure details or personal data.
