import "dotenv/config";

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import mysql from "mysql2/promise";

import { getBaseDatabaseConfig } from "../config/databaseConfig.js";

/**
 * Restore a logical JSON backup.
 *
 * Safety rules:
 *   - requires --yes (destructive)
 *   - requires the .sha256 sidecar to match
 *   - refuses NODE_ENV=production unless --allow-production is explicit
 *   - --replace drops the backed-up tables before recreating them; without
 *     it, existing rows are replaced table by table
 *   - admin_sessions is never restored
 *
 * Use a scratch database (for example portfolio_restore_test) to rehearse a
 * restore before touching production.
 */

const args = process.argv.slice(2);
const backupPathArg = args.find((arg) => !arg.startsWith("--"));
const confirmed = args.includes("--yes");
const replace = args.includes("--replace");
const allowProduction = args.includes("--allow-production");

if (!backupPathArg) {
  console.error(
    "Usage: npm run db:restore -- <backup.json> --yes [--replace] [--allow-production]"
  );
  process.exit(1);
}

if (!confirmed) {
  console.error(
    "Restore is destructive. Re-run with --yes after verifying the target DB_NAME."
  );
  process.exit(1);
}

if (process.env.NODE_ENV === "production" && !allowProduction) {
  console.error(
    "Refusing to restore with NODE_ENV=production. Re-run with --allow-production only after taking a fresh backup."
  );
  process.exit(1);
}

const backupPath = path.resolve(process.cwd(), backupPathArg);

const quoteIdentifier = (name) => `\`${String(name).replace(/`/g, "``")}\``;

const verifyChecksum = async () => {
  const raw = await fs.readFile(backupPath, "utf8");
  const actual = crypto.createHash("sha256").update(raw).digest("hex");
  const sidecar = (await fs.readFile(`${backupPath}.sha256`, "utf8")).trim();
  const expected = sidecar.split(/\s+/)[0];

  if (!/^[a-f0-9]{64}$/i.test(expected) || actual !== expected) {
    throw new Error(
      "Checksum verification failed. The backup is corrupted or was modified."
    );
  }

  return raw;
};

const insertRows = async (connection, table) => {
  if (table.rows.length === 0) return;

  const columns = Object.keys(table.rows[0]);

  if (columns.length === 0) {
    throw new Error(`Backup table ${table.name} has no columns.`);
  }

  const knownColumns = new Set(table.columns);

  for (const column of columns) {
    if (!knownColumns.has(column)) {
      throw new Error(
        `Backup table ${table.name} has inconsistent columns.`
      );
    }
  }

  const batchSize = 100;

  for (let offset = 0; offset < table.rows.length; offset += batchSize) {
    const batch = table.rows.slice(offset, offset + batchSize);
    const placeholders = batch
      .map(() => `(${columns.map(() => "?").join(", ")})`)
      .join(", ");
    const values = batch.flatMap((row) =>
      columns.map((column) => {
        if (!(column in row)) {
          throw new Error(
            `A row in ${table.name} is missing column ${column}.`
          );
        }

        return row[column];
      })
    );

    await connection.query(
      `INSERT INTO ${quoteIdentifier(table.name)} (${columns
        .map(quoteIdentifier)
        .join(", ")}) VALUES ${placeholders}`,
      values
    );
  }
};

const main = async () => {
  const raw = await verifyChecksum();
  const backup = JSON.parse(raw);

  if (backup?.format !== "portfolio-mysql-backup" || backup?.version !== 1) {
    throw new Error("Unsupported backup format or version.");
  }

  const connection = await mysql.createConnection(getBaseDatabaseConfig());

  try {
    console.log(`Restoring into database: ${process.env.DB_NAME}`);
    console.log(`Source backup:          ${backupPath}`);
    console.log(`Replace existing:       ${replace ? "yes" : "no"}`);
    console.log("");

    await connection.query("SET FOREIGN_KEY_CHECKS = 0");

    for (const table of backup.tables) {
      if (table.name === "admin_sessions" && table.schemaOnly !== true) {
        console.warn("Skipping admin_sessions rows (never restored).");
        continue;
      }

      if (replace) {
        await connection.query(
          `DROP TABLE IF EXISTS ${quoteIdentifier(table.name)}`
        );
      }

      await connection.query(table.createSql);

      if (table.schemaOnly === true) {
        console.log(`  ${table.name}: schema recreated (no rows restored)`);
        continue;
      }
      await connection.beginTransaction();

      try {
        await connection.query(
          `DELETE FROM ${quoteIdentifier(table.name)}`
        );
        await insertRows(connection, table);
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      }

      console.log(`  ${table.name}: restored ${table.rows.length} row(s)`);
    }

    await connection.query("SET FOREIGN_KEY_CHECKS = 1");

    console.log("");
    console.log("Restore complete. Run `npm run db:check` to validate the schema.");
  } finally {
    await connection.end().catch(() => {});
  }
};

main().catch((error) => {
  console.error(`Restore failed: ${error.message}`);
  process.exitCode = 1;
});
