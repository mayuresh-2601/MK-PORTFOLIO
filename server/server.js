import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import db from "./config/db.js";
import { cloudinaryConfigured } from "./config/cloudinary.js";
import { getEmailConfig } from "./config/email.js";
import { validateEnvironment } from "./config/validateEnv.js";

import { getAdminAuthConfig } from "./utils/adminAuth.js";

import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import skillRoutes from "./routes/skillRoutes.js";
import certificateRoutes from "./routes/certificateRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import systemRoutes from "./routes/systemRoutes.js";

import { apiLimiter } from "./middleware/rateLimiters.js";
import {
  errorHandler,
  notFound,
} from "./middleware/errorMiddleware.js";

const app = express();
const isProduction = process.env.NODE_ENV === "production";


// Environment Validation


const validation = validateEnvironment({
  production: isProduction,
});

validation.warnings.forEach((warning) => {
  console.warn(`⚠️ ${warning}`);
});

if (validation.errors.length > 0) {
  validation.errors.forEach((error) => {
    console.error(`❌ ${error}`);
  });

  process.exit(1);
}

const adminAuthConfig = getAdminAuthConfig();
const emailConfig = getEmailConfig();


// Express Configuration


app.disable("x-powered-by");
app.set("trust proxy", 1);

// Escape HTML-sensitive characters in JSON responses. This keeps the API
// safe if a response is ever embedded directly in an HTML context.
app.set("json escape", true);


// CORS Configuration


const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

const allowVercelPreviews = /^(true|1|yes|on)$/i.test(
  process.env.ALLOW_VERCEL_PREVIEWS || ""
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server and same-origin requests without an Origin
      // header, plus curl/health checks.
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.replace(/\/$/, "");

      const isLocalDev =
        !isProduction &&
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(
          normalizedOrigin
        );

      const isVercelPreview =
        allowVercelPreviews &&
        /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(
          normalizedOrigin
        );

      if (
        isLocalDev ||
        isVercelPreview ||
        allowedOrigins.includes(normalizedOrigin)
      ) {
        return callback(null, true);
      }

      // Omit CORS headers rather than throwing, so a disallowed origin gets
      // a normal browser CORS error instead of a misleading API 500.
      return callback(null, false);
    },
    credentials: true,
    maxAge: 86400,
    optionsSuccessStatus: 204,
  })
);


// Global Middleware


app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

app.use(
  morgan(isProduction ? "combined" : "dev", {
    skip: (req) =>
      req.path === "/" ||
      req.path === "/api/health" ||
      req.path === "/api/health/ready",
  })
);

app.use(
  express.json({
    limit: "1mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  })
);

// API responses should not be cached by browsers or CDNs.
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});


// Health Routes (deliberately not rate-limited)


app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    service: "Mayuresh Kasar Portfolio API",
    message: "Portfolio API backend is running.",
    environment: isProduction ? "production" : "development",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy",
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health/ready", async (req, res) => {
  try {
    await db.execute("SELECT 1");

    res.status(200).json({
      success: true,
      status: "ready",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: "not-ready",
      database: "unavailable",
      timestamp: new Date().toISOString(),
    });
  }
});


// Rate Limiting + API Routes


app.use("/api", apiLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/system", systemRoutes);


// Error Handling


app.use(notFound);
app.use(errorHandler);


// Start Server


const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || "0.0.0.0";

let server;

const startServer = async () => {
  try {
    await db.execute("SELECT 1");

    console.log("✅ Database connected successfully.");

    server = app.listen(PORT, HOST, () => {
      console.log(
        `🚀 API listening on ${HOST}:${PORT} (${
          isProduction ? "production" : "development"
        }).`
      );

      if (allowedOrigins.length > 0) {
        console.log(
          `🌐 Allowed browser origins: ${allowedOrigins.join(", ")}`
        );
      } else if (!isProduction) {
        console.log(
          "🌐 Local development: any localhost/127.0.0.1 origin is allowed."
        );
      }

      console.log(
        `🔐 Admin login: ${
          adminAuthConfig.mode === "hash"
            ? "bcrypt hash"
            : "env password (timing-safe)"
        }.`
      );

      if (!cloudinaryConfigured) {
        console.warn(
          "⚠️ Cloudinary is not configured — uploads return 503."
        );
      }

      if (!emailConfig.configured) {
        console.warn(
          "⚠️ Email is not configured — contact messages are saved but no notification email is sent."
        );
      } else {
        console.log(
          `📧 Email transport: ${
            emailConfig.transport === "gmail-api"
              ? "Gmail API (HTTPS)"
              : "Gmail SMTP"
          }.`
        );
      }

      if (!process.env.GEMINI_API_KEY) {
        console.warn(
          "⚠️ GEMINI_API_KEY is not configured — AI endpoints return 502."
        );
      }
    });

    // Render recommends keeping these above the platform's 60-second proxy
    // timeout so idle keep-alive connections are not reset unexpectedly.
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;
  } catch (error) {
    console.error("❌ Failed to connect to the database.");
    console.error(error.message);
    process.exit(1);
  }
};

startServer();


// Graceful Shutdown


let shuttingDown = false;

const shutdown = async (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`\n${signal} received. Shutting down gracefully...`);

  const forceExit = setTimeout(() => {
    console.error("❌ Forced shutdown after timeout.");
    process.exit(1);
  }, 10000);

  forceExit.unref();

  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }

    await db.end();

    clearTimeout(forceExit);

    console.log("✅ Server and database pool closed.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Shutdown error:", error.message);
    process.exit(1);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);

  if (isProduction) {
    shutdown("unhandledRejection");
  }
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  shutdown("uncaughtException");
});
