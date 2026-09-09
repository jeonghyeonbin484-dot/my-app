import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

function parseEnvFile(filePath: string) {
  const raw = readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  const values: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const name = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[name] = value;
  }
  return values;
}

function envFiles() {
  return [
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(process.cwd(), "my-app", ".env.local"),
  ];
}

export function loadLocalEnvIntoProcess() {
  for (const file of envFiles()) {
    if (!existsSync(file)) continue;
    const values = parseEnvFile(file);
    for (const [name, value] of Object.entries(values)) {
      process.env[name] = value;
    }
  }
}

export function getGeminiApiKey() {
  loadLocalEnvIntoProcess();

  const env = process.env;
  const value = (
    env["GEMINI_API_KEY"] ||
    env["gemini_api_key"] ||
    env["GOOGLE_API_KEY"] ||
    env["GOOGLE_GENERATIVE_AI_API_KEY"] ||
    ""
  ).trim();

  return value;
}
