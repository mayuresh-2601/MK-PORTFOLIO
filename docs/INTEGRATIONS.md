# External Integrations

**Product:** Mayuresh Kasar Portfolio ("MAYURESH.DEV")
**Document owner:** Mayuresh Kasar
**Status:** Source of truth for third-party services
**Version:** 1.0
**Last updated:** 2026-11-14
**Related:** [ARCHITECTURE.md](./ARCHITECTURE.md) · [API.md](./API.md) · [DEPLOYMENT.md](./DEPLOYMENT.md) · [SECURITY_AUDIT.md](./SECURITY_AUDIT.md)

---

## 1. Integration map

| Integration | Direction | Required? | Current state | Failure behavior |
|---|---|---|---|---|
| TiDB Cloud | API → DB | Yes | Connected over TLS | API does not start; readiness `503` |
| Cloudinary | API → Cloudinary | Optional | Configured in production, uploads verified | `503` unconfigured, `502` provider failure |
| Google Gemini | API → Google | Optional | Configured | `502`; core site unaffected |
| Gmail API | API → Google | Optional | Not configured | Message saved; warning logged |
| Gmail SMTP | API → Gmail | Optional | Local fallback only | Message saved; warning logged |
| Vercel | Git → static host | Yes | Live | Frontend unavailable if Vercel is down |
| Render | CI → Node host | Yes | Live | API unavailable; UI shows errors |
| GitHub Actions | Git → CI/CD | Yes | Seven jobs green | No deploy after a failed run |
| IndexNow | Operator → search engines | Optional | Key file live; manual submit | SEO-only; no user impact |
| Google Search Console / Bing Webmaster | Manual | Optional | Not verified | No indexing insights |

No inbound webhooks exist. No payment, chat, analytics, or CRM integration exists.

## 2. TiDB Cloud

### Purpose

System of record for projects, skills, certificates, and contact messages.

### Configuration

| Variable | Production value shape |
|---|---|
| `DB_HOST` | TiDB Cloud host |
| `DB_PORT` | `4000` |
| `DB_USER` | Database user |
| `DB_PASSWORD` | Secret |
| `DB_NAME` | `portfolio` |
| `DB_SSL` | `true` |
| `DB_CONNECTION_LIMIT` | `10` default |

### Behavior

- `mysql2/promise` pool with TLS 1.2+ and certificate verification.
- `SELECT 1` at startup gates `app.listen()`.
- `/api/health/ready` reruns `SELECT 1`.
- 20-second connect timeout.
- No query retries.

### Failure modes

| Failure | Effect | Response |
|---|---|---|
| Wrong host/port/credentials | Process exits at startup | Render deploy fails; previous release remains |
| TLS misconfiguration | Connection error at startup | Fix `DB_SSL`/certificate, not `rejectUnauthorized` |
| Database outage after boot | Requests fail | Readiness `503`; Render restarts per health check |
| Connection limit reached | Requests queue | Slow responses; reduce concurrency or raise limit carefully |

### Security

- Credentials only in Render's environment.
- Runtime user should be DML-only; migrations use a separate credential where possible.
- Never log the connection string.
- Backups are provider-dependent; see [DATABASE.md](./DATABASE.md).

## 3. Cloudinary

### Purpose

Stores project images, certificate images, and optional contact attachments. Render has no persistent disk, so uploads cannot be stored locally.

### Configuration

```env
CLOUD_NAME=your-cloud-name
CLOUD_API_KEY=your-api-key
CLOUD_API_SECRET=your-api-secret
```

Production uses cloud `dyjerqrqy`. An earlier local `CLOUD_NAME=PORT` was incorrect and has been corrected in local configuration.

**Credential status:** the API key/secret appeared in earlier tool output and must be treated as exposed. Rotation is an outstanding owner action. Do not print the values in documentation, logs, or chat.

### Upload behavior

| Context | Formats | Limit | Required? |
|---|---|---|---|
| Project image | JPG, PNG, WEBP | 5 MB | Required on create, optional on update |
| Certificate image | JPG, PNG, WEBP | 5 MB | Optional |
| Contact attachment | JPG, PNG, WEBP, PDF, DOC, DOCX | 10 MB | Optional |

