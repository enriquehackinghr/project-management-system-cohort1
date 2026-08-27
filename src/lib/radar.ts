import "server-only";

import {
  getAccessiblePortfolio,
  getAccessibleProject,
  getAccountProjectBundle,
} from "./db";
import { addDays, clamp, daysBetween } from "./dates";
import {
  DUE_SOON_DAYS,
  RISK_KIND_LABEL,
  detectRisks,
  elapsedPercent,
  groupAssignees,
  type RiskFinding,
  type RiskKind,
} from "./risk";
import type {
  Person,
  Phase,
  Project,
  Task,
  TaskAssignee,
  TaskDependency,
} from "./types";

export type RadarScope =
  | { kind: "project"; id: string }
  | { kind: "portfolio"; id: string }
  | { kind: "account" };

export type RadarBand = "on_track" | "watch" | "at_risk";

export const RADAR_BAND_LABEL: Record<RadarBand, string> = {
  on_track: "On track",
  watch: "Watch",
  at_risk: "At risk",
};

export type RadarTask = {
  id: string;
  title: string;
  status: Task["status"];
  priority: Task["priority"];
  projectId: string;
  projectName: string;
  projectColor: string | null;
  /** The primary assignee. ownerNames lists everyone responsible. */
  ownerId: string | null;
  ownerNames: string[];
  dueDate: string | null;
  estimateHours: number;
  daysOut: number | null;
};

export type RadarHorizonKey =
  | "overdue"
  | "today"
  | "week"
  | "fortnight"
  | "month"
  | "later"
  | "undated";

export type RadarHorizon = {
  key: RadarHorizonKey;
  label: string;
  hint: string;
  tone: "crust" | "wheat" | "olive" | "mute";
  count: number;
  tasks: RadarTask[];
};

export type RadarPerson = {
  id: string;
  name: string;
  role: string | null;
  capacityHours: number;
  openTasks: number;
  openHours: number;
  utilization: number;
  overCapacity: boolean;
  overdue: number;
  dueSoon: number;
  blocked: number;
  done: number;
};

export type RadarProject = {
  id: string;
  name: string;
  color: string | null;
  status: Project["status"];
  targetDate: string | null;
  daysToTarget: number | null;
  total: number;
  done: number;
  open: number;
  completion: number;
  elapsed: number | null;
  overdue: number;
  dueSoon: number;
  blocked: number;
  unassigned: number;
  highFindings: number;
  health: number;
  band: RadarBand;
};

export type RadarTotals = {
  projects: number;
  total: number;
  done: number;
  open: number;
  completion: number;
  overdue: number;
  dueSoon: number;
  blocked: number;
  unassigned: number;
  undated: number;
  openHours: number;
};

export type RadarFindingGroup = {
  kind: RiskKind;
  label: string;
  findings: RiskFinding[];
};

export type RadarSnapshot = {
  asOf: string;
  scope: {
    kind: RadarScope["kind"];
    id: string | null;
    name: string;
    label: string;
  };
  ownerFilter: RadarPerson | null;
  totals: RadarTotals;
  health: { score: number; band: RadarBand };
  horizons: RadarHorizon[];
  people: RadarPerson[];
  projects: RadarProject[];
  findings: RiskFinding[];
  findingGroups: RadarFindingGroup[];
};

type ScopeData = {
  name: string;
  label: string;
  projects: Project[];
  tasks: Task[];
  phases: Phase[];
  people: Person[];
  assignees: TaskAssignee[];
  dependencies: TaskDependency[];
  colors: Record<string, string>;
};

const HORIZON_ORDER: {
  key: RadarHorizonKey;
  label: string;
  hint: string;
  tone: RadarHorizon["tone"];
}[] = [
  { key: "overdue", label: "Overdue", hint: "Past due and not done", tone: "crust" },
  { key: "today", label: "Due today", hint: "Lands on the as-of date", tone: "crust" },
  { key: "week", label: "Next 7 days", hint: "The immediate horizon", tone: "wheat" },
  { key: "fortnight", label: "8 to 14 days", hint: "Next planning window", tone: "wheat" },
  { key: "month", label: "15 to 30 days", hint: "Still shapeable", tone: "olive" },
  { key: "later", label: "Beyond 30 days", hint: "Far out", tone: "mute" },
  { key: "undated", label: "No due date", hint: "Cannot be tracked as late", tone: "mute" },
];

const KIND_ORDER: RiskKind[] = [
  "overdue_task",
  "project_target_slip",
  "slipped_phase",
  "blocked_predecessor",
  "due_soon",
  "silent_project",
  "over_capacity",
  "unassigned_task",
  "undated_task",
];

