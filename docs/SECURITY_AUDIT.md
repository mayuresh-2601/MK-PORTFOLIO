# Security Audit

**Product:** Mayuresh Kasar Portfolio ("MAYURESH.DEV")
**Document owner:** Mayuresh Kasar
**Audit date:** 2026-11-14
**Repository baseline:** `af48648` (plus uncommitted documentation)
**Live services:** Vercel frontend, Render API, TiDB Cloud
**Status:** Current findings and remediation tracking
**Related:** [AUTHENTICATION.md](./AUTHENTICATION.md) · [API.md](./API.md) · [DEPLOYMENT.md](./DEPLOYMENT.md) · [FINAL_PRODUCTION_AUDIT.md](./FINAL_PRODUCTION_AUDIT.md)

---

## 1. Scope and method

Reviewed:

- Express middleware order, headers, CORS, rate limiting, error handling;
- admin authentication, cookie-session verification, credential storage;
- every route/controller/model for validation, authorization, and SQL construction;
- upload handling and Cloudinary integration;
- contact persistence and email behavior;
- client token handling, API client, safe URL rendering, CSP;
- Vercel/Nginx headers and SPA rewrites;
- CI workflow, Docker images, environment templates;
- tracked files, git history, local build output, and live JS/CSS assets for secrets;
- production headers and behavior;
- dependency audit for production dependencies.

Method:

- source review;
- targeted `grep` for dangerous patterns (`eval`, `innerHTML`, string-built SQL, secrets);
- production header checks with `curl`;
- live route audit with Playwright;
- secret pattern scans;
- `npm audit --audit-level=high` in both packages;
- Render log review;
- CI smoke-test evidence.

This is a focused application audit, not a formal penetration test or compliance certification.

## 2. Executive summary

The application implements a solid baseline for a single-admin portfolio:

- no known production dependency vulnerabilities;
- secrets are environment-only and not present in tracked files, history, build output, or live assets (apart from one credential that must be rotated);
- every mutation and private read is authorized server-side;
- SQL is parameterized and public reads use explicit columns;
- uploads are type- and size-limited with pre-upload validation;
- security headers and noindex directives are in place;
- errors do not leak internals in production;
- the CI pipeline gates production deploys and runs live smoke tests.

**Remediated on 2026-11-16:**

1. The admin JWT/localStorage model was replaced with opaque, revocable
   HttpOnly cookie sessions (S-02, S-04).
2. Optional TOTP MFA was added (S-03).
3. CSP was narrowed to `connect-src 'self'` and Cloudinary images (S-08).
4. Public telemetry no longer exposes platform, runtime, Docker or git branch
   (S-10).
5. Magic-byte validation and optional fail-closed ClamAV scanning were added
   (S-12).
6. COOP/CORP and related headers were added (S-16).
7. CodeQL, Dependabot, Gitleaks, Trivy, npm audit and ZAP workflows were added
   to the CI surface.

**Open risk is now concentrated in operations, not application logic:**

1. Cloudinary credentials were exposed during development and must be rotated.
2. A production restore drill and off-site backup rotation are still owner
   tasks; the application tooling exists.
3. There is no external uptime alerting.

**Verdict:** acceptable for a personal portfolio with the documented warnings,
**provided the Cloudinary credential is rotated** and the operational items are
completed. Production readiness detail is in
[FINAL_PRODUCTION_AUDIT.md](./FINAL_PRODUCTION_AUDIT.md).

## 3. Findings

Severity: **Critical** (immediate compromise), **High** (likely serious impact), **Medium** (material but constrained), **Low** (limited/hardening), **Info** (observation).

