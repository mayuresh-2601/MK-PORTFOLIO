import db from "../config/db.js";

/* 
   Get All Certificates
 */

/**
 * Fetch all certificates ordered by newest first.
 */
export const getCertificates = async () => {
  const sql = `
    SELECT *
    FROM certificates
    ORDER BY id DESC
  `;

  const [rows] = await db.execute(sql);

  return rows;
};

/* 
   Get Certificate By ID
 */

/**
 * Fetch a single certificate by ID.
 */
export const getCertificateById = async (id) => {
  const [rows] = await db.execute(
    `
      SELECT *
      FROM certificates
      WHERE id = ?
      LIMIT 1
    `,
    [Number(id)]
  );

  return rows[0] || null;
};

/* 
   Create Certificate
 */

/**
 * Create a new certificate.
 */
export const addCertificate = async (cert) => {
  const sql = `
    INSERT INTO certificates
    (
      title,
      issuer,
      image,
      link
    )
    VALUES (?, ?, ?, ?)
  `;

  const values = [
    cert.title.trim(),
    cert.issuer.trim(),
    cert.image || null,
    cert.link?.trim() || null,
  ];

  const [result] = await db.execute(sql, values);

  return {
    id: result.insertId,
    affectedRows: result.affectedRows,
  };
};

/* 
   Update Certificate
 */

/**
 * Update an existing certificate.
 */
export const updateCertificate = async (id, cert) => {
  const sql = `
    UPDATE certificates
    SET
      title = ?,
      issuer = ?,
      image = COALESCE(?, image),
      link = ?
    WHERE id = ?
  `;

  const values = [
    cert.title.trim(),
    cert.issuer.trim(),
    cert.image || null,
    cert.link?.trim() || null,
    Number(id),
  ];

  const [result] = await db.execute(sql, values);

  return {
    affectedRows: result.affectedRows,
    changedRows: result.changedRows,
  };
};

/* 
   Delete Certificate
 */

/**
 * Delete a certificate by ID.
 */
export const deleteCertificate = async (id) => {
  const [result] = await db.execute(
    "DELETE FROM certificates WHERE id = ?",
    [Number(id)]
  );

  return {
    affectedRows: result.affectedRows,
  };
};