export async function buildRadarSnapshot(input: {
  scope: RadarScope;
  personId: string;
  asOf: string;
  ownerId?: string | null;
}): Promise<RadarSnapshot | null> {
  const data = await loadScope(input.scope, input.personId);
  if (!data) return null;

  const { asOf } = input;
  const peopleById = new Map(data.people.map((person) => [person.id, person]));
  const projectById = new Map(data.projects.map((project) => [project.id, project]));
  const assigneesByTask = groupAssignees(data.assignees);
  const isAssigned = (taskId: string, personId: string) =>
    (assigneesByTask.get(taskId) ?? []).includes(personId);

  // Detection always runs against the full set so a view filter cannot hide a rule.
  const allFindings = detectRisks({
    asOf,
    projects: data.projects,
    tasks: data.tasks,
    phases: data.phases,
    people: data.people,
    assignees: data.assignees,
    dependencies: data.dependencies,
  });

  const ownerFilterId =
    input.ownerId && peopleById.has(input.ownerId) ? input.ownerId : null;
  const ownedTaskIds = ownerFilterId
    ? new Set(
        data.tasks
          .filter((task) => isAssigned(task.id, ownerFilterId))
          .map((task) => task.id),
      )
    : null;

  const tasks = ownerFilterId
    ? data.tasks.filter((task) => isAssigned(task.id, ownerFilterId))
    : data.tasks;
  const findings = ownerFilterId
    ? allFindings.filter(
        (finding) =>
          finding.ownerId === ownerFilterId ||
          (finding.taskId !== null && ownedTaskIds?.has(finding.taskId)),
      )
    : allFindings;

  const toRadarTask = (task: Task): RadarTask => {
    const project = projectById.get(task.project_id);
    const ownerNames = (assigneesByTask.get(task.id) ?? [])
      .map((personId) => peopleById.get(personId)?.full_name)
      .filter((name): name is string => Boolean(name));
    return {
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      projectId: task.project_id,
      projectName: project?.name ?? "Unknown project",
      projectColor: data.colors[task.project_id] ?? null,
      ownerId: task.owner_id,
      ownerNames,
      dueDate: task.due_date,
      estimateHours: Number(task.estimate_hours ?? 0),
      daysOut: task.due_date ? daysBetween(asOf, task.due_date) : null,
    };
  };

  const openTasks = tasks.filter((task) => task.status !== "done");
  const horizons = buildHorizons(openTasks, asOf, toRadarTask);
  const dueSoonCutoff = addDays(asOf, DUE_SOON_DAYS);

  const totals: RadarTotals = {
    projects: data.projects.length,
    total: tasks.length,
    done: tasks.filter((task) => task.status === "done").length,
    open: openTasks.length,
    completion: percent(
      tasks.filter((task) => task.status === "done").length,
      tasks.length,
    ),
    overdue: openTasks.filter((task) => isOverdue(task, asOf)).length,
    dueSoon: openTasks.filter((task) => isDueSoon(task, asOf, dueSoonCutoff)).length,
    blocked: openTasks.filter((task) => task.status === "blocked").length,
    unassigned: openTasks.filter((task) => !task.owner_id).length,
    undated: openTasks.filter((task) => !task.due_date).length,
    openHours: round1(
      openTasks.reduce((sum, task) => sum + Number(task.estimate_hours ?? 0), 0),
    ),
  };

  const people = buildPeople(
    data.people,
    data.tasks,
    assigneesByTask,
    asOf,
    dueSoonCutoff,
  );
  const projects = buildProjects(data, allFindings, asOf, dueSoonCutoff);
  const overCapacityCount = people.filter((person) => person.overCapacity).length;

  const health = scoreHealth({
    open: totals.open,
    total: totals.total,
    overdue: totals.overdue,
    blocked: totals.blocked,
    highFindings: findings.filter((finding) => finding.severity === "high").length,
    paceGap: averagePaceGap(projects),
    overCapacityRatio: people.length === 0 ? 0 : overCapacityCount / people.length,
  });

  return {
    asOf,
    scope: {
      kind: input.scope.kind,
      id: input.scope.kind === "account" ? null : input.scope.id,
      name: data.name,
      label: data.label,
    },
    ownerFilter: ownerFilterId
      ? people.find((person) => person.id === ownerFilterId) ?? null
      : null,
    totals,
    health,
    horizons,
    people,
    projects,
    findings: sortFindings(findings),
    findingGroups: groupFindings(findings),
  };
}

