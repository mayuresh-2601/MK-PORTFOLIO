import express from "express";

import {
  fetchCertificates,
  createCertificate,
  updateCertificateById,
  removeCertificate,
} from "../controllers/certificateController.js";

import { protect } from "../middleware/authMiddleware.js";
import { uploadSingle } from "../middleware/uploadMiddleware.js";

const router = express.Router();

/* 
   Public Routes
 */

/**
 * @route   GET /api/certificates
 * @desc    Get all certificates
 * @access  Public
 */
router.get("/", fetchCertificates);

/* 
   Protected Admin Routes
 */

/**
 * @route   POST /api/certificates
 * @desc    Create a new certificate
 * @access  Private (Admin)
 */
router.post(
  "/",
  protect,
  uploadSingle("image"),
  createCertificate
);

/**
 * @route   DELETE /api/certificates/:id
 * @desc    Delete a certificate
 * @access  Private (Admin)
 */
router.delete(
  "/:id",
  protect,
  removeCertificate
);

/**
 * @route   PUT /api/certificates/:id
 * @desc    Update a certificate
 * @access  Private (Admin)
 */
router.put(
  "/:id",
  protect,
  uploadSingle("image"),
  updateCertificateById
);

export default router;