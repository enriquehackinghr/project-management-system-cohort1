import "server-only";

import { createAdminClient } from "./supabase/admin";
import type { AuditEvent, Person } from "./types";

const admin = () => createAdminClient();

function asPerson(value: Person | Person[] | null | undefined): Person | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function writeAuditEvent(input: {
  actorId: string;
  kind: "change" | "view" | "click";
  action: string;
  summary: string;
  projectId?: string | null;
  portfolioId?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const projectId = input.projectId || null;
  const portfolioId = input.portfolioId || null;
  const summary = input.summary.trim().slice(0, 400);
  if ((!projectId && !portfolioId) || !summary) return;

  try {
    if (input.kind === "view" || input.kind === "click") {
      const since = new Date(Date.now() - 2000).toISOString();
      let recent = admin()
        .from("audit_events")
        .select("id")
        .eq("actor_id", input.actorId)
        .eq("kind", input.kind)
        .eq("summary", summary)
        .gte("created_at", since)
        .limit(1);
      if (projectId) recent = recent.eq("project_id", projectId);
      if (portfolioId) recent = recent.eq("portfolio_id", portfolioId);
      const { data } = await recent;
      if (data && data.length > 0) return;
    }
    const { error } = await admin().from("audit_events").insert({
      scope: projectId ? "project" : "portfolio",
      project_id: projectId,
      portfolio_id: portfolioId,
      actor_id: input.actorId,
      kind: input.kind,
      action: input.action,
      summary,
      target_type: input.targetType ?? null,
      target_id: input.targetId ?? null,
      metadata: input.metadata ?? {},
    });
    if (error) console.error("audit write failed", error.message);
  } catch (error) {
    console.error("audit write failed", error);
  }
}

export async function listAuditEvents(input: {
  projectIds?: string[];
  portfolioIds?: string[];
  limit?: number;
}): Promise<AuditEvent[]> {
  const projectIds = input.projectIds ?? [];
  const portfolioIds = input.portfolioIds ?? [];
  if (projectIds.length === 0 && portfolioIds.length === 0) return [];

  const filters = [
    projectIds.length > 0 ? `project_id.in.(${projectIds.join(",")})` : null,
    portfolioIds.length > 0 ? `portfolio_id.in.(${portfolioIds.join(",")})` : null,
  ].filter(Boolean);

  const { data, error } = await admin()
    .from("audit_events")
    .select("*, actor:people!actor_id(*)")
    .or(filters.join(","))
    .order("created_at", { ascending: false })
    .limit(input.limit ?? 250);

  if (error) throw new Error(error.message);

  return ((data ?? []) as Array<Omit<AuditEvent, "actor"> & { actor: Person | Person[] | null }>)
    .flatMap((row) => {
      const actor = asPerson(row.actor);
      if (!actor) return [];
      return [{ ...row, actor, metadata: row.metadata ?? {} }];
    });
}
