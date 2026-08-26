import type { Phase, Person, Project, Task, TaskDependency } from "./types";
import { daysBetween } from "./dates";

export type RiskKind =
  | "overdue_task"
  | "blocked_predecessor"
  | "over_capacity"
  | "silent_project"
  | "slipped_phase";

export type RiskFinding = {
  id: string;
  kind: RiskKind;
  title: string;
  detail: string;
  projectId: string;
  projectName: string;
  severity: "high" | "medium";
};

const SILENCE_DAYS = 14;

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
  const openStatuses = new Set(["todo", "in_progress", "blocked"]);

  for (const task of input.tasks) {
    const project = projectById.get(task.project_id);
    if (!project) continue;
    if (
      task.due_date &&
      task.due_date < input.asOf &&
      task.status !== "done"
    ) {
      findings.push({
        id: `overdue:${task.id}`,
        kind: "overdue_task",
        title: `${task.title} is overdue`,
        detail: `Due ${task.due_date}. Still ${task.status.replace("_", " ")}.`,
        projectId: project.id,
        projectName: project.name,
        severity: "high",
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
      });
    }
  }

  const loadByOwner = new Map<string, number>();
  for (const task of input.tasks) {
    if (!task.owner_id || !openStatuses.has(task.status)) continue;
    loadByOwner.set(
      task.owner_id,
      (loadByOwner.get(task.owner_id) ?? 0) + Number(task.estimate_hours ?? 0),
    );
  }
  for (const [ownerId, hours] of loadByOwner) {
    const person = peopleById.get(ownerId);
    if (!person) continue;
    if (hours > Number(person.capacity_hours_per_week)) {
      const owned = input.tasks.find((task) => task.owner_id === ownerId);
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
      });
    }
  }

  return findings;
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
      task.updated_at.slice(0, 10) >= addDaysSafe(input.asOf, -7) &&
      task.updated_at.slice(0, 10) <= input.asOf,
  );
  const slipped = input.tasks.filter(
    (task) =>
      task.due_date && task.due_date < input.asOf && task.status !== "done",
  );
  const next = input.tasks.filter(
    (task) =>
      task.status !== "done" &&
      (!task.start_date || task.start_date <= addDaysSafe(input.asOf, 14)),
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

function addDaysSafe(iso: string, days: number) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
