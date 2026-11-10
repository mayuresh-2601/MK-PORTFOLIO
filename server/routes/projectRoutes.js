import express from "express";

import {
  fetchProjects,
  createProject,
  updateProjectById,
  removeProject,
} from "../controllers/projectController.js";

import { protect } from "../middleware/authMiddleware.js";
import { uploadSingle } from "../middleware/uploadMiddleware.js";

const router = express.Router();

/* 
   Public Routes
 */

/**
 * @route   GET /api/projects
 * @desc    Get all portfolio projects
 * @access  Public
 */
router.get("/", fetchProjects);

/* 
   Protected Admin Routes
 */

/**
 * @route   POST /api/projects
 * @desc    Create a new project
 * @access  Private (Admin)
 */
router.post(
  "/",
  protect,
  uploadSingle("image"),
  createProject
);

/**
 * @route   PUT /api/projects/:id
 * @desc    Update an existing project
 * @access  Private (Admin)
 */
router.put(
  "/:id",
  protect,
  uploadSingle("image"),
  updateProjectById
);

/**
 * @route   DELETE /api/projects/:id
 * @desc    Delete a project
 * @access  Private (Admin)
 */
router.delete(
  "/:id",
  protect,
  removeProject
);

export default router;