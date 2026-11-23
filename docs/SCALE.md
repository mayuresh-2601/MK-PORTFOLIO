# Scale and Capacity Notes

**Product:** Mayuresh Kasar Portfolio ("MAYURESH.DEV")
**Document owner:** Mayuresh Kasar
**Status:** Capacity assumptions and triggers
**Version:** 1.0
**Last updated:** 2026-11-22
**Related:** [ARCHITECTURE.md](./ARCHITECTURE.md) · [PERFORMANCE.md](./PERFORMANCE.md) · [MONITORING.md](./MONITORING.md) · [DEPLOYMENT.md](./DEPLOYMENT.md)

## 1. What "100,000 visitors" means

The six-month goal is 100,000 genuine organic visitors, not 100,000
simultaneous users. Even spread over 180 days that is about **556 visitors per
day**, or roughly **0.4 requests per minute** if perfectly uniform. Real
traffic is bursty, so plan for peaks rather than the average.

This document does not claim that the current stack has been load-tested. No
load test was run in this change. The numbers below are a capacity model and a
list of limits to verify, not measured throughput.

## 2. Current architecture

| Layer | Capacity characteristic | Limit / risk |
|---|---|---|
| Frontend | Static files on Vercel's CDN | Effectively scales for a portfolio; build minutes are the free-tier constraint |
| API | One Render free web service, Node 22 | Single instance, cold starts after idle, in-memory rate limits |
| Database | TiDB Cloud Serverless (MySQL compatible) | Connection and request-unit limits depend on the plan; verify in the console |
| Media | Cloudinary free tier | Upload/storage/transformation quotas; verify in the console |
| Email | Gmail API / SMTP | Gmail sending limits; not a bulk mail service |
| AI | Google Gemini API | Paid per request after any free allowance; daily counters are a cost brake |
| CI/CD | GitHub Actions free minutes | Build frequency, not visitor traffic |

## 3. Likely bottlenecks, in order

1. **Render cold start.** A free instance idles; the first request can take
   30–60 seconds. The client uses a 60-second timeout, a loading state and one
   GET retry. This is the dominant visitor-facing delay, not CPU.
2. **Single API instance.** All requests share one process. In-memory rate
   limits and AI daily counters are per instance, and a restart resets them.
3. **TiDB connection pool.** The pool is capped at 10 by default (maximum 20).
   Long-running or leaked connections would exhaust it before CPU does.
4. **Cloudinary upload quota.** Uploads are rare (admin-only plus contact
   attachments), so quota is a cost risk, not a traffic bottleneck.
5. **Gemini cost.** AI explainers are the only per-request paid dependency.
   Limits are a brake, not a billing guarantee.
6. **Client payload.** The production build is roughly 383 kB of JavaScript
   (121 kB gzip), 55 kB of CSS (11 kB gzip) plus self-hosted fonts. That is
   acceptable for a portfolio but is the main mobile LCP cost.

## 4. What scales without work

- Static HTML, CSS, JS, fonts and images on Vercel's CDN.
- Public API reads at the current four-table scale (tens of rows).
- Blog and taxonomy pages, which are generated at build time.
- The contact form's database write path, as long as the pool is healthy.

## 5. What breaks first under a real spike

| Scenario | Expected behavior | Mitigation |
|---|---|---|
| 100+ requests/second for minutes | Render instance saturates; latency rises; some 429/5xx | Vercel/CDN absorbs static traffic; add a queue, cache or paid instance only if evidence demands it |
| Render restarts during a burst | In-memory limits reset; cold start | Accept for now; monitor; move limits to a shared store before multi-instance |
| TiDB connection exhaustion | API reads/writes time out | Keep pool ≤ 20, fix leaks, add indexes before adding instances |
| AI endpoint hammered | 429 from the limiter, then 502 if Gemini fails | Keep `AI_ENABLED` kill switch; lower daily limits |
| Contact form spam wave | 429/400 responses; DB writes limited | Existing honeypot, timing, heuristics and limiter; add edge rules if needed |

## 6. Measurement plan

Before changing capacity, capture real numbers:

- warm and cold API latency for `/api/health`, `/api/projects`, `/api/skills`;
- Render memory/CPU and restart count;
- TiDB connection count and slow queries;
- Vercel Core Web Vitals (LCP, INP, CLS);
- 429/5xx rates from provider logs;
- Cloudinary and Gemini usage against their quotas.

A local Lighthouse run is recorded in [../AUDIT/RUN_ALL_REPORT.md](../AUDIT/RUN_ALL_REPORT.md).
It measures the built site, not production latency.

## 7. Triggers for action

Act only when evidence crosses a threshold:

| Signal | Threshold | Action |
|---|---|---|
| Warm API p95 | > 1 s for simple reads | Profile queries, add indexes, check pool |
| 5xx rate | > 1% over an hour | Inspect Render logs, roll back the last change |
| Render memory | > 80% sustained | Find the leak or move to a larger instance |
| Cold starts | More than a few per day | Add a keep-warm ping only if the free tier permits, or accept the delay |
| AI spend | Approaching the monthly budget | Lower `AI_DAILY_LIMIT` / `AI_GLOBAL_DAILY_LIMIT`, or disable |
| DB connections | Near the pool cap | Fix leaks, shorten transactions, then raise carefully |

## 8. Honest limits

- No load test, soak test, or multi-instance test has been run.
- No CDN-level WAF or DDoS plan is configured on the free tier.
- The 100k visitor goal depends on content, distribution and search
  indexing; infrastructure is necessary but not sufficient.
- Provider quotas (TiDB, Cloudinary, Gemini, Gmail, Render, Vercel) must be
  checked in their consoles. This repository cannot verify them.
