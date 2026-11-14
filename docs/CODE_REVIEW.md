# Code Review Guide

**Product:** Mayuresh Kasar Portfolio ("MAYURESH.DEV")
**Document owner:** Mayuresh Kasar
**Status:** Review standard for this repository
**Version:** 1.0
**Last updated:** 2026-11-14
**Related:** [AGENTS.md](./AGENTS.md) · [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) · [TESTING.md](./TESTING.md) · [FEATURE_DEVELOPMENT.md](./FEATURE_DEVELOPMENT.md)

---

## 1. Purpose

This guide defines what a good change looks like in this codebase and how to review one. It is written for a solo owner working with an AI agent, so it favors explicit checklists over social process.

A review is not a style preference exercise. It answers four questions:

1. Does the change do what was asked, without expanding scope?
2. Can it break production, security, data, or accessibility?
3. Is it consistent with the existing architecture and design system?
4. Is the evidence sufficient to merge and deploy?

## 2. Review severity

Use these labels in review comments:

| Label | Meaning | Merge? |
|---|---|---|
| **Blocker** | Security, data loss, broken production path, or incorrect behavior | No |
| **Major** | Significant bug, missing validation/state, likely regression | No until fixed |
| **Minor** | Maintainability, clarity, small UX inconsistency | Usually yes with a follow-up |
| **Nit** | Preference; no behavioral impact | Optional |
| **Question** | Needs explanation, not necessarily a change | Resolve before merge |
| **Praise** | A good pattern worth keeping | — |

Do not bury a blocker among nits. State blockers first and be specific about the failure scenario.

## 3. Review order

Review in this order; later checks are wasted if an earlier one fails.

1. **Scope and intent** — does the diff match the request?
2. **Security and data** — auth, secrets, SQL, uploads, URLs, errors.
3. **Correctness** — logic, edge cases, state, status codes.
4. **Failure behavior** — external services, empty/loading/error states.
5. **Accessibility and responsive behavior**.
6. **Tests and evidence**.
7. **Documentation**.
8. **Style and naming**.

## 4. Scope and intent

- [ ] The change is limited to the requested feature/fix.
- [ ] No unrelated formatting, dependency, or refactor is mixed in.
- [ ] No new product scope without an approved requirement.
- [ ] No file was overwritten that contains someone else's uncommitted work.
- [ ] The commit message matches the change.

**Red flags:** large diffs with no explanation, a "while I was here" refactor, a new service or dependency, a deleted test, a changed API response shape without docs.

## 5. Security and data review

### Secrets

- [ ] No `.env`, key, token, password, hash, or connection string is added.
- [ ] `.env.example` changes use placeholders only.
- [ ] No secret is printed in logs, errors, comments, or tests.
- [ ] New secrets are server-side; no `VITE_*` secret.
- [ ] If a secret may have leaked, rotation is flagged.

### Authorization

- [ ] Every mutation and private read uses `protect`.
- [ ] Client route guards are not treated as security.
- [ ] JWT verification still pins HS256, issuer, audience, role, and current admin email.
- [ ] No new public endpoint exposes messages, credentials, or admin data.

### Input and SQL

- [ ] Types are checked before `.trim()`/property access.
- [ ] Required/optional, min/max, and format rules are explicit.
- [ ] SQL uses placeholders; no user input is concatenated.
- [ ] Public reads use explicit columns, not `SELECT *`.
- [ ] IDs are validated as positive integers.
- [ ] URLs accept only absolute HTTP(S).
- [ ] File uploads have MIME and size limits; public payloads are validated before upload.

### Errors and logs

- [ ] Production 5xx does not leak SQL, paths, stacks, or hostnames.
- [ ] 404 does not echo the requested path.
- [ ] Parser errors return stable 400/413 messages.
- [ ] Request bodies, tokens, passwords, and message contents are not logged.
- [ ] New error messages are safe and actionable.

### Headers and browser

- [ ] CSP is not weakened (`unsafe-eval`, `script-src *`, removed `frame-ancestors`).
- [ ] CORS remains an exact allowlist; no wildcard with credentials.
- [ ] Admin/API noindex remains.
- [ ] Third-party scripts are not added.

