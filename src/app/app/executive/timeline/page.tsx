import { Timeline } from "@/components/app/Timeline";
import { getAccountProjectBundle } from "@/lib/db";
import { requireSession } from "@/lib/session";

export default async function ExecutiveTimelinePage() {
  const session = await requireSession();
  const bundle = await getAccountProjectBundle(session.personId);

  if (bundle.projects.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-flour bg-white px-6 py-12 text-center">
        <p className="text-lg font-semibold tracking-tight">No projects in this account</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-mute">
          Create a project to plot a combined Gantt chart across the account.
        </p>
      </div>
    );
  }

  return (
    <Timeline
      phases={bundle.phases}
      tasks={bundle.tasks}
      dependencies={bundle.dependencies}
      projects={bundle.projects.map((project) => ({
        id: project.id,
        name: project.name,
        color: bundle.colors[project.id],
      }))}
      people={bundle.people}
      assignees={bundle.assignees}
      membersByProject={bundle.membersByProject}
    />
  );
}
