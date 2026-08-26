import { notFound } from "next/navigation";
import { AsOfLabel } from "@/components/app/Dashboards";
import { RiskRadar } from "@/components/app/RiskRadar";
import { loadRadar } from "@/actions/radar";
import { getAccessibleProject } from "@/lib/db";
import { parseAsOf } from "@/lib/dates";
import { requireSession } from "@/lib/session";

export default async function RisksPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ asOf?: string }>;
}) {
  const { id } = await params;
  const { asOf: asOfRaw } = await searchParams;
  const session = await requireSession();
  const bundle = await getAccessibleProject(id, session.personId);
  if (!bundle) notFound();
  const { asOf, findings } = await loadRadar(id, parseAsOf(asOfRaw));
  return (
    <div>
      <p className="text-sm font-medium text-crust">Risks</p>
      <h2 className="mt-1 mb-6 text-2xl font-semibold tracking-tight">Risk radar</h2>
      <AsOfLabel asOf={asOf} />
      <RiskRadar asOf={asOf} findings={findings} />
    </div>
  );
}
