import { readFileSync } from "node:fs";
import { Resend } from "resend";
import {
  passwordResetHtml,
  passwordResetSubject,
  passwordResetText,
} from "../src/lib/email-templates";

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

const apiKey = process.env.RESEND_API_KEY ?? process.env.RESEND_API;
if (!apiKey) {
  throw new Error("Missing RESEND_API or RESEND_API_KEY");
}

const appUrl =
  process.env.APP_URL ?? "https://project-management-system-cohort1.onrender.com";
const content = {
  recipientFirstName: "Enrique",
  resetUrl: `${appUrl}/reset-password?token=preview-token-not-valid`,
  expiresInMinutes: 60,
};

const from = process.env.EMAIL_FROM ?? "Baguette <hello@hackinghr.io>";
const to = process.env.TEST_EMAIL ?? "enrique@hackinghr.io";

const resend = new Resend(apiKey);
const { data, error } = await resend.emails.send({
  from,
  to,
  subject: passwordResetSubject(),
  html: passwordResetHtml(content),
  text: passwordResetText(content),
});

if (error) {
  console.error("Send failed:", error.message);
  process.exit(1);
}

console.log("Sent", data?.id ?? "ok", "to", to, "from", from);
