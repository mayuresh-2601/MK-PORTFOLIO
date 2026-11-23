# SEO, Crawling and Discovery

**Product:** Mayuresh Kasar Portfolio ("MAYURESH.DEV")
**Document owner:** Mayuresh Kasar
**Status:** Source of truth for SEO and crawler discovery
**Version:** 2.0
**Last updated:** 2026-11-22
**Site:** <https://mk-portfolio-phi-silk.vercel.app>
**Code:** `client/scripts/build-seo.mjs`, `client/vercel.json`, `client/public/robots.txt`, `client/src/components/common/SEO.jsx`, `client/tests/seo-build.test.js`

**Related:** [SEARCH_ENGINE_SETUP.md](./SEARCH_ENGINE_SETUP.md) · [DEPLOYMENT.md](./DEPLOYMENT.md) · [ANALYTICS_SETUP.md](./ANALYTICS_SETUP.md)

---

## 1. What the build generates

`client/package.json` runs:

```text
vite build && node scripts/build-seo.mjs
```

`build-seo.mjs` reads the blog post modules (plain data, importable by Node)
and writes the following into `client/dist`:

| Artefact | Purpose |
|---|---|
| `<route>/index.html` | Route-specific HTML with the correct head, JSON-LD and a `<noscript>` summary |
| `index.html` | Homepage (already emitted by Vite, metadata replaced by the generator) |
| `404.html` | Real not-found document, served with HTTP 404 by the platform |
| `sitemap.xml` | Every indexable URL; `/admin`, `/admin/dashboard` and `/api` excluded |
| `rss.xml` | RSS 2.0 feed of published posts |
| `llms.txt` | Compact, factual site summary for AI crawlers |
| `manifest.json` | Web app manifest copied from `client/public` |
| `.well-known/security.txt` | Security contact, copied from `client/public` |

There is **no committed sitemap** in `client/public`. The build is the only
source, so a stale URL cannot survive a deploy. `client/public/sitemap.xml`
was deleted for that reason.

Current output on a clean build:

```text
build-seo: 2 blog posts, 22 sitemap URLs, 25 route documents
```

The 25 route documents are 12 public static pages, 2 blog posts, 8 taxonomy
pages, `/admin`, `/admin/dashboard`, and `404.html`.

## 2. Sitemap contents

The 22 indexable URLs are:

- `/`, `/about`, `/skills`, `/projects`, `/certificates`, `/system`, `/contact`, `/blog`, `/tools`
- `/privacy`, `/terms`, `/accessibility`
- `/blog/how-i-built-my-full-stack-developer-portfolio`
- `/blog/react-and-vite-architecture-for-a-portfolio-spa`
- `/blog/tag/architecture`, `/blog/tag/frontend`, `/blog/tag/full-stack`, `/blog/tag/nodejs`, `/blog/tag/react`, `/blog/tag/vite`
- `/blog/category/frontend`, `/blog/category/full-stack`

`/admin` and `/admin/dashboard` are deliberately absent. The sitemap
generator filters on `route.sitemap !== false`, and the private routes set it
to `false`. A test asserts that no `/admin` or `/404` URL can appear.

`lastmod` comes from the post date/update date; static pages use the build
date. `priority` and `changefreq` are hints, not ranking controls.

## 3. Per-route HTML

A single-page app normally serves the homepage `<head>` for every route.
Search engines that execute JavaScript eventually see the client-side `SEO`
component, but social scrapers, some crawlers, and link unfurlers often do
not. The build therefore writes a route-specific copy of `dist/index.html`:

- `<title>`
- `name="description"`
- `name="robots"` (`index, follow, max-image-preview:large`, or
  `noindex, nofollow` for admin and 404)
- `rel="canonical"`
- `og:title`, `og:description`, `og:url`, `og:type`
- `twitter:title`, `twitter:description`
- article publication/modification/section tags for posts
- a JSON-LD graph: `WebSite`, `Person`, `WebPage` or `CollectionPage`,
  `BreadcrumbList`, and `BlogPosting` for articles
- a route-specific `<noscript>` block with an `<h1>`, description and links

The app still hydrates from the same bundle. This is **metadata
prerendering**, not React server-side rendering. The `<noscript>` block is a
readable summary, not the full interactive page. The React `SEO` component
still updates metadata on client-side navigation and removes stale dynamic
JSON-LD when a route has none.

The homepage keeps the static `Person` + `WebSite` + `ProfilePage` graph
shipped in `client/index.html`; the generator does not replace it.

## 4. Clean URLs and 404

`client/vercel.json` sets:

```json
"cleanUrls": true,
"trailingSlash": false
```

Consequences:

- `/about` serves `about/index.html`.
- `/about/` redirects to `/about`.
- Unknown paths are not rewritten to the SPA shell. They serve `404.html`
  with HTTP 404, so search engines see a real not-found response instead of a
  soft 404 with the homepage title.
