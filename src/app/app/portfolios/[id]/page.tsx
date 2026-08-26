import Link from "next/link";
import { notFound } from "next/navigation";
import { removeProjectFromPortfolioAction } from "@/actions/portfolios";
import { AddProjectsForm } from "@/components/app/PortfolioForms";
import { Card, ProgressBar, SecondaryButton } from "@/components/app/ui";
import { getAccessiblePortfolio, listProjectsForPerson } from "@/lib/db";
import { formatDate } from "@/lib/dates";
import { requireSession } from "@/lib/session";
import { PROJECT_STATUS_LABEL } from "@/lib/types";

export default async function PortfolioOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const [bundle, accessible] = await Promise.all([
    getAccessiblePortfolio(id, session.personId),
    listProjectsForPerson(session.personId),
  ]);
  if (!bundle) notFound();

  const memberIds = new Set(bundle.items.map((item) => item.project_id));
  const available = accessible.filter((project) => !memberIds.has(project.id));
  const done = bundle.tasks.filter((task) => task.status === "done").length;
  const pct =
    bundle.tasks.length === 0 ? 0 : Math.round((done / bundle.tasks.length) * 100);

  return (
    <div className="space-y-6">
      <Card>
        <p className="text-sm text-mute">Portfolio</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">
          {bundle.portfolio.name}
        </h2>
        <p className="mt-2 text-sm leading-6 text-mute">
          Combined board and timeline for every project in this set. Moving a card
          here updates the same task inside the project.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Stat label="Projects" value={String(bundle.items.length)} />
          <Stat label="Tasks" value={`${done}/${bundle.tasks.length}`} />
          <Stat label="Complete" value={`${pct}%`} />
        </div>
        <div className="mt-4">
          <ProgressBar value={pct} />
        </div>
      </Card>

      <section className="rounded-2xl border border-flour bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold tracking-tight">Projects</h2>
        {bundle.items.length === 0 ? (
          <p className="mb-4 text-sm text-mute">Add projects to populate the board and timeline.</p>
        ) : (
          <ul className="mb-6 divide-y divide-flour overflow-hidden rounded-xl border border-flour">
            {bundle.items.map((item) => {
              const projectTasks = bundle.tasks.filter(
                (task) => task.project_id === item.project_id,
              );
              const projectDone = projectTasks.filter((task) => task.status === "done").length;
              const remove = removeProjectFromPortfolioAction.bind(
                null,
                id,
                item.project_id,
              );
              return (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="min-w-0">
                      <Link
                        href={`/app/projects/${item.project_id}`}
                        className="font-medium hover:text-crust"
                      >
                        {item.project.name}
                      </Link>
                      <p className="text-[12px] text-mute">
                        {PROJECT_STATUS_LABEL[item.project.status]} · {projectDone}/
                        {projectTasks.length} done · {formatDate(item.project.start_date)} →{" "}
                        {formatDate(item.project.target_date)}
                      </p>
                    </div>
                  </div>
                  <form action={remove}>
                    <SecondaryButton type="submit" className="h-9 px-3 text-xs">
                      Remove
                    </SecondaryButton>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mb-3 text-sm font-medium">Add projects</p>
        <AddProjectsForm portfolioId={id} projects={available} />
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