| ID | Severity | Finding | Status |
|---|---|---|---|
| S-01 | High | Cloudinary API key/secret appeared in earlier tool output; treat as exposed | **Open — rotate** |
| S-02 | Medium | Admin JWT stored in `localStorage` | **Fixed** — HttpOnly cookie sessions |
| S-03 | Medium | No MFA for the single admin | **Fixed** — optional TOTP |
| S-04 | Medium | No server-side token revocation/logout | **Fixed** — DB-backed revocation |
| S-05 | Medium | No verified database backup/restore drill | **Tooling added** — production drill still owner-blocked |
| S-06 | Medium | No external uptime/alerting | **Open — operational** |
| S-07 | Low | Rate limits are in-memory and per instance | Accepted for single instance |
| S-08 | Low | CSP `connect-src https:` and `img-src https:` are broad | **Fixed** — `connect-src 'self'`, Cloudinary-only images |
| S-09 | Low | CSP allows `style-src 'unsafe-inline'` | Accepted; required by current inline styles |
| S-10 | Low | Public telemetry reveals platform, runtime, commit, CPU, memory | **Fixed** — minimal telemetry |
| S-11 | Low | No admin audit trail | Accepted; structured security events added |
| S-12 | Low | Uploaded files are not malware-scanned | **Fixed in code** — optional ClamAV, fail-closed; live scanner owner-blocked |
| S-13 | Low | No Cloudinary cleanup on row delete | Accepted; quota/privacy follow-up |
| S-14 | Low | No automated accessibility gate (focus contrast) | Focus contrast fixed manually; automated gate still open |
| S-15 | Info | `GET /` reports `environment` | Accepted; no secret |
| S-16 | Info | No `Cross-Origin-Opener-Policy` header | **Fixed** — COOP/CORP added |

## 4. Verified controls

### 4.1 Authentication and authorization

| Control | Evidence |
|---|---|
| Single env-configured admin | `server/utils/adminAuth.js` |
| bcrypt hash mode in production | Startup log: `🔐 Admin login: bcrypt hash.` |
| Plain fallback uses SHA-256 + `timingSafeEqual` | `adminAuth.js` |
| Hash precedence when both set | `getAdminAuthConfig()` + warning |
| Generic login failure | `401 Invalid email or password.` |
| Both fields checked | Email match evaluated even when password fails |
| Login rate limit | 10 failed / 15 min / resolved IP |
| Opaque session tokens | 32 random bytes, base64url, HttpOnly cookie |
| Only hashes stored | SHA-256 token hash in `admin_sessions` |
| Revocation | `revoked_at` on logout / log out all |
| Short absolute + idle expiry | 120 minutes / 30 minutes by default |
| Token bound to current admin email | `admin_email` checked against `ADMIN_EMAIL` |
| CSRF | Exact Origin/Referer + per-session `X-CSRF-Token` |
| MFA | Optional RFC 6238 TOTP |
| Server-side protection | `protect` on all mutations and `/api/messages` |
| Client guard is not the control | `ProtectedRoute` performs a server session check |

### 4.2 Input and data handling

| Control | Evidence |
|---|---|
| Parameterized SQL | `db.execute(sql, values)` in all models |
| Explicit public columns | `SELECT id, title, ...`, no `SELECT *` |
| Type checks before `.trim()` | `normalizeRequiredText`, `normalizeOptionalText`, `validateMessagePayload` |
| Length/range limits | Projects, skills, certificates, messages |
| URL protocol allowlist | `isSafeHttpUrl` (HTTP/HTTPS only) |
| Client URL re-check | `safeExternalUrl` |
| Upload MIME/size limits | JPG/PNG/WEBP 5 MB; documents 10 MB |
| Pre-upload validation | `uploadSingle(..., { validate })` |
| Safe JSON errors | Malformed JSON and oversize bodies normalized |
| Generic 404 | Does not echo the requested path |

### 4.3 Headers and browser protections

Frontend (`client/vercel.json`):

- `Content-Security-Policy`: `default-src 'self'`, `script-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`, `upgrade-insecure-requests`.
- `X-Frame-Options: DENY`.
- `X-Content-Type-Options: nosniff`.
- `Strict-Transport-Security: max-age=63072000; includeSubDomains`.
- `Referrer-Policy: strict-origin-when-cross-origin`.
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
- `/admin` and `/admin/*`: `X-Robots-Tag: noindex, nofollow`.
- `/assets/*`: immutable caching; `/index.html`: `no-cache`.

API (`server/server.js`):

