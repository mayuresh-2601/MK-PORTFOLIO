import db from "../config/db.js";

/*
   Admin sessions

   Only a SHA-256 hash of the opaque cookie token is stored. Expiry and
   last-seen timestamps are epoch milliseconds so they are independent of the
   MySQL server timezone. Revoked rows are kept briefly for audit/cleanup.
*/

export const createSession = async ({
  tokenHash,
  email,
  csrfToken,
  now,
  expiresAt,
}) => {
  await db.execute(
    `
      INSERT INTO admin_sessions
      (
        token_hash,
        admin_email,
        csrf_token,
        created_at,
        last_seen_at,
        expires_at
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      tokenHash,
      email,
      csrfToken,
      now,
      now,
      expiresAt,
    ]
  );
};

export const findSessionByToken = async (tokenHash) => {
  const [rows] = await db.execute(
    `
      SELECT
        token_hash,
        admin_email,
        csrf_token,
        created_at,
        last_seen_at,
        expires_at,
        revoked_at
      FROM admin_sessions
      WHERE token_hash = ?
      LIMIT 1
    `,
    [tokenHash]
  );

  return rows[0] || null;
};

export const touchSession = async (tokenHash, lastSeenAt) => {
  await db.execute(
    `
      UPDATE admin_sessions
      SET last_seen_at = ?
      WHERE token_hash = ?
        AND revoked_at IS NULL
    `,
    [lastSeenAt, tokenHash]
  );
};

export const revokeSession = async (tokenHash, revokedAt = Date.now()) => {
  const [result] = await db.execute(
    `
      UPDATE admin_sessions
      SET revoked_at = ?
      WHERE token_hash = ?
        AND revoked_at IS NULL
    `,
    [revokedAt, tokenHash]
  );

  return {
    affectedRows: result.affectedRows,
  };
};

export const revokeAllSessions = async (email, revokedAt = Date.now()) => {
  const [result] = await db.execute(
    `
      UPDATE admin_sessions
      SET revoked_at = ?
      WHERE admin_email = ?
        AND revoked_at IS NULL
    `,
    [revokedAt, email]
  );

  return {
    affectedRows: result.affectedRows,
  };
};

/**
 * Delete rows that expired or were revoked before the retention cutoff. This
 * keeps the table small without destroying recent revocation evidence.
 */
export const cleanupSessions = async (retentionCutoff) => {
  const [result] = await db.execute(
    `
      DELETE FROM admin_sessions
      WHERE expires_at < ?
        OR (
          revoked_at IS NOT NULL
          AND revoked_at < ?
        )
    `,
    [retentionCutoff, retentionCutoff]
  );

  return {
    deletedRows: result.affectedRows,
  };
};

export default {
  createSession,
  findSessionByToken,
  touchSession,
  revokeSession,
  revokeAllSessions,
  cleanupSessions,
};
