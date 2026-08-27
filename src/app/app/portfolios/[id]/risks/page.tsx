import { notFound } from "next/navigation";
import { RadarView } from "@/components/app/Radar";
import { parseAsOf } from "@/lib/dates";
import { buildRadarSnapshot } from "@/lib/radar";
import { requireSession } from "@/lib/session";

export default async function PortfolioRisksPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ asOf?: string; owner?: string }>;
}) {
  const { id } = await params;
  const { asOf, owner } = await searchParams;
  const session = await requireSession();

  const snapshot = await buildRadarSnapshot({
    scope: { kind: "portfolio", id },
    personId: session.personId,
    asOf: parseAsOf(asOf),
    ownerId: owner || null,
  });
  if (!snapshot) notFound();

  return <RadarView snapshot={snapshot} basePath={`/app/portfolios/${id}/risks`} />;
}
