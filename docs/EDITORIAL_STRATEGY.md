# EDITORIAL STRATEGY — MK-PORTFOLIO

**Date:** 2026-11-21
**Owner:** Mayuresh Kasar
**Status:** Draft — review and approve specific posts with the owner

## Purpose

MK-PORTFOLIO is a developer portfolio. Its audience is worldwide software
developers, recruiters, hiring managers, engineering managers, technology
companies and students. The strategy targets organic discovery through
technical articles that are genuinely useful, backed by the actual
implementation in this repository.

**Rules** (from `AGENTS.md` §11):
- Do not invent facts. Every claim must be verifiable against the codebase or
  the live site.
- Require owner approval before publishing first-person claims about
  personal experience, hiring decisions, performance improvements, business
  impact or awards.
- Do not auto-publish.

---

## 1. Published posts (draft)

These are written and stored under `client/src/content/posts/`. They are
technically grounded in the repository. The owner decides whether they are
accurate as personal narratives and approves publication.

| Post | Why it is search-relevant | Target query intent |
| --- | --- | --- |
| `how-i-built-my-full-stack-developer-portfolio` | "How I built my full stack developer portfolio", "React + Node.js + MySQL portfolio architecture", "jwt authentication portfolio", "docker compose portfolio" | Developers evaluating portfolios, looking for architecture patterns |
| `react-and-vite-architecture-for-a-portfolio-spa` | "React and Vite portfolio architecture", "React Router portfolio", "self-hosted fonts React", "code splitting Vite SPA" | Developers deciding between SPA, SSR, or static for their own sites |

Draft status: `DRAFT — review and approve before publishing`.

## 2. Ready-to-write outlines (12 of 12 from the mission)

For each, the deliverable is an **outline with verified statements**. Publishing
requires owner approval.

1. **How I Built My Full Stack Developer Portfolio** (published)
2. **React and Vite Architecture** (published)
3. **Node.js REST API Development**
4. **JWT Authentication and Security**
5. **MySQL vs TiDB**
6. **Docker Compose for Beginners**
7. **Deploying React and Node.js Projects**
8. **Live System Monitoring Dashboard**
9. **Gemini AI Integration**
10. **Express REST API Security**
11. **GitHub Actions CI/CD**
12. **Full Stack Developer Project Architecture**

For each post, follow this template:

```
## Intro (150–250 words)
- Why this matters for a portfolio.
- One concrete, verifiable fact about the repo (e.g., "The API returns 503 when
  the database is unreachable — see /api/health/ready").

## H2 sections with code examples
- Every claim links to a file in the repo or a route on the live site.
- Code samples are copies of real code (verify against git).

## Footer
- Related articles.
- CTA to the portfolio.
```

## 3. Distribution checklist (per post)

| Channel | Action | Owner approval? |
| --- | --- | --- |
| Blog route | Publish (see `docs/SEO_SETUP.md`) | Already implied |
| GitHub README | Link the post in `README.md` (owner edits) | Yes |
| LinkedIn | 1–2 posts per week (organic, with link) | No — content policy is the user's |
| Discord/Reddit/DEV Community | Share via link, in relevant communities | Respect community rules; owner oversight |
| RSS | Feed is generated automatically | — |

## 4. Content calendar (6 months)

**Month 1 (Nov–Dec 2026)** — Foundations
- Publish the two drafts.
- Publish `docs/SEO_SETUP.md`, `docs/ANALYTICS_SETUP.md` (pending).
- Add `rss.xml` feed.
- Weekly: 2 posts (if approved) + 1 LinkedIn post.

**Month 2 (Jan 2027)** — Traffic. Depth.
- Posts: DevOps, deployment (React on Vercel).
- Weekly: 2 posts + 2 LinkedIn posts.

**Month 3 (Feb–Mar 2027)** — Community.
- DEV Community, a GitHub Gist series, open-source contributions.

**Month 4 (Apr 2027)** — Developer tools.
- Publish `/tools` pages and first tool using them.

**Month 5 (May 2027)** — International & collaboration.
- Post threads in multiple languages where applicable.

**Month 6 (Jun 2027)** — Scaling successful channels.
- Refresh top-performing content, deep-link internal pages, run an IndexNow ping.

### Weekly Publishing Target (quality over quantity)

- 2 high-quality technical posts.
- 1–2 organic LinkedIn posts.
- 3 short coding videos (1–3 min) — canvas: architecture walk-throughs.
- 1 meaningful community contribution.

### Success criteria (actual, no fabricated numbers)

| Metric | When to review | Target (softer, realistic) |
| --- | --- | --- |
| Blog visits (GSC + logs) | Monthly | 400 by end of month 6 |
| New unique visitors (GA4 when approved) | Monthly | 500/month by month 6 |
| Sitemap impressions (GSC) | Weekly | 15+ indexed pages by month 6 |

Traffic milestones are aspirational; update with real data from `docs/SIX_MONTH_GROWTH_PLAN.md` §Metrics.

## 5. Approval requirements

- Publishing first-person experience claims — yes.
- New topics — yes (owner veto).
- Channel specifics — the user reviews before posting.
- Frequency — user decides; this document holds 2 posts/month minimum.

## 6. Anti-spam rules

- One post per site ≈ every 3–4 weeks.
- Never post to a channel the user hasn't joined.
- Never reuse the same text across channels without personalisation.
- Never post links to paid services, audits, or coaching.

## 7. Labeling

Draft status:
- `PUBLISHED` — published.
- `DRAFT` — ready for owner review.
- `OUTLINE — REVIEW` — not yet written.

This file is updated after each review:

```
| Status | Updated | Owner |
```

---

**Next owner action:** Review the two published drafts. If they are acceptable,
add `PUBLISHED` to `client/src/content/posts/*.js` frontmatter? (no frontmatter
— status is tracked in this doc and by commit.)
