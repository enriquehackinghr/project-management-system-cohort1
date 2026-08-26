import { notFound } from "next/navigation";
import { Timeline } from "@/components/app/Timeline";
import { getAccessiblePortfolio } from "@/lib/db";
import { requireSession } from "@/lib/session";

export default async function PortfolioTimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const bundle = await getAccessiblePortfolio(id, session.personId);
  if (!bundle) notFound();

  if (bundle.items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-flour bg-white px-6 py-12 text-center">
        <p className="text-lg font-semibold tracking-tight">No projects in this portfolio</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-mute">
          Add projects from the overview to plot a combined Gantt chart.
        </p>
      </div>
    );
  }

  return (
    <Timeline
      phases={bundle.phases}
      tasks={bundle.tasks}
      dependencies={bundle.dependencies}
      projects={bundle.items.map((item) => ({
        id: item.project_id,
        name: item.project.name,
        color: item.color,
      }))}
    />
  );
}
