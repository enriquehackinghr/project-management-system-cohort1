import Link from "next/link";
import type { ReactNode } from "react";
import { formatDate } from "@/lib/dates";
import {
  RADAR_BAND_LABEL,
  type RadarBand,
  type RadarHorizon,
  type RadarPerson,
  type RadarProject,
  type RadarSnapshot,
  type RadarTask,
} from "@/lib/radar";
import type { RiskSeverity } from "@/lib/risk";
import { PROJECT_STATUS_LABEL, TASK_STATUS_LABEL } from "@/lib/types";
import { RadarAi, type RadarAiScope } from "./RadarAi";
import { Card, Pill, ProgressBar } from "./ui";

type Tone = "crust" | "wheat" | "olive" | "mute";

const BAND_TONE: Record<RadarBand, Tone> = {
  on_track: "olive",
  watch: "wheat",
  at_risk: "crust",
};

const SEVERITY_TONE: Record<RiskSeverity, Tone> = {
  high: "crust",
  medium: "wheat",
  low: "mute",
};

const BAR_COLOR: Record<Tone, string> = {
  crust: "bg-crust",
  wheat: "bg-[#e8a33d]",
  olive: "bg-[#00854d]",
  mute: "bg-flour",
};

export function RadarView({
  snapshot,
  basePath,
}: {
  snapshot: RadarSnapshot;
  basePath: string;
}) {
  const showProject = snapshot.scope.kind !== "project";
  const aiScope: RadarAiScope =
    snapshot.scope.kind === "account" || snapshot.scope.id === null
      ? { kind: "account" }
      : { kind: snapshot.scope.kind, id: snapshot.scope.id };
  const ownerId = snapshot.ownerFilter?.id ?? null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-crust">{snapshot.scope.label}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Risk radar</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-mute">
          Everything late, everything landing soon, and who is carrying it — for{" "}
          {snapshot.scope.name} as of {formatDate(snapshot.asOf)}.
        </p>
      </div>

      <RadarFilters asOf={snapshot.asOf} ownerId={ownerId} people={snapshot.people} />

      {snapshot.ownerFilter ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-foam px-4 py-3 text-sm">
          <span>
            Filtered to <strong>{snapshot.ownerFilter.name}</strong>. The score,
            horizon, and findings cover only their work; the load table still shows
            the whole team.
          </span>
          <Link
            href={`${basePath}?asOf=${snapshot.asOf}`}
            className="font-medium text-crust"
          >
            Show everyone
          </Link>
        </div>
      ) : null}

      <RadarHealth snapshot={snapshot} />

      <RadarAi
        scope={aiScope}
        asOf={snapshot.asOf}
        ownerId={ownerId}
        showProject={showProject}
        findings={snapshot.findings.map((finding) => ({
          id: finding.id,
          title: finding.title,
          projectName: finding.projectName,
        }))}
      />

      <RadarSection
        title="Deadline horizon"
        description="Open work bucketed by how close it is to its due date."
      >
        <RadarHorizons horizons={snapshot.horizons} showProject={showProject} />
      </RadarSection>

      <RadarSection
        title="Assignment and load"
        description="Open hours against weekly capacity for everyone on this work. Select a name to filter the whole radar to them."
      >
        <RadarWorkload
          people={snapshot.people}
          asOf={snapshot.asOf}
          activeOwnerId={ownerId}
          basePath={basePath}
        />
      </RadarSection>

      {showProject ? (
        <RadarSection
          title="Project rollup"
          description="Weakest health first, so the project needing attention is at the top."
        >
          <RadarProjects projects={snapshot.projects} />
        </RadarSection>
      ) : null}

      <RadarSection
        title="What the rules found"
        description="Deterministic findings, grouped by rule. These are computed, not guessed."
      >
        <RadarFindings snapshot={snapshot} showProject={showProject} />
      </RadarSection>
    </div>
  );
}

