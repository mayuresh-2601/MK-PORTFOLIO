// server/controllers/systemController.js
import os from "os";

/**
 * Public telemetry.
 *
 * This endpoint is intentionally small. It no longer exposes the OS platform,
 * architecture, kernel/Node version, hostname, Docker version, git branch or
 * process identifiers. Visitors see useful live signals; attackers do not
 * get a free fingerprint of the host.
 */

function getCpuLoadPercent(cores) {
  // os.loadavg() is Linux/macOS only and returns 0s on Windows — expected,
  // since this endpoint is designed for the actual Linux deployment.
  const [load1] = os.loadavg();
  const percent = (load1 / cores) * 100;

  return Math.min(100, Math.round(percent * 10) / 10);
}

function getMemoryPercent() {
  const total = os.totalmem();
  const free = os.freemem();

  if (!total) return 0;

  return Math.min(100, Math.round(((total - free) / total) * 1000) / 10);
}

const aiEnabled = () =>
  !/^(false|0|no|off)$/i.test(
    String(process.env.AI_ENABLED || "").trim()
  ) && Boolean(String(process.env.GEMINI_API_KEY || "").trim());

const getDeployedCommit = () => {
  const commit = String(
    process.env.RENDER_GIT_COMMIT ||
      process.env.GIT_COMMIT ||
      process.env.VERCEL_GIT_COMMIT_SHA ||
      ""
  ).trim();

  return /^[a-f0-9]{7,40}$/i.test(commit) ? commit.slice(0, 7) : null;
};

export const getSystemSnapshot = async (req, res, next) => {
  try {
    const cores = os.cpus().length || 1;

    const snapshot = {
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      cpu: {
        cores,
        loadPercent: getCpuLoadPercent(cores),
      },
      memory: {
        usedPercent: getMemoryPercent(),
      },
      services: {
        ai: aiEnabled() ? "available" : "disabled",
      },
      deployment: {
        commit: getDeployedCommit(),
      },
    };

    return res.status(200).json({ success: true, data: snapshot });
  } catch (error) {
    return next(error);
  }
};

export default { getSystemSnapshot };