async function loadScope(
  scope: RadarScope,
  personId: string,
): Promise<ScopeData | null> {
  if (scope.kind === "project") {
    const bundle = await getAccessibleProject(scope.id, personId);
    if (!bundle) return null;
    return {
      name: bundle.project.name,
      label: "Project",
      projects: [bundle.project],
      tasks: bundle.tasks,
      phases: bundle.phases,
      people: dedupePeople([
        ...(bundle.owner ? [bundle.owner] : []),
        ...bundle.members.map((member) => member.person),
      ]),
      assignees: bundle.assignees,
      dependencies: bundle.dependencies,
      colors: {},
    };
  }

  if (scope.kind === "portfolio") {
    const bundle = await getAccessiblePortfolio(scope.id, personId);
    if (!bundle) return null;
    const colors: Record<string, string> = {};
    for (const item of bundle.items) colors[item.project_id] = item.color;
    return {
      name: bundle.portfolio.name,
      label: "Portfolio",
      projects: bundle.projects,
      tasks: bundle.tasks,
      phases: bundle.phases,
      people: dedupePeople([
        ...bundle.people,
        ...bundle.members.map((member) => member.person),
      ]),
      assignees: bundle.assignees,
      dependencies: bundle.dependencies,
      colors,
    };
  }

  const bundle = await getAccountProjectBundle(personId);
  return {
    name: "Executive Dashboard",
    label: "Account",
    projects: bundle.projects,
    tasks: bundle.tasks,
    phases: bundle.phases,
    people: bundle.people,
    assignees: bundle.assignees,
    dependencies: bundle.dependencies,
    colors: bundle.colors,
  };
}

function buildHorizons(
  openTasks: Task[],
  asOf: string,
  toRadarTask: (task: Task) => RadarTask,
): RadarHorizon[] {
  const buckets = new Map<RadarHorizonKey, RadarTask[]>(
    HORIZON_ORDER.map((entry) => [entry.key, [] as RadarTask[]]),
  );

  for (const task of openTasks) {
    buckets.get(horizonFor(task, asOf))?.push(toRadarTask(task));
  }

  return HORIZON_ORDER.map((entry) => {
    const tasks = buckets.get(entry.key) ?? [];
    tasks.sort(byDueDateThenTitle);
    return { ...entry, count: tasks.length, tasks };
  });
}

function horizonFor(task: Task, asOf: string): RadarHorizonKey {
  if (!task.due_date) return "undated";
  if (task.due_date < asOf) return "overdue";
  if (task.due_date === asOf) return "today";
  const daysOut = daysBetween(asOf, task.due_date);
  if (daysOut <= 7) return "week";
  if (daysOut <= 14) return "fortnight";
  if (daysOut <= 30) return "month";
  return "later";
}

function buildPeople(
  people: Person[],
  tasks: Task[],
  assigneesByTask: Map<string, string[]>,
  asOf: string,
  dueSoonCutoff: string,
): RadarPerson[] {
  const rows = people.map((person) => {
    const owned = tasks.filter((task) =>
      (assigneesByTask.get(task.id) ?? []).includes(person.id),
    );
    const open = owned.filter((task) => task.status !== "done");
    const openHours = round1(
      open.reduce((sum, task) => sum + Number(task.estimate_hours ?? 0), 0),
    );
    const capacityHours = Number(person.capacity_hours_per_week) || 0;
    return {
      id: person.id,
      name: person.full_name,
      role: person.role,
      capacityHours,
      openTasks: open.length,
      openHours,
      utilization: capacityHours > 0 ? Math.round((openHours / capacityHours) * 100) : 0,
      overCapacity: capacityHours > 0 && openHours > capacityHours,
      overdue: open.filter((task) => isOverdue(task, asOf)).length,
      dueSoon: open.filter((task) => isDueSoon(task, asOf, dueSoonCutoff)).length,
      blocked: open.filter((task) => task.status === "blocked").length,
      done: owned.filter((task) => task.status === "done").length,
    };
  });

  rows.sort(
    (a, b) =>
      b.overdue - a.overdue ||
      b.utilization - a.utilization ||
      a.name.localeCompare(b.name),
  );
  return rows;
}

function buildProjects(
  data: ScopeData,
  findings: RiskFinding[],
  asOf: string,
  dueSoonCutoff: string,
): RadarProject[] {
  const rows = data.projects.map((project) => {
    const projectTasks = data.tasks.filter((task) => task.project_id === project.id);
    const open = projectTasks.filter((task) => task.status !== "done");
    const done = projectTasks.length - open.length;
    const projectFindings = findings.filter(
      (finding) => finding.projectId === project.id,
    );
    const highFindings = projectFindings.filter(
      (finding) => finding.severity === "high",
    ).length;
    const overdue = open.filter((task) => isOverdue(task, asOf)).length;
    const blocked = open.filter((task) => task.status === "blocked").length;
    const elapsed = elapsedPercent(project, asOf);
    const completion = percent(done, projectTasks.length);
    const health = scoreHealth({
      open: open.length,
      total: projectTasks.length,
      overdue,
      blocked,
      highFindings,
      paceGap: elapsed === null ? 0 : Math.max(0, elapsed - completion),
      overCapacityRatio: 0,
    });

    return {
      id: project.id,
      name: project.name,
      color: data.colors[project.id] ?? null,
      status: project.status,
      targetDate: project.target_date,
      daysToTarget: project.target_date
        ? daysBetween(asOf, project.target_date)
        : null,
      total: projectTasks.length,
      done,
      open: open.length,
      completion,
      elapsed,
      overdue,
      dueSoon: open.filter((task) => isDueSoon(task, asOf, dueSoonCutoff)).length,
      blocked,
      unassigned: open.filter((task) => !task.owner_id).length,
      highFindings,
      health: health.score,
      band: health.band,
    };
  });

  rows.sort((a, b) => a.health - b.health || b.overdue - a.overdue);
  return rows;
}

