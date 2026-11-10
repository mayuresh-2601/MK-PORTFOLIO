import express from "express";

import {
  createMessage,
  fetchMessages,
  removeMessage,
} from "../controllers/messageController.js";

import { protect } from "../middleware/authMiddleware.js";
import { uploadSingle } from "../middleware/uploadMiddleware.js";
import { messageLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();

/* 
   Public Routes
 */

/**
 * @route   POST /api/messages
 * @desc    Submit a new contact message
 * @access  Public
 *
 * Supports:
 * - name
 * - email
 * - subject
 * - message
 * - optional file attachment (image, PDF, DOC or DOCX)
 */
router.post(
  "/",
  messageLimiter,
  uploadSingle("file", { allowDocuments: true }),
  createMessage
);

/* 
   Protected Admin Routes
 */

/**
 * @route   GET /api/messages
 * @desc    Get all contact messages
 * @access  Private (Admin)
 */
router.get(
  "/",
  protect,
  fetchMessages
);

/**
 * @route   DELETE /api/messages/:id
 * @desc    Delete a contact message
 * @access  Private (Admin)
 */
router.delete(
  "/:id",
  protect,
  removeMessage
);

export default router;