**Any blocker here stops the review.**

## 6. Correctness review

### Server

- [ ] Route/method matches the documented contract.
- [ ] Status codes follow the API table (`200/201/400/401/404/413/429/500/502/503`).
- [ ] Success/error envelopes are consistent.
- [ ] Partial-update semantics are preserved (omitted vs empty vs invalid).
- [ ] `404` is returned for missing rows, not `200` with empty data.
- [ ] `affectedRows`/`changedRows` interpretation is correct.
- [ ] No double-send or missing `return` after a response.
- [ ] `next(error)` is used for unexpected failures.
- [ ] Rate limiter is applied at the right layer (before upload parsing where relevant).
- [ ] Optional integration failure does not fail the core operation.

### Client

- [ ] Data fetching has loading, success, empty, and error states.
- [ ] A failed request does not leave an infinite spinner.
- [ ] Retry is explicit and limited to safe requests.
- [ ] State updates after unmount are guarded where relevant.
- [ ] Forms preserve input on error and disable during submit.
- [ ] Success claims appear only after the API confirms.
- [ ] Buttons have correct `type` and do not submit accidentally.
- [ ] Links use the router for internal navigation and safe `rel` for external.
- [ ] Images have alt text and fallbacks.

### Data and dates

- [ ] `created_at` is rendered consistently.
- [ ] Nullable fields are handled (`null` link/image/issuer).
- [ ] Long text wraps; descriptions do not break cards.
- [ ] Empty arrays are distinguished from failed requests.

## 7. Failure behavior

- [ ] Missing Cloudinary → `503`; the rest of the site works.
- [ ] Cloudinary failure → `502`; no raw provider error.
- [ ] Missing Gemini → `502`; page remains usable.
- [ ] Email failure → message already saved; response still `201`.
- [ ] Database down → readiness `503`; process behavior is intentional.
- [ ] Render cold start → loading state, not a false "no data".
- [ ] Rate limit → `429` with a clear message.
- [ ] Admin partial load failure → other sections remain usable.

## 8. Accessibility review

- [ ] One `h1`; heading order is semantic.
- [ ] Landmarks: header/nav/main/footer.
- [ ] Skip link still first and functional.
- [ ] All form controls have visible labels and `htmlFor`/`id`.
- [ ] Icon-only buttons have `aria-label`.
- [ ] Images have meaningful `alt`; decorative elements are hidden.
- [ ] Modals/mobile menu: `role="dialog"`, `aria-modal`, focus trap, Escape, focus restoration.
- [ ] Status uses `role="status"`; errors use `role="alert"`.
- [ ] Progress bars expose `role="progressbar"` and values.
- [ ] Active nav uses `aria-current="page"`.
- [ ] Focus is visible; contrast rules are respected.
- [ ] Color is not the only state indicator.
- [ ] Motion is disabled under `prefers-reduced-motion`.
- [ ] Layout works at 320 px without horizontal scroll.

Known exceptions must be documented, not ignored. The focus-ring contrast is a current known issue.

## 9. Design consistency

- [ ] Uses existing tokens and classes (`btn`, `tag`, `brutal-card`, `state-panel`, form classes).
- [ ] No unexplained hex values or one-off shadows.
- [ ] One primary action per view.
- [ ] Loading/empty/error panels use the shared pattern.
- [ ] Spacing follows the 4 px scale and section rhythm.
- [ ] Typography roles are respected (display vs body vs meta).
- [ ] Mobile reflow is intentional, not a shrunken desktop.
- [ ] New pattern is added to `DESIGN.md` if it is reusable.

## 10. Tests and evidence

- [ ] Relevant server tests pass.
- [ ] New validation/auth boundary has a test.
- [ ] Client lint and build pass.
- [ ] Schema change has a migration and `db:check`.
- [ ] Docker stack job passes if containers/schema/proxy changed.
- [ ] Production smoke passes after deploy.
- [ ] Manual check covers the actual changed behavior.
- [ ] No test was weakened or deleted to make the change pass.

