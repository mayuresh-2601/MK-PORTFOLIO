/**
 * Database lifecycle commands for MySQL 8+ and TiDB Cloud.
 *
 * Usage (from the server directory):
 *   npm run db:setup     create the database (if needed) + schema
 *   npm run db:migrate   upgrade an existing database idempotently
 *   npm run db:seed      insert/refresh the portfolio baseline content
 *   npm run db:check     verify tables, columns, charset and row counts
 *
 * The script uses the same environment variables and TLS settings as the
 * API, so a successful command here proves the credentials Render will use.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import mysql from "mysql2/promise";

import { getBaseDatabaseConfig } from "../config/databaseConfig.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const databaseDir = path.resolve(__dirname, "../database");

const { database: databaseName, ...connectionBase } =
  getBaseDatabaseConfig();

if (!/^[A-Za-z0-9_]+$/.test(databaseName)) {
  console.error(
    `❌ DB_NAME may only contain letters, digits and underscores. Got: "${databaseName}"`
  );
  process.exit(1);
}

const REQUIRED_TABLES = ["projects", "skills", "certificates", "messages"];

const log = (message) => console.log(message);

const readSql = (filename) =>
  fs.readFile(path.join(databaseDir, filename), "utf8");

const connect = (options = {}) =>
  mysql.createConnection({
    ...connectionBase,
    ...options,
  });

const queryOne = async (connection, sql, values = []) => {
  const [rows] = await connection.execute(sql, values);
  return rows[0] || null;
};

const getTableNames = async (connection) => {
  const [rows] = await connection.execute(
    `
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME
    `,
    [databaseName]
  );

  return rows.map((row) => row.TABLE_NAME);
};

const getColumn = async (connection, table, column) =>
  queryOne(
    connection,
    `
      SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_TYPE
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
      LIMIT 1
    `,
    [databaseName, table, column]
  );

const getTableCollation = async (connection, table) =>
  queryOne(
    connection,
    `
      SELECT TABLE_COLLATION
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = ?
      LIMIT 1
    `,
    [databaseName, table]
  );

const printCounts = async (connection) => {
  for (const table of REQUIRED_TABLES) {
    const [rows] = await connection.execute(
      `SELECT COUNT(*) AS count FROM \`${table}\``
    );

    log(`   ${table.padEnd(14)} ${rows[0].count}`);
  }
};

/* 
   setup
 */