- Helmet with CSP `frame-ancestors 'none'` and `frameguard: deny`.
- `X-Robots-Tag: noindex, nofollow` on all responses.
- `Cache-Control: no-store` on `/api`.
- `x-powered-by` disabled.
- CORS exact allowlist, credentials enabled, no wildcard.
- JSON/urlencoded bodies limited to 1 MB.

### 4.4 Error handling and logging

- Production 5xx returns `Internal Server Error`.
- Stack traces only outside production.
- Parser errors return stable messages.
- 404 does not echo attacker-controlled paths.
- Morgan logs method, path, status, size, timing, and resolved IP; it does not log bodies.
- Fatal rejection/exception handlers serialize only stacks/messages/primitives, not arbitrary objects.
- Authentication failures log the resolved IP, not the submitted email/password.
- Telemetry excludes `os.hostname()`.

### 4.5 Secrets and dependencies

| Check | Result |
|---|---|
| Tracked `.env`, `.pem`, `.key`, `.git`, `node_modules` | None found |
| Git history secret scan | Clean except documented placeholders/test fixtures |
| Local build output scan | Clean |
| Live Vercel JS/CSS scan | Clean |
| Client bundle server secrets | None found |
| `npm audit --omit=dev` (client) | 0 vulnerabilities |
| `npm audit --omit=dev` (server) | 0 vulnerabilities |
| Docker images `.env`/build output | CI verifies exclusion |
| CI repository hygiene | Fails on tracked env/build output |

### 4.6 Upload and integration isolation

- Missing Cloudinary credentials → `503`, no crash.
- Cloudinary failure → `502`, no raw provider error.
- Missing Gemini key → `502`, core site unaffected.
- Email failure → message already saved; `201` preserved.
- Uploads use memory storage; no ephemeral disk writes.
- Contact payload validated before upload to prevent orphan assets.

## 5. Detailed findings and recommendations

### S-01 — Cloudinary credential exposure (High, open)

**What happened:** A Cloudinary API key/secret appeared in earlier tool output during development. The current values still work, which means they must be considered compromised until rotated.

**Impact:** An attacker with the key can upload/delete assets, consume quota, and potentially access account resources allowed by the key. It does not grant database or admin access.

**Required action:**

1. Create a new API key/secret in the Cloudinary console.
2. Update `CLOUD_API_KEY` and `CLOUD_API_SECRET` in Render.
3. Redeploy/restart.
4. Upload a disposable image and verify delivery.
5. Revoke the old key.
6. Record the rotation date here.

**Status:** Open. Owner action required. Do not print the new values.

---

### S-02 — JWT in `localStorage` (Medium, fixed)

**Old impact:** Any XSS could read the token and act as admin until expiry.

**Fix (2026-11-16):** the API now issues an opaque random token in an
HttpOnly, Secure, SameSite cookie. The browser stores no auth token in
JavaScript-readable storage. State changes require a per-session
`X-CSRF-Token` and an exact Origin/Referer. See
[AUTHENTICATION.md](./AUTHENTICATION.md).

**Residual:** XSS can still make authenticated requests in the victim browser,
but it can no longer exfiltrate a reusable token.

---

### S-03 — No MFA (Medium, fixed)

**Old impact:** A stolen/guessed password gave full admin access.

**Fix (2026-11-16):** optional TOTP via `ADMIN_TOTP_SECRET`; a correct
password alone cannot create a session when MFA is configured.

**Residual:** no backup codes; recovery requires Render environment access.

---

### S-04 — No server-side logout/revocation (Medium, fixed)

**Old impact:** A copied token remained valid until expiry.

**Fix (2026-11-16):** sessions live in `admin_sessions` and are revoked
immediately by logout, log out all, expiry, idle timeout, or an admin-email
change. Only SHA-256 hashes are stored.

---

### S-05 — No verified backup/restore (Medium, tooling added)

**Impact:** Data loss from a bad migration, accidental delete, or provider
incident is unrecoverable beyond provider defaults.

