# Feature Development Guide

**Product:** Mayuresh Kasar Portfolio ("MAYURESH.DEV")
**Document owner:** Mayuresh Kasar
**Status:** How to extend the system without breaking it
**Version:** 1.0
**Last updated:** 2026-11-14
**Related:** [AGENTS.md](./AGENTS.md) · [ARCHITECTURE.md](./ARCHITECTURE.md) · [API.md](./API.md) · [TESTING.md](./TESTING.md)

---

## 1. Purpose

This guide explains how to add a feature end to end in this codebase: where the code goes, what must be validated, what must be documented, and what must be verified before merge. It assumes the current architecture and does not introduce new frameworks.

**Rule:** a feature is not "done" when it works locally. It is done when validation, authorization, error states, accessibility, documentation, tests, and deployment are all handled.

## 2. Decision gate before coding

Answer these before writing code:

| Question | If yes |
|---|---|
| Does it add a new user role, account, or permission? | Stop: approval required; the system is single-admin by design |
| Does it add a new service, dependency, or paid resource? | Stop: approval required; document cost and failure mode |
| Does it change the database schema? | Plan a forward-only migration and backup |
| Does it change the API contract? | Update [API.md](./API.md) and tests in the same change |
| Does it accept files or URLs? | Add limits, validation, and failure handling |
| Does it send data to a third party? | Add privacy review, timeout, and graceful failure |
| Does it need a secret? | Server-side only; update the env template with a placeholder |
| Does it affect SEO or public metadata? | Update the route metadata and verify live output |
| Does it add motion? | Add a reduced-motion path |

If the feature is not in [PRD.md](./PRD.md) scope, it needs an explicit product decision. Do not quietly expand scope.

## 3. The layers

```text
client page/component
  → client/src/api/axios.js
    → Express route (server/routes)
      → middleware (auth, rate limit, upload)
        → controller (validation, status codes)
          → model (parameterized SQL)
            → MySQL/TiDB
```

A typical feature touches some subset of:

1. `server/database/schema.sql` and `server/scripts/database.js` — only for persistent data.
2. `server/models/*.js` — SQL.
3. `server/controllers/*.js` — validation and orchestration.
4. `server/routes/*.js` — method, path, middleware.
5. `client/src/pages/*` and/or `client/src/components/*` — UI and state.
6. `client/src/index.css` — only if a new visual pattern is required.
7. Tests and docs.

## 4. Recipe: add a field to an existing resource

Example: add an optional `featured` boolean to projects. This is illustrative; the field does not exist today.

### 4.1 Database

1. Add the column to `server/database/schema.sql` for fresh installs:
   - `featured TINYINT(1) NOT NULL DEFAULT 0`
2. Add an idempotent check to `npm run db:migrate` in `server/scripts/database.js`:
   - inspect `INFORMATION_SCHEMA.COLUMNS`;
   - `ALTER TABLE ... ADD COLUMN` only when missing.
3. Update `seed.sql` only if baseline content should set the field.
4. Run against a disposable database:

```bash
cd server
npm run db:migrate
npm run db:check
```

5. Back up production before applying the migration there.

### 4.2 Model

- Add the column to the explicit `SELECT` list.
- Add it to `INSERT`/`UPDATE` placeholders.
- Keep `db.execute` and `?` placeholders.
- Do not use `SELECT *`.

### 4.3 Controller

- Parse and normalize the field.
- Reject wrong types with `400`.
- Preserve partial-update semantics: omitted means "keep existing"; explicit empty means the documented behavior.
- Do not trust client-side validation.

### 4.4 Client

- Add the control with a visible label.
- Include the field in create and edit payloads.
- Update the TypeScript-free JSDoc/comments if the shape is documented.
- Preserve loading, error, and success feedback.
- Check keyboard use and mobile layout.

### 4.5 Contract and tests

- Update [API.md](./API.md) request/response examples.
- Add a unit test for validation boundaries.
- Extend the CI Docker update test if the field is critical.
- Update [DATABASE.md](./DATABASE.md) column tables.

### 4.6 Verification

```bash
cd server && npm run check && npm test
cd ../client && npm run lint && npm run build
```

Then run the Docker stack if the schema changed.

## 5. Recipe: add a new public page

### 5.1 Route and page

1. Create `client/src/pages/public/NewPage.jsx`.
2. Add the route in `client/src/App.jsx` inside the public layout.
3. Add the nav link in `client/src/components/common/Navbar.jsx` and the footer if appropriate.
4. Add a `SEO` block with a unique title, description, and path.
5. Use an existing page shell (`page-section`, `section__inner`, `grid-acid`/`grid-pink`) rather than inventing a layout.

