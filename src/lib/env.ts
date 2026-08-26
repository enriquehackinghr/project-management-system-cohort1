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
