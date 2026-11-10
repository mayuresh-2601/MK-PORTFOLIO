import express from "express";

import {
  fetchCertificates,
  createCertificate,
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
 * Future Route
 *
 * Uncomment when updateCertificate controller is implemented.
 *
 * import { updateCertificate } from "../controllers/certificateController.js";
 *
 * router.put(
 *   "/:id",
 *   protect,
 *   uploadSingle("image"),
 *   updateCertificate
 * );
 */

export default router;