Implementation:

- Multer memory storage; one file per request.
- MIME allowlist checked before Cloudinary.
- Contact payload validated **before** upload to avoid orphan assets.
- Folder: `portfolio/<year>/<month>`.
- Public ID: `<timestamp>-<sanitized-base-name>`, max 80 characters.
- `allowed_formats` enforced by Cloudinary as a second layer.
- The secure URL is stored in the database.

### Failure modes

| Failure | Response |
|---|---|
| One or more credentials missing | `503` with a configuration message |
| Unsupported MIME | `400` |
| File too large | `413` |
| Cloudinary error/timeout | `502 File upload failed. Please try again.` |
| Image URL later deleted in Cloudinary | Broken image; client shows a placeholder |

### Known limitations

- Deleting a project/certificate/message does not delete the Cloudinary asset.
- No malware scanning.
- No automatic transforms beyond Cloudinary defaults.
- No quota alerting.
- Rotation is manual.

### Rotation procedure

1. In the Cloudinary console, create a new API key/secret.
2. Update `CLOUD_API_KEY` and `CLOUD_API_SECRET` in Render.
3. Redeploy/restart.
4. Upload a disposable test image through the admin dashboard.
5. Confirm the secure URL loads.
6. Delete the test asset and revoke the old key.
7. Record completion in [SECURITY_AUDIT.md](./SECURITY_AUDIT.md).

## 4. Google Gemini

### Purpose

Plain-language explanations for skills and certificates, plus portfolio Q&A on `/system`.

### Configuration

```env
GEMINI_API_KEY=your-gemini-key
```

The key is server-side only. It is sent in the `x-goog-api-key` header, not the query string.

### Model and endpoint

| Property | Value |
|---|---|
| Model | `gemini-3.5-flash-lite` |
| Endpoint | `https://generativelanguage.googleapis.com/v1beta/models/<model>:generateContent` |
| Timeout | 20 seconds |
| Max output | 300 tokens (400 for portfolio Q&A) |
| Rate limit | 10 requests/minute per IP |
| Client rendering | Plain text, never HTML |

### Prompting

- A fixed system prompt constrains tone, length, and claims.
- Skill input: name + optional level.
- Certificate input: title + issuer.
- Q&A input: question ≤ 300 characters plus curated owner context.
- Off-topic questions are redirected to the Contact page.
- The service joins all text-bearing response parts because Gemini 3.x may return thought-signature parts without text.

### Failure modes

| Failure | Response |
|---|---|
| Key missing | `502 AI assistant is temporarily unavailable.` |
| Invalid key/quota | `502`, logged without the key |
| Timeout | `502` after 20 seconds |
| Empty/malformed provider response | `502` |
| Rate limit exceeded | `429` |

AI is never on the critical path for browsing, contact, or admin.

### Cost controls

- Short prompts and bounded output.
- Per-IP rate limit.
- No conversation history sent to the API beyond the current prompt/context.
- No streaming.

## 5. Gmail notifications

### Purpose

Email the owner when a contact message is submitted. The message is always saved first; email is best-effort.

### Transport selection

`EMAIL_TRANSPORT` accepts `auto`, `smtp`, `gmail-api`, `gmail`, `none`.

| Value | Behavior |
|---|---|
| `auto` | Use Gmail API when the three OAuth values exist; otherwise SMTP when configured; otherwise disabled |
| `gmail-api` / `gmail` | Require Gmail OAuth values; startup validation fails if half-configured |
| `smtp` | Require SMTP credentials |
| `none` | Disable notifications |

Render free tier blocks outbound SMTP on ports 25, 465, and 587. Use the Gmail API over HTTPS in production.

### Gmail API configuration

```env
EMAIL_USER=your-address@gmail.com
GMAIL_CLIENT_ID=...apps.googleusercontent.com
GMAIL_CLIENT_SECRET=...
GMAIL_REFRESH_TOKEN=...
EMAIL_TRANSPORT=gmail-api
```

