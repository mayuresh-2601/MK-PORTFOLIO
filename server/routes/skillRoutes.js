import express from "express";

import {
  fetchSkills,
  createSkill,
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
 * Future Route
 *
 * Uncomment when updateSkill controller is implemented.
 *
 * import { updateSkill } from "../controllers/skillController.js";
 * router.put("/:id", protect, updateSkill);
 */

export default router;