### 5.2 Data and states

- Fetch through `client/src/api/axios.js`.
- Support loading, empty, error, and populated states.
- Use `state-panel` classes for full-section states.
- Add a retry action for recoverable errors.
- Cancel or ignore stale responses on unmount where applicable.

### 5.3 Accessibility and responsive behavior

- One `h1`.
- Landmarks and heading order.
- Visible labels for controls.
- Keyboard reachability.
- 320 px layout with no horizontal scroll.
- Reduced-motion behavior for any animation.

### 5.4 SEO

- Unique title/description.
- Canonical path.
- Add the route to `client/public/sitemap.xml` **only if it is public and canonical**.
- Add it to the `<noscript>` navigation in `client/index.html` if it is a primary section.
- Do not add `/admin` or API routes.

### 5.5 Verification

- Live title/description/canonical after deploy.
- Crawlable fallback still accurate.
- Sitemap XML valid.
- No broken links.

## 6. Recipe: add an admin CRUD resource

### 6.1 Data

1. Add a table to `schema.sql` with `utf8mb4`, an auto-increment `id`, and `created_at`.
2. Add a migration for existing databases.
3. Decide whether rows are standalone (no FK) or relational. Document why.

### 6.2 API

1. `server/models/newModel.js` with explicit columns.
2. `server/controllers/newController.js` with:
   - list (public or admin?);
   - create;
   - update (partial semantics);
   - delete.
3. `server/routes/newRoutes.js`:
   - public `GET` if appropriate;
   - `protect` on every mutation;
   - `uploadSingle` only if files are required;
   - a limiter on public abuse-prone routes.
4. Mount the router in `server/server.js` under `/api`.
5. Add the resource to the shared API limiter coverage (automatic under `/api`, unless skipped).

### 6.3 Client

1. Add a card/section to `AdminDashboard.jsx`.
2. Add create/edit forms with explicit labels.
3. Add icon actions with `aria-label`.
4. Load the resource in the parallel dashboard fetch.
5. Handle partial failure: a failed resource must not blank the others.
6. Add empty-state copy.

### 6.4 Tests and docs

- Validation tests.
- Auth rejection test (no token → `401`).
- Docker integration test for create/update/delete if the resource is core.
- Update [API.md](./API.md), [DATABASE.md](./DATABASE.md), [PRD.md](./PRD.md), and this guide if the pattern is new.

### 6.5 Security checklist

- [ ] `protect` on mutations and private reads.
- [ ] Explicit column selection.
- [ ] Parameterized SQL.
- [ ] Length/type/range validation.
- [ ] Safe URL validation for every link field.
- [ ] Upload type/size limits and pre-upload validation.
- [ ] No secret in the response.
- [ ] No internal detail in errors.

## 7. Recipe: add an AI endpoint

1. Add the route to `server/routes/aiRoutes.js` under the existing `aiLimiter`.
2. Add a controller that validates and bounds the input.
3. Extend `server/services/aiService.js`:
   - build the prompt from validated values;
   - keep the system prompt constraints;
   - use the server-side `GEMINI_API_KEY`;
   - preserve the 20-second timeout and bounded `maxOutputTokens`;
   - join text-bearing parts only.
4. Return `502` with a stable message on provider failure.
5. Never return the provider key, raw provider error, or prompt internals.
6. Add tests for input validation (no network).
7. Update [API.md](./API.md), [INTEGRATIONS.md](./INTEGRATIONS.md), and [PRD.md](./PRD.md).
8. Verify the client renders the result as text, never HTML.

**Cost guardrails:** do not increase the rate limit or output size without measuring usage. AI is an enhancement, not a core journey.

## 8. Recipe: add a file upload

1. Decide the field name and whether it is required.
2. Use the existing `uploadSingle(fieldName, { allowDocuments, validate })`.
3. Add MIME types to the allowlist only if the product requires them.
4. Keep limits: images 5 MB, documents 10 MB, one file.
5. If the payload can be invalid, pass a `validate` function so Cloudinary is not called for rejected input.
6. Decide what happens when Cloudinary is absent:
   - required image → `503`;
   - optional image → allow the row without an image.
7. Store only the secure URL (and optionally the public ID if cleanup will be implemented).
8. Document that deleting a row does not delete the Cloudinary asset.
9. Do not add malware scanning claims unless a scanner is actually implemented.

## 9. Recipe: add a third-party integration

Before coding, obtain approval and record:

- purpose and user value;
- data sent and received;
- authentication method and secret storage;
- timeout, retry, and failure behavior;
- cost and quota;
- privacy implications;
- removal plan.

