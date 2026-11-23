# ANALYTICS SETUP — GOOGLE ANALYTICS 4 (Optional)

**Date:** 2026-11-21
**Status:** `NOT ENABLED BY DEFAULT`

> Per the working agreement in `AGENTS.md` (invariant 12), adding analytics is
> a **new third-party service** and needs explicit owner approval. This document
> records the implementation that is ready to enable, the exact CSP changes
> required, and the privacy guarantees. **Until the owner says so, this
> feature stays off and `client/.env` is not changed.**

---

## 1. What is implemented

`client/src/lib/analytics.js`

```js
export const isEnabled = () =>
  Boolean(MEASUREMENT_ID) &&
  import.meta.env.PROD === true &&
  typeof window !== "undefined";

export const trackEvent = (event_name, params = {}) => { ... };
export const trackPage = (path) => trackEvent("page_view", { page_path: path });
```

- Exported and typed (`client/src/lib/analytics.d.ts`).
- Enabled only when **both** of these are true:
  - `VITE_GA_MEASUREMENT_ID` is set in `client/.env`
  - `import.meta.env.PROD` is true (never in dev)
- Initialisation pushes `["js", new Date()]` and `["config", ID]` to
  `window.dataLayer` and loads `https://www.googletagmanager.com/gtag/js?id=...`.

## 2. Events implemented

| Event name | Emitted where | Purpose |
| --- | --- | --- |
| `page_view` | `App.jsx` on every route change | Page views by path |
| `resume_download_clicked` | `Footer.jsx` resume link | Resume CTA clicks |
| `github_link_clicked` | `Footer.jsx` GitHub | GitHub CTA clicks |
| `linkedin_link_clicked` | `Footer.jsx` LinkedIn | Social CTA clicks |
| `contact_form_submitted` | `Contact.jsx` after successful send | Contact conversions |

**No other events are planned without a decision.** Event names, page paths,
and labels only — never query strings, query values, passwords, JWTs, form
contents, or message contents.

## 3. Enabling it (owner approval)

1. Create a Google Analytics 4 **property** for `https://mk-portfolio-phi-silk.vercel.app`.
2. Copy the **Measurement ID** (`G-XXXXXXXXXX`).
3. Add to `client/.env` (do not commit — it is gitignored):
   ```
   VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```
4. **Update `client/vercel.json` CSP** — `script-src` currently reads
   `script-src 'self'`. GA needs two extra hosts. Required change (this is a
   config review with the owner, not a pull request):
   ```
   "script-src": ["'self'", "https://www.googletagmanager.com", "https://www.google-analytics.com"]
   ```
   Also consider adding
   `https://www.google-analytics.com` to `connect-src` if the page uses
   `gtag` fetch (by default GA4 uses the script + no first-party fetches;
   `connect-src` changes are not required in the default configuration).
5. Redeploy the client on Vercel.
6. Verify in the GA4 UI under "Reports" → "Realtime" — the home page should
   appear as a real-time event.

### Verification evidence template

```
Date: <date>
GA4 Measurement ID: G-XXXXXXXXXX (verified redacted in chat)
Live site: https://mk-portfolio-phi-silk.vercel.app
CSP updated: yes/no — see vercel.json diff <commit hash>
Realtime check: <screenshot of GA4 realtime, or "not run">
```

## 4. Privacy guarantees (invariant check)

| Guarantee | Status |
| --- | --- |
| No passwords/JWTs in events | Yes — `trackEvent` only receives static names, paths, labels |
| No form contents or message contents | Yes |
| No personally identifiable information beyond public paths | Yes |
| No traffic from `localhost`/dev | Yes — `import.meta.env.PROD` gate |
| No secrets in `client/` | Verified by `gitleaks` scan |

## 5. Measurement dashboard

`AUDIT/PENDING_ANALYTICS.md` documents the metric plan (the dashboard itself
is a manual report built from analytics + GSC/Bing data, see
`docs/SEARCH_ENGINE_SETUP.md`).

## 6. Maintenance

- Rotate the Measurement ID if you lose access to the GA4 property —
  `client/.env` is not committed.
- GA4 deprecates some features; re-verify `connect-src` when gtag changes.
