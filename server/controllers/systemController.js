// server/controllers/systemController.js
import os from "os";
import fs from "fs";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

// Detects whether this process is running inside a Docker container.
// The /.dockerenv file is created by Docker itself at container start —
// this is the standard, reliable way to check.
function isRunningInDocker() {
  try {
    return fs.existsSync("/.dockerenv");
  } catch {
    return false;
  }
}

function getCpuLoadPercent(cores) {
  // os.loadavg() is Linux/macOS only and returns 0s on Windows — expected,
  // since this endpoint is designed to run on the actual Linux deployment
  // (Render), not a local Windows dev machine.
  const [load1] = os.loadavg();
  const percent = (load1 / cores) * 100;
  return Math.min(100, Math.round(percent * 10) / 10);
}

function getMemoryStats() {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  return {
    totalMB: Math.round(total / 1024 / 1024),
    usedMB: Math.round(used / 1024 / 1024),
    freeMB: Math.round(free / 1024 / 1024),
    usedPercent: Math.round((used / total) * 1000) / 10,
  };
}

// Git and Docker metadata change rarely. Running `git`/`docker` with
// execSync on every 5-second poll blocked the event loop, so the values are
// collected asynchronously once and cached for five minutes.
const STATIC_INFO_TTL_MS = 5 * 60 * 1000;

let cachedStaticInfo = null;
let cachedStaticInfoExpiresAt = 0;
let staticInfoRequest = null;

const readCommand = async (file, args) => {
  try {
    const { stdout } = await execFileAsync(file, args, {
      timeout: 1500,
      windowsHide: true,
      maxBuffer: 64 * 1024,
    });

    return stdout.trim() || null;
  } catch {
    return null;
  }
};

const loadStaticInfo = async () => {
  const [dockerVersion, gitCommit, gitBranch] = await Promise.all([
    readCommand("docker", ["--version"]),
    readCommand("git", ["rev-parse", "--short", "HEAD"]),
    readCommand("git", ["rev-parse", "--abbrev-ref", "HEAD"]),
  ]);

  return {
    dockerVersion,
    gitCommit,
    gitBranch,
  };
};

const getStaticInfo = () => {
  if (cachedStaticInfo && Date.now() < cachedStaticInfoExpiresAt) {
    return Promise.resolve(cachedStaticInfo);
  }

  // Collapse concurrent cache misses into one set of child processes.
  if (staticInfoRequest) return staticInfoRequest;

  staticInfoRequest = loadStaticInfo()
    .then((info) => {
      cachedStaticInfo = info;
      cachedStaticInfoExpiresAt = Date.now() + STATIC_INFO_TTL_MS;
      return info;
    })
    .finally(() => {
      staticInfoRequest = null;
    });

  return staticInfoRequest;
};

// Warm the cache after startup without delaying the first health check.
void getStaticInfo().catch(() => {});

export const getSystemSnapshot = async (req, res, next) => {
  try {
    const inDocker = isRunningInDocker();
    const staticInfo = await getStaticInfo();
    const cpus = os.cpus();
    const cores = cpus.length || 1;

    const snapshot = {
      timestamp: new Date().toISOString(),
      host: {
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        uptimeSeconds: Math.round(os.uptime()),
        processUptimeSeconds: Math.round(process.uptime()),
      },
      cpu: {
        cores,
        model: cpus[0]?.model ?? "unknown",
        loadPercent: getCpuLoadPercent(cores),
      },
      memory: getMemoryStats(),
      docker: {
        runningInContainer: inDocker,
        // Only attempt docker CLI calls if NOT already inside a container —
        // a container usually can't see the host's other containers unless
        // the docker socket is explicitly mounted.
        version: !inDocker ? staticInfo.dockerVersion : null,
      },
      git: {
        commit: staticInfo.gitCommit,
        branch: staticInfo.gitBranch,
      },
    };

    return res.status(200).json({ success: true, data: snapshot });
  } catch (error) {
    return next(error);
  }
};

export default { getSystemSnapshot };