A review comment should ask for evidence, not just assert "tested".

## 11. Documentation

- [ ] `API.md` updated for contract changes.
- [ ] `DATABASE.md`/`DATABASE_BACKEND.md` updated for schema/query changes.
- [ ] `ARCHITECTURE.md` updated for new services/layers/data flow.
- [ ] `DESIGN.md` updated for new visual patterns.
- [ ] `AUTHENTICATION.md`/`SECURITY_AUDIT.md` updated for auth/security changes.
- [ ] `DEPLOYMENT.md`/`PROJECT_SETUP.md` updated for env/deploy changes.
- [ ] `TESTING.md` updated for coverage changes.
- [ ] Relative links resolve; no reference to a deleted document.

## 12. Style and maintainability

- [ ] Naming matches the surrounding code.
- [ ] Functions are small and have one responsibility.
- [ ] Comments explain intent, not obvious syntax.
- [ ] No dead code, commented-out blocks, or debug `console.log` left behind.
- [ ] No `TODO` without an owner and reason.
- [ ] No premature abstraction for a single use.
- [ ] No new dependency for a trivial task.
- [ ] Error messages are consistent in tone and punctuation.
- [ ] Imports are ordered consistently with the file.

## 13. Review examples

### Blocker

> `POST /api/projects` reads `req.body.github` and interpolates it into the SQL string. This is a SQL injection path. Use `db.execute` with `?` placeholders and keep the existing `isSafeHttpUrl` check.

### Major

> The contact form sets `success` before the request resolves. If the API returns `400`, the UI still tells the visitor the message was sent. Move the success state into the resolved branch and keep the input on failure.

### Major

> Deleting a project does not check `affectedRows`, so a missing ID returns `200`. The contract says `404` for an unknown ID; return it.

### Minor

> The new card uses `box-shadow: 0 8px 24px rgba(...)`, which conflicts with the hard-offset shadow system. Use `var(--shadow)` or document why this surface is different.

### Nit

> `handleSubmit` is fine, but `submitMessage` matches the verb used in the other page handlers.

### Question

> Does the new endpoint need a rate limiter? It triggers a provider call and is public; if abuse is possible, it should use `aiLimiter` or a dedicated limiter.

## 14. Pull request description template

```markdown
## What changed
- ...

## Why
- ...

## Risk
- [ ] Auth
- [ ] Data/schema
- [ ] Uploads
- [ ] Public API contract
- [ ] Deployment/env
- [ ] SEO
- [ ] Accessibility

## Verification
- [ ] server: npm run check && npm test
- [ ] client: npm run lint && npm run build
- [ ] Docker stack (if applicable)
- [ ] production smoke (if deployed)
- [ ] manual route/flow check
- [ ] secret scan
- [ ] docs updated

## Screenshots (if UI)
Before/after at desktop and mobile.

## Rollback
How to revert safely.
```

## 15. Merge and deploy rules

- No merge with an open Blocker.
- No merge with failing required CI jobs.
- No direct production deploy with a red pipeline unless the owner declares an emergency.
- No force-push to `main`.
- No merge that includes unrelated uncommitted owner work.
- After merge, watch the deploy and verify the live behavior.
- If the change is risky, deploy when the owner can monitor it.

## 16. Self-review checklist for agents

Before asking for review:

- [ ] `git diff` reviewed line by line.
- [ ] `git status` shows only intended files.
- [ ] No secret in the diff.
- [ ] No debug output.
- [ ] Tests pass.
- [ ] Docs updated.
- [ ] The change matches the request, not a broader idea.
- [ ] The rollback path is understood.

## 17. What not to do in review

- Do not request a rewrite for a style preference.
- Do not approve because "it builds".
- Do not ignore a security issue because the site is small.
- Do not ask for more abstraction without a concrete maintenance problem.
- Do not let a known accessibility issue pass silently; record it.
- Do not approve a deleted or weakened test.
- Do not review only the diff; open the surrounding file to understand context.
