import { notFound } from "next/navigation";
import { renameProjectAction } from "@/actions/projects";
import { EditableName } from "@/components/app/EditableName";
import { PhaseForm, TaskForm } from "@/components/app/ProjectForms";
import { AddPeopleToWorkForm } from "@/components/app/TeamForms";
import { Card, Pill, ProgressBar } from "@/components/app/ui";
import { getAccessibleProject, listOwnedTeamMemberPeople } from "@/lib/db";
import { formatDate } from "@/lib/dates";
import { requireSession } from "@/lib/session";
import { PROJECT_STATUS_LABEL } from "@/lib/types";

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const bundle = await getAccessibleProject(id, session.personId);
  if (!bundle) notFound();

  const people = bundle.members.map((member) => member.person).filter(Boolean);
  const canManage =
    bundle.project.owner_id === session.personId ||
    bundle.project.created_by_id === session.personId;
  const teamPeople = canManage
    ? (await listOwnedTeamMemberPeople(session.personId)).filter(
        (person) => !bundle.members.some((member) => member.person_id === person.id),
      )
    : [];
  const done = bundle.tasks.filter((task) => task.status === "done").length;
  const pct =
    bundle.tasks.length === 0
      ? 0
      : Math.round((done / bundle.tasks.length) * 100);

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <EditableName
              name={bundle.project.name}
              label="Project name"
              action={renameProjectAction.bind(null, id)}
              size="page"
              canEdit={canManage}
            />
            <p className="mt-2 text-sm text-mute">{bundle.owner?.full_name ?? "Unowned"}</p>
            <p className="mt-2 text-sm leading-6">{bundle.project.goal}</p>
            <p className="mt-4 text-sm text-mute">
              {formatDate(bundle.project.start_date)} → {formatDate(bundle.project.target_date)}
              {bundle.project.budget != null
                ? ` · Budget ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(bundle.project.budget)}`
                : ""}
            </p>
          </div>
          <Pill>{PROJECT_STATUS_LABEL[bundle.project.status]}</Pill>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <Stat label="Complete" value={`${pct}%`} />
          <Stat label="Tasks" value={`${done}/${bundle.tasks.length}`} />
          <Stat label="Phases" value={String(bundle.phases.length)} />
          <Stat label="Members" value={String(bundle.members.length)} />
        </div>
        <div className="mt-4">
          <ProgressBar value={pct} />
        </div>
      </Card>

      <section className="rounded-2xl border border-flour bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold tracking-tight">Members</h2>
        <div className="mb-4 flex flex-wrap gap-2">
          {bundle.members.map((member) => (
            <Pill key={member.id}>
              {member.person.full_name} · {member.role || "Member"}
            </Pill>
          ))}
        </div>
        {canManage ? (
          <>
            <p className="mb-3 text-sm font-medium">Add from your teams</p>
            <AddPeopleToWorkForm actionId={id} kind="project" people={teamPeople} />
          </>
        ) : null}
      </section>

      <section className="rounded-2xl border border-flour bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold tracking-tight">Phases</h2>
        <ul className="mb-4 divide-y divide-flour overflow-hidden rounded-xl border border-flour">
          {bundle.phases.map((phase) => (
            <li key={phase.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <span className="font-medium">{phase.name}</span>
              <span className="text-mute">
                {formatDate(phase.start_date)} – {formatDate(phase.end_date)}
              </span>
            </li>
          ))}
        </ul>
        <PhaseForm projectId={id} />
      </section>

      <section className="rounded-2xl border border-flour bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold tracking-tight">Tasks</h2>
        <ul className="mb-4 divide-y divide-flour overflow-hidden rounded-xl border border-flour">
          {bundle.tasks.map((task) => (
            <li key={task.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <span className="font-medium">{task.title}</span>
              <span className="capitalize text-mute">{task.status.replace(/_/g, " ")}</span>
            </li>
          ))}
        </ul>
        <TaskForm projectId={id} phases={bundle.phases} people={people} />
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
