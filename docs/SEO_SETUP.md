# SEO SETUP — MK-PORTFOLIO

**Date:** 2026-11-21
**Owner:** Mayuresh Kasar

This document records the sitemap, robots and structured-data setup for the
production site at https://mk-portfolio-phi-silk.vercel.app/

No account configuration is required. Everything below is committed to the
repository.

---

## 1. How SEO is generated

The site ships two SEO artefacts:

| File | Location in repo | Generated at build |
| --- | --- | --- |
| `sitemap.xml` | `client/public/sitemap.xml` (copied to `dist`) | Overwritten by `node scripts/build-seo.mjs` after `vite build` |
| `rss.xml` | `client/public/rss.xml` (copied to `dist`) | Overwritten by `node scripts/build-seo.mjs` |

`npm run build` runs `vite build && node scripts/build-seo.mjs`. The generator
imports the blog post modules directly, so the sitemap and RSS are built from
the same source of truth as the pages.

The sitemap includes:

- `/`, `/about`, `/skills`, `/projects`, `/certificates`, `/system`, `/contact`, `/blog`, `/tools`
- every published blog post (`/blog/<slug>`)
- every unique blog tag (`/blog/tag/<slug>`)
- every blog category (`/blog/category/<slug>`)

It deliberately **excludes** `/admin` and `/admin/dashboard` and every page that
requires authentication.

---

## 2. robots.txt

`client/public/robots.txt` is:

```
User-agent: *
Allow: /

# Private admin area — keep it out of search results.
Disallow: /admin
Disallow: /admin/

Sitemap: https://mk-portfolio-phi-silk.vercel.app/sitemap.xml
```

Add any future private area to `Disallow`.

---

## 3. Per-page metadata

Every public route renders `<SEO … />`
(`client/src/components/common/SEO.jsx`). It sets, on route change:

- `<title>`
- `name="description"`
- `name="robots"` (`index, follow`)
- `name="author"` (set in `index.html`)
- `og:title`, `og:description`, `og:url`, `og:image`, `og:type`
- `twitter:title`, `twitter:description`, `twitter:image`
- canonical URL
- Homepage `name="keywords"` (legacy; modern search ignores it)

For blog articles, `SEO` additionally injects a dynamic JSON-LD
`Article` schema (`client/src/pages/public/BlogPost.jsx`).

---

## 4. Structured data (JSON-LD)

`client/index.html` ships the homepage graph:

- `Person` — Mayuresh Kasar, Maharashtra, India, full-stack skills, socials
- `WebSite` — name, description, `sameAs` for GitHub and LinkedIn
- `ProfilePage` — the homepage itself, `isPartOf` the `WebSite`

Blog posts add an `Article` node per post, generated at build time from the
post metadata (`title`, `description`, `date`, tags, category, author).

Taxonomy pages do not currently add `CollectionPage` — it can be added by
editing `BlogTaxonomy.jsx`.

---

## 5. Rendering for crawlers

The public site is client-rendered. Three practical consequences:

1. **Google** executes JavaScript, so it can read the `SEO` metadata after the
   initial render.
2. **Bing** and **social scrapers** may not execute JavaScript, so they read
   the `<head>` that Vercel serves — which is the homepage shell.
3. To fix (2) robustly, add prerendering. The repository currently does **not**
   prerender; this is tracked as backlog (`AUDIT/BASELINE_REPORT.md`).

If a script blocker on a page means Google cannot run it, fix the page's
`SEO` props rather than the site-wide config.

---

## 6. Things to monitor (maintenance)

| Check | Cadence |
| --- | --- |
| `sitemap.xml` includes every published post and excludes `/admin` | After every `npm run build` (run `npm run seo:build` locally and diff) |
| `robots.txt` disallows new private routes | After every deploy |
| Blog sitemap entries return `200` | After publishing a post |
| `og:url` values match the live domain | After domain change |

### Expected HTTP responses

```
GET /sitemap.xml            200 application/xml
GET /rss.xml                200 application/xml
GET /                       200 text/html
GET /admin                  200, X-Robots-Tag: noindex, nofollow
GET /Mayuresh_Kasar_Resume.pdf 200 application/pdf
```

Run:

```powershell
powershell -c "(Invoke-WebRequest -Uri 'https://mk-portfolio-phi-silk.vercel.app/sitemap.xml').StatusCode"
powershell -c "(Invoke-WebRequest -Uri 'https://mk-portfolio-phi-silk.vercel.app/rss.xml').StatusCode"
powershell -c "(Invoke-WebRequest -Uri 'https://mk-portfolio-phi-silk.vercel.app/admin').Headers['x-robots-tag']"
```
