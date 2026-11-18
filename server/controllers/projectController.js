import {
  getAllProjects,
  getProjectsPage,
  countProjects,
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

import {
  buildPagination,
  parsePagination,
} from "../utils/pagination.js";

import { deleteCloudinaryAsset } from "../utils/cloudinaryAsset.js";

const MAX_TITLE_LENGTH = 255;
const MAX_DESCRIPTION_LENGTH = 5000;
const MAX_URL_LENGTH = 512;
const PAGE_SIZE = 9;

/*
   Get All Projects
 */

export const fetchProjects = async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query, {
      defaultLimit: PAGE_SIZE,
    });

    if (pagination.error) {
      return res.status(400).json({
        success: false,
        message: pagination.error,
      });
    }

    if (!pagination.paginated) {
      const projects = await getAllProjects();

      return res.status(200).json({
        success: true,
        count: projects.length,
        total: projects.length,
        page: 1,
        limit: projects.length || PAGE_SIZE,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        data: projects,
      });
    }

    const total = await countProjects();
    const meta = buildPagination(
      total,
      pagination.page,
      pagination.limit
    );
    const projects = await getProjectsPage(meta.limit, meta.offset);

    return res.status(200).json({
      success: true,
      count: projects.length,
      total: meta.total,
      page: meta.page,
      limit: meta.limit,
      totalPages: meta.totalPages,
      hasNextPage: meta.hasNextPage,
      hasPreviousPage: meta.hasPreviousPage,
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

    // A replaced upload would otherwise stay public forever. The new image
    // is already stored, so removing the old one cannot affect the record.
    if (req.file && existingProject.image !== project.image) {
      await deleteCloudinaryAsset(existingProject.image);
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

    const existingProject = await getProjectById(id);

    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    const result = await deleteProject(id);

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    // Uploaded images are not repository assets; remove them from Cloudinary
    // so a deleted project does not leave a publicly reachable file behind.
    await deleteCloudinaryAsset(existingProject.image);

    return res.status(200).json({
      success: true,
      message: "Project deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};
