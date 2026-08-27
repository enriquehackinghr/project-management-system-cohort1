import type { Phase, Person, Project, Task, TaskDependency, TaskStatus } from "./types";
import { addDays, daysBetween } from "./dates";

export type RiskKind =
  | "overdue_task"
  | "due_soon"
  | "blocked_predecessor"
  | "over_capacity"
  | "silent_project"
  | "slipped_phase"
  | "project_target_slip"
  | "unassigned_task"
  | "undated_task";

export type RiskSeverity = "high" | "medium" | "low";

export type RiskFinding = {
  id: string;
  kind: RiskKind;
  title: string;
  detail: string;
  projectId: string;
  projectName: string;
  severity: RiskSeverity;
  taskId: string | null;
  ownerId: string | null;
  dueDate: string | null;
};

const SILENCE_DAYS = 14;

export const DUE_SOON_DAYS = 7;
export const DUE_IMMINENT_DAYS = 2;

/** A project is flagged when completion trails calendar-elapsed by more than this. */
const PACE_GAP_POINTS = 25;

export const OPEN_STATUSES: ReadonlySet<TaskStatus> = new Set<TaskStatus>([
  "todo",
  "in_progress",
  "blocked",
]);

export function isOpen(task: Task) {
  return OPEN_STATUSES.has(task.status);
}

export const RISK_KIND_LABEL: Record<RiskKind, string> = {
  overdue_task: "Overdue",
  due_soon: "Due soon",
  blocked_predecessor: "Blocked by dependency",
  over_capacity: "Over capacity",
  silent_project: "No recent activity",
  slipped_phase: "Slipped phase",
  project_target_slip: "Target date at risk",
  unassigned_task: "Unassigned work",
  undated_task: "Missing due date",
};

