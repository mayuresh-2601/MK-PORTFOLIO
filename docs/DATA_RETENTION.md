# Data Retention and Privacy

**Product:** Mayuresh Kasar Portfolio ("MAYURESH.DEV")
**Document owner:** Mayuresh Kasar
**Status:** Retention policy
**Version:** 1.0
**Last updated:** 2026-11-16
**Related:** [SECURITY_OPERATIONS.md](./SECURITY_OPERATIONS.md) · [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md) · [DATABASE.md](./DATABASE.md)

---

## 1. What is stored

| Data | Location | Purpose | Contains personal data |
|---|---|---|---|
| Projects, skills, certificates | MySQL/TiDB | Public portfolio content | No (owner content) |
| Contact messages | MySQL/TiDB `messages` | Reply to enquiries | Yes: name, email, message |
| Admin sessions | MySQL/TiDB `admin_sessions` | Authenticate the single admin | Admin email, hashed token, CSRF value |
| Uploaded files | Cloudinary | Public certificate/project images | Possibly, if the owner uploads one |
| API logs | Render | Operate and secure the service | IP, method, path, status, timing |
| Security events | Render | Detect abuse and investigate incidents | IP, request id, event type |
| Build/deploy logs | GitHub, Vercel, Render | Release history | Commit metadata |
| Backups | Owner-controlled storage | Recovery | Everything except sessions |

The application has no analytics, advertising pixels, third-party trackers, or
visitor accounts. Public telemetry is limited to CPU load, memory percentage,
uptime, AI availability and a short deployed-commit hash.

## 2. Retention schedule

| Data | Retention | Mechanism |
|---|---|---|
| Contact messages | Until answered and no longer needed; review every 12 months | Manual deletion in the admin dashboard or SQL |
| Admin sessions (active) | ≤ 120 minutes absolute, 30 minutes idle | `expires_at` / `last_seen_at` checks |
| Admin sessions (expired/revoked rows) | 7 days (`SESSION_RETENTION_DAYS`) | Startup + 6-hour cleanup job |
| API access logs | Provider default (Render) | Render log retention |
| Security event logs | Provider default; export if investigating | Render log retention |
| CI logs | GitHub default (90 days for public repos) | GitHub settings |
| Vercel deploy logs | Provider default | Vercel settings |
| Application backups | 7 daily + 4 weekly + 3 monthly recommended | Owner rotation |
| Uploaded files | Until the related certificate/project is removed | Cloudinary/admin dashboard |
| Browser CSRF token | Memory only; gone on reload | No persistence |
| Browser admin hint | `sessionStorage`; gone on tab close/logout | Cosmetic only |
| Cookies | Session cookie; removed on logout/expiry | HttpOnly cookie |

## 3. Session cleanup

`cleanupSessions(cutoff)` deletes rows where:

- `expires_at < cutoff`, or
- `revoked_at IS NOT NULL AND revoked_at < cutoff`.

`cutoff = now - SESSION_RETENTION_DAYS`. It runs once at startup and every six
hours. The retention window preserves recent revocation evidence for incident
review without keeping credentials indefinitely.

The retention value is validated at startup (1–90 days). Changing it does not
retroactively restore deleted rows.

## 4. Contact message handling

- Messages are accepted only after validation, origin check, rate limit, and
  spam heuristics.
- A notification email is sent after the row is saved. A mail failure does not
  discard the message.
- Messages are visible only in the authenticated admin dashboard.
- Delete a message when the enquiry is resolved or after 12 months, whichever
  comes first, unless there is a documented reason to keep it.
- Do not export messages into the repository, screenshots, or public issues.
- If a visitor asks for deletion, delete the row and any related email
  notification; confirm without echoing the message contents.

Example (run as the owner, with a verified id):

```sql
DELETE FROM messages WHERE id = ?;
```

## 5. Logs and personal data

- Request logs contain IP addresses and paths. They do not contain request
  bodies, cookies, passwords, tokens, or email addresses.
- Security events are JSON lines and intentionally omit credentials.
- Cloudflare/Render/Vercel may retain their own edge logs under their policies.
- Do not add personal data to event names or detail fields.
- When exporting logs for an incident, keep them in private storage and delete
  them when the incident is closed.

## 6. Backups

- Backups contain contact messages and portfolio content, but **not** admin
  sessions or environment credentials.
- Keep backups encrypted at rest, access-controlled, and outside the Git
  repository.
- Recommended rotation: 7 daily, 4 weekly, 3 monthly.
- Delete expired backups securely. A deleted file may remain in provider
  snapshots until that provider's own retention expires.
- Rehearse a restore quarterly using
  [SECURITY_OPERATIONS.md §5](./SECURITY_OPERATIONS.md#5-backups-and-restore-drills).

## 7. Data subject requests

The only personal data the site collects directly is a contact message. For a
deletion or access request:

1. Verify the requester controls the email address in the message.
2. Locate rows by that email.
3. Provide or delete only that person's message data.
4. Do not disclose other visitors' messages or admin data.
5. Record the completion date without copying the message contents.

## 8. Retention change procedure

1. Change `SESSION_RETENTION_DAYS` in Render (1–90).
2. Restart the API.
3. Confirm the startup log shows the new session settings.
4. Update this document and the environment template.
5. Do not shorten retention during an open incident; preserve evidence first.

## 9. Owner-blocked items

- Production provider log retention must be confirmed in the Render, Vercel
  and GitHub dashboards.
- Production backup rotation must be stored in owner-controlled encrypted
  storage; this repository only provides the tooling.
- TiDB provider backup/PITR settings must be verified in the TiDB console.
- Contact-message review is a manual owner task.
