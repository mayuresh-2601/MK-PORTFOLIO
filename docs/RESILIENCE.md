# Resilience and Failure Modes

**Product:** Mayuresh Kasar Portfolio ("MAYURESH.DEV")
**Document owner:** Mayuresh Kasar
**Status:** Operational notes
**Version:** 1.0
**Last updated:** 2026-11-22
**Related:** [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md) · [MONITORING.md](./MONITORING.md) · [SCALE.md](./SCALE.md) · [DEPLOYMENT.md](./DEPLOYMENT.md) · [DATA_RETENTION.md](./DATA_RETENTION.md)

The site is designed so that optional integrations fail open and browsing
continues. The database is the one dependency that cannot fail open: without
it, content reads and writes cannot be served correctly.

## 1. Failure matrix

| Failure | Visitor impact | Data impact | Current behavior | Recovery |
|---|---|---|---|---|
| Render instance asleep | First request waits 30–60 s | None | Client 60 s timeout, loading state, one GET retry | Request wakes the service |
| Render restart / deploy | Brief 5xx or connection errors | Sessions survive (stored in DB) | In-memory rate limits and AI counters reset | Retry; no action |
| TiDB unreachable | Data pages and contact form fail | No new messages | Readiness returns 503; API returns 5xx without internals | Restore DB connectivity, check credentials/TLS/IP allowlist |
| TiDB slow | Slow pages, possible timeouts | Writes may time out | Pool capped at 10 by default | Inspect slow queries, indexes, connections |
| Cloudinary down | Uploads fail; text-only contact messages still save | Attachment not delivered | Upload returns 502; timeout returns 504 | Retry; upload is optional for text messages |
| Cloudinary stalls | Upload request ends after 30 s (`UPLOAD_TIMEOUT_MS`) | Late asset is deleted if it arrives | 504 response | Retry the upload |
| Gemini down or over quota | AI explainer shows an error | None | 502 after a 20 s timeout; rest of the site works | Retry later, check key/quota, or set `AI_ENABLED=false` |
| Gmail down or token expired | Contact message still saves; no notification email | Message body is kept; attachment is deleted after the failed send attempt | Email error is logged, response is still 201 | Re-authorize Gmail, check Render logs |
| Vercel down | Site unavailable | None | Static CDN outage | Wait for provider or roll back a bad deploy |
| Bad frontend deploy | Wrong UI or 404s | None | Previous deployment can be promoted | Vercel rollback |
| Bad API deploy | 5xx or startup failure | None if no migration | Render keeps the previous deploy available | Redeploy last known-good or roll back the commit |
| Bad migration | Wrong schema or data | Potentially destructive | No down migration | Restore backup, verify with `db:check`, reconcile |

## 2. Design choices that limit blast radius

- **Optional integrations fail open.** Cloudinary, Gemini and Gmail errors do
  not break browsing or public reads.
- **Persist before notify.** The contact message is written to the database
  before email is attempted. A mail failure does not lose the message body.
- **Opaque, revocable sessions.** A restart does not log the admin out, and a
  revoked row cannot be replayed.
- **No token in browser storage.** An XSS cannot read a bearer token from
  localStorage.
- **Single origin for the API.** `/api` is proxied by Vercel/Nginx/Vite, so the
  session cookie is first-party and SameSite=Lax is sufficient.
- **Bounded external calls.** Gemini has a 20 s timeout; Cloudinary uploads
  have a 30 s timeout; the client gives the API 60 s to cover a Render cold
  start.
- **Graceful shutdown.** `SIGINT`/`SIGTERM` stop accepting new work and close
  the database pool.
- **Health vs readiness.** `/api/health` proves the process is alive;
  `/api/health/ready` also checks the database.

## 3. Known gaps

| Gap | Consequence | Next step |
|---|---|---|
| No automated backup restore drill | Recovery time is unproven | Schedule a quarterly drill with a disposable database |
| No uptime monitor | Outages are discovered by visitors | Add a free external check for `/api/health` |
| No multi-instance session/rate-limit store | Limits are per instance; a second instance would not share them | Move limits to a shared store before scaling out |
| Attachment is deleted even if email fails | The visitor's file is lost, though the message body remains | Decide whether to retain failed attachments temporarily; document the choice |
| No queue for email | A slow Gmail call can lengthen the contact request | Accept at current volume or move email to a background job |
| No WAF/DDoS plan | A determined flood can exhaust the free instance | Use provider-level protection if it becomes a real attack |

## 4. Recovery order

1. Confirm the failure with `/api/health` and `/api/health/ready`.
2. Check Render logs for the first fatal line; do not paste secrets into chat
   or issues.
3. If the last deploy caused it, roll back before debugging in production.
4. If the database is involved, stop writes, verify the backup, and restore to
   a new database before pointing the API at it.
5. After recovery, verify public reads, login, CSRF, contact submission, and
   the discovery files.
6. Record what happened and update this document.

## 5. What is not claimed

- No failover region, multi-instance API, or automatic database failover.
- No tested recovery-time or recovery-point objective.
- No guarantee that a free-tier provider will not change its limits.
- No claim that the attachment/email path is lossless; it is not.
