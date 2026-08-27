import { notFound } from "next/navigation";
import { AuditLogView } from "@/components/app/AuditLog";
import { getAccessibleProject, listProjectAuditEvents } from "@/lib/db";
import { requireSession } from "@/lib/session";
import type { AuditKind } from "@/lib/types";

const KINDS = new Set<AuditKind>(["change", "view", "click"]);

export default async function ProjectAuditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ kind?: string }>;
}) {
  const { id } = await params;
  const { kind: kindRaw } = await searchParams;
  const kind = kindRaw && KINDS.has(kindRaw as AuditKind) ? (kindRaw as AuditKind) : undefined;
  const session = await requireSession();
  const bundle = await getAccessibleProject(id, session.personId);
  if (!bundle) notFound();
  const events = await listProjectAuditEvents(id, session.personId);

  return (
    <AuditLogView
      kicker="Audit Log"
      title="Project activity"
      description="Every view, click, and change from people with access to this project."
      events={events}
      filterHref={`/app/projects/${id}/audit`}
      kind={kind}
    />
  );
}
