export type SessionPerson = {
  personId: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
};

export type ProjectStatus = "planning" | "active" | "on_hold" | "completed";
export type TaskStatus = "todo" | "in_progress" | "blocked" | "done";
export type TaskPriority = "low" | "medium" | "high";
export type AccessRole = "view" | "admin";

export const ACCESS_ROLES: AccessRole[] = ["view", "admin"];

export const ACCESS_ROLE_LABEL: Record<AccessRole, string> = {
  view: "View",
  admin: "Admin",
};

export const ACCESS_ROLE_HINT: Record<AccessRole, string> = {
  view: "Can see everything, cannot change anything.",
  admin: "Can edit the content of this work.",
};

export type Person = {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  role: string | null;
  capacity_hours_per_week: number;
  slack_handle: string | null;
  industry: string | null;
  country: string | null;
  created_at?: string;
  last_login_at?: string | null;
};

export type PasswordReset = {
  id: string;
  person_id: string;
  expires_at: string;
  used_at: string | null;
};

export type Project = {
  id: string;
  name: string;
  description: string | null;
  goal: string | null;
  owner_id: string;
  created_by_id: string;
  start_date: string | null;
  target_date: string | null;
  status: ProjectStatus;
  budget: number | null;
  created_at: string;
  updated_at: string;
};

export type ProjectMember = {
  id: string;
  project_id: string;
  person_id: string;
  role: string | null;
  access_role: AccessRole;
  person: Person;
};

export type Phase = {
  id: string;
  project_id: string;
  name: string;
  sort_order: number;
  start_date: string | null;
  end_date: string | null;
};

export type Task = {
  id: string;
  project_id: string;
  phase_id: string | null;
  parent_task_id: string | null;
  title: string;
  description: string | null;
  owner_id: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  estimate_hours: number | null;
  start_date: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * A task can carry several assignees. `tasks.owner_id` mirrors whichever one was
 * added first, so anything that needs a single accountable name still has one.
 */
export type TaskAssignee = {
  id: string;
  task_id: string;
  person_id: string;
  created_at: string;
};

export type TaskDependency = {
  id: string;
  predecessor_id: string;
  successor_id: string;
};

export type StatusReport = {
  id: string;
  project_id: string;
  generated_body: string;
  body: string;
  snapshot: unknown;
  as_of: string;
  created_at: string;
};

export type ProjectBundle = {
  project: Project;
  owner: Person | null;
  members: ProjectMember[];
  phases: Phase[];
  tasks: Task[];
  assignees: TaskAssignee[];
  dependencies: TaskDependency[];
};

export type Portfolio = {
  id: string;
  name: string;
  created_by_id: string;
  created_at: string;
  updated_at: string;
};

export type PortfolioProject = {
  id: string;
  portfolio_id: string;
  project_id: string;
  color: string;
  sort_order: number;
  project: Project;
};

export type PortfolioMember = {
  id: string;
  portfolio_id: string;
  person_id: string;
  role: string | null;
  access_role: AccessRole;
  person: Person;
};

export type PortfolioBundle = {
  portfolio: Portfolio;
  items: PortfolioProject[];
  projects: Project[];
  phases: Phase[];
  tasks: Task[];
  assignees: TaskAssignee[];
  people: Person[];
  /** Assignable people per project, since a task can only go to its own members. */
  membersByProject: Record<string, Person[]>;
  dependencies: TaskDependency[];
  members: PortfolioMember[];
};

export type Team = {
  id: string;
  name: string;
  created_by_id: string;
  created_at: string;
  updated_at: string;
};

export type TeamMember = {
  id: string;
  team_id: string;
  person_id: string;
  role: string | null;
  access_role: AccessRole;
  person: Person;
};

export type TeamBundle = {
  team: Team;
  members: TeamMember[];
  projects: Project[];
  portfolios: Portfolio[];
};

export type AuditKind = "change" | "view" | "click";

export type AuditEvent = {
  id: string;
  scope: "project" | "portfolio";
  project_id: string | null;
  portfolio_id: string | null;
  actor_id: string;
  kind: AuditKind;
  action: string;
  summary: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  actor: Person;
};

export const AUDIT_KIND_LABEL: Record<AuditKind, string> = {
  change: "Change",
  view: "View",
  click: "Click",
};

export type AccountBundle = {
  projects: Project[];
  colors: Record<string, string>;
  phases: Phase[];
  tasks: Task[];
  assignees: TaskAssignee[];
  people: Person[];
  membersByProject: Record<string, Person[]>;
  dependencies: TaskDependency[];
};

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "Ready",
  in_progress: "In progress",
  blocked: "Blocked",
  done: "Done",
};

export const TASK_STATUSES: TaskStatus[] = [
  "todo",
  "in_progress",
  "blocked",
  "done",
];

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Med",
  high: "High",
};

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  planning: "Planning",
  active: "Active",
  on_hold: "On hold",
  completed: "Completed",
};
