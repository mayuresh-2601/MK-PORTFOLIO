import jwt from "jsonwebtoken";

import { getAdminAuthConfig } from "../utils/adminAuth.js";

/*
   JWT Authentication Middleware

   Tokens are signed and verified with HS256 only, and must belong to the
   current ADMIN_EMAIL with the admin role. Rotating ADMIN_EMAIL or
   JWT_SECRET therefore invalidates every previously issued token.
*/

export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // ------------------------------------------
  // Validate Authorization Header
  // ------------------------------------------
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authorization token is required.",
    });
  }

  const token = authHeader.substring(7).trim();

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authorization token is required.",
    });
  }

  const jwtSecret = String(process.env.JWT_SECRET || "").trim();
  const adminConfig = getAdminAuthConfig();

  if (!jwtSecret || !adminConfig.email) {
    console.error(
      "JWT_SECRET or ADMIN_EMAIL environment variable is missing."
    );

    return res.status(500).json({
      success: false,
      message: "Server configuration error.",
    });
  }

  try {
    // Enforce the same issuer/audience/algorithm that authController uses,
    // so tokens minted for another service cannot be reused here.
    const decoded = jwt.verify(token, jwtSecret, {
      algorithms: ["HS256"],
      issuer: "portfolio-api",
      audience: "portfolio-admin",
    });

    if (!decoded || typeof decoded !== "object") {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    const tokenEmail = String(decoded.email || "")
      .trim()
      .toLowerCase();

    const tokenSubject = String(decoded.sub || "")
      .trim()
      .toLowerCase();

    if (
      decoded.role !== "admin" ||
      tokenEmail !== adminConfig.email ||
      tokenSubject !== adminConfig.email
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    req.user = {
      email: adminConfig.email,
      role: "admin",
    };

    return next();
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Authentication Error:", error);
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Authentication token has expired.",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Authentication failed.",
    });
  }
};

export default protect;
