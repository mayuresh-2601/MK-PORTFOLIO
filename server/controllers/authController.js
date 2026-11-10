import jwt from "jsonwebtoken";

import {
  getAdminAuthConfig,
  verifyAdminCredentials,
} from "../utils/adminAuth.js";

/*
   Admin Login

   Exactly one email/password pair is accepted. The pair is read from the
   server environment (ADMIN_EMAIL + ADMIN_PASSWORD or ADMIN_PASSWORD_HASH),
   never from the database. Both fields are checked on every request so an
   attacker cannot tell which one was wrong from the response or its timing.
*/

const MAX_EMAIL_LENGTH = 254;
const MAX_PASSWORD_LENGTH = 1024;

export const login = async (req, res, next) => {
  try {
    const rawEmail = req.body?.email;
    const rawPassword = req.body?.password;

    // Validate types before touching the credential helpers.
    if (
      typeof rawEmail !== "string" ||
      typeof rawPassword !== "string" ||
      !rawEmail.trim() ||
      !rawPassword
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const email = rawEmail.trim().toLowerCase();
    const password = rawPassword;

    if (
      email.length > MAX_EMAIL_LENGTH ||
      password.length > MAX_PASSWORD_LENGTH
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const adminConfig = getAdminAuthConfig();
    const jwtSecret = String(process.env.JWT_SECRET || "").trim();

    // jsonwebtoken treats a bare numeric string as milliseconds, but a
    // number as seconds. Convert digits explicitly so `JWT_EXPIRES_IN=43200`
    // means twelve hours as documented, and normalize units to lowercase.
    const rawJwtExpiry = String(
      process.env.JWT_EXPIRES_IN || "12h"
    ).trim();

    const jwtExpiry = /^\d+$/.test(rawJwtExpiry)
      ? Number(rawJwtExpiry)
      : rawJwtExpiry.toLowerCase();

    // Validate environment variables. This should already have been caught
    // at startup, but keep a defensive check in case the process is started
    // by a different entry point in the future.
    if (
      !adminConfig.email ||
      adminConfig.mode === "none" ||
      !jwtSecret
    ) {
      console.error(
        "Authentication environment variables are missing or invalid."
      );

      return res.status(500).json({
        success: false,
        message: "Server configuration error.",
      });
    }

    const credentialsMatch = await verifyAdminCredentials(
      email,
      password
    );

    if (!credentialsMatch) {
      console.warn(
        `[auth] Failed admin login attempt from ${req.ip || "unknown"}.`
      );

      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // The token is tied to the current ADMIN_EMAIL. Changing the env email
    // invalidates old tokens because the middleware checks the same claim.
    const token = jwt.sign(
      {
        sub: adminConfig.email,
        email: adminConfig.email,
        role: "admin",
      },
      jwtSecret,
      {
        algorithm: "HS256",
        expiresIn: jwtExpiry,
        issuer: "portfolio-api",
        audience: "portfolio-admin",
      }
    );

    console.log(
      `[auth] Admin login succeeded from ${req.ip || "unknown"}.`
    );

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      expiresIn: jwtExpiry,
      user: {
        email: adminConfig.email,
        role: "admin",
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Login Error:", error);
    }

    next(error);
  }
};

export default { login };