export function detectRisks(input: {
  asOf: string;
  projects: Project[];
  tasks: Task[];
  phases: Phase[];
  people: Person[];
  dependencies: TaskDependency[];
}): RiskFinding[] {
  const findings: RiskFinding[] = [];
  const peopleById = new Map(input.people.map((person) => [person.id, person]));
  const projectById = new Map(
    input.projects.map((project) => [project.id, project]),
  );
  const tasksById = new Map(input.tasks.map((task) => [task.id, task]));
  const dueSoonCutoff = addDays(input.asOf, DUE_SOON_DAYS);
  const imminentCutoff = addDays(input.asOf, DUE_IMMINENT_DAYS);

  for (const task of input.tasks) {
    const project = projectById.get(task.project_id);
    if (!project || task.status === "done") continue;
    if (!task.due_date) continue;

    if (task.due_date < input.asOf) {
      findings.push({
        id: `overdue:${task.id}`,
        kind: "overdue_task",
        title: `${task.title} is overdue`,
        detail: `Due ${task.due_date}. Still ${task.status.replace("_", " ")}.`,
        projectId: project.id,
        projectName: project.name,
        severity: "high",
        taskId: task.id,
        ownerId: task.owner_id,
        dueDate: task.due_date,
      });
      continue;
    }

    if (task.due_date <= dueSoonCutoff) {
      const daysOut = daysBetween(input.asOf, task.due_date);
      findings.push({
        id: `duesoon:${task.id}`,
        kind: "due_soon",
        title: `${task.title} is due in ${daysOut} day${daysOut === 1 ? "" : "s"}`,
        detail: `Due ${task.due_date}. Still ${task.status.replace("_", " ")}.`,
        projectId: project.id,
        projectName: project.name,
        severity: task.due_date <= imminentCutoff ? "high" : "medium",
        taskId: task.id,
        ownerId: task.owner_id,
        dueDate: task.due_date,
      });
    }
  }

  for (const dep of input.dependencies) {
    const predecessor = tasksById.get(dep.predecessor_id);
    const successor = tasksById.get(dep.successor_id);
    if (!predecessor || !successor) continue;
    const project = projectById.get(successor.project_id);
    if (!project) continue;
    if (predecessor.status !== "done" && successor.status !== "done") {
      findings.push({
        id: `blocked:${dep.id}`,
        kind: "blocked_predecessor",
        title: `${successor.title} is blocked by an incomplete predecessor`,
        detail: `${predecessor.title} is still ${predecessor.status.replace("_", " ")}.`,
        projectId: project.id,
        projectName: project.name,
        severity: "high",
        taskId: successor.id,
        ownerId: successor.owner_id,
        dueDate: successor.due_date,
      });
    }
  }

  const loadByOwner = new Map<string, number>();
  for (const task of input.tasks) {
    if (!task.owner_id || !isOpen(task)) continue;
    loadByOwner.set(
      task.owner_id,
      (loadByOwner.get(task.owner_id) ?? 0) + Number(task.estimate_hours ?? 0),
    );
  }
  for (const [ownerId, hours] of loadByOwner) {
    const person = peopleById.get(ownerId);
    if (!person) continue;
    if (hours > Number(person.capacity_hours_per_week)) {
      const owned = input.tasks.find(
        (task) => task.owner_id === ownerId && isOpen(task),
      );
      const project = owned ? projectById.get(owned.project_id) : input.projects[0];
      if (!project) continue;
      findings.push({
        id: `capacity:${ownerId}`,
        kind: "over_capacity",
        title: `${person.full_name} is above capacity`,
        detail: `${hours} open hours assigned against ${person.capacity_hours_per_week}h weekly capacity.`,
        projectId: project.id,
        projectName: project.name,
        severity: "medium",
        taskId: null,
        ownerId,
        dueDate: null,
      });
    }
  }

  for (const project of input.projects) {
    const projectTasks = input.tasks.filter((task) => task.project_id === project.id);
    if (projectTasks.length === 0) continue;
    const latest = projectTasks.reduce(
      (max, task) => (task.updated_at > max ? task.updated_at : max),
      project.updated_at,
    );
    const latestDay = latest.slice(0, 10);
    if (daysBetween(latestDay, input.asOf) >= SILENCE_DAYS) {
      findings.push({
        id: `silent:${project.id}`,
        kind: "silent_project",
        title: `${project.name} has no recent activity`,
        detail: `No task updated in ${daysBetween(latestDay, input.asOf)} days (as of ${input.asOf}).`,
        projectId: project.id,
        projectName: project.name,
        severity: "high",
        taskId: null,
        ownerId: null,
        dueDate: null,
      });
    }
  }

  for (const phase of input.phases) {
    const project = projectById.get(phase.project_id);
    if (!project || !phase.end_date) continue;
    if (phase.end_date >= input.asOf) continue;
    const open = input.tasks.filter(
      (task) => task.phase_id === phase.id && task.status !== "done",
    );
    if (open.length > 0) {
      findings.push({
        id: `phase:${phase.id}`,
        kind: "slipped_phase",
        title: `${phase.name} has passed with open work`,
        detail: `Phase ended ${phase.end_date}. ${open.length} task${open.length === 1 ? "" : "s"} still open.`,
        projectId: project.id,
        projectName: project.name,
        severity: "high",
        taskId: null,
        ownerId: null,
        dueDate: phase.end_date,
      });
    }
  }

  for (const project of input.projects) {
    const projectTasks = input.tasks.filter((task) => task.project_id === project.id);
    if (projectTasks.length === 0) continue;
    const open = projectTasks.filter((task) => task.status !== "done");

    if (project.target_date && project.target_date < input.asOf && open.length > 0) {
      findings.push({
        id: `target:${project.id}`,
        kind: "project_target_slip",
        title: `${project.name} is past its target date`,
        detail: `Target was ${project.target_date}. ${open.length} task${open.length === 1 ? "" : "s"} still open ${daysBetween(project.target_date, input.asOf)} days later.`,
        projectId: project.id,
        projectName: project.name,
        severity: "high",
        taskId: null,
        ownerId: null,
        dueDate: project.target_date,
      });
    } else if (open.length > 0) {
      const elapsed = elapsedPercent(project, input.asOf);
      const completion = Math.round(
        ((projectTasks.length - open.length) / projectTasks.length) * 100,
      );
      if (elapsed !== null && elapsed - completion > PACE_GAP_POINTS) {
        findings.push({
          id: `pace:${project.id}`,
          kind: "project_target_slip",
          title: `${project.name} is behind its own pace`,
          detail: `${elapsed}% of the calendar is gone but only ${completion}% of tasks are done. Target ${project.target_date}.`,
          projectId: project.id,
          projectName: project.name,
          severity: "high",
          taskId: null,
          ownerId: null,
          dueDate: project.target_date,
        });
      }
    }
  }

  for (const project of input.projects) {
    const open = input.tasks.filter(
      (task) => task.project_id === project.id && task.status !== "done",
    );

    const unassigned = open.filter((task) => !task.owner_id && task.due_date);
    if (unassigned.length > 0) {
      findings.push({
        id: `unassigned:${project.id}`,
        kind: "unassigned_task",
        title: `${unassigned.length} dated task${unassigned.length === 1 ? " has" : "s have"} no owner`,
        detail: `Work in ${project.name} has a due date but nobody accountable. Earliest is due ${earliestDue(unassigned)}.`,
        projectId: project.id,
        projectName: project.name,
        severity: "medium",
        taskId: null,
        ownerId: null,
        dueDate: earliestDue(unassigned),
      });
    }

    const undated = open.filter((task) => !task.due_date);
    if (undated.length > 0) {
      findings.push({
        id: `undated:${project.id}`,
        kind: "undated_task",
        title: `${undated.length} open task${undated.length === 1 ? "" : "s"} without a due date`,
        detail: `These never appear on the deadline horizon in ${project.name}, so they cannot be tracked as late.`,
        projectId: project.id,
        projectName: project.name,
        severity: "low",
        taskId: null,
        ownerId: null,
        dueDate: null,
      });
    }
  }

  return findings;
}