export function RadarFilters({
  asOf,
  ownerId,
  people,
}: {
  asOf: string;
  ownerId: string | null;
  people: RadarPerson[];
}) {
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
      {people.length > 0 ? (
        <label className="flex items-center gap-2">
          Owner
          <select
            className="h-9 rounded-full border border-flour bg-white px-3 text-ink"
            name="owner"
            defaultValue={ownerId ?? ""}
          >
            <option value="">Everyone</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <button type="submit" className="font-medium text-crust">
        Update
      </button>
    </form>
  );
}

export function RadarHealth({ snapshot }: { snapshot: RadarSnapshot }) {
  const { totals, health } = snapshot;
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <Card>
        <div className="flex items-start justify-between gap-3">
          <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-mute">
            Health score
          </p>
          <Pill tone={BAND_TONE[health.band]}>{RADAR_BAND_LABEL[health.band]}</Pill>
        </div>
        <p className="mt-3 text-4xl font-semibold tracking-tight">{health.score}</p>
        <p className="mt-1 text-sm text-mute">
          {totals.done} of {totals.total} tasks done · {totals.completion}% complete
        </p>
        <div className="mt-4">
          <ProgressBar value={totals.completion} />
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Overdue"
          value={totals.overdue}
          hint="Past due, not done"
          tone={totals.overdue > 0 ? "crust" : "mute"}
        />
        <Stat
          label="Due in 7 days"
          value={totals.dueSoon}
          hint="Landing this week"
          tone={totals.dueSoon > 0 ? "wheat" : "mute"}
        />
        <Stat
          label="Blocked"
          value={totals.blocked}
          hint="Waiting on something"
          tone={totals.blocked > 0 ? "crust" : "mute"}
        />
        <Stat
          label="Unassigned"
          value={totals.unassigned}
          hint={`${totals.undated} also undated`}
          tone={totals.unassigned > 0 ? "wheat" : "mute"}
        />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: number;
  hint: string;
  tone: Tone;
}) {
  return (
    <div className="rounded-2xl border border-flour bg-white p-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-mute">
        {label}
      </p>
      <p
        className={`mt-2 text-2xl font-semibold tracking-tight ${
          tone === "crust" ? "text-crust" : ""
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-[12px] text-mute">{hint}</p>
    </div>
  );
}

export function RadarHorizons({
  horizons,
  showProject,
}: {
  horizons: RadarHorizon[];
  showProject: boolean;
}) {
  const max = Math.max(1, ...horizons.map((horizon) => horizon.count));
  const total = horizons.reduce((sum, horizon) => sum + horizon.count, 0);

  if (total === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-flour bg-foam/60 px-5 py-8 text-center text-sm text-mute">
        No open work in this scope. Every task is done.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-flour bg-white">
      {horizons.map((horizon) => (
        <details
          key={horizon.key}
          className="group border-b border-flour last:border-b-0"
          open={horizon.key === "overdue" && horizon.count > 0}
        >
          <summary
            className={`flex cursor-pointer list-none items-center gap-4 px-4 py-3 transition hover:bg-foam/70 ${
              horizon.count === 0 ? "opacity-55" : ""
            }`}
          >
            <div className="w-36 shrink-0">
              <p className="text-sm font-medium">{horizon.label}</p>
              <p className="text-[11px] text-mute">{horizon.hint}</p>
            </div>
            <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-flour">
              <div
                className={`h-full rounded-full ${BAR_COLOR[horizon.tone]}`}
                style={{ width: `${Math.round((horizon.count / max) * 100)}%` }}
              />
            </div>
            <span className="w-10 shrink-0 text-right text-sm font-semibold tabular-nums">
              {horizon.count}
            </span>
          </summary>
          {horizon.count > 0 ? (
            <ul className="divide-y divide-flour border-t border-flour bg-foam/40">
              {horizon.tasks.map((task) => (
                <TaskRow key={task.id} task={task} showProject={showProject} />
              ))}
            </ul>
          ) : null}
        </details>
      ))}
    </div>
  );
}

function TaskRow({ task, showProject }: { task: RadarTask; showProject: boolean }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{task.title}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12px] text-mute">
          {showProject ? (
            <>
              <Link
                href={`/app/projects/${task.projectId}/board`}
                className="inline-flex items-center gap-1.5 hover:text-crust"
              >
                {task.projectColor ? (
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: task.projectColor }}
                  />
                ) : null}
                {task.projectName}
              </Link>
              <span aria-hidden="true">·</span>
            </>
          ) : null}
          <span>{task.ownerName ?? "Unassigned"}</span>
          <span aria-hidden="true">·</span>
          <span>{task.dueDate ? formatDate(task.dueDate) : "No due date"}</span>
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {task.estimateHours > 0 ? (
          <span className="text-[12px] text-mute">{task.estimateHours}h</span>
        ) : null}
        <Pill tone={task.status === "blocked" ? "crust" : "mute"}>
          {TASK_STATUS_LABEL[task.status]}
        </Pill>
      </div>
    </li>
  );
}

export function RadarWorkload({
  people,
  asOf,
  activeOwnerId,
  basePath,
}: {
  people: RadarPerson[];
  asOf: string;
  activeOwnerId: string | null;
  basePath: string;
}) {
  if (people.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-flour bg-foam/60 px-5 py-8 text-center text-sm text-mute">
        Nobody is on this work yet. Add people to see assignment load.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-flour bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-foam text-[12px] uppercase tracking-[0.12em] text-mute">
          <tr>
            <th className="px-4 py-3 font-medium">Owner</th>
            <th className="px-4 py-3 font-medium">Load vs capacity</th>
            <th className="px-4 py-3 text-right font-medium">Open</th>
            <th className="px-4 py-3 text-right font-medium">Overdue</th>
            <th className="px-4 py-3 text-right font-medium">Due 7d</th>
            <th className="px-4 py-3 text-right font-medium">Blocked</th>
          </tr>
        </thead>
        <tbody>
          {people.map((person) => {
            const active = person.id === activeOwnerId;
            const query = new URLSearchParams({ asOf });
            if (!active) query.set("owner", person.id);
            return (
              <tr
                key={person.id}
                className={`border-t border-flour ${active ? "bg-foam/70" : ""}`}
              >
                <td className="px-4 py-3">
                  <Link
                    href={`${basePath}?${query.toString()}`}
                    className="font-medium hover:text-crust"
                    title={active ? "Clear this filter" : `Filter to ${person.name}`}
                  >
                    {person.name}
                  </Link>
                  <p className="text-[12px] text-mute">{person.role || "Contributor"}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-full min-w-24 max-w-48 overflow-hidden rounded-full bg-flour">
                      <div
                        className={`h-full rounded-full ${
                          person.overCapacity ? "bg-crust" : "bg-[#00854d]"
                        }`}
                        style={{ width: `${Math.min(100, person.utilization)}%` }}
                      />
                    </div>
                    <span
                      className={`shrink-0 text-[12px] tabular-nums ${
                        person.overCapacity ? "font-semibold text-crust" : "text-mute"
                      }`}
                    >
                      {person.openHours}h / {person.capacityHours}h
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{person.openTasks}</td>
                <td
                  className={`px-4 py-3 text-right tabular-nums ${
                    person.overdue > 0 ? "font-semibold text-crust" : ""
                  }`}
                >
                  {person.overdue}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{person.dueSoon}</td>
                <td
                  className={`px-4 py-3 text-right tabular-nums ${
                    person.blocked > 0 ? "font-semibold text-crust" : ""
                  }`}
                >
                  {person.blocked}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function RadarProjects({ projects }: { projects: RadarProject[] }) {
  if (projects.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-flour bg-foam/60 px-5 py-8 text-center text-sm text-mute">
        No projects in this scope yet.
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => (
        <Card key={project.id} className="h-full">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              {project.color ? (
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: project.color }}
                />
              ) : null}
              <Link
                href={`/app/projects/${project.id}/risks`}
                className="truncate font-semibold tracking-tight hover:text-crust"
              >
                {project.name}
              </Link>
            </div>
            <Pill tone={BAND_TONE[project.band]}>{project.health}</Pill>
          </div>

          <div className="mt-4 space-y-2">
            <MiniBar label="Done" value={project.completion} tone="olive" />
            {project.elapsed !== null ? (
              <MiniBar
                label="Calendar gone"
                value={project.elapsed}
                tone={project.elapsed - project.completion > 25 ? "crust" : "mute"}
              />
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {project.overdue > 0 ? (
              <Pill tone="crust">{project.overdue} overdue</Pill>
            ) : null}
            {project.blocked > 0 ? (
              <Pill tone="crust">{project.blocked} blocked</Pill>
            ) : null}
            {project.dueSoon > 0 ? (
              <Pill tone="wheat">{project.dueSoon} due in 7d</Pill>
            ) : null}
            {project.unassigned > 0 ? (
              <Pill tone="wheat">{project.unassigned} unassigned</Pill>
            ) : null}
            {project.overdue === 0 && project.blocked === 0 ? (
              <Pill tone="olive">Nothing late</Pill>
            ) : null}
          </div>

          <p className="mt-4 text-[12px] text-mute">
            {PROJECT_STATUS_LABEL[project.status]} ·{" "}
            {project.targetDate
              ? `${
                  project.daysToTarget !== null && project.daysToTarget < 0
                    ? `${Math.abs(project.daysToTarget)} days past target`
                    : `${project.daysToTarget} days to target`
                } (${formatDate(project.targetDate)})`
              : "No target date"}
          </p>
        </Card>
      ))}
    </div>
  );
}

function MiniBar({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: Tone;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-[12px] text-mute">{label}</span>
      <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-flour">
        <div
          className={`h-full rounded-full ${BAR_COLOR[tone]}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      <span className="w-9 shrink-0 text-right text-[12px] tabular-nums text-mute">
        {value}%
      </span>
    </div>
  );
}

export function RadarFindings({
  snapshot,
  showProject,
}: {
  snapshot: RadarSnapshot;
  showProject: boolean;
}) {
  if (snapshot.findingGroups.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-flour bg-foam/60 px-5 py-8 text-center text-sm text-mute">
        No rule fired as of {formatDate(snapshot.asOf)}. Overdue work, upcoming
        deadlines, blocked predecessors, over-capacity owners, silent projects, and
        slipped phases all appear here.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {snapshot.findingGroups.map((group) => (
        <div
          key={group.kind}
          className="overflow-hidden rounded-2xl border border-flour bg-white"
        >
          <div className="flex items-center justify-between gap-3 border-b border-flour bg-foam px-4 py-2.5">
            <p className="text-sm font-semibold tracking-tight">{group.label}</p>
            <span className="text-[12px] text-mute">
              {group.findings.length} finding
              {group.findings.length === 1 ? "" : "s"}
            </span>
          </div>
          <ul className="divide-y divide-flour">
            {group.findings.map((finding) => (
              <li key={finding.id} className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone={SEVERITY_TONE[finding.severity]}>{finding.severity}</Pill>
                  {showProject ? (
                    <Link
                      href={`/app/projects/${finding.projectId}/board`}
                      className="text-[12px] text-mute hover:text-crust"
                    >
                      {finding.projectName}
                    </Link>
                  ) : null}
                  {finding.dueDate ? (
                    <span className="text-[12px] text-mute">
                      {formatDate(finding.dueDate)}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1.5 text-sm font-medium">{finding.title}</p>
                <p className="mt-0.5 text-sm text-mute">{finding.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function RadarSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-3">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-mute">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
