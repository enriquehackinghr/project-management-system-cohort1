import { Board } from "@/components/app/Board";
import { getAccountProjectBundle } from "@/lib/db";
import { requireSession } from "@/lib/session";

export default async function ExecutiveBoardPage() {
  const session = await requireSession();
  const bundle = await getAccountProjectBundle(session.personId);

  if (bundle.projects.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-flour bg-white px-6 py-12 text-center">
        <p className="text-lg font-semibold tracking-tight">No projects in this account</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-mute">
          Create a project to populate a combined kanban board across the account.
        </p>
      </div>
    );
  }

  const projectNames = Object.fromEntries(
    bundle.projects.map((project) => [project.id, project.name]),
  );

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-crust">Board</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">Account kanban</h2>
        <p className="mt-1 text-sm text-mute">
          Cards are colored by project. Dragging a card updates that task in its own project.
        </p>
      </div>
      <div className="flex flex-wrap gap-3 text-[12px] text-mute">
        {bundle.projects.map((project) => (
          <span key={project.id} className="inline-flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: bundle.colors[project.id] }}
            />
            {project.name}
          </span>
        ))}
      </div>
      <Board
        tasks={bundle.tasks}
        people={bundle.people}
        projectColors={bundle.colors}
        projectNames={projectNames}
      />
    </div>
  );
}
