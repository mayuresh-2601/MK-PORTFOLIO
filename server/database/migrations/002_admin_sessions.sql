-- ─────────────────────────────────────────────────────────────
-- Migration: 002_admin_sessions
-- Use for an EXISTING database created by an older schema.
--
-- `npm run db:migrate` applies this automatically. The DDL is
-- idempotent (`IF NOT EXISTS`) so it is safe to run once more.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS admin_sessions (
    token_hash CHAR(64) NOT NULL PRIMARY KEY,
    admin_email VARCHAR(254) NOT NULL,
    csrf_token CHAR(64) NOT NULL,
    created_at BIGINT NOT NULL,
    last_seen_at BIGINT NOT NULL,
    expires_at BIGINT NOT NULL,
    revoked_at BIGINT NULL DEFAULT NULL,
    INDEX idx_admin_sessions_expires (expires_at),
    INDEX idx_admin_sessions_email (admin_email, revoked_at)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
