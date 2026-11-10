import express from "express";

import {
  fetchSkills,
  createSkill,
  updateSkillById,
  removeSkill,
} from "../controllers/skillController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/**

 * Public Routes

 */

// Get all skills
router.get("/", fetchSkills);

/**

 * Protected Admin Routes

 */

// Create a new skill
router.post("/", protect, createSkill);

// Delete a skill
router.delete("/:id", protect, removeSkill);

/**
 * Update Route
 *
 * Update an existing skill (name and/or proficiency level).
 */
router.put("/:id", protect, updateSkillById);

export default router;