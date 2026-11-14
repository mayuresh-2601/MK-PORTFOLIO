# Database Backend Implementation

**Product:** Mayuresh Kasar Portfolio ("MAYURESH.DEV")
**Document owner:** Mayuresh Kasar
**Status:** Source of truth for database code and operations
**Version:** 1.0
**Last updated:** 2026-11-14
**Design reference:** [DATABASE.md](./DATABASE.md)
**Code:** `server/config/databaseConfig.js`, `server/config/db.js`, `server/models/*`, `server/scripts/database.js`

---

## 1. Purpose

[DATABASE.md](./DATABASE.md) defines the schema and data model. This document defines how the backend actually connects, queries, migrates, seeds, and verifies that database. It is the reference for changing database code without breaking production.

## 2. Connection configuration

### 2.1 Single source of truth

`server/config/databaseConfig.js` builds both the one-off connection options and the pool options. The API, the setup/migrate/seed scripts, and any future tooling use the same function, so credentials and TLS behavior cannot drift.

Required environment variables:

| Variable | Rule |
|---|---|
| `DB_HOST` | Required; trimmed |
| `DB_USER` | Required; trimmed |
| `DB_NAME` | Required; trimmed; must match `^[A-Za-z0-9_]+$` in the scripts |
| `DB_PASSWORD` | Must be defined; an empty string is allowed for local root |
| `DB_PORT` | Optional; defaults to `4000` when missing/invalid |
| `DB_SSL` | Optional; defaults to `true` only when `NODE_ENV=production` |
| `DB_CONNECTION_LIMIT` | Optional; default `10`, clamped to 1–20 |

Missing required variables throw before the pool is created:

```text
Missing database environment variables: DB_HOST, DB_USER. Copy server/.env.example to server/.env and fill in your TiDB or MySQL values.
```

The thrown message names the missing keys but never prints values.

### 2.2 TLS

```js
ssl: sslEnabled
  ? { minVersion: "TLSv1.2", rejectUnauthorized: true }
  : undefined
```

- TiDB Cloud requires TLS on port `4000`; set `DB_SSL=true`.
- Local MySQL and Docker set `DB_SSL=false`.
- Certificate verification is on. Do not set `rejectUnauthorized: false` to work around a certificate problem; fix the CA/endpoint instead.
- If `DB_SSL` is unset, production defaults to TLS and non-production defaults to plain TCP.

### 2.3 Pool options

```js
{
  waitForConnections: true,
  connectionLimit,          // 1..20, default 10
  maxIdle: connectionLimit,
  idleTimeout: 60000,       // 60 s
  queueLimit: 0,            // unlimited queue
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  namedPlaceholders: true,
  charset: "utf8mb4",
  connectTimeout: 20000     // 20 s
}
```

Rationale:

- TiDB Serverless has connection limits; 10 is enough for portfolio traffic and stays within them.
- `queueLimit: 0` means requests wait rather than fail immediately when all connections are busy. At current traffic this is safe; at scale it should be revisited alongside request timeouts.
- Keep-alive reduces reconnection cost on a long-lived single instance.
- `utf8mb4` is required for emoji and non-Latin content.
- A 20-second connect timeout prevents a hung startup.

### 2.4 Pool lifecycle

`server/config/db.js`:

```js
const db = mysql.createPool(getPoolConfig());

export const testDatabaseConnection = async () => {
  const connection = await db.getConnection();
  await connection.ping();
  connection.release();
};
```

- `server.js` calls `testDatabaseConnection()` before `app.listen()`; a failed database means the process does not start.
- Graceful shutdown closes the HTTP server and the pool on `SIGINT`/`SIGTERM`.
- There is no separate connection manager, retry loop, or circuit breaker. A database outage after startup surfaces as request errors; `/api/health/ready` runs `SELECT 1` and returns `503`.

## 3. Query layer

### 3.1 Model modules

| Model | Functions |
|---|---|
| `projectModel.js` | `getAllProjects`, `getProjectById`, `addProject`, `updateProject`, `deleteProject` |
| `skillModel.js` | `getSkills`, `getSkillById`, `addSkill`, `updateSkill`, `deleteSkill` |
| `certificateModel.js` | `getAllCertificates`, `getCertificateById`, `addCertificate`, `updateCertificate`, `deleteCertificate` |
| `messageModel.js` | `addMessage`, `getMessages`, `deleteMessage` |

Models do not validate business rules. They accept already-normalized values and return plain rows or affected-row counts.

### 3.2 Query rules

