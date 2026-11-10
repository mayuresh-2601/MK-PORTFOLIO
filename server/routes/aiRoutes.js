// server/routes/aiRoutes.js
import express from "express";
import {
  explainSkillHandler,
  explainCertificateHandler,
  askAboutMeHandler,
} from "../controllers/aiController.js";

import { aiLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();

router.post("/explain-skill", aiLimiter, explainSkillHandler);
router.post("/explain-certificate", aiLimiter, explainCertificateHandler);
router.post("/ask-about-me", aiLimiter, askAboutMeHandler);

export default router;
