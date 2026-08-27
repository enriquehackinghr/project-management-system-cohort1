/**
 * Local testing only. Mints a real password reset link for an existing account
 * so the reset form can be exercised without waiting on an email to arrive.
 *
 *   node scripts/create-reset-link.mjs someone@example.com
 */
import { readFileSync } from "node:fs";
import { createHash, randomBytes } from "node:crypto";
import pg from "pg";

function loadEnv() {
  const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  for (const line of text.split(/\r?\n/)) {
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
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv();

const email = (process.argv[2] ?? "").trim().toLowerCase();
if (!email) {
  console.error("Usage: node scripts/create-reset-link.mjs <email>");
  process.exit(1);
}

const baseUrl = process.env.PREVIEW_URL ?? "http://localhost:3000";
const client = new pg.Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});
await client.connect();

try {
  const account = await client.query(
    `select p.id, p.first_name, p.email
     from people p join accounts a on a.person_id = p.id
     where p.email = $1`,
    [email],
  );
  if (!account.rows.length) {
    console.error(`No account with a password found for ${email}.`);
    process.exit(1);
  }

  const person = account.rows[0];
  // Same shape the app uses: 256 bits of entropy, only the digest is stored.
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");

  await client.query(
    `update password_resets set used_at = now()
     where person_id = $1 and used_at is null`,
    [person.id],
  );
  await client.query(
    `insert into password_resets (person_id, token_hash, expires_at)
     values ($1, $2, now() + interval '60 minutes')`,
    [person.id, tokenHash],
  );

  console.log(`Account:  ${person.first_name} <${person.email}>`);
  console.log("Expires:  60 minutes from now, single use");
  console.log("");
  console.log(`${baseUrl}/reset-password?token=${encodeURIComponent(token)}`);
} finally {
  await client.end();
}
