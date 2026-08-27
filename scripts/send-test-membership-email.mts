import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import {
  membershipInviteHtml,
  membershipInviteSubject,
  membershipInviteText,
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
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!apiKey) throw new Error("Missing RESEND_API or RESEND_API_KEY");
if (!supabaseUrl || !supabaseKey) throw new Error("Missing Supabase credentials");

const appUrl =
  process.env.APP_URL ?? "https://project-management-system-cohort1.onrender.com";
const from = process.env.EMAIL_FROM ?? "Baguette <enrique@hackinghr.io>";
const to = process.env.TEST_EMAIL ?? "enrique@hackinghr.io";

const db = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const [{ data: project, error: projectError }, { data: portfolio, error: portfolioError }] =
  await Promise.all([
    db.from("projects").select("id, name").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    db.from("portfolios").select("id, name").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

if (projectError) throw new Error(projectError.message);
if (portfolioError) throw new Error(portfolioError.message);
if (!project?.id) throw new Error("No project found to link in the test email.");
if (!portfolio?.id) throw new Error("No portfolio found to link in the test email.");

function links(kind: "project" | "portfolio", id: string) {
  const path = kind === "portfolio" ? `/app/portfolios/${id}` : `/app/projects/${id}`;
  return {
    workUrl: `${appUrl}${path}`,
    loginUrl: `${appUrl}/login?next=${encodeURIComponent(path)}`,
  };
}

const resend = new Resend(apiKey);
const sends = [
  {
    workKind: "project" as const,
    workName: String(project.name),
    workId: String(project.id),
  },
  {
    workKind: "portfolio" as const,
    workName: String(portfolio.name),
    workId: String(portfolio.id),
  },
];

for (const item of sends) {
  const content = {
    recipientFirstName: "Enrique",
    inviterName: "Baguette",
    workKind: item.workKind,
    workName: item.workName,
    ...links(item.workKind, item.workId),
  };
  const { data, error } = await resend.emails.send({
    from,
    to,
    subject: membershipInviteSubject(content),
    html: membershipInviteHtml(content),
    text: membershipInviteText(content),
  });
  if (error) {
    console.error("Send failed:", error.message);
    process.exit(1);
  }
  console.log(
    "Sent",
    data?.id ?? "ok",
    item.workKind,
    item.workName,
    content.workUrl,
  );
}
