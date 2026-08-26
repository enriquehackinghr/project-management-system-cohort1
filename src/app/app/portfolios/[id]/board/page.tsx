import { notFound } from "next/navigation";
import { Board } from "@/components/app/Board";
import { getAccessiblePortfolio } from "@/lib/db";
import { requireSession } from "@/lib/session";

export default async function PortfolioBoardPage({
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
          Add projects from the overview to populate a combined kanban board.
        </p>
      </div>
    );
  }

  const projectColors = Object.fromEntries(
    bundle.items.map((item) => [item.project_id, item.color]),
  );
  const projectNames = Object.fromEntries(
    bundle.items.map((item) => [item.project_id, item.project.name]),
  );

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-crust">Board</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">Portfolio kanban</h2>
        <p className="mt-1 text-sm text-mute">
          Cards are colored by project. Dragging a card updates that task in its own project.
        </p>
      </div>
      <div className="flex flex-wrap gap-3 text-[12px] text-mute">
        {bundle.items.map((item) => (
          <span key={item.id} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            {item.project.name}
          </span>
        ))}
      </div>
      <Board
        tasks={bundle.tasks}
        people={bundle.people}
        projectColors={projectColors}
        projectNames={projectNames}
      />
    </div>
  );
}
