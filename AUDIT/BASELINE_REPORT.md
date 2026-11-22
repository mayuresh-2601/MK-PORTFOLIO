# BASELINE REPORT — MK-PORTFOLIO

**Audit date:** 2026-11-21
**Auditor:** Autonomous engineering agent
**Repository:** https://github.com/mayuresh-2601/MK-PORTFOLIO
**Local root:** `E:\PORT\PORTFOLIO-APP`
**Baseline branch:** `main` @ `c5ac4a9`
**Working branch created for this programme:** `feature/100k-organic-growth`
**Live site:** https://mk-portfolio-phi-silk.vercel.app/
**Live API:** https://mk-portfolio-api.onrender.com

This report records the repository state **before** any growth-programme changes.
Nothing in this report is an assumption from the README; each item was verified
against source, configuration and the deployed site.

---

## 1. Phase Zero — safety checks

| Check | Result |
| --- | --- |
| Working directory | `E:\PORT\PORTFOLIO-APP` |
| Git repository root | `E:\PORT\PORTFOLIO-APP` (single repo, no submodules) |
| Branch at start | `main` |
| Status at start | Clean (`## main...origin/main`, 0 changes) |
| HEAD at start | `c5ac4a9` — `fix(docker): drop unused nginx modules before upgrade` |
| `origin/main` | `c5ac4a9` (in sync) |
| Package manager | npm (both `client` and `server`), lockfiles present |
| Lockfiles | `client/package-lock.json`, `server/package-lock.json` |
| Node runtime available | v24.18.0 (local) — engines pin `22.x` |
| npm available | 12.0.2 |
| Testing tools | Server: Node built-in `node:test` (no extra dependency). Client: none. |
| Ignored/untracked | `.env`, `client/.env`, `client/.vercel/`, `client/dist/`, `server/.env`, `server/backups/` |

**Secret safety:** `.env` files exist locally and are ignored by git. No secret was
read, copied or printed during this audit. All reports use `.env.example` only.

---

## 2. Verified architecture

### 2.1 Frontend (`client/`)

| Item | Verified value |
| --- | --- |
| Framework | React 18.3.1 |
| Build tool | Vite 6 |
| Routing | `react-router-dom` 7.18.5, client-side `BrowserRouter` |
| Styling | Tailwind CSS 4 via `@tailwindcss/vite` |
| HTTP client | axios 1.15.2 |
| Icons | lucide-react 1.11.0 |
| Fonts | Self-hosted `@fontsource/inter` + `@fontsource/space-mono` |
| Rendering | Client-side only. `index.html` ships one shell; every route renders in the browser. |
| Package scripts | `dev`, `start`, `build`, `preview`, `lint`, `check` |

Public routes (from `client/src/App.jsx`):

| Route | Page component |
| --- | --- |
| `/` | `pages/public/Home.jsx` |
| `/about` | `pages/public/About.jsx` |
| `/skills` | `pages/public/Skills.jsx` |
| `/projects` | `pages/public/Projects.jsx` |
| `/certificates` | `pages/public/Certificates.jsx` |
| `/system` | `pages/public/System.jsx` |
| `/contact` | `pages/public/Contact.jsx` |
| `/admin` | `pages/admin/AdminLogin.jsx` |
| `/admin/dashboard` | `pages/admin/AdminDashboard.jsx` (protected) |
| `*` | 404 `NotFound` |

### 2.2 Backend (`server/`)

| Item | Verified value |
| --- | --- |
| Runtime | Node.js 22.x (engine pin) |
| Framework | Express 5.2.1 |
| Database | MySQL / TiDB via `mysql2` 3.22.3 |
| Auth | bcryptjs password hash, revocable cookie sessions, optional TOTP MFA |
| Security | helmet, CORS allow-list, express-rate-limit, CSRF origin checks, multer uploads, Cloudinary, Nodemailer (Gmail API/SMTP) |
| Tests | 17 `node:test` files under `server/tests/` |

### 2.3 Deployment

