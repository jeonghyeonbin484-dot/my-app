const fs = require("fs");
const path = require("path");

const raw = fs.readFileSync(".env.local", "utf8").replace(/^\uFEFF/, "");
let key = "";
for (const line of raw.split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i === -1) continue;
  const n = t.slice(0, i).trim();
  let v = t.slice(i + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  if (n.toLowerCase() === "gemini_api_key") key = v;
}

fs.writeFileSync(
  path.join("lib", "gemini-secret.generated.ts"),
  "export const GEMINI_API_KEY = " + JSON.stringify(key) + ";\n",
);
console.log("wrote", key.length);
