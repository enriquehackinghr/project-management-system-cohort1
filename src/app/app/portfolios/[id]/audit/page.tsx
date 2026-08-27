import { notFound } from "next/navigation";
import { AuditLogView } from "@/components/app/AuditLog";
import { getAccessiblePortfolio, listPortfolioAuditEvents } from "@/lib/db";
import { requireSession } from "@/lib/session";
import type { AuditKind } from "@/lib/types";

const KINDS = new Set<AuditKind>(["change", "view", "click"]);

export default async function PortfolioAuditPage({
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
  const bundle = await getAccessiblePortfolio(id, session.personId);
  if (!bundle) notFound();
  const events = await listPortfolioAuditEvents(id, session.personId);

  return (
    <AuditLogView
      kicker="Audit Log"
      title="Portfolio activity"
      description="Views, clicks, and changes for this portfolio and the projects inside it."
      events={events}
      filterHref={`/app/portfolios/${id}/audit`}
      kind={kind}
    />
  );
}