OAuth scopes:

- `openid`
- `email`
- `https://www.googleapis.com/auth/gmail.send`

The one-time flow is `npm run gmail:auth`; it writes `GMAIL_REFRESH_TOKEN` to `server/.env` without printing it. Use a Desktop OAuth client and publish the consent screen to production so refresh tokens do not expire after seven days.

### SMTP configuration (local)

```env
EMAIL_USER=your-address@gmail.com
EMAIL_PASS=your-app-password
EMAIL_TRANSPORT=smtp
```

Never set `EMAIL_PASS` on Render's free tier.

### Message flow

1. Validate the contact payload.
2. Upload an attachment to Cloudinary if present.
3. Insert the message.
4. Build a MIME message with sanitized headers and escaped HTML.
5. Send with a 15-second timeout.
6. Log success/failure; do not change the `201` response.

### Current status

Email is **not configured in production**. Messages are saved and visible in the admin inbox. Startup logs a warning. No placeholder credentials were added.

### Failure modes

| Failure | Effect |
|---|---|
| Missing OAuth values | Notification skipped; message saved |
| Invalid/expired refresh token | Send fails; logged; message saved |
| Gmail quota/timeout | Send fails; logged; message saved |
| Attachment too large | Rejected before send (`413`) |
| `EMAIL_PASS` set on Render | SMTP likely times out; use Gmail API |

### Security

- Header values are sanitized to prevent injection.
- HTML body is escaped.
- Attachments are buffers, never filesystem paths.
- Tokens are never logged.
- The mailbox is the owner's; no third party receives contact data.

### Completion checklist

- [ ] Create/confirm the Google Cloud project and Gmail API.
- [ ] Configure the OAuth consent screen and scopes.
- [ ] Create a Desktop OAuth client.
- [ ] Run `npm run gmail:auth` locally.
- [ ] Add the five variables to Render.
- [ ] Run `npm run email:check`.
- [ ] Send a test contact message and confirm delivery.
- [ ] Confirm the message is still saved if email fails.
- [ ] Record completion in [SECURITY_AUDIT.md](./SECURITY_AUDIT.md).

## 6. Vercel

### Purpose

Static hosting for the React build, with CDN delivery, SPA rewrites, and security headers.

### Configuration

| Setting | Value |
|---|---|
| Root directory | `client` |
| Framework | Vite |
| Build command | `npm run build` |
| Output | `dist` |
| Env | `VITE_API_BASE_URL=https://mk-portfolio-api.onrender.com` |

`client/vercel.json` supplies:

- SPA rewrite of unknown paths to `index.html`;
- security headers (CSP, HSTS, frame denial, nosniff, referrer, permissions);
- `/admin` and `/admin/*` `X-Robots-Tag: noindex, nofollow`;
- asset caching rules.

### Failure modes

| Failure | Effect |
|---|---|
| Build error | Previous deployment remains |
| Missing `VITE_API_BASE_URL` | Browser calls same-origin `/api` on Vercel and fails |
| Wrong API URL | CORS/404 errors |
| Header regression | Security or noindex checks fail in CI |

### Verification

- Live title/description/canonical.
- `/admin` response headers include noindex.
- CSP includes `frame-ancestors 'none'`.
- SPA deep links return the app shell.

## 7. Render

### Purpose

Runs the Express API on Node 22.

### Configuration

| Setting | Value |
|---|---|
| Service | `mk-portfolio-api` |
| Root directory | `server` |
| Build | `npm ci` |
| Start | `npm start` |
| Health check | `/api/health` |
| Plan | Free |
| Auto-deploy | `false` |

Environment variables are managed in the Render dashboard. `render.yaml` documents names with `sync: false` for secrets; it must never contain real values.

### Deployment behavior

- GitHub Actions triggers a deploy through the Render REST API only after CI passes.
- Render restarts the service on a failed health check.
- Free tier idles; first request can take 30–60 seconds.

### Failure modes