const setup = async () => {
  log(`\n📦 Setting up database "${databaseName}"...`);

  // Connect without selecting a database first so we can create it.
  const admin = await connect();

  try {
    await admin.query(
      `CREATE DATABASE IF NOT EXISTS \`${databaseName}\` ` +
        "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    );

    log("✅ Database exists (created if missing).");
  } catch (error) {
    // TiDB Cloud Serverless databases are created in the console and the
    // application user may not have CREATE DATABASE permission. If the
    // database already exists this is fine; otherwise the error below will
    // make the actual problem clear.
    if (error.errno !== 1044 && error.errno !== 1045) {
      throw error;
    }

    log(
      "ℹ️  No CREATE DATABASE permission; using the existing database."
    );
  } finally {
    await admin.end();
  }

  const schemaSql = await readSql("schema.sql");

  const connection = await connect({
    database: databaseName,
    multipleStatements: true,
  });

  try {
    await connection.query(schemaSql);

    log("✅ Schema applied.");

    const tables = await getTableNames(connection);

    log(`✅ Tables: ${tables.join(", ")}`);

    log("\nNext step: npm run db:seed");
  } finally {
    await connection.end();
  }
};

/* 
   migrate
 */

const migrate = async () => {
  log(`\n🔧 Migrating database "${databaseName}"...`);

  const connection = await connect({ database: databaseName });

  try {
    const tables = await getTableNames(connection);

    const missingTables = REQUIRED_TABLES.filter(
      (table) => !tables.includes(table)
    );

    if (missingTables.length > 0) {
      throw new Error(
        `Missing table(s): ${missingTables.join(", ")}. ` +
          "Run `npm run db:setup` for a fresh database."
      );
    }

    const subjectColumn = await getColumn(
      connection,
      "messages",
      "subject"
    );

    if (!subjectColumn) {
      await connection.query(
        `
          ALTER TABLE messages
          ADD COLUMN subject VARCHAR(200) NOT NULL
          DEFAULT 'Portfolio Contact Form'
          AFTER email
        `
      );

      log("✅ Added messages.subject.");
    } else {
      log("ℹ️  messages.subject already present.");
    }

    const certificateImage = await getColumn(
      connection,
      "certificates",
      "image"
    );

    if (certificateImage && certificateImage.IS_NULLABLE === "NO") {
      await connection.query(
        "ALTER TABLE certificates MODIFY COLUMN image VARCHAR(512) NULL DEFAULT NULL"
      );

      log("✅ Certificate image is now optional.");
    } else {
      log("ℹ️  Certificate image already optional.");
    }

    for (const [table, column] of [
      ["projects", "github"],
      ["projects", "demo"],
      ["certificates", "link"],
    ]) {
      const info = await getColumn(connection, table, column);

      if (info && info.COLUMN_DEFAULT !== null) {
        await connection.query(
          `ALTER TABLE \`${table}\` MODIFY COLUMN \`${column}\` VARCHAR(512) NULL DEFAULT NULL`
        );

        log(`✅ ${table}.${column} default changed to NULL.`);
      }
    }

    for (const table of REQUIRED_TABLES) {
      const info = await getTableCollation(connection, table);

      if (info && !/^utf8mb4/i.test(info.TABLE_COLLATION || "")) {
        await connection.query(
          `ALTER TABLE \`${table}\` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
        );

        log(`✅ Converted ${table} to utf8mb4.`);
      }
    }

    if (tables.includes("users")) {
      await connection.query("DROP TABLE IF EXISTS users");

      log("✅ Dropped unused legacy users table.");
    }

    log("\n✅ Migration complete.");
  } finally {
    await connection.end();
  }
};

/* 
   seed
 */

const seed = async () => {
  log(`\n🌱 Seeding database "${databaseName}"...`);

  const seedSql = await readSql("seed.sql");

  const connection = await connect({
    database: databaseName,
    multipleStatements: true,
  });

  try {
    await connection.query(seedSql);

    log("✅ Baseline portfolio content applied.");
    log("\nRow counts:");

    await printCounts(connection);
  } finally {
    await connection.end();
  }
};

/* 
   check
 */

const check = async () => {
  log(`\n🔎 Checking database "${databaseName}"...`);

  const connection = await connect({ database: databaseName });

  try {
    const tables = await getTableNames(connection);
    const problems = [];

    for (const table of REQUIRED_TABLES) {
      if (!tables.includes(table)) {
        problems.push(`missing table: ${table}`);
      }
    }

    if (tables.includes("messages")) {
      const subject = await getColumn(connection, "messages", "subject");

      if (!subject) problems.push("missing column: messages.subject");
    }

    if (tables.includes("certificates")) {
      const image = await getColumn(connection, "certificates", "image");

      if (image && image.IS_NULLABLE !== "YES") {
        problems.push("certificates.image must be nullable");
      }
    }

    for (const table of REQUIRED_TABLES) {
      if (!tables.includes(table)) continue;

      const info = await getTableCollation(connection, table);

      if (info && !/^utf8mb4/i.test(info.TABLE_COLLATION || "")) {
        problems.push(
          `${table} is not utf8mb4 (${info.TABLE_COLLATION})`
        );
      }
    }

    if (problems.length > 0) {
      console.error("\n❌ Database check failed:");
      for (const problem of problems) console.error(`   - ${problem}`);
      console.error(
        "\nRun `npm run db:migrate` for an existing database, or `npm run db:setup` for a new one."
      );
      process.exitCode = 1;
      return;
    }

    log("✅ Tables, columns and charsets are correct.");
    log("\nRow counts:");

    await printCounts(connection);
  } finally {
    await connection.end();
  }
};

/* 
   Entry point
 */

const command = process.argv[2];

const commands = { setup, migrate, seed, check };

if (!commands[command]) {
  console.error(
    "Usage: node scripts/database.js <setup|migrate|seed|check>"
  );
  process.exit(1);
}

try {
  await commands[command]();
} catch (error) {
  console.error(`\n❌ Database command "${command}" failed.`);
  console.error(error.message);
  process.exit(1);
}
