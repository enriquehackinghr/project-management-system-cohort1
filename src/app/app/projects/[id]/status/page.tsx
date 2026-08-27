import { notFound } from "next/navigation";
import { AsOfLabel } from "@/components/app/Dashboards";
import { StatusEngine } from "@/components/app/StatusEngine";
import {
  getAccessibleProject,
  getProjectAccessRole,
  listStatusReports,
} from "@/lib/db";
import { parseAsOf } from "@/lib/dates";
import { requireSession } from "@/lib/session";

export default async function StatusPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ asOf?: string }>;
}) {
  const { id } = await params;
  const { asOf: asOfRaw } = await searchParams;
  const asOf = parseAsOf(asOfRaw);
  const session = await requireSession();
  const bundle = await getAccessibleProject(id, session.personId);
  if (!bundle) notFound();
  const reports = await listStatusReports(id, session.personId);
  const canEdit = (await getProjectAccessRole(id, session.personId)) === "admin";
  return (
    <div>
      <p className="text-sm font-medium text-crust">Status</p>
      <h2 className="mt-1 mb-6 text-2xl font-semibold tracking-tight">Weekly status</h2>
      <AsOfLabel asOf={asOf} />
      <StatusEngine projectId={id} asOf={asOf} reports={reports} canEdit={canEdit} />
    </div>
  );
}
