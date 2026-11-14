# API Contract

**Product:** Mayuresh Kasar Portfolio ("MAYURESH.DEV")
**Document owner:** Mayuresh Kasar
**Status:** Source of truth for the HTTP API
**Version:** 1.0
**Last updated:** 2026-11-14
**Base URLs:**
- Production: `https://mk-portfolio-api.onrender.com`
- Local: `http://localhost:5000`
- Frontend calls: `${VITE_API_BASE_URL}/api` or same-origin `/api`

**Inputs:** [PRD.md](./PRD.md) · [ARCHITECTURE.md](./ARCHITECTURE.md) · [DATABASE.md](./DATABASE.md)

---

## 1. Conventions

| Item | Convention |
|---|---|
| Protocol | HTTPS in production |
| Format | JSON (`application/json`) except multipart uploads |
| Base path | `/api` for application endpoints; `/` and `/api/health*` are operational |
| Versioning | None; client and API are deployed together |
| Auth | `Authorization: Bearer <JWT>` on protected routes |
| Success envelope | `{ "success": true, ... }` |
| Error envelope | `{ "success": false, "statusCode": <number>, "message": "...", "timestamp": "..." }` |
| Dates | ISO 8601 strings in JSON |
| IDs | Positive integers |
| Casing | `snake_case` for database fields such as `created_at`; `camelCase` is not used in API payloads |
| Caching | `/api` responses send `Cache-Control: no-store` |
| Indexing | API responses send `X-Robots-Tag: noindex, nofollow` |
| Rate-limit headers | Standard `draft-8` headers; legacy headers disabled |
| CORS | Exact origin allowlist; credentials enabled |

### Response headers (API)

