import "dotenv/config";

/**
 * Shared database configuration.
 *
 * Keeping the connection options in one place means the API, the database
 * setup script, and any future tooling all connect the same way. TiDB Cloud
 * requires TLS; local MySQL and Docker Compose do not.
 */

const requiredForConnection = ["DB_HOST", "DB_USER", "DB_NAME"];

const missing = requiredForConnection.filter(
  (key) => !process.env[key]?.trim()
);

// An empty password is valid for a local MySQL root account, so only require
// the variable to be present rather than non-empty.
if (process.env.DB_PASSWORD === undefined) {
  missing.push("DB_PASSWORD");
}

if (missing.length > 0) {
  throw new Error(
    `Missing database environment variables: ${missing.join(", ")}. ` +
      "Copy server/.env.example to server/.env and fill in your TiDB or MySQL values."
  );
}

const sslSetting = process.env.DB_SSL;

const sslEnabled =
  sslSetting === undefined
    ? process.env.NODE_ENV === "production"
    : /^(true|1|yes|on)$/i.test(sslSetting.trim());

const parsedLimit = Number(process.env.DB_CONNECTION_LIMIT);
const connectionLimit = Number.isFinite(parsedLimit)
  ? Math.min(20, Math.max(1, Math.trunc(parsedLimit)))
  : 10;

const parsedPort = Number(process.env.DB_PORT);
const port = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 4000;

export const databaseSslEnabled = sslEnabled;

/**
 * Options accepted by both `mysql.createConnection` and `mysql.createPool`.
 */
export const getBaseDatabaseConfig = () => ({
  host: process.env.DB_HOST.trim(),
  port,
  user: process.env.DB_USER.trim(),
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME.trim(),
  charset: "utf8mb4",
  connectTimeout: 20000,
  ssl: sslEnabled
    ? {
        minVersion: "TLSv1.2",
        rejectUnauthorized: true,
      }
    : undefined,
});

/**
 * Pool-only options. Tuned to stay comfortably inside TiDB Serverless
 * connection limits while still handling a portfolio's traffic.
 */
export const getPoolConfig = () => ({
  ...getBaseDatabaseConfig(),
  waitForConnections: true,
  connectionLimit,
  maxIdle: connectionLimit,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  namedPlaceholders: true,
});
