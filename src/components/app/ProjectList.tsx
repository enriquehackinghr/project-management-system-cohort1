import Link from "next/link";
import { formatDate } from "@/lib/dates";
import {
  PROJECT_STATUS_LABEL,
  type Project,
  type ProjectStatus,
  type Task,
} from "@/lib/types";
import { Pill, ProgressBar } from "./ui";

function statusTone(status: ProjectStatus) {
  if (status === "active") return "olive" as const;
  if (status === "on_hold") return "wheat" as const;
  if (status === "completed") return "olive" as const;
  return "mute" as const;
}

export function ProjectList({
  projects,
  tasks,
  asOf,
}: {
  projects: Project[];
  tasks: Task[];
  asOf: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-flour bg-white">
      <div className="hidden border-b border-flour bg-foam/70 px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em] text-mute lg:grid lg:grid-cols-[minmax(0,1.6fr)_6.5rem_9rem_5.5rem_5.5rem_9rem] lg:gap-4">
        <span>Project</span>
        <span>Status</span>
        <span>Progress</span>
        <span>Tasks</span>
        <span>Overdue</span>
        <span>Dates</span>
      </div>
      <ul>
        {projects.map((project) => {
          const projectTasks = tasks.filter((task) => task.project_id === project.id);
          const done = projectTasks.filter((task) => task.status === "done").length;
          const inProgress = projectTasks.filter((task) => task.status === "in_progress").length;
          const blocked = projectTasks.filter((task) => task.status === "blocked").length;
          const pct =
            projectTasks.length === 0
              ? 0
              : Math.round((done / projectTasks.length) * 100);
          const overdue = projectTasks.filter(
            (task) => task.due_date && task.due_date < asOf && task.status !== "done",
          ).length;
          const goal = project.goal || project.description;

          return (
            <li key={project.id} className="border-b border-flour last:border-b-0">
              <Link
                href={`/app/projects/${project.id}`}
                className="grid gap-3 px-5 py-4 transition hover:bg-foam/80 lg:grid-cols-[minmax(0,1.6fr)_6.5rem_9rem_5.5rem_5.5rem_9rem] lg:items-center lg:gap-4"
              >
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold leading-snug tracking-tight">
                    {project.name}
                  </p>
                  {goal ? (
                    <p className="mt-1 truncate text-[13px] text-mute">{goal}</p>
                  ) : null}
                  <p className="mt-2 text-[12px] text-mute lg:hidden">
                    {PROJECT_STATUS_LABEL[project.status]} · {done}/{projectTasks.length} tasks
                    {overdue ? ` · ${overdue} overdue` : ""}
                    {project.start_date || project.target_date
                      ? ` · ${formatDate(project.start_date)} → ${formatDate(project.target_date)}`
                      : ""}
                  </p>
                </div>
                <div className="hidden lg:block">
                  <Pill tone={statusTone(project.status)}>
                    {PROJECT_STATUS_LABEL[project.status]}
                  </Pill>
                </div>
                <div className="min-w-0">
                  <div className="mb-1.5 flex items-center justify-between text-[12px] text-mute">
                    <span className="tabular-nums">{pct}%</span>
                    {inProgress || blocked ? (
                      <span className="hidden sm:inline">
                        {inProgress ? `${inProgress} moving` : null}
                        {inProgress && blocked ? " · " : null}
                        {blocked ? `${blocked} blocked` : null}
                      </span>
                    ) : null}
                  </div>
                  <ProgressBar value={pct} />
                </div>
                <p className="hidden text-sm tabular-nums lg:block">
                  {done}/{projectTasks.length}
                </p>
                <p
                  className={`hidden text-sm tabular-nums lg:block ${
                    overdue ? "font-medium text-crust" : "text-mute"
                  }`}
                >
                  {overdue}
                </p>
                <p className="hidden text-[13px] text-mute lg:block">
                  {project.start_date || project.target_date
                    ? `${formatDate(project.start_date)} → ${formatDate(project.target_date)}`
                    : "No dates"}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
