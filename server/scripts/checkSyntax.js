/**
 * Syntax-check every server JavaScript file.
 *
 * `node --check` validates one file at a time, so this walks the tree and
 * runs it for each .js file. It catches typos and broken imports before a
 * Render deploy without needing any test framework.
 */

import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, "..");

const files = readdirSync(serverRoot, {
  recursive: true,
  withFileTypes: true,
})
  .filter((entry) => {
    const directory = entry.parentPath || entry.path || "";

    return (
      entry.isFile() &&
      entry.name.endsWith(".js") &&
      !directory.includes("node_modules")
    );
  })
  .map((entry) =>
    path.join(entry.parentPath || entry.path || "", entry.name)
  )
  .sort();

if (files.length === 0) {
  console.error("No JavaScript files found to check.");
  process.exit(1);
}

let failed = 0;

for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], {
    encoding: "utf8",
  });

  if (result.status !== 0) {
    failed += 1;
    console.error(`❌ ${path.relative(serverRoot, file)}`);
    if (result.stderr) console.error(result.stderr.trim());
  }
}

if (failed > 0) {
  console.error(`\n${failed} file(s) failed the syntax check.`);
  process.exit(1);
}

console.log(`✅ Syntax check passed for ${files.length} server files.`);
