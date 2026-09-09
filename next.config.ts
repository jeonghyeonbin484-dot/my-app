import { readFileSync } from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

function loadEnvLocal() {
  try {
    const filePath = path.join(__dirname, ".env.local");
    const raw = readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
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
      process.env[name] = value;
    }
  } catch {
    // next.config 로드 시점 실패 시 API에서 다시 읽습니다.
  }
}

loadEnvLocal();

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
