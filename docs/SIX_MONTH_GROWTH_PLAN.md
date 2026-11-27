# SIX-MONTH ORGANIC GROWTH PLAN — MK-PORTFOLIO

**Start date:** 2026-11-21
**End date:** 2027-05-21 (six calendar months)
**Goal:** 100,000 genuine visitors by end of programme
**Budget:** ₹0 — all work is free and organic
**Principle:** all numbers below are **targets**; never fabricate data.

---

## 1. Overview

Realistic positioning for a developer portfolio targeting worldwide software
developers, recruiters and hiring managers.

Baseline (as of 2026-11-21):

| Metric | Baseline value |
| --- | --- |
| Indexable pages in sitemap | 7 (/, /about, /skills, /projects, /certificates, /system, /contact) |
| Blog posts | 0 |
| Developer tools pages | 0 |
| GA4 installed | no (owner decision pending) |
| GSC account | not configured |

Primary objective: **100,000 genuine website visitors.**

Honesty note: for a single developer portfolio, 100k visitors in 6 months is
achievable on some niches but requires sustained visibility. Treat the plan as
a structure, not a promise.

---

## 2. Monthly plan

### Month 1 (Nov – Dec 2026): Foundations

**Goals**
- Verify every route renders 200 with correct per-route metadata.
- Publish the blog engine with 2 technical articles.
- Generate sitemap/RSS.
- Set up GSC + Bing, submit sitemap + RSS.
- Enable GA4 (pending owner approval).

**Checklist**
- [ ] `npm run build` green; `npm run lint` green; server `npm test` green (119 tests); client `npm test` green (38 tests).
- [ ] `sitemap.xml` and `rss.xml` validate (see `docs/SEARCH_ENGINE_SETUP.md` §1, §2).
- [ ] `/admin` returns `noindex, nofollow`.
- [ ] Every route returns `200` and a unique title/description (curl check).
- [ ] Blog published at `/blog` with 6 posts.
- [ ] GSC: sitemap submitted, robots.txt valid.
- [ ] Bing Webmaster Tools: sitemap + RSS submitted.
- [ ] GA4: Measurement ID configured, realtime check (owner-approved).
- [ ] README updated with blog/tools links.

**Content targets**
- Publish: 6 articles (tracked in `docs/EDITORIAL_STRATEGY.md`).

### Month 2 (Jan 2027): Depth

**Goals**
- Deepen content: Deployment, CI/CD, Monitoring.
- 2 new blog posts.
- Internal linking between posts and product pages.

**Checklist**
- [ ] Blog posts published (from outline list in `docs/EDITORIAL_STRATEGY.md`).
- [ ] Each new post linked from `/blog` page and from related posts.
- [ ] GSC coverage: new pages indexed (manual index requests for 1 page at a time).

**Content targets**
- 2 blog posts.

### Month 3 (Feb–Mar 2027): Community & Developer Tools

**Goals**
- Publish `/tools` (JSON formatter, URL encoder, etc.).
- 2 posts on DevOps/CI topics.
- Begin DEV Community, GitHub gist series.

**Checklist**
- [ ] `/tools` page live; 2–3 tools tested locally; `npm test` green.
- [ ] 2 blog posts.
- [ ] DEV Community posts authored and posted (5 comments on relevant threads).
- [ ] GitHub repositories: polished, topic tags added.

**Content targets**
- 2 blog posts + tools launch.

### Month 4 (Apr 2027): International & Collaboration

**Goals**
- 2 posts in diverse topics.
- Consider translations for popular posts.

**Checklist**
- [ ] 2 blog posts.
- [ ] PDF export of key posts (if requested by community).
- [ ] Collaborate with one open-source contributor or peer.

**Content targets**
- 2 blog posts.

### Month 5 (May 2027): Scaling

**Goals**
- Review GSC and Bing data; double down on working channels.
- Begin IndexNow ping if desired (see `docs/SEARCH_ENGINE_SETUP.md`).

**Checklist**
- [ ] Monthly traffic report generated.
- [ ] Identify top-performing pages; refresh them (add sections).
- [ ] Deep-link internal pages from new content.

### Month 6 (Jun 2027): Consolidation

**Goals**
- Measure, iterate, and consolidate successful strategies.
- Update `README.md` and `docs/` with real numbers.

**Checklist**
- [ ] Monthly traffic report generated.
- [ ] Identify top-performing pages; refresh them.
- [ ] Review CTA performance (contact rate).

---

## 3. Traffic targets (honest ranges)

