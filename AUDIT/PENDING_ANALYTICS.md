# PENDING ANALYTICS

**Created:** 2026-11-21
**Status:** PENDING — requires owner approval

This file is intentionally short. Analytics is implemented but disabled by
default. See `docs/ANALYTICS_SETUP.md` for the complete record: CSP changes,
privacy guarantees, event names, and verification steps.

---

## Summary

| Item | State |
| --- | --- |
| GA4 Measurement ID configured in `client/.env` | No |
| Analytics script loaded in production | No |
| CSP updated | No |
| GA4 property created on Google side | No |
| Verification complete | No |

## What is ready

- `client/src/lib/analytics.js` — isolated, env-gated module.
- Events: `page_view`, `resume_download_clicked`, `github_link_clicked`,
  `linkedin_link_clicked`, `contact_form_submitted`.
- Route tracking wired into `App.jsx` (paths only, no query strings).

## Blocking decision

Per `AGENTS.md` §13 ("Stop and ask") and invariant 12, **adding analytics is a
new third-party service**. Until the owner says yes, `client/.env` is not
changed and no script is loaded.

## When the owner approves

1. Follow the 5 steps in `docs/ANALYTICS_SETUP.md`.
2. Fill in this file with the Measurement ID (write it here, not in chat) and
   the CSP diff.
3. Verification evidence (realtime check in GA4).
4. Mark the status row above as `ENABLED`.

---

## Recorded approvals

(To be filled when the owner approves.)

| Item | Approved by | Date |
| --- | --- | --- |
| Enable GA4 | | |