1. Use `db.execute(sql, values)` with `?` placeholders. `namedPlaceholders` is enabled but the current models use positional placeholders.
2. Select explicit columns. Never `SELECT *` on a public endpoint.
3. Convert path IDs with `Number(id)` in the model and validate the integer in the controller.
4. Order lists by `id DESC` (newest first).
5. Use `LIMIT 1` for single-row reads.
6. Do not concatenate user input into SQL, including identifiers. Table/column names are hardcoded.
7. Use `COALESCE(?, image)` when an optional replacement should preserve the existing value.
8. Each mutation is a single statement; no transaction is needed at current scope.
9. Do not add indexes without a measured query that uses them.

### 3.3 Example: project update

```sql
UPDATE projects
SET
  title = ?,
  description = ?,
  github = ?,
  demo = ?,
  image = COALESCE(?, image)
WHERE id = ?
```

The controller resolves omitted fields to the existing values before calling the model. The model only protects the image from being cleared by a missing replacement.

### 3.4 Return shapes

| Operation | Return |
|---|---|
| List | Array of rows |
| Single read | Row or `null` |
| Insert | `{ id, affectedRows }` |
| Update | `{ affectedRows, changedRows }` |
| Delete | `{ affectedRows }` |

Controllers translate these into `404` (`getById` null or `affectedRows === 0`), `200`, or `201`.

## 4. Error handling

- MySQL/TiDB errors bubble from the model to the controller's `catch`, then to `next(error)`.
- The global error handler returns `500 Internal Server Error` in production for 5xx; it does not expose SQL text, table names, or stack traces.
- In development, the stack is returned and logged for debugging.
- There is no automatic query retry. Retrying a failed write could duplicate a row; retrying a read is left to the client's one GET retry.
- Duplicate-key errors are not specially mapped because the schema has no unique business keys beyond the primary key.
- A lost connection surfaces as a request error; the pool attempts to create a new connection on the next checkout.
- Startup connection failure is fatal by design: a half-working API is worse than a failed deploy that Render can roll back.

## 5. Migrations

### 5.1 Model

Migrations are **forward-only and idempotent**, implemented in `server/scripts/database.js`. There is no migration table and no down migration. Every step checks the current schema before changing it.

### 5.2 `npm run db:migrate` steps

1. Connect to `DB_NAME`.
2. Read existing tables from `information_schema.TABLES`.
3. If any of the four required tables are missing, stop and instruct the operator to run `db:setup`.
4. Add `messages.subject VARCHAR(200) NOT NULL DEFAULT 'Portfolio Contact Form'` if missing.
5. Make `certificates.image` nullable if it is currently `NOT NULL`.
6. Normalize `projects.github`, `projects.demo`, and `certificates.link` to `VARCHAR(512) NULL DEFAULT NULL` when present.
7. Convert each required table to `utf8mb4` / `utf8mb4_unicode_ci` when its collation is not utf8mb4.
8. Drop the legacy `users` table if it exists (authentication is environment-based).
9. Print the resulting row counts.

Each step logs either an applied change or an "already present" message, so repeated runs are safe.

### 5.3 `db:setup`

1. Connect without a database selected.
2. Create the database if permitted, with `utf8mb4` / `utf8mb4_unicode_ci`.
3. Connect to it.
4. Execute `schema.sql` (which contains no `USE` statement).
5. Verify the four tables exist.
6. Print counts.

If the user cannot create databases, create it manually and grant rights, then rerun.

### 5.4 `db:seed`

- Reads `seed.sql` and executes it against `DB_NAME`.
- Uses explicit primary keys and `INSERT ... ON DUPLICATE KEY UPDATE`-style refreshes so baseline rows are updated without deleting later content.
- Does not delete messages or admin-created rows.
- Prints counts after seeding.

The seed is baseline portfolio content, not a backup. It must never contain real contact messages.

### 5.5 `db:check`

Read-only verification:

- all four tables exist;
- `messages.subject` exists;
- `certificates.image` is nullable;
- every table uses utf8mb4;
- prints row counts.

Exit code is non-zero when a problem is found, which makes it usable in CI and pre-deploy checks.

### 5.6 Production migration rules

1. Back up before destructive DDL or bulk updates. No backup = no migration.
2. Run against a staging/disposable database first.
3. Run during low traffic and watch the API logs.
4. Never edit an already-applied migration in place; add a new idempotent step.
5. Never run `db:seed` against production to "fix" content; it overwrites baseline rows by ID.
6. Do not use `db:setup` on an existing production database without understanding that it only creates missing tables.