**Fix (2026-11-16):** `npm run db:backup`, `db:verify` and `db:restore` export
schema + rows to JSON, write/verify a SHA-256 sidecar, exclude
`admin_sessions`, and support a scratch-database rehearsal. See
[SECURITY_OPERATIONS.md](./SECURITY_OPERATIONS.md#5-backups-and-restore-drills).

**Still owner-blocked:** a production backup rotation and a live restore drill.

---

### S-06 — No external uptime alerting (Medium, open)

**Impact:** The owner may learn about an outage from a visitor rather than an alert.

**Recommendation:** add an external monitor for the frontend and `/api/health/ready`, with email/phone alerts. Do not rely solely on Render/Vercel dashboards.

---

### S-07 — In-memory rate limits (Low, accepted)

**Impact:** Limits reset on restart and are not shared across instances. At one Render instance, this is acceptable.

**Trigger to fix:** horizontal scaling or observed abuse across restarts. Move to a shared store (for example Redis) with the same key strategy.

---

### S-08 — Broad CSP connect/img sources (Low, fixed)

**Fix (2026-11-16):** `connect-src 'self'` (the frontend uses the same-origin
`/api` rewrite) and `img-src 'self' data: https://res.cloudinary.com`.
`default-src`, `script-src`, `base-uri`, `object-src`, `frame-ancestors` and
`form-action` are also restricted. See `client/vercel.json` and
`client/nginx.conf`.

---

### S-09 — `style-src 'unsafe-inline'` (Low, accepted)

The app uses inline `style` attributes for progress widths and layout values. React escapes style values, and the CSP still blocks inline scripts.

**Recommendation:** if the inline styles are removed, drop `'unsafe-inline'` from `style-src`. Do not add `'unsafe-inline'` to `script-src`.

---

### S-10 — Public telemetry (Low, fixed)

**Fix (2026-11-16):** the public snapshot now exposes only timestamp, uptime,
CPU cores/load, memory percentage, AI availability and a short commit hash.
Platform, architecture, Node version, hostname, Docker status, git branch and
process identifiers were removed. See `controllers/systemController.js`.

---

### S-11 — No admin audit trail (Low, accepted)

There is no record of which admin action changed what. With one admin, the value is limited.

**Recommendation:** add an append-only audit log if a second admin or delegated content role is introduced.

---

### S-12 — No malware scanning (Low, fixed in code)

**Fix (2026-11-16):** every upload is checked against magic bytes for its
declared MIME type and extension. Optional ClamAV INSTREAM scanning runs when
`CLAMAV_HOST` is set and fails closed (503) on scanner errors. A local
`clamav` Compose profile is available. Live production scanning still needs a
reachable clamd service.

---

### S-13 — No Cloudinary cleanup (Low, accepted)

Deleting a database row leaves the asset in Cloudinary. This grows quota usage and may retain personal attachments.

**Recommendation:** store the public ID and delete the asset on row deletion, with a failure-tolerant cleanup job. Define retention for contact attachments.

---

### S-14 — Accessibility gate (Low, open)

The focus ring previously used pink on acid at 2.71:1. It now pairs an ink inner ring (16.07:1 on acid) with a pink outer ring (5.93:1 on ink), so at least one layer clears 3:1 on every surface. This was a WCAG risk, not a security vulnerability. There is still no automated axe/Lighthouse gate.

**Recommendation:** keep the two-layer focus ring and add an automated check. See [DESIGN.md](./DESIGN.md) and [TESTING.md](./TESTING.md).

---

### S-15 — Environment disclosure (Info)

`GET /` returns `"environment": "production" | "development"`. This is not sensitive and helps confirm the deployment. No change required.

### S-16 — COOP header (Info, fixed)

`Cross-Origin-Opener-Policy: same-origin` and
`Cross-Origin-Resource-Policy: same-origin` are now set by Vercel and Nginx,
along with `X-Permitted-Cross-Domain-Policies: none`.

## 6. Threat model summary

| Threat | Likelihood | Impact | Controls | Residual |
|---|---|---|---|---|
| Credential stuffing | Medium | Admin compromise | Rate limit, strong password, MFA, generic errors | Distributed IPs |
| XSS token theft | Low | Admin compromise | CSP, escaping, HttpOnly cookie, no JS token | XSS can still act in-session |
| CSRF | Low | Admin action | Origin/Referer + per-session header | Same-site subdomain compromise |
| SQL injection | Low | Data breach | Parameterized SQL, validation | None known |
| File upload abuse | Medium | Quota/storage abuse | MIME/magic bytes, size limits, optional ClamAV | Live scanner owner-blocked |
| Contact spam | Medium | Inbox noise | 5/15 min limit, honeypot, timing, link flood checks | Distributed spam |
| AI cost abuse | Low | Quota burn | 10/min, daily/global caps, kill switch, bounded output | Multiple IPs |
| Secret leakage | Medium | Service compromise | Env-only, Gitleaks, CI hygiene | Cloudinary rotation |
| Clickjacking | Low | UI redress | `frame-ancestors 'none'`, `DENY` | None known |
| DoS | Low | Availability | Body limits, rate limits, single instance | No WAF |
| Supply chain | Low | Code execution | Small deps, lockfiles, audit | No SCA gate beyond audit |
| Data loss | Medium | Content/message loss | Provider backups (unverified) | No drill |
| Insider misuse | Low | Data change | Single owner | No audit log |

## 7. Production verification evidence

Checks performed against the live deployment:

- `/api/health` → `200 healthy`;
- `/api/health/ready` → `200 ready`;
- `/api/messages` without token → `401`;
- `/admin` → `X-Robots-Tag: noindex, nofollow`;
- API → `X-Robots-Tag`, `Cache-Control: no-store`, HSTS, nosniff, frame denial;
- CSP includes `frame-ancestors 'none'`;
- public content counts: 4 / 16 / 16;
- live route audit: 0 console errors, 0 failed requests, 0 broken images, no unsafe links;
- secret scans: clean except known placeholders/test fixtures;
- CI run `43362202013`: 7/7 jobs including production smoke.

Re-run these checks after the documentation deploy and record the result in [FINAL_PRODUCTION_AUDIT.md](./FINAL_PRODUCTION_AUDIT.md).

## 8. Remediation plan

| Priority | Action | Owner | Target |
|---|---|---|---|
| P0 | Rotate Cloudinary key/secret and verify uploads | Owner | Immediate |
| P1 | Complete a production restore drill and off-site rotation | Owner | This month |
| P1 | Add external uptime monitoring + alert channel | Owner | This month |
| P1 | Set `ADMIN_TOTP_SECRET` and verify MFA login | Owner | This week |
| P2 | Configure a production ClamAV endpoint (or accept magic-byte only) | Owner | When uploads grow |
| P2 | Configure Gmail OAuth and verify delivery | Owner | When email is required |
| P2 | Add axe/Lighthouse CI and fix focus contrast | Agent | Next UI change |
| P3 | Add Cloudinary cleanup/retention | Agent | When media volume grows |
| P3 | Add admin audit log | Agent | If roles are added |

## 9. Security checklist for future changes

- [ ] No secret added to tracked files, templates, docs, or client code.
- [ ] New env var documented as a placeholder in the correct `.env.example`.
- [ ] Every mutation/private read uses `protect`.
- [ ] New input validated for type, length, range, and protocol.
- [ ] SQL uses placeholders and explicit columns.
- [ ] New upload has type/size limits and pre-upload validation.
- [ ] New public endpoint has a rate limit where abuse is possible.
- [ ] New integration has a timeout and a stable failure message.
- [ ] Errors do not leak internals in production.
- [ ] Logs do not contain bodies, tokens, passwords, or personal data.
- [ ] Headers/CSP remain intact.
- [ ] Dependency audit passes.
- [ ] Secret scan passes.
- [ ] Docs and tests updated.

## 10. Statement of limitations

This audit reviewed the repository and live behavior on the date above. It did not include:

- a full penetration test;
- source-code review of third-party dependencies;
- Cloudinary/Gmail/Google/TiDB provider configuration review beyond the app's use;
- a privacy compliance assessment;
- a disaster-recovery drill;
- social engineering or physical access testing.

Absence of a finding is not proof of absence of vulnerabilities. Re-audit after any auth, upload, dependency, or infrastructure change.
