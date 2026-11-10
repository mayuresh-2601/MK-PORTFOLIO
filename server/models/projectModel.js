import db from "../config/db.js";

/* 
   Get All Projects
 */

/**
 * Fetch all portfolio projects ordered by newest first.
 */
export const getAllProjects = async () => {
  const sql = `
    SELECT *
    FROM projects
    ORDER BY id DESC
  `;

  const [rows] = await db.execute(sql);

  return rows;
};

/* 
   Get Project By ID
 */

/**
 * Fetch a single project by ID.
 */
export const getProjectById = async (id) => {
  const [rows] = await db.execute(
    `
      SELECT *
      FROM projects
      WHERE id = ?
      LIMIT 1
    `,
    [Number(id)]
  );

  return rows[0] || null;
};

/* 
   Create Project
 */

/**
 * Create a new portfolio project.
 */
export const addProject = async (project) => {
  const sql = `
    INSERT INTO projects
    (
      title,
      description,
      github,
      demo,
      image
    )
    VALUES (?, ?, ?, ?, ?)
  `;

  const values = [
    project.title.trim(),
    project.description.trim(),
    project.github?.trim() || null,
    project.demo?.trim() || null,
    project.image || null,
  ];

  const [result] = await db.execute(sql, values);

  return {
    id: result.insertId,
    affectedRows: result.affectedRows,
  };
};

/* 
   Update Project
 */

/**
 * Update an existing portfolio project.
 */
export const updateProject = async (id, project) => {
  const sql = `
    UPDATE projects
    SET
      title = ?,
      description = ?,
      github = ?,
      demo = ?,
      image = COALESCE(?, image)
    WHERE id = ?
  `;

  const values = [
    project.title.trim(),
    project.description.trim(),
    project.github?.trim() || null,
    project.demo?.trim() || null,
    project.image || null,
    Number(id),
  ];

  const [result] = await db.execute(sql, values);

  return {
    affectedRows: result.affectedRows,
    changedRows: result.changedRows,
  };
};

/* 
   Delete Project
 */

/**
 * Delete a project by ID.
 */
export const deleteProject = async (id) => {
  const [result] = await db.execute(
    "DELETE FROM projects WHERE id = ?",
    [Number(id)]
  );

  return {
    affectedRows: result.affectedRows,
  };
};