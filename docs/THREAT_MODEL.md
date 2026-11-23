# Threat Model

**Product:** Mayuresh Kasar Portfolio ("MAYURESH.DEV")
**Document owner:** Mayuresh Kasar
**Status:** Working threat model
**Version:** 1.0
**Last updated:** 2026-11-22
**Related:** [AUTHENTICATION.md](./AUTHENTICATION.md) · [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) · [SECURITY_OPERATIONS.md](./SECURITY_OPERATIONS.md) · [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md)

This is a small, single-owner portfolio, not a multi-tenant product. The model
focuses on the assets that actually exist and the abuse paths that are
realistic for a public site with a contact form, an admin area, uploads and a
paid AI integration.

## 1. Assets

| Asset | Why it matters | Where it lives |
|---|---|---|
| Admin credential | Full control of public content and the message inbox | Render environment |
| Admin session | Authenticated access without the password | HttpOnly cookie + hashed row in `admin_sessions` |
| Contact messages | Visitors' names, emails, free text, optional attachments | MySQL/TiDB, Cloudinary, Gmail |
| Public content | Portfolio reputation and availability | MySQL/TiDB, Vercel build |
| Cloudinary / Gemini / Gmail credentials | Cost, spam, and account abuse | Render environment |
| Database credentials | Read/write access to all content and messages | Render environment |
| Source repository | Supply-chain and secret exposure | GitHub |

## 2. Actors and trust boundaries

| Actor | Capability | Trust |
|---|---|---|
| Anonymous visitor | Read public pages, submit contact form, use AI explainers, call public API reads | Untrusted |
| Authenticated admin | Read messages, mutate content, upload files, log out all sessions | Trusted, single identity |
| Search/AI crawler | Read public HTML and discovery files | Untrusted but allowed |
| Platform operator | Vercel, Render, TiDB, Cloudinary, Google | Trusted providers under their terms |
| Attacker | Credential stuffing, scraping, spam, upload abuse, cost abuse | Untrusted |

Boundaries: browser → Vercel edge → Render API → TiDB/Cloudinary/Google.
The browser never receives a server secret. The API is the only component
that talks to the database and providers.

## 3. Threats and controls

| Threat | Control | Evidence | Residual risk |
|---|---|---|---|
| Credential stuffing on admin login | 10 failed logins/15 min/IP, generic errors, optional TOTP | `rateLimiters.js`, `adminAuth.test.js`, `totp.test.js` | Distributed IPs; add edge/WAF limits if attacked |
| Plaintext admin password in production | Startup validation and login both reject `ADMIN_PASSWORD` when `NODE_ENV=production`; bcrypt hash required | `adminAuth.js`, `validateEnv.test.js`, `adminAuth.test.js` | Owner must set the hash in Render before deploy |
| Session theft via XSS | No token in JS-readable storage; HttpOnly cookie; CSP `script-src 'self'` | `sessionConfig.js`, `vercel.json` | XSS could still make authenticated requests in the victim browser |
| CSRF | Exact Origin/Referer guard plus per-session `X-CSRF-Token` | `origin.test.js`, `sessionState.test.js`, `authMiddleware.js` | Same-site subdomain compromise; keep `CLIENT_URL` exact |
| Session fixation / replay | Server-generated token after login, short TTL, idle timeout, revocation, `__Host-` cookie in production | `sessionConfig.test.js`, `sessionState.test.js` | Stolen live cookie works until revoke/expiry |
| Database leak | Only SHA-256 session hashes stored; admin password never in DB | `sessionModel.js` | Contact messages are plaintext in the DB |
| Contact-form spam | Honeypot, timing check, link/email flood heuristics, rate limit | `spamGuard.test.js`, `messageValidation.test.js` | Determined human spam; no CAPTCHA by design |
| Malicious upload | MIME + extension + magic-byte validation, size limits, optional ClamAV, Cloudinary `allowed_formats` | `fileSignature.test.js`, `uploadMiddleware.js` | Zero-day parser bugs; Cloudinary remains an external parser |
| Upload stalls / orphan assets | 30 s timeout (`UPLOAD_TIMEOUT_MS`), 504 response, late asset cleanup | `uploadMiddleware.js` | Cleanup can itself fail; quota is not a security boundary |
| AI cost abuse | Per-minute and daily limits, `AI_ENABLED` kill switch | `rateLimiters.js`, `validateEnv.test.js` | Counters are in-memory and reset on restart |
| Prompt injection / unsafe AI output | Fixed system prompt, input length caps, output rendered as text | `aiService.js`, `aiController.js` | Model can still produce misleading text; never treated as authority |
| Secret leakage in logs | Security events omit credentials, bodies, cookies; error middleware strips control characters | `errorMiddleware.test.js`, `securityLog.js` | Provider logs may retain IPs and paths |
| Dependency compromise | `npm ci`, lockfiles, `npm audit`, no new dependencies in this change | `npm audit` output in the run report | Transitive packages can still be compromised |
| Indexing of private surfaces | `/admin` noindex meta + header, robots disallow, sitemap filter | `seo-build.test.js`, `vercel.json` | A linked admin URL is still discoverable by humans |
| Denial of service | Body limits, rate limits, Helmet, single instance | `server.js`, `rateLimiters.js` | No WAF or CDN-level DDoS plan on the free tier |
| Supply-chain / repo secret | `.env` ignored, hygiene CI job, no secrets in templates | `.gitignore`, CI hygiene | A developer can still commit a secret by mistake |

## 4. Out of scope

- Multi-tenant authorization, user roles, password reset and account recovery.
- Payment data (the site takes no payments).
- Malware on the visitor's device.
- Physical security of provider data centres.
- Legal compliance certification; see [COMPLIANCE.md](./COMPLIANCE.md).

## 5. Review triggers

Revisit this model when any of the following changes:

- a new integration, dependency, table, or background job is added;
- authentication, session storage, or password handling changes;
- the site starts collecting a new category of personal data;
- analytics is enabled;
- traffic grows enough to need multiple API instances (in-memory limits stop
  being global);
- a real incident reveals a path not listed here.
