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

function collectEnvFiles() {
  const files = new Set<string>();
  const seeds = [
    process.cwd(),
    path.join(process.env.USERPROFILE ?? "", "Desktop", "my-app"),
    path.join(process.env.HOME ?? "", "Desktop", "my-app"),
  ].filter(Boolean);

  for (const seed of seeds) {
    let dir = path.resolve(seed);
    for (let i = 0; i < 8; i += 1) {
      files.add(path.join(dir, ".env.local"));
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }

  files.add(path.join(process.cwd(), "my-app", ".env.local"));
  return [...files];
}

function keyFromValues(values: Record<string, string>) {
  const names = Object.keys(values);
  for (const name of names) {
    if (name.toLowerCase() === "gemini_api_key") return values[name]?.trim() ?? "";
    if (name.toLowerCase() === "google_api_key") return values[name]?.trim() ?? "";
    if (name.toLowerCase() === "google_generative_ai_api_key") return values[name]?.trim() ?? "";
  }
  return "";
}

export function getGeminiApiKey() {
  for (const file of collectEnvFiles()) {
    try {
      if (!existsSync(file)) continue;
      const value = keyFromValues(parseEnvFile(file));
      if (value) return value;
    } catch {
      // 다음 경로를 시도합니다.
    }
  }
  return "";
}
