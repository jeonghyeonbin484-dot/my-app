import { readFileSync } from "node:fs";
import path from "node:path";

function parseEnvFile(filePath: string) {
  try {
    const raw = readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
    const values: Record<string, string> = {};
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      values[key] = value;
    }
    return values;
  } catch {
    return {};
  }
}

function keyFromValues(values: Record<string, string>) {
  return (
    values.GEMINI_API_KEY?.trim() ||
    values.gemini_api_key?.trim() ||
    values.GOOGLE_API_KEY?.trim() ||
    values.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    ""
  );
}

export function getGeminiApiKey() {
  const files = [
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(process.cwd(), "my-app", ".env.local"),
    path.resolve(process.cwd(), "..", "my-app", ".env.local"),
  ];

  for (const file of files) {
    const value = keyFromValues(parseEnvFile(file));
    if (value) return value;
  }

  return (
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.gemini_api_key?.trim() ||
    process.env.GOOGLE_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    ""
  );
}
