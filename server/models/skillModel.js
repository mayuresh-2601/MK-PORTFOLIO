import db from "../config/db.js";

/* 
   Get All Skills
 */

/**
 * Fetch all skills ordered by newest first.
 */
export const getSkills = async () => {
  const sql = `
    SELECT id, name, level, created_at
    FROM skills
    ORDER BY id DESC
  `;

  const [rows] = await db.execute(sql);

  return rows;
};

/**
 * Fetch one page of skills.
 *
 * `db.query` is required for `LIMIT ? OFFSET ?`; see projectModel.js.
 */
export const getSkillsPage = async (limit, offset) => {
  const [rows] = await db.query(
    `
      SELECT id, name, level, created_at
      FROM skills
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `,
    [Number(limit), Number(offset)]
  );

  return rows;
};

/**
 * Count skills for pagination metadata.
 */
export const countSkills = async () => {
  const [rows] = await db.execute(
    "SELECT COUNT(*) AS total FROM skills"
  );

  return Number(rows[0]?.total || 0);
};

/* 
   Get Skill By ID
 */

/**
 * Fetch a single skill by ID.
 */
export const getSkillById = async (id) => {
  const [rows] = await db.execute(
    "SELECT id, name, level, created_at FROM skills WHERE id = ? LIMIT 1",
    [Number(id)]
  );

  return rows[0] || null;
};

/* 
   Create Skill
 */

/**
 * Add a new skill.
 */
export const addSkill = async (
  name,
  level = 80
) => {
  const sql = `
    INSERT INTO skills
    (name, level)
    VALUES (?, ?)
  `;

  const [result] = await db.execute(sql, [
    name.trim(),
    Number(level),
  ]);

  return {
    id: result.insertId,
    affectedRows: result.affectedRows,
  };
};

/* 
   Update Skill
 */

/**
 * Update an existing skill.
 */
export const updateSkill = async (
  id,
  name,
  level
) => {
  const sql = `
    UPDATE skills
    SET
      name = ?,
      level = ?
    WHERE id = ?
  `;

  const [result] = await db.execute(sql, [
    name.trim(),
    Number(level),
    Number(id),
  ]);

  return result;
};

/* 
   Delete Skill
 */

/**
 * Delete a skill by ID.
 */
export const deleteSkill = async (id) => {
  const [result] = await db.execute(
    "DELETE FROM skills WHERE id = ?",
    [Number(id)]
  );

  return result;
};