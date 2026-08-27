import Link from "next/link";
import { ExecutiveDashboard, TeamDashboard } from "@/components/app/Dashboards";
import { Card, EmptyState, ProgressBar } from "@/components/app/ui";
import { getAccountProjectBundle } from "@/lib/db";
import { formatDate, todayIso } from "@/lib/dates";
import { requireSession } from "@/lib/session";
import { PROJECT_STATUS_LABEL } from "@/lib/types";

export default async function ExecutiveOverviewPage() {
  const session = await requireSession();
  const bundle = await getAccountProjectBundle(session.personId);
  const asOf = todayIso();
  const done = bundle.tasks.filter((task) => task.status === "done").length;
  const pct =
    bundle.tasks.length === 0 ? 0 : Math.round((done / bundle.tasks.length) * 100);
  const overdue = bundle.tasks.filter(
    (task) => task.due_date && task.due_date < asOf && task.status !== "done",
  ).length;

  if (bundle.projects.length === 0) {
    return (
      <EmptyState
        title="No projects yet"
        body="Create a project to see a combined board, timeline, and health view across the account."
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

  return (
    <div className="space-y-6">
      <Card>
        <p className="text-sm text-mute">Account</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">Executive Dashboard</h2>
        <p className="mt-2 text-sm leading-6 text-mute">
          Every project you can access, rolled into one overview, board, and timeline.
          Moving a card on the board updates the same task inside its project.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <Stat label="Projects" value={String(bundle.projects.length)} />
          <Stat label="Tasks" value={`${done}/${bundle.tasks.length}`} />
          <Stat label="Complete" value={`${pct}%`} />
          <Stat label="Overdue" value={String(overdue)} />
        </div>
        <div className="mt-4">
          <ProgressBar value={pct} />
        </div>
      </Card>

      <section>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Project health</h2>
        <ExecutiveDashboard asOf={asOf} projects={bundle.projects} tasks={bundle.tasks} />
      </section>

      <section className="rounded-2xl border border-flour bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold tracking-tight">Projects</h2>
        <ul className="divide-y divide-flour overflow-hidden rounded-xl border border-flour">
          {bundle.projects.map((project) => {
            const projectTasks = bundle.tasks.filter(
              (task) => task.project_id === project.id,
            );
            const projectDone = projectTasks.filter((task) => task.status === "done").length;
            return (
              <li
                key={project.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: bundle.colors[project.id] }}
                  />
                  <div className="min-w-0">
                    <Link
                      href={`/app/projects/${project.id}`}
                      className="font-medium hover:text-crust"
                    >
                      {project.name}
                    </Link>
                    <p className="text-[12px] text-mute">
                      {PROJECT_STATUS_LABEL[project.status]} · {projectDone}/
                      {projectTasks.length} done · {formatDate(project.start_date)} →{" "}
                      {formatDate(project.target_date)}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Team load</h2>
        <TeamDashboard
          asOf={asOf}
          tasks={bundle.tasks}
          people={bundle.people}
          assignees={bundle.assignees}
        />
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-foam px-3 py-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-mute">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}
