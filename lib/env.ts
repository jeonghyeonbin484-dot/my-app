import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { GEMINI_API_KEY as generatedKey } from "@/lib/gemini-secret.generated";

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
  if (generatedKey?.trim()) return generatedKey.trim();

  const files = [
    path.join(process.cwd(), ".env.local"),
    path.join(process.cwd(), "my-app", ".env.local"),
    path.join(process.env.USERPROFILE ?? "", "Desktop", "my-app", ".env.local"),
  ];

  for (const file of files) {
    try {
      if (!existsSync(file)) continue;
      const value = keyFromValues(parseEnvFile(file));
      if (value) return value;
    } catch {
      // 다음 파일을 시도합니다.
    }
  }

  return "";
}