function scoreHealth(input: {
  open: number;
  total: number;
  overdue: number;
  blocked: number;
  highFindings: number;
  paceGap: number;
  overCapacityRatio: number;
}): { score: number; band: RadarBand } {
  if (input.total === 0) return { score: 100, band: "on_track" };

  let penalty = 0;
  if (input.open > 0) {
    penalty += 40 * (input.overdue / input.open);
    penalty += 20 * (input.blocked / input.open);
  }
  penalty += Math.min(15, input.highFindings * 3);
  penalty += clamp(input.paceGap * 0.3, 0, 15);
  penalty += 10 * input.overCapacityRatio;

  const score = Math.round(clamp(100 - penalty, 0, 100));
  return { score, band: bandFor(score) };
}

function bandFor(score: number): RadarBand {
  if (score >= 75) return "on_track";
  if (score >= 50) return "watch";
  return "at_risk";
}

function averagePaceGap(projects: RadarProject[]) {
  const dated = projects.filter((project) => project.elapsed !== null);
  if (dated.length === 0) return 0;
  const total = dated.reduce(
    (sum, project) => sum + Math.max(0, (project.elapsed ?? 0) - project.completion),
    0,
  );
  return total / dated.length;
}

function groupFindings(findings: RiskFinding[]): RadarFindingGroup[] {
  return KIND_ORDER.map((kind) => ({
    kind,
    label: RISK_KIND_LABEL[kind],
    findings: findings.filter((finding) => finding.kind === kind),
  })).filter((group) => group.findings.length > 0);
}

const SEVERITY_RANK = { high: 0, medium: 1, low: 2 } as const;

function sortFindings(findings: RiskFinding[]) {
  return [...findings].sort(
    (a, b) =>
      SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
      KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) ||
      a.title.localeCompare(b.title),
  );
}

function isOverdue(task: Task, asOf: string) {
  return Boolean(task.due_date && task.due_date < asOf && task.status !== "done");
}

function isDueSoon(task: Task, asOf: string, cutoff: string) {
  return Boolean(
    task.due_date &&
      task.due_date >= asOf &&
      task.due_date <= cutoff &&
      task.status !== "done",
  );
}

function byDueDateThenTitle(a: RadarTask, b: RadarTask) {
  if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) {
    return a.dueDate < b.dueDate ? -1 : 1;
  }
  return a.title.localeCompare(b.title);
}

function dedupePeople(people: Person[]) {
  const byId = new Map<string, Person>();
  for (const person of people) byId.set(person.id, person);
  return [...byId.values()];
}

function percent(part: number, whole: number) {
  return whole === 0 ? 0 : Math.round((part / whole) * 100);
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

/** Compact projection of a snapshot for the AI interpretation prompt. */
export function radarPromptPayload(snapshot: RadarSnapshot) {
  return {
    as_of: snapshot.asOf,
    scope: `${snapshot.scope.label}: ${snapshot.scope.name}`,
    health: snapshot.health,
    totals: snapshot.totals,
    horizons: snapshot.horizons.map((horizon) => ({
      label: horizon.label,
      count: horizon.count,
    })),
    people: snapshot.people.slice(0, 20).map((person) => ({
      name: person.name,
      open_tasks: person.openTasks,
      open_hours: person.openHours,
      capacity_hours: person.capacityHours,
      utilization_pct: person.utilization,
      overdue: person.overdue,
      blocked: person.blocked,
    })),
    projects: snapshot.projects.map((project) => ({
      name: project.name,
      health: project.health,
      band: project.band,
      completion_pct: project.completion,
      elapsed_pct: project.elapsed,
      overdue: project.overdue,
      blocked: project.blocked,
      target_date: project.targetDate,
    })),
    findings: snapshot.findings.map((finding) => ({
      id: finding.id,
      kind: finding.kind,
      severity: finding.severity,
      project: finding.projectName,
      title: finding.title,
      detail: finding.detail,
    })),
  };
}
