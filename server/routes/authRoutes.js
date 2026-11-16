import express from "express";

import {
  getSession,
  login,
  logout,
  logoutAll,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();

/*
   Authentication Routes

   Login issues an opaque HttpOnly session cookie. There is no JWT in the
   response body, so no token is ever exposed to JavaScript or localStorage.
*/

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate admin (password + optional TOTP) and start a session
 * @access  Public
 */
router.post("/login", authLimiter, login);

/**
 * @route   GET /api/auth/session
 * @desc    Return the current session's CSRF token and expiry
 * @access  Private (Admin cookie session)
 */
router.get("/session", protect, getSession);

/**
 * @route   POST /api/auth/logout
 * @desc    Revoke the current session and clear the cookie
 * @access  Private (Admin cookie session)
 */
router.post("/logout", protect, logout);

/**
 * @route   POST /api/auth/logout-all
 * @desc    Revoke every active session for the admin account
 * @access  Private (Admin cookie session)
 */
router.post("/logout-all", protect, logoutAll);

export default router;
