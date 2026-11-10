-- ─────────────────────────────────────────────────────────────
-- Migration: 001_production_hardening
-- Use for an EXISTING database created by an older schema.
--
-- Prefer `npm run db:migrate`, which checks the current schema first
-- and only applies what is missing. This file documents the same
-- changes for manual execution. Run it ONCE; MySQL/TiDB do not
-- support `ADD COLUMN IF NOT EXISTS`, so rerunning is not harmless.
-- ─────────────────────────────────────────────────────────────

-- 1. Persist the contact-form subject.
USE portfolio;

ALTER TABLE messages
    ADD COLUMN subject VARCHAR(200) NOT NULL
    DEFAULT 'Portfolio Contact Form'
    AFTER email;

-- 2. Certificate artwork is optional.
ALTER TABLE certificates
    MODIFY COLUMN image VARCHAR(512) NULL DEFAULT NULL;

-- 3. Optional links should be NULL rather than an empty string.
ALTER TABLE projects
    MODIFY COLUMN github VARCHAR(512) NULL DEFAULT NULL;

ALTER TABLE projects
    MODIFY COLUMN demo VARCHAR(512) NULL DEFAULT NULL;

ALTER TABLE certificates
    MODIFY COLUMN link VARCHAR(512) NULL DEFAULT NULL;

-- 4. Guarantee utf8mb4 for emoji and non-Latin content.
ALTER TABLE projects
    CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE skills
    CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE certificates
    CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE messages
    CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 5. Admin auth is environment-based; the old unused table only stores
--    stale credentials. Back it up first if your deployment used it.
DROP TABLE IF EXISTS users;