Then:

1. Add config in `server/config/`.
2. Add environment variable names to `server/.env.example` with placeholders.
3. Validate at startup as optional (warning) or required (fatal), deliberately.
4. Implement with a timeout and a stable user-facing failure.
5. Never expose the secret or raw provider response.
6. Add a rate limit if the integration is publicly triggerable.
7. Document in [INTEGRATIONS.md](./INTEGRATIONS.md) and [ARCHITECTURE.md](./ARCHITECTURE.md).
8. Add a degraded-mode test: the core site must still work when the integration is absent.

## 10. Recipe: add a client-only improvement

Examples: better empty state, keyboard shortcut, animation, responsive fix.

1. Reuse existing tokens and components.
2. Do not add a state library for one screen.
3. Do not fetch data in multiple components for the same view; keep one owner.
4. Add `aria-*` only when it reflects real semantics.
5. Test at 320 px, 768 px, 1024 px, and 1440 px.
6. Test with keyboard only.
7. Test with `prefers-reduced-motion: reduce`.
8. Check contrast against the palette rules.
9. Run lint and build.

## 11. Partial-update semantics

The API distinguishes:

| Input | Meaning |
|---|---|
| Field omitted | Keep existing value |
| Field present and valid | Replace |
| Field present and empty (optional URL) | Clear to `null` |
| Field present but wrong type/too long | `400` |
| Required field empty | `400` |

When adding a field, preserve this model or document the exception. Do not silently convert a malformed value into "keep existing"; that hides client bugs.

## 12. Error and status-code conventions

Use the existing table:

| Code | Use |
|---|---|
| `200` | Successful read/update/delete |
| `201` | Resource created |
| `400` | Validation, bad ID, unsupported type, malformed JSON |
| `401` | Missing/invalid/expired token, bad credentials |
| `404` | Unknown ID or route |
| `413` | Body/file too large |
| `429` | Rate limited |
| `500` | Unexpected server/config failure |
| `502` | Cloudinary/Gemini failure |
| `503` | Uploads unconfigured, database not ready |

Do not return `200` with `{ success: false }`. Do not return `500` for user input errors.

## 13. Testing the feature

| Layer | Minimum |
|---|---|
| Server logic | Unit test for validation/auth boundary |
| API | Manual curl or Docker integration test |
| Client | Lint + build; manual state checks |
| Accessibility | Keyboard pass; focus visible; labels |
| Responsive | 320 px and desktop |
| Failure mode | Disable the optional integration or simulate an error |
| Security | No secret in response; auth enforced; URL/file limits |
| Production | Smoke route/headers if the feature affects them |

Full strategy: [TESTING.md](./TESTING.md).

## 14. Documentation updates

| Change | Documents to update |
|---|---|
| Product scope or user journey | `PRD.md`, `IMPLEMENTATION_PLAN.md` |
| New visual pattern | `DESIGN.md` |
| New service, layer, or data flow | `ARCHITECTURE.md` |
| Schema/query change | `DATABASE.md`, `DATABASE_BACKEND.md` |
| Endpoint or payload change | `API.md` |
| Auth change | `AUTHENTICATION.md`, `SECURITY_AUDIT.md` |
| Integration change | `INTEGRATIONS.md`, `MCP.md` if agent tooling |
| Test coverage change | `TESTING.md` |
| Deployment/env change | `DEPLOYMENT.md`, `PROJECT_SETUP.md` |
| Operational behavior | `MONITORING.md`, `DEBUGGING.md` |

## 15. Feature acceptance checklist

- [ ] Scope is approved and consistent with the PRD.
- [ ] Server validation and authorization are present.
- [ ] SQL is parameterized and uses explicit columns.
- [ ] Client has loading, empty, error, and success states.
- [ ] No secret is exposed to the browser.
- [ ] Optional integration failure is non-blocking.
- [ ] Accessibility: labels, focus, keyboard, reduced motion.
- [ ] Responsive at 320 px.
- [ ] Tests updated and passing.
- [ ] Documentation updated.
- [ ] No unrelated files staged.
- [ ] CI green.
- [ ] Production verified after deploy.

## 16. What not to do

- Do not add a user table, signup, or password reset to "complete" the auth story.
- Do not add an ORM for four tables.
- Do not add Redis, a queue, or a worker without a measured need.
- Do not add a second state library.
- Do not add a new CSS framework or component library.
- Do not add MCP tools or browser automation to the product.
- Do not weaken CSP, CORS, rate limits, or validation to make a demo work.
- Do not commit real data, secrets, or production message contents.
- Do not claim WCAG conformance, uptime, or ranking without evidence.
