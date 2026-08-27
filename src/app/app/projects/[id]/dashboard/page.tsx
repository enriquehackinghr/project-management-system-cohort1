import { notFound } from "next/navigation";
import {
  AsOfLabel,
  ProjectDashboard,
  TeamDashboard,
} from "@/components/app/Dashboards";
import { getAccessibleProject } from "@/lib/db";
import { parseAsOf } from "@/lib/dates";
import { detectRisks } from "@/lib/risk";
import { requireSession } from "@/lib/session";

export default async function ProjectDashboardPage({
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
  const people = bundle.members.map((member) => member.person).filter(Boolean);
  const risks = detectRisks({
    asOf,
    projects: [bundle.project],
    tasks: bundle.tasks,
    phases: bundle.phases,
    people,
    dependencies: bundle.dependencies,
  });
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-crust">Health</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">Project dashboard</h2>
      </div>
      <AsOfLabel asOf={asOf} />
      <ProjectDashboard
        asOf={asOf}
        project={bundle.project}
        tasks={bundle.tasks}
        phases={bundle.phases}
        riskCount={risks.filter((risk) => risk.severity !== "low").length}
      />
      <section>
        <h2 className="mb-3 text-lg font-semibold">Team load</h2>
        <TeamDashboard asOf={asOf} tasks={bundle.tasks} people={people} />
      </section>
    </div>
  );
}