- `/api/*` is the only rewrite, proxied to the Render API.

The old catch-all rewrite (`/(.*)` → `/index.html`) was removed. Vite's dev
server and Nginx still need their own SPA fallback for local development;
that is separate from the production Vercel contract.

## 5. robots.txt

`client/public/robots.txt` allows public content and excludes private
surfaces:

```text
User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/
Disallow: /api/

User-agent: GPTBot
User-agent: ClaudeBot
User-agent: PerplexityBot
User-agent: Google-Extended
User-agent: CCBot
User-agent: Applebot-Extended
Allow: /
Disallow: /admin
Disallow: /admin/
Disallow: /api/

Sitemap: https://mk-portfolio-phi-silk.vercel.app/sitemap.xml
```

The named AI crawlers are allowed to read public content so the owner's work
can be summarised and cited, with the same private exclusions. This is a
policy choice, not a ranking guarantee. Change it if the owner prefers to
opt out of AI crawling.

`/admin` also sends `X-Robots-Tag: noindex, nofollow` from `vercel.json` and
carries a `noindex` meta tag in its generated document.

## 6. llms.txt

`dist/llms.txt` is a short, link-rich summary for language models. It lists
the canonical site, contact address, source repository, core pages, articles,
policies, and explicit notes:

- cite the canonical URLs;
- do not infer employers, salary, availability, or personal details;
- the JWT decoder does not verify signatures;
- `/admin` and `/api/` are private.

It is generated from the same route list as the sitemap and cannot include a
private route.

## 7. RSS, manifest and security.txt

- `/rss.xml` is an RSS 2.0 feed of the blog, with RFC 822 dates and absolute
  links. `index.html` advertises it with `rel="alternate"`.
- `/manifest.json` provides name, short name, theme colours, and an SVG icon.
  `index.html` links it with `rel="manifest"`.
- `/.well-known/security.txt` gives a security contact, expiry, canonical URL
  and a policy link to `docs/SECURITY.md`. It contains no secret.

## 8. Verification

Local build:

```bash
cd client
npm test          # includes seo-build.test.js and taxonomy.test.js
npm run lint
npm run build
```

The build must print `22 sitemap URLs` while both posts are published. If a
post is added, the count increases by one plus any new tag/category pages.

Inspect the output:

```powershell
([xml](Get-Content dist\sitemap.xml)).urlset.url.Count
Select-String -Path dist\sitemap.xml -Pattern 'admin|/api|404'
Get-Content dist\llms.txt -TotalCount 20
```

Expected: 22, no matches, and a factual summary.

A local static server using the same clean-URL rules was used to verify
`/`, `/about`, `/blog/<slug>`, the three policy pages, `/admin`,
`/does-not-exist` (404), `sitemap.xml`, `rss.xml`, `llms.txt`, `robots.txt`,
`manifest.json` and `/.well-known/security.txt`. That proves the artefacts
map correctly; Vercel edge behaviour is verified after deployment.

Production checks after an approved deploy:

```powershell
(Invoke-WebRequest 'https://mk-portfolio-phi-silk.vercel.app/sitemap.xml').StatusCode
(Invoke-WebRequest 'https://mk-portfolio-phi-silk.vercel.app/rss.xml').StatusCode
(Invoke-WebRequest 'https://mk-portfolio-phi-silk.vercel.app/llms.txt').StatusCode
(Invoke-WebRequest 'https://mk-portfolio-phi-silk.vercel.app/admin').Headers['x-robots-tag']
(Invoke-WebRequest 'https://mk-portfolio-phi-silk.vercel.app/does-not-exist' -SkipHttpErrorCheck).StatusCode
```

Expected: `200`, `200`, `200`, `noindex, nofollow`, and `404`.

## 9. Maintenance

| Check | Cadence |
|---|---|
| Sitemap count matches published routes and excludes `/admin` | Every build |
| New private route added to `robots.txt` and the build filter | Before deploy |
| New post has a unique slug, description, date and tags | Before publishing |
| Canonicals match the live domain | After a domain change |
| 404 returns HTTP 404, not a soft 404 | After changing `vercel.json` |
| `llms.txt` and `security.txt` still resolve | After deploy |
| Search Console / Bing sitemap submission | After the first approved deploy of this branch |

## 10. Honest limits

- This is not full SSR. A crawler that ignores both HTML head metadata and
  the `<noscript>` block still cannot see the React-rendered page.
- Structured data does not guarantee rich results.
- The sitemap helps discovery; it does not guarantee indexing or rankings.
- No ranking, traffic, or "100k visitors" claim is supported by these
  changes alone. See [SIX_MONTH_GROWTH_PLAN.md](./SIX_MONTH_GROWTH_PLAN.md) and
  [../AUDIT/GROWTH_JOURNAL.md](../AUDIT/GROWTH_JOURNAL.md) for the measured
  plan and its assumptions.
