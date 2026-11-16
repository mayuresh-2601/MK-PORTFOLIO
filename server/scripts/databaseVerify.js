import "dotenv/config";

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import mysql from "mysql2/promise";

import { getBaseDatabaseConfig } from "../config/databaseConfig.js";

/**
 * Verify a logical backup file:
 *   1. SHA-256 sidecar matches the file.
 *   2. JSON shape is valid and every table row count agrees with its rows.
 *   3. With --db, live row counts match the backup.
 */

const backupPathArg = process.argv[2];
const checkDatabase = process.argv.includes("--db");

if (!backupPathArg) {
  console.error(
    "Usage: npm run db:verify -- <backup.json> [--db]"
  );
  process.exit(1);
}

const backupPath = path.resolve(process.cwd(), backupPathArg);

const sha256File = async (filePath) => {
  const contents = await fs.readFile(filePath);

  return crypto.createHash("sha256").update(contents).digest("hex");
};

const fail = (message) => {
  throw new Error(message);
};

const readBackup = async () => {
  const raw = await fs.readFile(backupPath, "utf8");
  const actual = crypto.createHash("sha256").update(raw).digest("hex");

  try {
    const sidecar = (await fs.readFile(`${backupPath}.sha256`, "utf8")).trim();
    const expected = sidecar.split(/\s+/)[0];

    if (!/^[a-f0-9]{64}$/i.test(expected)) {
      fail("The .sha256 sidecar does not contain a valid SHA-256 digest.");
    }

    if (actual !== expected) {
      fail(
        `Checksum mismatch. Expected ${expected}, file is ${actual}. Do not restore this file.`
      );
    }

    console.log(`Checksum OK: ${actual}`);
  } catch (error) {
    fail(`Could not verify the checksum sidecar: ${error.message}`);
  }

  let backup;

  try {
    backup = JSON.parse(raw);
  } catch {
    fail("The backup is not valid JSON.");
  }

  if (backup?.format !== "portfolio-mysql-backup" || backup?.version !== 1) {
    fail("The backup format/version is not supported.");
  }

  if (!Array.isArray(backup.tables) || backup.tables.length === 0) {
    fail("The backup contains no tables.");
  }

  const seen = new Set();

  for (const table of backup.tables) {
    if (
      typeof table.name !== "string" ||
      typeof table.createSql !== "string" ||
      !Array.isArray(table.rows)
    ) {
      fail("A table entry is malformed.");
    }

    if (seen.has(table.name)) {
      fail(`Duplicate table in backup: ${table.name}`);
    }

    seen.add(table.name);

    if (table.rowCount !== table.rows.length) {
      fail(
        `Row count mismatch for ${table.name}: metadata says ${table.rowCount}, rows array has ${table.rows.length}.`
      );
    }

    for (const row of table.rows) {
      if (!row || typeof row !== "object" || Array.isArray(row)) {
        fail(`A row in ${table.name} is not an object.`);
      }
    }
  }

  for (const required of ["projects", "skills", "certificates", "messages"]) {
    if (!seen.has(required)) {
      fail(`Required table ${required} is missing from the backup.`);
    }
  }

  const sessionTable = backup.tables.find(
    (table) => table.name === "admin_sessions"
  );

  if (
    sessionTable &&
    (sessionTable.schemaOnly !== true || sessionTable.rows.length !== 0)
  ) {
    fail(
      "The backup contains admin_sessions rows. Only an empty schema may be exported."
    );
  }

  console.log(`Structure OK: ${backup.tables.length} table(s).`);

  for (const table of backup.tables) {
    console.log(`  ${table.name}: ${table.rows.length} row(s)`);
  }

  return backup;
};

const compareLiveCounts = async (backup) => {
  const connection = await mysql.createConnection(getBaseDatabaseConfig());

  try {
    let mismatches = 0;

    for (const table of backup.tables) {
      const [rows] = await connection.query(
        `SELECT COUNT(*) AS count FROM \`${table.name.replace(/`/g, "``")}\``
      );
      const live = Number(rows[0]?.count ?? -1);

      if (live !== table.rowCount) {
        mismatches += 1;
        console.error(
          `  MISMATCH ${table.name}: backup ${table.rowCount}, live ${live}`
        );
      } else {
        console.log(`  MATCH ${table.name}: ${live}`);
      }
    }

    if (mismatches > 0) {
      fail(`${mismatches} table(s) differ from the live database.`);
    }

    console.log("Live database counts match the backup.");
  } finally {
    await connection.end();
  }
};

const main = async () => {
  const backup = await readBackup();

  if (checkDatabase) {
    await compareLiveCounts(backup);
  }

  console.log("");
  console.log("Backup verification passed.");
};

main().catch((error) => {
  console.error(`Verification failed: ${error.message}`);
  process.exitCode = 1;
});
