# SEARCH ENGINE SETUP — GOOGLE & BING

**Date:** 2026-11-21
**Owner:** Mayuresh Kasar

This document is the manual setup guide for the production site. The tools
themselves are free; no paid plan is required. **Nothing in this document is
verified by the repository — index status, crawl errors and impressions are
account facts and can only be read from your accounts.**

---

## 1. Google Search Console

1. Open https://search.google.com/search-console
2. Add property: **https://mk-portfolio-phi-silk.vercel.app** (URL-prefix property).
3. Verify using **any of**:
   - **Domain-level property** — for `mk-portfolio-phi-silk.vercel.app`,
     which lets you manage both the apex and apex paths; needs a DNS
     `TXT` record. Add a `CNAME` (or, for `apex.vercel.app`) the record
     Google shows.
   - **URL-prefix** — `https://mk-portfolio-phi-silk.vercel.app/` — verify
     with `HTML file` upload, `Google Analytics` or `Meta tag` (the
     recommended "owners" list shows all of your accounts).
4. After verification, verify **`/sitemap.xml`**:
   `https://mk-portfolio-phi-silk.vercel.app/sitemap.xml` — expect a valid
   sitemap that loads (no XML errors).
5. On the **Sitemap** tab: submit
   `https://mk-portfolio-phi-silk.vercel.app/sitemap.xml`.
   **Do not claim success here.** Google warns: "Don't expect instant indexing."
   Read the status after 24–48 hours: a valid sitemap has no errors and shows
   indexed pages as they appear.

### GSC manual indexing (use sparingly — not a ranking hack)

- **URL inspection** → paste `https://mk-portfolio-phi-silk.vercel.app/<path>`
  → check the request result is `Indexed` or `Submit to index`.
- **Coverage report** → note pages that are `Error`, `Excluded by...`, or
  `Discovered — currently not indexed`. Fix the issue first, then request
  indexing only for one page at a time, not in bulk.

### Core Web Vitals (GSC)

Read the "Core Web Vitals" report quarterly. Check **LCP < 2.5s** on mobile
and desktop, and **INP < 200ms**.

---

## 2. Bing Webmaster Tools

1. Open https://www.bing.com/webmasters/
2. Sign in with a Microsoft account (or create one; a separate email is not
   required for Bing to serve a site — you can reuse your Google account).
3. Add the site: `https://mk-portfolio-phi-silk.vercel.app`.
4. Verify — options:
   - **Confirm by upload** (HTML file) — quickest.
   - **Meta tag** — add Bing's `<meta name="msvalidate.01">` to the same
     `<head>` Google allows.
5. Submit:
   - Sitemap: `https://mk-portfolio-phi-silk.vercel.app/sitemap.xml`
   - RSS feed (Bing consumes RSS): `https://mk-portfolio-phi-silk.vercel.app/rss.xml`
6. Inspect the **Bing Index Explorer**: requests the site crawls, errors and
   statistics.

---

## 3. Bing and Google difference — what you can actually measure

- **GSC**: impressions, clicks, impressions, CTR, position. Available after
  the sitemap is live and the site is indexed.
- **Bing Webmaster Tools**: impressions, clicks, positions; slower to
  populate (Bing crawls less often than Google).
- **RSS**: Bing reads feeds; Google prefers sitemaps, but it also reads
  feeds. Both are fine.

Expected first month on a small, single-page-per-URL site:

- **Impressions:** hundreds to low thousands — normal.
- **Clicks:** 0–20/month initially.
- **CTR:** typically 0.5–2% of impressions.

If CTR stays below 0.1% for pages like `/skills` or `/projects`, the titles
or snippets are being ignored — improve the first line of the title or
description.

**Do not fabricate numbers.** If you don't know a number, write
`not-measured` or `pending-review`.

---

## 4. What this repository does NOT do

- It does not claim indexing from a sitemap's existence.
- It does not run GSC/Bing automation (requires browser access).
- It does not promise rankings or visitors.
- It does not spam links, claim backlinks, or create fake content.

After verifying in GSC and Bing, copy the evidence into
`docs/SEARCH_ENGINE_SETUP.md` under "Verification evidence" (see the
template in §5).

# Verification evidence

(Fill in after verifying in your accounts. No fabricated numbers.)

## GSC
- Sitemap submitted: ... date
- Indexed pages (Coverage tab): ... pages
- Manual indexing requests: [dates]

## Bing Webmaster Tools
- Sitemap submitted: ... date
- RSS submitted: ... date

