import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

function parseEnvLocal() {
  const values: Record<string, string> = {};
  try {
    const raw = readFileSync(path.join(__dirname, ".env.local"), "utf8").replace(/^\uFEFF/, "");
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
      process.env[name] = value;
    }
  } catch {
    // .env.local이 없으면 빈 값으로 둡니다.
  }
  return values;
}

const localEnv = parseEnvLocal();
const geminiKey =
  localEnv.GEMINI_API_KEY ||
  localEnv.gemini_api_key ||
  process.env.GEMINI_API_KEY ||
  "";

writeFileSync(
  path.join(__dirname, "lib", "gemini-secret.generated.ts"),
  `export const GEMINI_API_KEY = ${JSON.stringify(geminiKey)};\n`,
);

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