/** Percent of the project's planned calendar consumed as of a date, or null when undated. */
export function elapsedPercent(project: Project, asOf: string) {
  if (!project.start_date || !project.target_date) return null;
  const span = daysBetween(project.start_date, project.target_date);
  if (span <= 0) return null;
  const gone = daysBetween(project.start_date, asOf);
  if (gone <= 0) return 0;
  return Math.min(100, Math.round((gone / span) * 100));
}

function earliestDue(tasks: Task[]) {
  return tasks.reduce<string | null>(
    (min, task) =>
      task.due_date && (min === null || task.due_date < min) ? task.due_date : min,
    null,
  );
}

export function buildStatusSnapshot(input: {
  asOf: string;
  project: Project;
  tasks: Task[];
  people: Person[];
}) {
  const peopleById = new Map(input.people.map((person) => [person.id, person]));
  const moved = input.tasks.filter(
    (task) =>
      task.updated_at.slice(0, 10) >= addDays(input.asOf, -7) &&
      task.updated_at.slice(0, 10) <= input.asOf,
  );
  const slipped = input.tasks.filter(
    (task) =>
      task.due_date && task.due_date < input.asOf && task.status !== "done",
  );
  const next = input.tasks.filter(
    (task) =>
      task.status !== "done" &&
      (!task.start_date || task.start_date <= addDays(input.asOf, 14)),
  );
  const needsDecision = input.tasks.filter((task) => task.status === "blocked");

  return {
    as_of: input.asOf,
    project: {
      id: input.project.id,
      name: input.project.name,
      status: input.project.status,
      goal: input.project.goal,
    },
    counts: {
      total: input.tasks.length,
      done: input.tasks.filter((task) => task.status === "done").length,
      overdue: slipped.length,
      blocked: needsDecision.length,
    },
    moved: moved.map(summarizeTask(peopleById)),
    slipped: slipped.map(summarizeTask(peopleById)),
    next: next.slice(0, 12).map(summarizeTask(peopleById)),
    needs_decision: needsDecision.map(summarizeTask(peopleById)),
  };
}

function summarizeTask(peopleById: Map<string, Person>) {
  return (task: Task) => ({
    id: task.id,
    title: task.title,
    status: task.status,
    owner: task.owner_id ? peopleById.get(task.owner_id)?.full_name ?? null : null,
    due_date: task.due_date,
    updated_at: task.updated_at,
  });
}
