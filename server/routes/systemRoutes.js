// server/routes/systemRoutes.js
import express from "express";
import { getSystemSnapshot } from "../controllers/systemController.js";
import { systemLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();

router.get("/", systemLimiter, getSystemSnapshot);

export default router;
