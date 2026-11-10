import db from "../config/db.js";

/* 
   Get All Skills
 */

/**
 * Fetch all skills ordered by newest first.
 */
export const getSkills = async () => {
  const sql = `
    SELECT *
    FROM skills
    ORDER BY id DESC
  `;

  const [rows] = await db.execute(sql);

  return rows;
};

/* 
   Get Skill By ID
 */

/**
 * Fetch a single skill by ID.
 */
export const getSkillById = async (id) => {
  const [rows] = await db.execute(
    "SELECT * FROM skills WHERE id = ? LIMIT 1",
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