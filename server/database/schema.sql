-- ─────────────────────────────────────────────────────────────
-- Portfolio database schema
-- Target: MySQL 8+ and TiDB Cloud (MySQL compatible)
-- ─────────────────────────────────────────────────────────────
-- Run this through `npm run db:setup` (server/scripts/database.js),
-- which creates the database if needed and executes this file.
-- Docker Compose also mounts it into /docker-entrypoint-initdb.d/.
--
-- Design notes:
--  * All tables use utf8mb4 so emoji and non-Latin text round-trip.
--  * Admin authentication is environment-based (ADMIN_EMAIL +
--    ADMIN_PASSWORD_HASH), so there is no unused `users` table.
--  * Certificate images are optional; many credentials are represented
--    by an issuer link only.
--  * `messages.subject` stores the subject shown in the contact form.
--  * CHECK constraints live in the API layer for TiDB compatibility.
-- ─────────────────────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS portfolio;

USE portfolio;
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    github VARCHAR(512) NULL DEFAULT NULL,
    demo VARCHAR(512) NULL DEFAULT NULL,
    image VARCHAR(512) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_projects_created (created_at)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    level INT NOT NULL DEFAULT 80,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_skills_name (name)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    issuer VARCHAR(255) NOT NULL DEFAULT 'Unknown',
    image VARCHAR(512) NULL DEFAULT NULL,
    link VARCHAR(512) NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_certificates_created (created_at)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    subject VARCHAR(200) NOT NULL DEFAULT 'Portfolio Contact Form',
    message TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_messages_created (created_at)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
