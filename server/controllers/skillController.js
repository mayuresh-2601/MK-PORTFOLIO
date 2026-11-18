import {
  getSkills,
  getSkillsPage,
  countSkills,
  getSkillById,
  addSkill,
  updateSkill,
  deleteSkill,
} from "../models/skillModel.js";

import { normalizeRequiredText } from "../utils/validation.js";

import {
  buildPagination,
  parsePagination,
} from "../utils/pagination.js";

const MAX_NAME_LENGTH = 100;
const PAGE_SIZE = 9;

/*
   Get All Skills
 */

export const fetchSkills = async (req, res, next) => {
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
      const skills = await getSkills();

      return res.status(200).json({
        success: true,
        count: skills.length,
        total: skills.length,
        page: 1,
        limit: skills.length || PAGE_SIZE,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        data: skills,
      });
    }

    const total = await countSkills();
    const meta = buildPagination(
      total,
      pagination.page,
      pagination.limit
    );
    const skills = await getSkillsPage(meta.limit, meta.offset);

    return res.status(200).json({
      success: true,
      count: skills.length,
      total: meta.total,
      page: meta.page,
      limit: meta.limit,
      totalPages: meta.totalPages,
      hasNextPage: meta.hasNextPage,
      hasPreviousPage: meta.hasPreviousPage,
      data: skills,
    });
  } catch (error) {
    next(error);
  }
};

/*
   Create Skill
 */

export const createSkill = async (req, res, next) => {
  try {
    const { name, level } = req.body || {};

    const normalizedName = normalizeRequiredText(
      name,
      MAX_NAME_LENGTH
    );

    if (normalizedName === undefined) {
      return res.status(400).json({
        success: false,
        message: "Skill name must be 100 characters or fewer.",
      });
    }

    if (!normalizedName) {
      return res.status(400).json({
        success: false,
        message: "Skill name is required.",
      });
    }

    // An omitted or non-numeric level falls back to 80, matching the
    // original admin form behaviour.
    let skillLevel = Number(level);

    if (!Number.isFinite(skillLevel)) {
      skillLevel = 80;
    }

    if (skillLevel < 0 || skillLevel > 100) {
      return res.status(400).json({
        success: false,
        message: "Skill level must be between 0 and 100.",
      });
    }

    const result = await addSkill(
      normalizedName,
      Math.round(skillLevel)
    );

    return res.status(201).json({
      success: true,
      message: "Skill created successfully.",
      id: result.id,
    });
  } catch (error) {
    next(error);
  }
};

/*
   Update Skill
 */

export const updateSkillById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid skill ID.",
      });
    }

    const existingSkill = await getSkillById(id);

    if (!existingSkill) {
      return res.status(404).json({
        success: false,
        message: "Skill not found.",
      });
    }

    const body = req.body || {};

    const name =
      body.name === undefined
        ? existingSkill.name
        : normalizeRequiredText(body.name, MAX_NAME_LENGTH);

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Skill name is required.",
      });
    }

    let level = existingSkill.level;

    if (body.level !== undefined) {
      const parsedLevel = Number(body.level);

      if (!Number.isFinite(parsedLevel)) {
        return res.status(400).json({
          success: false,
          message: "Skill level must be a number between 0 and 100.",
        });
      }

      level = Math.min(100, Math.max(0, Math.round(parsedLevel)));
    }

    await updateSkill(id, name, level);

    return res.status(200).json({
      success: true,
      message: "Skill updated successfully.",
    });
  } catch (error) {
    next(error);
  }
};

/*
   Delete Skill
 */

export const removeSkill = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid skill ID.",
      });
    }

    const result = await deleteSkill(id);

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Skill not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Skill deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};
