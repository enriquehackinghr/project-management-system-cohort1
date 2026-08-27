import "server-only";

function required(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return value;
}

export function getSupabaseUrl() {
  return required("SUPABASE_URL", process.env.SUPABASE_URL);
}

export function getSupabaseServiceRoleKey() {
  return required(
    "SUPABASE_SERVICE_ROLE_KEY",
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function getOpenAiKey() {
  return required(
    "OPENAI_API_KEY",
    process.env.OPENAI_API_KEY ?? process.env.OPENAI_API,
  );
}

export function getSessionSecret() {
  return (
    process.env.SESSION_SECRET ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    "baguette-dev-session-secret"
  );
}

export function getResendApiKey() {
  return process.env.RESEND_API_KEY ?? process.env.RESEND_API;
}

export function getEmailFrom() {
  return process.env.EMAIL_FROM ?? "Baguette <enrique@hackinghr.io>";
}

export function getAppUrl() {
  const raw =
    process.env.APP_URL ??
    process.env.RENDER_EXTERNAL_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined) ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);
  if (raw) return raw.replace(/\/$/, "");
  if (process.env.NODE_ENV === "production") {
    return "https://project-management-system-cohort1.onrender.com";
  }
  return "http://localhost:3000";
}
