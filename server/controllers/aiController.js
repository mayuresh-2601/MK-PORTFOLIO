// server/controllers/aiController.js
import {
  explainSkill,
  explainCertificate,
  answerAboutMe,
} from "../services/aiService.js";

// Requests are rate-limited by `aiLimiter` on the route. These handlers only
// validate and normalise input before calling the paid Gemini API.

export const explainSkillHandler = async (req, res) => {
  try {
    const { name, level } = req.body || {};

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Skill 'name' is required.",
      });
    }

    const parsedLevel = Number(level);

    const explanation = await explainSkill(
      name.trim().slice(0, 100),
      Number.isFinite(parsedLevel) ? parsedLevel : undefined
    );

    res.status(200).json({ success: true, explanation });
  } catch (error) {
    console.error("AI explainSkill error:", error.message);

    res.status(502).json({
      success: false,
      message: "AI explanation is temporarily unavailable.",
    });
  }
};

export const explainCertificateHandler = async (req, res) => {
  try {
    const { title, issuer } = req.body || {};

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Certificate 'title' is required.",
      });
    }

    const explanation = await explainCertificate(
      title.trim().slice(0, 150),
      typeof issuer === "string" ? issuer.trim().slice(0, 150) : ""
    );

    res.status(200).json({ success: true, explanation });
  } catch (error) {
    console.error("AI explainCertificate error:", error.message);

    res.status(502).json({
      success: false,
      message: "AI explanation is temporarily unavailable.",
    });
  }
};

export const askAboutMeHandler = async (req, res) => {
  try {
    const { question } = req.body || {};

    if (
      !question ||
      typeof question !== "string" ||
      question.trim().length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "'question' is required.",
      });
    }

    if (question.length > 300) {
      return res.status(400).json({
        success: false,
        message: "Question is too long (max 300 characters).",
      });
    }

    const answer = await answerAboutMe(question.trim());

    res.status(200).json({ success: true, answer });
  } catch (error) {
    console.error("AI askAboutMe error:", error.message);

    res.status(502).json({
      success: false,
      message: "AI assistant is temporarily unavailable.",
    });
  }
};