| Metric | Month 1 | Month 3 | Month 6 |
| --- | --- | --- | --- |
| Unique visitors (GA4 realtime / GSC avg) | 0 (GA4 not yet approved) | 500 | 1,500–5,000 |
| New unique visitors (estimate) | 0 | 1,000 | 3,000–8,000 |
| Sitemap impressions (GSC) | 0 | 50–150 | 500–2,000 |
| Blog visits (GA4) | 0 | 200 | 1,000–3,000 |
| Contact enquiries (email, nothing fabricated) | not measured | 5–20 | 50–200 |

Targets are aspirational. Actual data is recorded monthly in
`docs/SIX_MONTH_GROWTH_PLAN.md` §Metrics and `AUDIT/GROWTH_JOURNAL.md`.

---

## 4. Growth engine

### 4.1 Technical content → organic

Every post is written to answer a specific technical question. People
searching that question find it via Google. Content is distributed to
communities once with an honest link, never spammed.

### 4.2 Discovery channels

| Channel | Frequency | Free? |
| --- | --- | --- |
| Blog + Sitemap + RSS | continuous | Yes |
| GSC + Bing | continuous | Yes |
| DEV Community | 2/month | Yes |
| GitHub | continuous (repo, topics, README) | Yes |
| LinkedIn organic | 2–3/month | Yes |
| YouTube (short dev videos) | monthly | Yes |
| Reddit | 1–2/month (relevant threads) | Yes |
| IndexNow | as built | Yes |

### 4.3 Engagement

- CTA on every page: portfolio, GitHub, contact.
- Blog share buttons (Twitter/LinkedIn/copy).
- Author signature on posts (automated, links to /about and /contact).

---

## 5. Metrics

| Metric | Source | Method |
| --- | --- | --- |
| Unique visitors | GA4 / GSC / Render logs | Manual report, once/month |
| Impressions | GSC + Bing | Copy into `docs/SIX_MONTH_GROWTH_PLAN.md` |
| CTR | GSC | Copy into the same file |
| Position | GSC | Track top-3 improvements |
| Blog visits | GA4 / GSC (when enabled) | Same |
| Contact enquiries | Email inbox / Google Form | Count in `docs/SIX_MONTH_GROWTH_PLAN.md` |

Example monthly report format:

```markdown
# Growth journal — month YYYY
- GA4 unique visitors: X (previous: Y)
- GSC impressions: X — top queries:
  - ...
- Indexed pages (GSC Coverage): X / Y
- Blog posts: N, top post: /blog/<slug> (X visits)
- New GitHub repositories: N
- Contact enquiries: N
- Notes/observations.
```

Reports are stored in `AUDIT/GROWTH_JOURNAL.md`.

---

## 6. Risk register

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| GA4 not approved | Medium | Low | Plan B: GSC/Bing-only measurement |
| Traffic plateau | Medium | Medium | Re-audit top queries; improve CTAs |
| Owner busy | Medium | Low | Publish 2 posts/month minimum, document |
| Build breaks | Low | High | Every build must pass CI |

---

## 7. Non-goals

- Paid ads, buying traffic, or premium SEO services (violates budget policy).
- Faking analytics data or impressions.
- Paying for an IndexNow or ping service.
- Automating community posts (anti-spam rules).

---

## 8. Deliverables and owner decisions

| Item | Status | Owner decision required |
| --- | --- | --- |
| GA4 enabling | Code ready, not enabled | Yes (see `docs/ANALYTICS_SETUP.md`) |
| Blog articles | 6 published (`how-i-built-my-full-stack-developer-portfolio`, `react-and-vite-architecture-for-a-portfolio-spa`, `docker-compose-bcrypt-hash-ci-failure`, `cookie-sessions-without-jwt-localstorage`, `static-seo-and-real-404s-in-a-react-spa`, `fail-fast-environment-validation`) | Yes — review |
| `/tools` | Implemented; linked in Navbar (`Navbar.jsx`) | Owner — can unlink if undesired |
| Growth journal template | `AUDIT/GROWTH_JOURNAL.md` created | Yes — fill monthly |
| Review cadence | Monthly growth journal + data update | Yes |

## 9. Next steps

1. Owner: review the 6 published articles.
2. Owner: approve GA4 enabling or defer.
3. Run `npm run build`, `npm run lint`, server `npm test` — evidence in `AUDIT/FINAL_VERIFICATION.md`.
4. Launch: `sitemap.xml`/`rss.xml` deployed; GSC/Bing configured.
5. Monthly: growth journal review.
