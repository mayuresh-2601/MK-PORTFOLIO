// server/routes/aiRoutes.js
import express from "express";
import {
  explainSkillHandler,
  explainCertificateHandler,
  askAboutMeHandler,
} from "../controllers/aiController.js";

import {
  aiDailyLimiter,
  aiGlobalDailyLimiter,
  aiLimiter,
  requireAiEnabled,
} from "../middleware/rateLimiters.js";

const router = express.Router();

const aiGuards = [
  requireAiEnabled,
  aiGlobalDailyLimiter,
  aiDailyLimiter,
  aiLimiter,
];

router.post("/explain-skill", ...aiGuards, explainSkillHandler);
router.post("/explain-certificate", ...aiGuards, explainCertificateHandler);
router.post("/ask-about-me", ...aiGuards, askAboutMeHandler);

export default router;
