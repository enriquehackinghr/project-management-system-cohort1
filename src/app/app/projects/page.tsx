import Link from "next/link";
import { ProjectList } from "@/components/app/ProjectList";
import { EmptyState, PageHeader, PrimaryButton } from "@/components/app/ui";
import { listProjectsForPerson, listTasksForProjects } from "@/lib/db";
import { todayIso } from "@/lib/dates";
import { requireSession } from "@/lib/session";

export default async function ProjectsPage() {
  const session = await requireSession();
  const projects = await listProjectsForPerson(session.personId);
  const tasks = await listTasksForProjects(projects.map((project) => project.id));
  const asOf = todayIso();
  const overdue = tasks.filter(
    (task) => task.due_date && task.due_date < asOf && task.status !== "done",
  ).length;

  return (
    <div>
      <PageHeader
        kicker="Projects"
        title="Your work"
        description={
          projects.length === 0
            ? "Create a project to run a board, timeline, and status from one place."
            : `${projects.length} project${projects.length === 1 ? "" : "s"} · ${overdue} overdue`
        }
        actions={
          <Link href="/app/projects/new">
            <PrimaryButton type="button">New project</PrimaryButton>
          </Link>
        }
      />
      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          body="Create one by form or describe it to the assistant. Both paths write the same tables."
        >
          <Link href="/app/projects/new" className="inline-flex h-11 items-center rounded-full bg-crust px-5 text-sm font-semibold text-white">
            Start a project
          </Link>
        </EmptyState>
      ) : (
        <ProjectList projects={projects} tasks={tasks} asOf={asOf} />
      )}
    </div>
  );
}
