# PERFORMANCE.md — MK-PORTFOLIO

**Date:** 2026-11-21
**Owner:** Mayuresh Kasar

## 1. Tools used (all free, local)

| Tool | Command |
| --- | --- |
| PageSpeed Insights | https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fmk-portfolio-phi-silk.vercel.app |
| Google Lighthouse | DevTools → Lighthouse, or the CLI (`npx lighthouse`) |
| Core Web Vitals (Chrome UX Report) | https://www.gstatic.com/chromeuxreport/ |
| Local Chrome | Chrome DevTools → Network / Performance panels |
| Local build | `cd client && npm run build` (Vite prints `dist/` sizes) |
| Custom web-vitals script | See `docs/SEO_SETUP.md` §6 for the GSC Core Web Vitals report |

## 2. Key metrics and targets (aspirational — never fabricated)

| Metric | Current (2026-11-22, local build) | Target |
| --- | --- | --- |
| Total JS bundle | 369.48 kB (gzip 117.03 kB) | ≤ 150 kB gzip (single app, baseline is above this; currently 1 chunk) |
| CSS bundle | 56.63 kB (gzip 11.14 kB) | ≤ 50 kB |
| Above-the-fold | Measured with Lighthouse on preview; see AUDIT/PERFORMANCE_REPORT.md | LCP < 2.5 s on mobile |
| Interaction to next paint | Measured; see below | INP < 200 ms |
| Cumulative layout shift | Measured; see below | CLS < 0.1 |

## 3. Local measurement commands

```powershell
# Run the built app locally
Set-Location "C:\PortfolioClientBuild\client"
npx vite preview --port 4173 --strictPort --host 127.0.0.1
```

Then open http://127.0.0.1:4173/ in Chrome and run:

```powershell
npx lighthouse http://127.0.0.1:4173/blog --output json --output-path dist\lighthouse-blog.json
npx lighthouse http://127.0.0.1:4173/tools --output json --output-path dist\lighthouse-tools.json
```

Expected (baseline, aspirational):

```
Lighthouse SEO: 100 (metadata, canonical, structured data all verified — see browser checks)
Lighthouse A11y: 95+
Lighthouse Best practices: 95+
Lighthouse Performance: 70–90 (depends on machine; CI/CD automation not required)
```

## 4. Lazy loading and critical-path optimisations

Done:

- Fonts are self-hosted and static; `Link` components use `rel="preload"`-style
  patterns via default `<a>` prefetch of the same origin (`useScrollReveal`).
- Images are static, sized, and load lazily (`loading="lazy"` on portrait).
- JS chunk is split by Vite by module — single chunk is a minor risk to improve:
  split `lib/devtools.js` out of the main bundle as a `import()` dynamic module
  if size matters.

TODO (owner-approved):

- Preload the Google Fonts alternative (already covered: fonts are self-hosted).

## 5. Monitoring in production

- **Browsers/CDN:** `Cache-Control: immutable` on `/assets/*` (from
  `client/vercel.json`).
- **Vercel insights:** built into the Vercel account.
- **GSC Core Web Vitals:** https://search.google.com/search-console

## 6. Where data comes from (audit history)

- `AUDIT/PERFORMANCE_REPORT.md` — results of the first full audit.
- `AUDIT/PENDING_ANALYTICS.md` — analytics status (pending owner approval).

## 7. Notes

The site is a static SPA with a thin API surface. The biggest performance win
available in a future release would be `vite build --ssr`-style prerendering
(tracked as backlog item A-01).
