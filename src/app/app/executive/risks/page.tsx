import Link from "next/link";
import { notFound } from "next/navigation";
import { RadarView } from "@/components/app/Radar";
import { EmptyState } from "@/components/app/ui";
import { parseAsOf } from "@/lib/dates";
import { buildRadarSnapshot } from "@/lib/radar";
import { requireSession } from "@/lib/session";

export default async function ExecutiveRisksPage({
  searchParams,
}: {
  searchParams: Promise<{ asOf?: string; owner?: string }>;
}) {
  const { asOf, owner } = await searchParams;
  const session = await requireSession();

  const snapshot = await buildRadarSnapshot({
    scope: { kind: "account" },
    personId: session.personId,
    asOf: parseAsOf(asOf),
    ownerId: owner || null,
  });
  if (!snapshot) notFound();

  if (snapshot.totals.projects === 0) {
    return (
      <EmptyState
        title="Nothing to watch yet"
        body="The radar reads every project you can access. Create one and its overdue work, upcoming deadlines, and team load will show up here."
      >
        <Link
          href="/app/projects/new"
          className="inline-flex h-11 items-center rounded-full bg-crust px-5 text-sm font-semibold text-white"
        >
          Start a project
        </Link>
      </EmptyState>
    );
  }

  return <RadarView snapshot={snapshot} basePath="/app/executive/risks" />;
}