| Item | Verified value |
| --- | --- |
| Frontend host | Vercel (`.vercel/project.json` present) |
| SPA fallback | `vercel.json` rewrite `/(.*)` → `/index.html` |
| API proxy | `/api/(.*)` → `https://mk-portfolio-api.onrender.com/api/$1` |
| Backend host | Render (`render.yaml`) |
| CI | GitHub Actions: `docker-ci.yml`, `codeql.yml`, `zap-baseline.yml`, `trivy.yml`, `gitleaks.yml`; Dependabot enabled |
| Last known CI state | 11/11 checks green on `c5ac4a9` |

### 2.4 Existing SEO implementation

| Feature | State |
| --- | --- |
| Per-route metadata | Present (`components/common/SEO.jsx`) — rewrites title/description/canonical/OG/Twitter on route change |
| Static homepage metadata | Present in `index.html` (title, description, keywords, author, robots, canonical, OG, Twitter) |
| Structured data | JSON-LD `@graph` with `Person`, `WebSite`, `ProfilePage` |
| `robots.txt` | Present, disallows `/admin` |
| `sitemap.xml` | Present, 7 static URLs, `lastmod` 2026-11-13 |
| `noscript` fallback | Present |
| Rendering for crawlers | Client-side only — no prerender/SSG |
| Analytics | None |
| RSS/feed | None |
| Blog | None |
| Developer tools | None |
| Case studies | None |

---

## 3. Known issues at baseline

| ID | Severity | Finding | Evidence |
| --- | --- | --- | --- |
| B-01 | High | Route content is client-rendered. Non-JS crawlers and social scrapers see an empty shell. | `index.html` has only `<div id="root">`; `SEO.jsx` mutates `<head>` in `useEffect`. |
| B-02 | Medium | Sitemap is hand-maintained and stale (`lastmod` 2026-11-13); it does not know about future routes. | `client/public/sitemap.xml` |
| B-03 | Medium | No measurement layer; there is no way to attribute organic traffic or CTA events. | No analytics dependency or script in `client/package.json` / `index.html`. |
| B-04 | Medium | No content platform; organic search has only 7 thin pages. | `client/src/pages/public/` contains no article/blog routes. |
| B-05 | Low | No RSS/Atom feed for future content. | No feed file in `client/public/`. |
| B-06 | Low | `keywords` meta tag is present; modern search engines largely ignore it. | `index.html` line 21. |
| B-07 | Low | Sitemap lastmod dates do not reflect current content edits. | `sitemap.xml` vs git log. |
| B-08 | Info | Client has no automated tests at baseline. | `client/package.json` has no `test` script. |

---

## 4. Baseline commands and raw evidence

```
$ git status -sb
## main...origin/main

$ git log -1 --oneline
c5ac4a9 fix(docker): drop unused nginx modules before upgrade

$ git rev-parse --short origin/main
c5ac4a9

$ node --version
v24.18.0

$ npm --version
12.0.2

$ Get-ChildItem client\src -Recurse -File | Measure-Object
28 files

$ Get-ChildItem server -Recurse -File (excluding node_modules) | Measure-Object
82 files
```

Baseline build/lint/test results are recorded in
`AUDIT/PERFORMANCE_REPORT.md` and `AUDIT/FINAL_VERIFICATION.md` after the
dependency install completes.

---

## 5. Baseline risk assessment

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Changing SEO markup breaks the SPA shell | Medium | High | Keep `SEO.jsx` behaviour; add, never remove. Verify build + routes. |
| Adding dependencies costs money | Low | Medium | Only OSI-approved open-source packages; no paid services. |
| Analytics script violates CSP | Medium | Medium | Gate analytics behind env var; document the exact CSP change required. |
| Prerendering breaks the app | Medium | High | Prerender is additive and must be verified against every route before it is enabled by default. |
| Production deploy without approval | Low | High | No deploy is performed in this programme. Changes stay on the feature branch. |

---

## 6. Baseline conclusion

The repository is already a mature, secure, well-documented full-stack
application with a functioning SEO component and CI. The growth programme does
**not** need to rebuild it. The highest-value work is additive:

1. Make route HTML crawler-visible (prerender or equivalent).
2. Generate sitemap/robots/RSS from a single source of truth.
3. Add an opt-in, privacy-safe measurement layer.
4. Add a static technical blog with real, verifiable content.
5. Add client-side developer tools with tests.
6. Keep every change free, dependency-light and verified.

No existing functionality is removed by this programme.
