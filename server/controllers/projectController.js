import {
  getAllProjects,
  getProjectById,
  addProject,
  updateProject,
  deleteProject,
} from "../models/projectModel.js";

import {
  isSafeHttpUrl,
  normalizeOptionalText,
  normalizeRequiredText,
} from "../utils/validation.js";

const MAX_TITLE_LENGTH = 255;
const MAX_DESCRIPTION_LENGTH = 5000;
const MAX_URL_LENGTH = 512;

/*
   Get All Projects
 */

export const fetchProjects = async (req, res, next) => {
  try {
    const projects = await getAllProjects();

    return res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    next(error);
  }
};

/*
   Create Project
 */

export const createProject = async (req, res, next) => {
  try {
    const { title, description, github, demo } = req.body || {};

    const normalizedTitle = normalizeRequiredText(
      title,
      MAX_TITLE_LENGTH
    );

    const normalizedDescription = normalizeRequiredText(
      description,
      MAX_DESCRIPTION_LENGTH
    );

    if (normalizedTitle === undefined) {
      return res.status(400).json({
        success: false,
        message: "Project title must be 255 characters or fewer.",
      });
    }

    if (!normalizedTitle) {
      return res.status(400).json({
        success: false,
        message: "Project title and description are required.",
      });
    }

    if (normalizedDescription === undefined) {
      return res.status(400).json({
        success: false,
        message:
          "Project description must be 5000 characters or fewer.",
      });
    }

    if (!normalizedDescription) {
      return res.status(400).json({
        success: false,
        message: "Project title and description are required.",
      });
    }

    const normalizedGithub = normalizeOptionalText(
      github,
      MAX_URL_LENGTH
    );

    if (
      normalizedGithub === undefined ||
      (normalizedGithub && !isSafeHttpUrl(normalizedGithub))
    ) {
      return res.status(400).json({
        success: false,
        message:
          "GitHub URL must be a valid http:// or https:// link (max 512 characters).",
      });
    }

    const normalizedDemo = normalizeOptionalText(
      demo,
      MAX_URL_LENGTH
    );

    if (
      normalizedDemo === undefined ||
      (normalizedDemo && !isSafeHttpUrl(normalizedDemo))
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Demo URL must be a valid http:// or https:// link (max 512 characters).",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Project image is required.",
      });
    }

    const project = {
      title: normalizedTitle,
      description: normalizedDescription,
      github: normalizedGithub,
      demo: normalizedDemo,
      image: req.file.path,
    };

    const result = await addProject(project);

    return res.status(201).json({
      success: true,
      message: "Project created successfully.",
      id: result.id,
    });
  } catch (error) {
    next(error);
  }
};

/*
   Update Project
 */

export const updateProjectById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID.",
      });
    }

    const existingProject = await getProjectById(id);

    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    const body = req.body || {};

    const title =
      body.title === undefined
        ? existingProject.title
        : normalizeRequiredText(body.title, MAX_TITLE_LENGTH);

    if (!title) {
      return res.status(400).json({
        success: false,
        message:
          "Project title is required and must be 255 characters or fewer.",
      });
    }

    const description =
      body.description === undefined
        ? existingProject.description
        : normalizeRequiredText(
            body.description,
            MAX_DESCRIPTION_LENGTH
          );

    if (!description) {
      return res.status(400).json({
        success: false,
        message:
          "Project description is required and must be 5000 characters or fewer.",
      });
    }

    // An explicit empty value clears the link; omitting the field keeps the
    // existing value. This makes partial updates predictable.
    const github =
      body.github === undefined
        ? existingProject.github
        : normalizeOptionalText(body.github, MAX_URL_LENGTH);

    if (
      github === undefined ||
      (github && !isSafeHttpUrl(github))
    ) {
      return res.status(400).json({
        success: false,
        message:
          "GitHub URL must be a valid http:// or https:// link (max 512 characters).",
      });
    }

    const demo =
      body.demo === undefined
        ? existingProject.demo
        : normalizeOptionalText(body.demo, MAX_URL_LENGTH);

    if (demo === undefined || (demo && !isSafeHttpUrl(demo))) {
      return res.status(400).json({
        success: false,
        message:
          "Demo URL must be a valid http:// or https:// link (max 512 characters).",
      });
    }

    const project = {
      title,
      description,
      github,
      demo,
      image: req.file ? req.file.path : existingProject.image,
    };

    const result = await updateProject(id, project);

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Project updated successfully.",
    });
  } catch (error) {
    next(error);
  }
};

/*
   Delete Project
 */

export const removeProject = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID.",
      });
    }

    const result = await deleteProject(id);

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Project deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};
