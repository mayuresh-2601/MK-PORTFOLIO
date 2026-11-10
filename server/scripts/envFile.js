import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const envPath = path.resolve(__dirname, "../.env");

const formatValue = (value) => {
  const text = String(value ?? "");

  if (/[\r\n]/.test(text)) {
    throw new Error("Environment values must not contain line breaks.");
  }

  // Google OAuth values are URL-safe, but quote anything containing
  // whitespace, a comment marker, or a dollar sign so dotenv and Docker
  // Compose read the exact value.
  if (/[\s#$'"`\\]/.test(text)) {
    return `'${text.replace(/'/g, "'\\''")}'`;
  }

  return text;
};

export const readEnvFile = async () => {
  try {
    return await fs.readFile(envPath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return "";
    throw error;
  }
};

/**
 * Insert or replace keys in server/.env without disturbing comments or
 * unrelated values. Returns the keys that were updated.
 */
export const upsertEnvValues = async (values) => {
  const existing = await readEnvFile();
  const newline = existing.includes("\r\n") ? "\r\n" : "\n";

  const lines = existing ? existing.split(/\r?\n/) : [];
  const updated = [];

  for (const [key, rawValue] of Object.entries(values)) {
    if (!/^[A-Z0-9_]+$/.test(key)) {
      throw new Error(`Invalid environment key: ${key}`);
    }

    const value = formatValue(rawValue);
    const line = `${key}=${value}`;

    const index = lines.findIndex((entry) =>
      entry.trimStart().startsWith(`${key}=`)
    );

    if (index >= 0) {
      lines[index] = line;
    } else {
      lines.push(line);
    }

    updated.push(key);
  }

  let result = lines.join(newline);

  if (!result.endsWith(newline)) {
    result += newline;
  }

  await fs.writeFile(envPath, result, {
    encoding: "utf8",
    mode: 0o600,
  });

  // Best effort on Windows, where chmod is mostly a no-op.
  await fs.chmod(envPath, 0o600).catch(() => {});

  return updated;
};

export default {
  envPath,
  readEnvFile,
  upsertEnvValues,
};