- `Content-Security-Policy` with `frame-ancestors 'none'`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security`
- `Referrer-Policy`
- `Permissions-Policy`
- `X-Robots-Tag: noindex, nofollow`
- `Cache-Control: no-store` on `/api`

## 2. Authentication

### Admin login

`POST /api/auth/login`

| Property | Value |
|---|---|
| Auth | Public |
| Rate limit | 10 failed attempts per 15 minutes per IP; successful requests are skipped |
| Body | JSON `{ "email": string, "password": string }` |

Request:

```json
{
  "email": "admin@example.com",
  "password": "<admin-password>"
}
```

Success `200`:

```json
{
  "success": true,
  "message": "Login successful.",
  "token": "<jwt>",
  "expiresIn": "12h",
  "user": {
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

Failure `401`:

```json
{
  "success": false,
  "message": "Invalid email or password."
}
```

Notes:

- The email is trimmed and lowercased; the password is not trimmed.
- Types and lengths are validated before credential comparison.
- Both email and password are always checked to reduce timing leakage.
- The token is HS256, issuer `portfolio-api`, audience `portfolio-admin`, with `sub`, `email`, and `role: "admin"` claims.
- Expiry comes from `JWT_EXPIRES_IN` (default `12h`).
- There is no logout, refresh, or `me` endpoint. Logout is client-side token removal.
- There is no signup or password reset.

### Protected request

```http
Authorization: Bearer <jwt>
```

Missing/invalid/expired token returns `401`:

```json
{
  "success": false,
  "message": "Authorization token is required."
}
```

or

```json
{
  "success": false,
  "message": "Invalid authentication token."
}
```

or

```json
{
  "success": false,
  "message": "Authentication token has expired."
}
```

A server misconfiguration (`JWT_SECRET` or `ADMIN_EMAIL` missing) returns `500` with a generic configuration error, never the missing value.

## 3. Rate limits

| Limiter | Scope | Window | Limit | Notes |
|---|---|---:|---:|---|
| `apiLimiter` | `/api/*` | 15 min | 300 | Skips `OPTIONS`, `/health`, `/health/ready`, `/system` |
| `authLimiter` | `POST /api/auth/login` | 15 min | 10 | Successful logins are skipped |
| `messageLimiter` | `POST /api/messages` | 15 min | 5 | Applies before upload parsing |
| `aiLimiter` | `/api/ai/*` | 1 min | 10 | Per IP |
| `systemLimiter` | `GET /api/system` | 1 min | 120 | Separate from the shared budget |

- Health endpoints are deliberately not rate-limited for Render/CI probes.
- The key is the resolved client IP, with IPv6 subnet key generation.
- Limits are in-memory and per API instance. A restart or a second instance resets/separates them.
- `429` response:

```json
{
  "success": false,
  "message": "Too many requests. Please try again in a few minutes."
}
```

Messages vary by limiter (login, messages, AI, telemetry).

## 4. Endpoint summary

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/` | Public | Service identity/status |
| GET | `/api/health` | Public | Liveness |
| GET | `/api/health/ready` | Public | Database readiness |
| POST | `/api/auth/login` | Public | Admin login |
| GET | `/api/projects` | Public | List projects |
| POST | `/api/projects` | Admin | Create project (multipart image) |
| PUT | `/api/projects/:id` | Admin | Update project (optional image) |
| DELETE | `/api/projects/:id` | Admin | Delete project |
| GET | `/api/skills` | Public | List skills |
| POST | `/api/skills` | Admin | Create skill |
| PUT | `/api/skills/:id` | Admin | Update skill |
| DELETE | `/api/skills/:id` | Admin | Delete skill |
| GET | `/api/certificates` | Public | List certificates |
| POST | `/api/certificates` | Admin | Create certificate (optional image) |
| PUT | `/api/certificates/:id` | Admin | Update certificate (optional image) |
| DELETE | `/api/certificates/:id` | Admin | Delete certificate |
| POST | `/api/messages` | Public | Submit contact message (optional file) |
| GET | `/api/messages` | Admin | List contact messages |
| DELETE | `/api/messages/:id` | Admin | Delete a message |
| POST | `/api/ai/explain-skill` | Public | Explain a skill |
| POST | `/api/ai/explain-certificate` | Public | Explain a certificate |
| POST | `/api/ai/ask-about-me` | Public | Answer a portfolio question |
| GET | `/api/system` | Public | Live telemetry snapshot |

### Pagination and filtering

None. List endpoints return every row ordered by `id DESC`, plus a `count`. This is intentional at current volume. The inbox is the first endpoint expected to need cursor pagination if messages grow.

## 5. Operational endpoints

### `GET /`

Returns service identity and environment. Not under `/api`, not rate-limited.

```json
{
  "success": true,
  "service": "Mayuresh Kasar Portfolio API",
  "message": "Portfolio API backend is running.",
  "environment": "production",
  "timestamp": "2026-11-14T07:30:00.000Z"
}
```

### `GET /api/health`

Liveness only; does not query the database.

```json
{
  "success": true,
  "status": "healthy",
  "uptime": 3600,
  "timestamp": "2026-11-14T07:30:00.000Z"
}
```

### `GET /api/health/ready`

Executes `SELECT 1`.

Success `200`:

```json
{
  "success": true,
  "status": "ready",
  "database": "connected",
  "timestamp": "2026-11-14T07:30:00.000Z"
}
```

Failure `503`:

```json
{
  "success": false,
  "status": "not-ready",
  "database": "unavailable",
  "timestamp": "2026-11-14T07:30:00.000Z"
}
```

## 6. Projects

### `GET /api/projects`

Public. Returns all projects, newest ID first.

```json
{
  "success": true,
  "count": 4,
  "data": [
    {
      "id": 4,
      "title": "Project title",
      "description": "Short description shown on the card.",
      "github": "https://github.com/example/repo",
      "demo": "https://example.com",
      "image": "https://res.cloudinary.com/.../image.webp",
      "created_at": "2026-11-09T10:00:00.000Z"
    }
  ]
}
```

`github` and `demo` may be `null`. The client hides unsafe/absent links and falls back to a placeholder image if the media fails.

### `POST /api/projects`

Admin. `multipart/form-data`.

| Field | Type | Required | Rules |
|---|---|---|---|
| `title` | text | Yes | Trimmed; ≤ 255 |
| `description` | text | Yes | Trimmed; ≤ 5,000 |
| `github` | text | No | Empty → `null`; must be absolute HTTP(S); ≤ 512 |
| `demo` | text | No | Same as GitHub |
| `image` | file | Yes | JPG/PNG/WEBP; ≤ 5 MB; one file |

Success `201`:

```json
{
  "success": true,
  "message": "Project created successfully.",
  "id": 5
}
```

Common failures: `400` validation, `401` auth, `413` oversized file, `502` Cloudinary failure, `503` Cloudinary unconfigured.

### `PUT /api/projects/:id`

Admin. `multipart/form-data`. Partial update:

- Omitted `title`/`description` keep existing values.
- Omitted `github`/`demo` keep existing values; explicit empty clears to `null`.
- Omitted image keeps the existing image; a new image replaces it.
- Invalid/too-long values return `400`.
- Unknown ID returns `404`.

Success `200`:

```json
{
  "success": true,
  "message": "Project updated successfully."
}
```

### `DELETE /api/projects/:id`

Admin. Success `200`:

```json
{
  "success": true,
  "message": "Project deleted successfully."
}
```

`400` for a non-positive/non-integer ID; `404` if missing. The Cloudinary asset is not automatically deleted.

## 7. Skills

### `GET /api/skills`

Public.

```json
{
  "success": true,
  "count": 16,
  "data": [
    {
      "id": 16,
      "name": "React.js",
      "level": 90,
      "created_at": "2026-11-09T10:00:00.000Z"
    }
  ]
}
```

### `POST /api/skills`

Admin. JSON.

```json
{
  "name": "Docker",
  "level": 78
}
```

Rules:

- `name`: required string, trimmed, ≤ 100.
- `level`: numeric 0–100; omitted/non-numeric defaults to `80` on create; out-of-range returns `400`; stored rounded.
- Success `201` with `id`.

### `PUT /api/skills/:id`

Admin. JSON. Omitted `name`/`level` keep existing values. A provided non-numeric level returns `400`; a numeric level outside 0–100 is clamped to the range and rounded. Success `200`.

### `DELETE /api/skills/:id`

Admin. Success `200`; `404` if missing.

## 8. Certificates

### `GET /api/certificates`

Public.

```json
{
  "success": true,
  "count": 16,
  "data": [
    {
      "id": 16,
      "title": "Certificate title",
      "issuer": "Issuer",
      "image": null,
      "link": "https://example.com/credential",
      "created_at": "2026-11-09T10:00:00.000Z"
    }
  ]
}
```

`image` and `link` may be `null`.

### `POST /api/certificates`

Admin. `multipart/form-data`.

| Field | Type | Required | Rules |
|---|---|---|---|
| `title` | text | Yes | ≤ 255 |
| `issuer` | text | No | ≤ 255; blank → `Unknown` |
| `link` | text | No | Absolute HTTP(S); ≤ 512 |
| `image` | file | No | JPG/PNG/WEBP; ≤ 5 MB |

Success `201` with `id`.

### `PUT /api/certificates/:id`

Admin. `multipart/form-data`. Partial update; a new image replaces the current one. Blank issuer becomes `Unknown`; explicit empty link clears it. Success `200`; unknown ID `404`.

### `DELETE /api/certificates/:id`

Admin. Success `200`; unknown ID `404`. Cloudinary assets are not deleted automatically.

## 9. Contact messages

### `POST /api/messages`

Public. `multipart/form-data` (the browser uses `FormData` only when a file is present).

| Field | Type | Required | Rules |
|---|---|---|---|
| `name` | text | Yes | Trimmed; ≤ 100 |
| `email` | text | Yes | Trimmed; valid format; ≤ 150 |
| `subject` | text | No | Trimmed; default `Portfolio Contact Form`; ≤ 200 |
| `message` | text | Yes | Trimmed; ≤ 5,000 |
| `file` | file | No | JPG/PNG/WEBP/PDF/DOC/DOCX; ≤ 10 MB; one file |

Order of operations:

1. `messageLimiter`.
2. Multer parses the multipart body and enforces file type/size.
3. `validateMessagePayload` runs **before** Cloudinary upload.
4. Valid payload + file → Cloudinary upload.
5. Insert into `messages`.
6. Attempt email notification; failure is logged and does not change the response.
7. Return `201`.

Success `201`:

```json
{
  "success": true,
  "message": "Message sent successfully.",
  "id": 42
}
```

Validation failures `400`:

```json
{
  "success": false,
  "message": "Please provide a valid email address."
}
```

Oversized upload `413`; unsupported type `400`; upload provider failure `502`; uploads unconfigured `503`.

### `GET /api/messages`

Admin. Returns all messages newest first.

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 42,
      "name": "Visitor",
      "email": "visitor@example.com",
      "subject": "Project enquiry",
      "message": "Hello...",
      "created_at": "2026-11-14T07:30:00.000Z"
    }
  ]
}
```

Without a token: `401`. There is no pagination.

### `DELETE /api/messages/:id`

Admin. Success `200`; `400` invalid ID; `404` missing. Deletion is permanent. Email copies are outside the application's control.

## 10. AI

All AI endpoints are public, rate-limited to 10 requests/minute per IP, and require `GEMINI_API_KEY` server-side. The provider timeout is 20 seconds. Provider failure returns `502` with a stable message.

### `POST /api/ai/explain-skill`

```json
{
  "name": "Docker",
  "level": 78
}
```

Success `200`:

```json
{
  "success": true,
  "explanation": "Docker packages an application..."
}
```

`name` required, trimmed, truncated to 100 characters server-side. `level` is optional; non-finite values are ignored.

### `POST /api/ai/explain-certificate`

```json
{
  "title": "Meta Front-End Developer",
  "issuer": "Meta"
}
```

Success `200` with `explanation`. `title` required, truncated to 150; `issuer` truncated to 150.

### `POST /api/ai/ask-about-me`

```json
{
  "question": "What DevOps skills does he have?"
}
```

Success `200`:

```json
{
  "success": true,
  "answer": "Mayuresh works with Linux, Docker..."
}
```

`question` required, ≤ 300 characters. The answer is constrained to the supplied portfolio context; off-topic questions are redirected to the Contact page.

Failure:

```json
{
  "success": false,
  "message": "AI assistant is temporarily unavailable."
}
```

The AI output is plain text; the client renders it as text, never HTML.

## 11. System telemetry

### `GET /api/system`

Public. Rate-limited 120/minute.

```json
{
  "success": true,
  "data": {
    "timestamp": "2026-11-14T07:30:00.000Z",
    "host": {
      "platform": "linux",
      "arch": "x64",
      "nodeVersion": "v22.x",
      "uptimeSeconds": 3600,
      "processUptimeSeconds": 3500
    },
    "cpu": {
      "cores": 2,
      "model": "unknown",
      "loadPercent": 12.5
    },
    "memory": {
      "totalMB": 512,
      "usedMB": 210,
      "freeMB": 302,
      "usedPercent": 41
    },
    "docker": {
      "runningInContainer": false,
      "version": null
    },
    "git": {
      "commit": "abc1234",
      "branch": "main"
    }
  }
}
```

Security notes:

- No `os.hostname()`.
- No environment variables, tokens, file paths, or database details.
- Git/Docker metadata is cached for five minutes; concurrent misses collapse into one refresh.
- Git/Docker may be unavailable; fields are `null` rather than causing a failure.

## 12. Validation and error conventions

### Status codes

| Code | Meaning | Typical cause |
|---|---|---|
| `200` | Success | Reads, updates, deletes, login, AI |
| `201` | Created | Project/skill/certificate/message creation |
| `400` | Bad request | Missing/invalid field, bad ID, unsupported file type, malformed JSON |
| `401` | Unauthorized | Missing/invalid/expired token, bad credentials |
| `404` | Not found | Unknown ID or route |
| `413` | Payload too large | JSON body or upload exceeds limit |
| `429` | Too many requests | Rate limit |
| `500` | Internal error | Unexpected server/database/config failure |
| `502` | Bad gateway | Cloudinary or Gemini failure |
| `503` | Service unavailable | Uploads unconfigured or database not ready |

### Error shape

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Skill name is required.",
  "timestamp": "2026-11-14T07:30:00.000Z"
}
```

- `stack` appears only outside production.
- Production 5xx messages are `Internal Server Error`.
- Malformed JSON: `400` with `Malformed JSON request body.`
- Oversized JSON: `413` with `Request body is too large.`
- Unknown API route: `404` with `Route not found.` The requested path is not echoed.
- Do not parse `message` for machine logic; use `statusCode`/HTTP status.

### Validation rules

- All IDs must be positive integers.
- All text fields are trimmed unless noted.
- `normalizeOptionalText` distinguishes missing (`null`), malformed (`undefined` → `400`), and too long (`undefined` → `400`).
- URLs must parse as absolute `http:`/`https:`. `javascript:`, `data:`, and relative URLs are rejected.
- Email uses a simple format check, not RFC 5322 completeness.
- SQL uses placeholders; no user input is concatenated into SQL.

## 13. File uploads

| Context | Field | Types | Max | Notes |
|---|---|---|---|---|
| Project image | `image` | JPG, PNG, WEBP | 5 MB | Required on create, optional on update |
| Certificate image | `image` | JPG, PNG, WEBP | 5 MB | Optional |
| Contact attachment | `file` | JPG, PNG, WEBP, PDF, DOC, DOCX | 10 MB | Optional; validated before upload |

- Multer uses memory storage; no file is written to Render's ephemeral disk.
- One file per request.
- Cloudinary folder: `portfolio/<year>/<month>`.
- Public ID: timestamp + sanitized original base name, max 80 characters.
- Cloudinary `allowed_formats` is enforced in addition to MIME checks.
- Uploads return `503` when Cloudinary is not configured and `502` when the provider fails.
- Uploaded files are not malware-scanned. Do not accept untrusted executables.
- Deleting a database row does not delete the Cloudinary asset.

## 14. CORS

- Allowed origins come from `CLIENT_URL` (comma-separated, exact, no trailing slash).
- In development, any `http://localhost` or `http://127.0.0.1` origin is allowed.
- Vercel preview origins are allowed only when `ALLOW_VERCEL_PREVIEWS` is true.
- Requests without an `Origin` header are allowed (server-to-server/curl).
- A disallowed origin receives no CORS headers rather than a misleading `500`.
- `credentials: true`, preflight cache `86400`, options success `204`.

Production must set `CLIENT_URL` to the exact Vercel origin. Never use `*` with credentials.

## 15. External APIs and integrations

| Integration | Direction | Protocol | Timeout | Retry |
|---|---|---|---|---|
| TiDB Cloud | API → DB | MySQL over TLS | 20 s connect | Pool queue; no automatic query retry |
| Cloudinary | API → Cloudinary | HTTPS SDK | SDK default | No automatic retry |
| Gemini | API → Google | HTTPS REST | 20 s | No automatic retry |
| Gmail API | API → Google | HTTPS REST | 15 s per request | No automatic retry |
| Gmail SMTP | API → Gmail | SMTP | 15 s connection/greeting, 30 s socket | No automatic retry |
| IndexNow | Operator → IndexNow | HTTPS | N/A | Manual |

Client retry: one automatic retry for idempotent `GET` requests with no response, after 2 seconds. Mutations are never retried automatically.

## 16. Webhooks

No inbound webhooks are implemented or required.

- No payment, GitHub, Cloudinary, Gmail, or AI webhook receiver exists.
- IndexNow is an outbound URL submission, not a webhook.
- If a webhook is added, it must verify the provider signature, enforce replay protection, limit payload size, and be documented here before implementation.

## 17. Required environment variables

### API

| Variable | Required | Purpose |
|---|---|---|
| `NODE_ENV` | Production | Enables production behavior |
| `PORT` | Host-provided | Listen port |
| `HOST` | No | Bind host (default `0.0.0.0`) |
| `CLIENT_URL` | Production | CORS origin allowlist |
| `ALLOW_VERCEL_PREVIEWS` | No | Allow preview origins |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Yes | Database connection |
| `DB_SSL`, `DB_CONNECTION_LIMIT` | No | TLS/pool tuning |
| `JWT_SECRET` | Yes | Token signing; ≥ 32 chars in production |
| `JWT_EXPIRES_IN` | No | Session duration (default `12h`) |
| `ADMIN_EMAIL` | Yes | Admin identity |
| `ADMIN_PASSWORD_HASH` | Recommended | bcrypt hash |
| `ADMIN_PASSWORD` | Local fallback | Plain secret; ≥ 12 chars; hash wins if both set |
| `CLOUD_NAME`, `CLOUD_API_KEY`, `CLOUD_API_SECRET` | No | Uploads |
| `EMAIL_USER`, `EMAIL_TRANSPORT` | No | Email |
| `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN` | No | Gmail API |
| `EMAIL_PASS` | No | Gmail SMTP app password |
| `GEMINI_API_KEY` | No | AI |

### Frontend (public)

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | API origin; empty = same-origin |
| `VITE_PROXY_TARGET` | Local dev/preview proxy |

Never put any server secret in a `VITE_*` variable.

## 18. Data privacy and failure handling

- Contact messages contain personal data. They are returned only to an authenticated admin.
- Request bodies are not logged by morgan; only method, path, status, size, timing, and resolved IP.
- Error responses never include SQL, credentials, stack traces in production, hostnames, or filesystem paths.
- Email failure does not fail a saved message.
- AI failure does not affect browsing, contact, or admin flows.
- Upload failure aborts the create/update/message request; it does not silently store a missing required image.
- Cloudinary unconfigured returns `503` for upload attempts; certificate creation without an image still works.
- Database unavailability prevents startup (for the API process); readiness returns `503` if the DB drops later.
- Rate-limit state is in-memory; a restart resets limits. Plan a shared store before horizontal scaling.

## 19. Contract change rules

1. Adding or changing an endpoint requires an update to this document and [TESTING.md](./TESTING.md).
2. Never break the existing response envelope without a versioning plan.
3. Every new mutation must use `protect`, validate input, and return explicit status codes.
4. Every new public abuse-prone endpoint needs a rate limiter.
5. Every new file upload needs type/size limits, pre-upload validation, and a documented failure mode.
6. Every new external integration needs a timeout, stable user-facing failure, and no secret in the browser.
7. Every new URL field must accept only absolute HTTP(S) and be re-checked in the client.