| Failure | Effect |
|---|---|
| Bad env var | Startup validation stops the process |
| Database unavailable | Process exits; deploy fails |
| Health check failure | Render restarts |
| Cold start | Slow first request; client timeout 60 s |
| Render outage | API unavailable; UI shows error states |

## 8. GitHub Actions

### Purpose

CI/CD control plane: hygiene, server checks, client checks, Dockerfile lint, full stack, Render deploy, production smoke tests.

### Configuration

| Item | Value |
|---|---|
| Workflow | `.github/workflows/docker-ci.yml` |
| Triggers | Push/PR to `main`, manual dispatch |
| Node | 22 |
| Secret | `RENDER_API_KEY` |
| Variables | `RENDER_SERVICE_ID`, `PRODUCTION_API_URL`, `PRODUCTION_SITE_URL` (optional, defaults in workflow) |

### Job sequence

1. Repository Hygiene
2. Server Syntax & Tests
3. Client Lint & Build
4. Lint Dockerfiles
5. Build & Test Full Stack
6. Deploy API to Render
7. Production Smoke Tests

Deploy and smoke jobs depend on the earlier jobs. A red build cannot trigger a production deploy.

### Failure modes

| Failure | Effect |
|---|---|
| Secret scan finds a tracked `.env` | Pipeline stops |
| Test/lint/build failure | No deploy |
| Docker stack failure | No deploy; logs uploaded |
| Render API failure | Deploy job fails |
| Smoke failure | Release is flagged; investigate immediately |

## 9. IndexNow

### Purpose

Notify participating search engines that public URLs changed.

### Current state

- Key file: `client/public/a4a20cec102278b8da74b3c53c282f30.txt`
- The file is deployed with the static build and should return `200`.
- Submission is an operational script, not part of the app runtime.
- Search engines may accept or ignore the submission; it is not a ranking guarantee.

### Procedure

1. Confirm the key file is live:
   ```bash
   curl -I https://mk-portfolio-phi-silk.vercel.app/a4a20cec102278b8da74b3c53c282f30.txt
   ```
2. Submit the canonical URLs with the IndexNow endpoint.
3. Treat `200`/`202` as accepted, not as indexing proof.
4. Verify indexing in Search Console/Bing Webmaster later.

## 10. Google Search Console and Bing Webmaster

These are **manual owner tasks**, not code integrations.

Required steps:

1. Verify ownership of the Vercel domain (DNS or HTML file).
2. Submit `https://mk-portfolio-phi-silk.vercel.app/sitemap.xml`.
3. Inspect the homepage and key routes.
4. Check mobile usability and Core Web Vitals.
5. Request indexing for changed pages.
6. Monitor coverage and queries.

Technical SEO is ready; verification and indexing require the owner's accounts. No ranking position is guaranteed.

## 11. Integration change policy

Adding or changing an integration requires:

1. An approved use case and owner.
2. A written data-flow and failure-mode review.
3. Secrets stored only in the server environment.
4. Timeouts, bounded input/output, and a stable user-facing error.
5. A rate limit if publicly triggerable.
6. A degraded-mode test proving the core site still works.
7. Updates to this document, [ARCHITECTURE.md](./ARCHITECTURE.md), [API.md](./API.md), and [SECURITY_AUDIT.md](./SECURITY_AUDIT.md).
8. A removal plan.

Do not add an integration "just in case". Every service is a dependency, a credential, and a future outage.

## 12. Integration status summary

| Integration | Code | Production configured | Verified | Owner action |
|---|---|---|---|---|
| TiDB Cloud | Yes | Yes | Yes | Backup plan |
| Cloudinary | Yes | Yes | Yes | Rotate credentials |
| Gemini | Yes | Yes | Yes | Monitor quota |
| Gmail API | Yes | No | No | Configure OAuth |
| SMTP | Yes | No (blocked on Render) | Local only | None for production |
| Vercel | Config | Yes | Yes | Search Console |
| Render | Config | Yes | Yes | Uptime alerting |
| GitHub Actions | Yes | Yes | 7/7 jobs | None |
| IndexNow | Script | Key file live | Submission manual | Submit after changes |