## 6. Database-name independence

- `schema.sql` and `seed.sql` contain no `USE` statement and no hardcoded database name.
- The scripts select the database through the connection options.
- `DB_NAME` is validated against `^[A-Za-z0-9_]+$` before use.
- CI applies both SQL files to a second database (`portfolio_alt`) and verifies row counts, proving the files are portable.
- Docker bakes the SQL files into the MySQL image, so initialization does not depend on host bind mounts.

This matters because the local stack, CI, and production use different database names and providers.

## 7. Transactions and consistency

Current operations are single-row and single-statement, so no explicit transaction is used.

If a future feature needs multiple statements (for example, creating a project plus tag rows), then:

1. acquire a connection from the pool;
2. `beginTransaction()`;
3. execute all statements on that connection;
4. `commit()` on success, `rollback()` in `catch`;
5. always `release()` in `finally`.

Do not use the pool-level `db.query` for statements that must share a transaction.

## 8. Performance

### Current profile

- Four tables, tens of rows, read-heavy.
- List queries are primary-key ordered and return all rows.
- No joins, no N+1 patterns, no ORM overhead.
- Pool size 10 is far above current concurrency.

### Guardrails

- Keep public list payloads small; a project description can be 5,000 characters, so a future pagination change should consider payload size, not only row count.
- Avoid running `git`/`docker` commands per telemetry poll; the System controller caches them for five minutes.
- Do not add speculative indexes. Review `EXPLAIN` before changing indexes.
- Do not add caching until a measured latency problem exists. A cache introduces invalidation bugs that are worse than the current query cost.
- Monitor slow queries through TiDB/Render tooling if latency appears.

### Known scaling triggers

| Trigger | Action |
|---|---|
| Messages exceed a few hundred | Add cursor pagination and an index that matches the query |
| Multiple API instances | Move rate limits to a shared store; revisit pool limits |
| Large media volume | Add Cloudinary cleanup; keep URLs in the DB |
| Read latency grows | Consider a read replica or caching with explicit invalidation |

## 9. Security

- Credentials live only in the server environment.
- The browser never connects to the database.
- TLS with certificate verification protects TiDB traffic.
- All user input is parameterized.
- Public queries expose only public columns; `messages` is never returned on a public route.
- Errors never include SQL or schema details in production.
- The runtime database user should have DML only on the four tables. Use a separate DDL credential for migrations.
- Do not log query values that contain personal data.
- Do not commit dumps, seeds containing real messages, or connection strings.

### Least-privilege verification (approval item)

Confirm in the TiDB console that the API user cannot `CREATE`, `DROP`, `ALTER`, or grant privileges. If it can, create a dedicated runtime user and update `DB_USER`/`DB_PASSWORD` in Render.

## 10. Backup and restore

The application does not implement backups. The database provider is the system of record.

Minimum operational policy (approval required):

| Item | Recommendation |
|---|---|
| Frequency | Daily logical backup; retain 7–30 days |
| Method | Provider backup if available; otherwise scheduled dump from a trusted runner |
| Storage | Encrypted private storage, separate from TiDB |
| Verification | Monthly restore into staging; run `db:check`; compare counts |
| Pre-deploy | Export before destructive migrations |
| Retention | Align with contact-message privacy policy |

Restore outline:

1. Restore into a new database, not over production.
2. Run `npm run db:migrate` and `npm run db:check`.
3. Verify counts and spot-check public content.
4. Point the API at the restored database.
5. Reconcile Cloudinary assets and messages received after the backup timestamp.
6. Record the drill result.

## 11. Operational commands

```bash
cd server

npm run db:setup     # create database + schema
npm run db:migrate   # idempotent upgrades
npm run db:seed      # baseline content
npm run db:check     # verify schema + counts
```

Expected counts after a fresh seed:

```text
projects     4
skills       16
certificates 16
```

Run `db:check` after every migration and before every production deploy that touches data.

## 12. Change checklist

- [ ] Schema change added to `schema.sql`.
- [ ] Idempotent migration added to `scripts/database.js`.
- [ ] Seed updated only if baseline content changes.
- [ ] Model queries updated with explicit columns and placeholders.
- [ ] Controller validation and status codes updated.
- [ ] `DATABASE.md`, `API.md`, and this document updated.
- [ ] `npm run db:migrate` and `db:check` pass on a disposable database.
- [ ] CI Docker job passes, including the arbitrary-database-name check.
- [ ] Production backup taken and owner approval recorded.
- [ ] Restore path remains viable.
