# ARCHITECTURE AUDIT — MK-PORTFOLIO

**Audit date:** 2026-11-21
**Scope:** complete repository inspection (source, configuration, CI/CD, deployment)
**Method:** direct file inspection, lockfile/dependency analysis, route enumeration, deployment config review, live HTTP checks.
**Baseline commit:** `c5ac4a9`

---

## 1. System context

```
                    ┌────────────────────────────────────────────┐
                    │                Browser                     │
                    └───────────────┬────────────────────────────┘
                                    │ HTTPS
                    ┌───────────────▼────────────────────────────┐
                    │  Vercel — React SPA (client/dist)          │
                    │  clean static assets + SPA fallback        │
                    └──────┬───────────────────────┬─────────────┘
                           │ /api/* proxy          │ static assets
                           ▼                       ▼
        ┌──────────────────────────────────┐   ┌────────────────────┐
        │  Render — Express API (server/)  │   │  Cloudinary (media)│
        │  MySQL/TiDB  · sessions · email  │   └────────────────────┘
        └──────────────────────────────────┘
```

- **Frontend:** React 18 SPA, Vite 6, Tailwind 4, React Router 7, axios.
- **Backend:** Node 22 + Express 5 REST API, MySQL/TiDB, cookie sessions, rate limiting, uploads.
- **No server-side rendering at baseline.** The API is a separate deploy from the site.

---

## 2. Frontend inventory

### 2.1 Source tree

```
client/src/
├── api/axios.js
├── assets/{GithubIcon,LinkedinIcon}.jsx
├── components/
│   ├── common/{AIExplainModal,CountUp,Footer,Marquee,Navbar,Pagination,SEO,StatsBand}.jsx
│   └── protected/ProtectedRoute.jsx
├── config/site.js
├── hooks/{usePaginatedList,useScrollReveal}.js
├── pages/
│   ├── admin/{AdminLogin,AdminDashboard}.jsx
│   └── public/{About,Certificates,Contact,Home,Projects,Skills,System}.jsx
├── utils/safeUrl.js
├── App.jsx
├── index.css
└── main.jsx
```

### 2.2 Routing

`BrowserRouter` in `main.jsx`; routes declared in `App.jsx`. Every public page
renders `<SEO … />`. Admin routes are hidden from the navbar and excluded from
`robots.txt`, the sitemap and the JSON-LD graph.

### 2.3 Rendering behaviour

- `index.html` contains the full homepage `<head>` (metadata + JSON-LD) and an
  empty `<div id="root">`.
- `SEO.jsx` rewrites metadata inside `useEffect`, i.e. **after** first paint.
- Consequence: crawlers that do not execute JavaScript receive the homepage
  metadata for every URL, and no page content.

### 2.4 Data flow

`src/api/axios.js` centralises the API base URL and error handling. Pages call
`/api/*`; Vercel proxies those calls to Render. Uploads go through the API to
Cloudinary; the client never holds Cloudinary credentials.

---

## 3. Backend inventory

### 3.1 Layers

```
server/
├── server.js                 app assembly, middleware, startup/shutdown
├── config/                   db, cloudinary, email, env validation
├── middleware/               auth, error, rate limiters, upload
├── routes/                   auth, projects, skills, certificates, messages, ai, system
├── controllers/              request handling per resource
├── models/                   SQL data access
├── utils/                    security, sessions, TOTP, validation, spam guard, signatures
├── database/                 schema.sql, seed.sql, migrations, Dockerfile
├── scripts/                  migrate/seed/backup/restore/verify, gmail auth, MFA
└── tests/                    17 node:test suites
```

### 3.2 Security controls observed

| Control | Location |
| --- | --- |
| helmet with restrictive CSP | `server.js` |
| CORS allow-list + credentials | `server.js`, `utils/origin.js` |
| Cookie-session auth with CSRF origin check | `utils/sessionConfig.js`, `middleware/authMiddleware.js` |
| bcrypt password hashing | `utils/adminAuth.js` |
| Optional TOTP MFA | `utils/totp.js` |
| Rate limiting | `middleware/rateLimiters.js` |
| JSON body limits (1 MB) | `server.js` |
| Upload signature + malware scan hooks | `utils/fileSignature.js`, `utils/malwareScan.js` |
| `X-Robots-Tag: noindex` on every API response | `server.js` |
| Dependency scanning | `.github/workflows/trivy.yml`, `codeql.yml`, Dependabot, `gitleaks.yml` |

### 3.3 Tests

`server/tests/` contains 17 suites covering admin auth, sessions, OTP, CORS/origin,
pagination, rate limiting, message validation, spam guard, email, Cloudinary,
file signatures, error middleware and environment validation. Runner: `node --test`.

---

## 4. Deployment and CI/CD

| Concern | Implementation |
| --- | --- |
| Frontend build | `client/package.json` → `vite build` |
| SPA fallback | `client/vercel.json` rewrite `/(.*)` → `/index.html` |
| API proxy | `/api/(.*)` → Render origin |
| Security headers | `client/vercel.json` (CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy, CORP/COOP) |
| Asset caching | `/assets/*` immutable, 1 year |
| Admin noindex | `/admin` and `/admin/*` → `X-Robots-Tag: noindex, nofollow` |
| Backend deploy | `render.yaml`, Dockerfile |
| CI | build/lint/tests, Docker build, Trivy, CodeQL, ZAP baseline, Gitleaks, Dependabot |

**Observation:** the CSP `script-src 'self'` means any third-party analytics
script must be added deliberately. See `docs/ANALYTICS_SETUP.md`.

---

## 5. SEO architecture at baseline

| Layer | Status |
| --- | --- |
| Metadata per route | Implemented client-side (`SEO.jsx`) |
| Homepage metadata | Complete in `index.html` |
| Canonical | Set client-side per route |
| Open Graph | Set client-side per route; static defaults in `index.html` |
| Twitter card | Set client-side per route; `summary_large_image` |
| Structured data | `Person`, `WebSite`, `ProfilePage` JSON-LD |
| Sitemap | Static XML, 7 URLs |
| robots.txt | Correct, disallows `/admin` |
| Crawlability of content | Weak — content is JS-rendered |
| Internal linking | Navbar + footer + page links |
| Feed | Absent |

---

## 6. Findings and recommendations

| ID | Severity | Finding | Recommendation |
| --- | --- | --- | --- |
| A-01 | High | No crawler-visible HTML for routes other than the shell | Add build-time prerendering for public routes; keep SPA behaviour. |
| A-02 | Medium | Sitemap/robots are static and will drift | Generate sitemap from a route manifest at build time. |
| A-03 | Medium | No analytics or event measurement | Add env-gated analytics module + event helpers. |
| A-04 | Medium | No blog/content routes | Add a dependency-light static blog. |
| A-05 | Low | No RSS feed | Generate RSS from blog metadata. |
| A-06 | Low | Client has no tests | Add pure-function tests for new tooling using `node:test`. |
| A-07 | Info | `keywords` meta present but unused by major engines | Keep (harmless); do not rely on it. |
| A-08 | Info | Admin hint uses `sessionStorage` in a `useState` initializer | Guard for non-browser environments if prerendering is enabled. |

---

## 7. Non-goals for this audit

- No production configuration change.
- No dependency was added during inspection.
- No secret was read or printed.
- No deploy was performed.
