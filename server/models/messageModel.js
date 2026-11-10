import db from "../config/db.js";

/*
   Get All Messages
 */

/**
 * Fetch all contact messages ordered by newest first.
 */
export const getMessages = async () => {
  const sql = `
    SELECT *
    FROM messages
    ORDER BY id DESC
  `;

  const [rows] = await db.execute(sql);

  return rows;
};

/*
   Get Message By ID
 */

/**
 * Fetch a single contact message.
 */
export const getMessageById = async (id) => {
  const [rows] = await db.execute(
    `
      SELECT *
      FROM messages
      WHERE id = ?
      LIMIT 1
    `,
    [Number(id)]
  );

  return rows[0] || null;
};

/*
   Create Message
 */

/**
 * Save a contact message.
 */
export const addMessage = async (data) => {
  const sql = `
    INSERT INTO messages
    (
      name,
      email,
      subject,
      message
    )
    VALUES (?, ?, ?, ?)
  `;

  const values = [
    data.name.trim(),
    data.email.trim(),
    data.subject.trim(),
    data.message.trim(),
  ];

  const [result] = await db.execute(sql, values);

  return {
    id: result.insertId,
    affectedRows: result.affectedRows,
  };
};

/*
   Delete Message
 */

/**
 * Delete a contact message by ID.
 */
export const deleteMessage = async (id) => {
  const [result] = await db.execute(
    "DELETE FROM messages WHERE id = ?",
    [Number(id)]
  );

  return {
    affectedRows: result.affectedRows,
  };
};
