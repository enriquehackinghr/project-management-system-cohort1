import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const text = readFileSync(resolve(".env.local"), "utf8");
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return env;
}

const env = loadEnvLocal();
const url = env.SUPABASE_URL;
const token = env.SUPABASE_ACCESS_TOKEN;
const ref = new URL(url).hostname.split(".")[0];
const file = process.argv[2] ?? "supabase/migrations/001_init.sql";
const sql = readFileSync(resolve(file), "utf8");

const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ query: sql }),
});

const body = await response.text();
if (!response.ok) {
  console.error("Migration failed:", response.status);
  console.error(body.slice(0, 2000));
  process.exit(1);
}

console.log("Migration applied:", file);
