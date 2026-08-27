import Link from "next/link";
import { formatDate } from "@/lib/dates";
import { groupAssignees } from "@/lib/risk";
import type { Person, Phase, Project, Task, TaskAssignee } from "@/lib/types";
import { Card, Pill, ProgressBar } from "./ui";

function progress(tasks: Task[]) {
  if (tasks.length === 0) return 0;
  return Math.round((tasks.filter((task) => task.status === "done").length / tasks.length) * 100);
}

export function ExecutiveDashboard({
  asOf,
  projects,
  tasks,
}: {
  asOf: string;
  projects: Project[];
  tasks: Task[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => {
        const projectTasks = tasks.filter((task) => task.project_id === project.id);
        const pct = progress(projectTasks);
        const overdue = projectTasks.filter(
          (task) => task.due_date && task.due_date < asOf && task.status !== "done",
        ).length;
        const latest = projectTasks.reduce(
          (max, task) => (task.updated_at > max ? task.updated_at : max),
          project.updated_at,
        );
        return (
          <Link key={project.id} href={`/app/projects/${project.id}/dashboard`} className="block">
            <Card className="h-full transition hover:border-crust/40">
              <div className="flex items-start justify-between gap-3">
                <p className="text-lg font-semibold tracking-tight">{project.name}</p>
                <Pill tone={overdue ? "crust" : "olive"}>{overdue} overdue</Pill>
              </div>
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-mute">Completion</span>
                  <span className="font-semibold">{pct}%</span>
                </div>
                <ProgressBar value={pct} />
              </div>
              <p className="mt-4 text-[12px] text-mute">
                Updated {formatDate(latest.slice(0, 10))} · {projectTasks.length} tasks
              </p>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

export function TeamDashboard({
  asOf,
  tasks,
  people,
  assignees,
}: {
  asOf: string;
  tasks: Task[];
  people: Person[];
  assignees: TaskAssignee[];
}) {
  const assigneesByTask = groupAssignees(assignees);
  return (
    <div className="overflow-hidden rounded-2xl border border-flour bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-foam text-[12px] uppercase tracking-[0.12em] text-mute">
          <tr>
            <th className="px-4 py-3 font-medium">Owner</th>
            <th className="px-4 py-3 font-medium">Open hours</th>
            <th className="px-4 py-3 font-medium">Capacity</th>
            <th className="px-4 py-3 font-medium">Overdue</th>
          </tr>
        </thead>
        <tbody>
          {people.map((person) => {
            const owned = tasks.filter((task) =>
              (assigneesByTask.get(task.id) ?? []).includes(person.id),
            );
            const openHours = owned
              .filter((task) => task.status !== "done")
              .reduce((sum, task) => sum + Number(task.estimate_hours ?? 0), 0);
            const overdue = owned.filter(
              (task) => task.due_date && task.due_date < asOf && task.status !== "done",
            ).length;
            const over = openHours > Number(person.capacity_hours_per_week);
            return (
              <tr key={person.id} className="border-t border-flour">
                <td className="px-4 py-3 font-medium">{person.full_name}</td>
                <td className="px-4 py-3">{openHours}</td>
                <td className="px-4 py-3">
                  <span className={over ? "font-semibold text-crust" : ""}>
                    {person.capacity_hours_per_week}h
                  </span>
                </td>
                <td className="px-4 py-3">{overdue}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function ProjectDashboard({
  asOf,
  project,
  tasks,
  phases,
  riskCount,
}: {
  asOf: string;
  project: Project;
  tasks: Task[];
  phases: Phase[];
  riskCount: number;
}) {
  const pct = progress(tasks);
  const elapsed =
    project.start_date && project.target_date && project.start_date < asOf
      ? Math.min(
          100,
          Math.round(
            ((Date.parse(`${asOf}T00:00:00Z`) - Date.parse(`${project.start_date}T00:00:00Z`)) /
              Math.max(
                Date.parse(`${project.target_date}T00:00:00Z`) -
                  Date.parse(`${project.start_date}T00:00:00Z`),
                1,
              )) *
              100,
          ),
        )
      : 0;
  const done = tasks.filter((task) => task.status === "done").length;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-mute">Progress</p>
        <p className="mt-3 text-3xl font-semibold">{pct}%</p>
        <p className="mt-1 text-sm text-mute">
          {done} of {tasks.length} tasks done
        </p>
        <div className="mt-4">
          <ProgressBar value={pct} />
        </div>
      </Card>
      <Card>
        <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-mute">Burn vs timeline</p>
        <p className="mt-3 text-3xl font-semibold">{elapsed}%</p>
        <p className="mt-1 text-sm text-mute">
          Calendar elapsed through {formatDate(asOf)}
        </p>
        <div className="mt-4">
          <ProgressBar value={elapsed} />
        </div>
      </Card>
      <Card>
        <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-mute">Open risks</p>
        <p className="mt-3 text-3xl font-semibold">{riskCount}</p>
        <p className="mt-1 text-sm text-mute">{phases.length} phases in the plan</p>
      </Card>
    </div>
  );
}

export function AsOfLabel({ asOf }: { asOf: string }) {
  return (
    <form className="mb-6 flex flex-wrap items-center gap-3 text-sm text-mute">
      <label className="flex items-center gap-2">
        As of
        <input
          className="h-9 rounded-full border border-flour bg-white px-3 text-ink"
          type="date"
          name="asOf"
          defaultValue={asOf}
        />
      </label>
      <button type="submit" className="font-medium text-crust">
        Update
      </button>
    </form>
  );
}
