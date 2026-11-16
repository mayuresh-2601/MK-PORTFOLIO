import "dotenv/config";

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import mysql from "mysql2/promise";

import { getBaseDatabaseConfig } from "../config/databaseConfig.js";

/**
 * Logical JSON backup for MySQL 8 / TiDB Cloud.
 *
 * Why not mysqldump? It is not installed on Render and may not be available
 * on a Windows workstation. This script uses the same mysql2 driver and TLS
 * settings as the API, exports schema + rows, and writes a SHA-256 sidecar so
 * a restore can prove the file was not corrupted or edited.
 *
 * Admin sessions are deliberately excluded: their rows contain hashed
 * credentials that are useless after a restore and should not be copied into
 * another environment.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, "..");
const defaultBackupDir = path.join(serverRoot, "backups");

const EXCLUDED_TABLES = new Set(["admin_sessions"]);
const REQUIRED_TABLES = ["projects", "skills", "certificates", "messages"];

const quoteIdentifier = (name) => `\`${String(name).replace(/`/g, "``")}\``;

const connect = async () => {
  const config = getBaseDatabaseConfig();

  // Keep DATETIME/TIMESTAMP values as MySQL strings instead of JS Date
  // objects. JSON.stringify would otherwise write ISO-8601 ("...T...Z")
  // values, which MySQL rejects on restore.
  return mysql.createConnection({ ...config, dateStrings: true });
};

const getTables = async (connection) => {
  const [rows] = await connection.execute(
    `
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ?
        AND TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `,
    [process.env.DB_NAME.trim()]
  );

  return rows.map((row) => row.TABLE_NAME);
};

const buildTimestamp = () =>
  new Date().toISOString().replace(/[:.]/g, "-");

const sha256File = async (filePath) => {
  const contents = await fs.readFile(filePath);

  return crypto.createHash("sha256").update(contents).digest("hex");
};

const outputPathArg = process.argv[2];

const outputPath = outputPathArg
  ? path.resolve(process.cwd(), outputPathArg)
  : path.join(defaultBackupDir, `portfolio-${buildTimestamp()}.json`);

const main = async () => {
  const connection = await connect();

  try {
    const tables = await getTables(connection);
    const missing = REQUIRED_TABLES.filter(
      (table) => !tables.includes(table)
    );

    if (missing.length > 0) {
      throw new Error(
        `Database is missing required table(s): ${missing.join(", ")}`
      );
    }

    const backup = {
      format: "portfolio-mysql-backup",
      version: 1,
      createdAt: new Date().toISOString(),
      database: process.env.DB_NAME.trim(),
      excludedTables: [...EXCLUDED_TABLES],
      tables: [],
    };

    for (const table of tables) {
      const [createRows] = await connection.query(
        `SHOW CREATE TABLE ${quoteIdentifier(table)}`
      );

      const createSql = createRows[0]?.["Create Table"];

      if (!createSql) {
        throw new Error(`Could not read the schema for ${table}.`);
      }

      // Excluded tables keep their schema so a restore produces a working
      // database, but their rows (session secrets) are never exported.
      if (EXCLUDED_TABLES.has(table)) {
        backup.tables.push({
          name: table,
          createSql,
          columns: [],
          rowCount: 0,
          rows: [],
          schemaOnly: true,
        });

        console.log(`  ${table}: schema only (rows excluded)`);
        continue;
      }

      const [rows] = await connection.query(
        `SELECT * FROM ${quoteIdentifier(table)}`
      );

      backup.tables.push({
        name: table,
        createSql,
        columns: rows.length > 0 ? Object.keys(rows[0]) : [],
        rowCount: rows.length,
        rows,
      });

      console.log(`  ${table}: ${rows.length} row(s)`);
    }

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(
      outputPath,
      `${JSON.stringify(backup, null, 2)}\n`,
      "utf8"
    );

    const digest = await sha256File(outputPath);

    await fs.writeFile(`${outputPath}.sha256`, `${digest}  ${path.basename(outputPath)}\n`, "utf8");

    console.log("");
    console.log("Backup complete.");
    console.log(`File:   ${outputPath}`);
    console.log(`SHA256: ${digest}`);
    console.log("");
    console.log(
      "Store this file somewhere private. It contains contact messages and admin content, but no admin session secrets or environment credentials."
    );
  } finally {
    await connection.end();
  }
};

main().catch((error) => {
  console.error(`Backup failed: ${error.message}`);
  process.exitCode = 1;
});
