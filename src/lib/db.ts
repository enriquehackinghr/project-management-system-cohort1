import "server-only";

import { createAdminClient } from "./supabase/admin";
import type {
  Person,
  Phase,
  Portfolio,
  PortfolioBundle,
  PortfolioProject,
  Project,
  ProjectBundle,
  ProjectMember,
  StatusReport,
  Task,
  TaskDependency,
} from "./types";
import { joinName } from "./names";
import { nextPortfolioColor } from "./portfolio-colors";

const admin = () => createAdminClient();

function throwIfError(error: { message: string } | null) {
  if (error) {
    throw new Error(error.message);
  }
}

export async function upsertPerson(input: {
  firstName: string;
  lastName: string;
  email: string;
  role?: string | null;
  capacityHoursPerWeek?: number;
}) {
  const { data, error } = await admin().rpc("upsert_person", {
    p_first_name: input.firstName.trim(),
    p_last_name: input.lastName.trim(),
    p_email: input.email.trim().toLowerCase(),
    p_role: input.role ?? null,
    p_capacity: input.capacityHoursPerWeek ?? 40,
  });
  throwIfError(error);
  const person = (Array.isArray(data) ? data[0] : data) as Person | undefined;
  if (!person?.id) {
    throw new Error("Could not create the person record.");
  }
  return person;
}

export async function getPersonById(id: string) {
  const { data, error } = await admin()
    .from("people")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  throwIfError(error);
  return data as Person | null;
}

export async function listProjectsForPerson(personId: string) {
  const { data: memberships, error } = await admin()
    .from("project_members")
    .select("project_id")
    .eq("person_id", personId);
  throwIfError(error);
  const ids = (memberships ?? []).map((row) => row.project_id as string);
  if (ids.length === 0) return [] as Project[];

  const { data, error: projectError } = await admin()
    .from("projects")
    .select("*")
    .in("id", ids)
    .order("updated_at", { ascending: false });
  throwIfError(projectError);
  return (data ?? []) as Project[];
}

export async function assertProjectAccess(projectId: string, personId: string) {
  const { data, error } = await admin()
    .from("project_members")
    .select("id")
    .eq("project_id", projectId)
    .eq("person_id", personId)
    .maybeSingle();
  throwIfError(error);
  if (!data) {
    throw new Error("You do not have access to this project.");
  }
}

export async function getProjectBundle(
  projectId: string,
  personId: string,
): Promise<ProjectBundle> {
  await assertProjectAccess(projectId, personId);

  const db = admin();
  const { data: project, error: projectError } = await db
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();
  throwIfError(projectError);

  const [
    { data: owner },
    { data: memberRows, error: memberError },
    { data: phases, error: phaseError },
    { data: tasks, error: taskError },
  ] = await Promise.all([
    db.from("people").select("*").eq("id", project.owner_id).maybeSingle(),
    db
      .from("project_members")
      .select("id, project_id, person_id, role, person:people(*)")
      .eq("project_id", projectId),
    db
      .from("phases")
      .select("*")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true }),
    db
      .from("tasks")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true }),
  ]);

  throwIfError(memberError);
  throwIfError(phaseError);
  throwIfError(taskError);

  const taskList = (tasks ?? []) as Task[];
  const taskIds = taskList.map((task) => task.id);
  let projectDeps: TaskDependency[] = [];
  if (taskIds.length > 0) {
    const { data: depRows, error: filteredDepError } = await db
      .from("task_dependencies")
      .select("*")
      .in("predecessor_id", taskIds);
    throwIfError(filteredDepError);
    projectDeps = (depRows ?? []) as TaskDependency[];
  }

  const members = ((memberRows ?? []) as Array<
    Omit<ProjectMember, "person"> & { person: Person | Person[] }
  >).map((row) => ({
    ...row,
    person: Array.isArray(row.person) ? row.person[0] : row.person,
  }));

  return {
    project: project as Project,
    owner: (owner as Person | null) ?? null,
    members,
    phases: (phases ?? []) as Phase[],
    tasks: taskList,
    dependencies: projectDeps,
  };
}

export async function getAccessibleProject(projectId: string, personId: string) {
  try {
    return await getProjectBundle(projectId, personId);
  } catch {
    return null;
  }
}

export async function listPeopleForProjects(projectIds: string[]) {
  if (projectIds.length === 0) return [] as Person[];
  const { data: members, error } = await admin()
    .from("project_members")
    .select("person:people(*)")
    .in("project_id", projectIds);
  throwIfError(error);
  const byId = new Map<string, Person>();
  for (const row of members ?? []) {
    const person = Array.isArray(row.person) ? row.person[0] : row.person;
    if (person) byId.set(person.id, person as Person);
  }
  return [...byId.values()];
}

export async function listTasksForProjects(projectIds: string[]) {
  if (projectIds.length === 0) return [] as Task[];
  const { data, error } = await admin()
    .from("tasks")
    .select("*")
    .in("project_id", projectIds);
  throwIfError(error);
  return (data ?? []) as Task[];
}

export async function listPhasesForProjects(projectIds: string[]) {
  if (projectIds.length === 0) return [] as Phase[];
  const { data, error } = await admin()
    .from("phases")
    .select("*")
    .in("project_id", projectIds);
  throwIfError(error);
  return (data ?? []) as Phase[];
}

export async function listDependenciesForTasks(taskIds: string[]) {
  if (taskIds.length === 0) return [] as TaskDependency[];
  const { data, error } = await admin()
    .from("task_dependencies")
    .select("*")
    .or(
      `predecessor_id.in.(${taskIds.join(",")}),successor_id.in.(${taskIds.join(",")})`,
    );
  throwIfError(error);
  return (data ?? []) as TaskDependency[];
}

export async function createManualProject(input: {
  createdById: string;
  createdByEmail: string;
  createdByFirstName: string;
  createdByLastName: string;
  name: string;
  description?: string;
  goal?: string;
  startDate?: string;
  targetDate?: string;
  budget?: number | null;
  members: Array<{
    firstName: string;
    lastName: string;
    email: string;
    role?: string;
    capacityHoursPerWeek?: number;
  }>;
}) {
  const creatorMember = {
    firstName: input.createdByFirstName,
    lastName: input.createdByLastName,
    email: input.createdByEmail,
    role: "Owner",
    capacityHoursPerWeek: 40,
  };
  const members = [
    creatorMember,
    ...input.members.filter(
      (member) =>
        member.email.trim().toLowerCase() !==
        input.createdByEmail.trim().toLowerCase(),
    ),
  ];
  const payload = {
    created_by_id: input.createdById,
    project: {
      name: input.name,
      description: input.description ?? "",
      goal: input.goal ?? "",
      owner_email: input.createdByEmail.toLowerCase(),
      start_date: input.startDate ?? "",
      target_date: input.targetDate ?? "",
      status: "planning",
      budget: input.budget ?? "",
    },
    members: members.map((member) => ({
      first_name: member.firstName,
      last_name: member.lastName,
      full_name: joinName(member.firstName, member.lastName),
      email: member.email.toLowerCase(),
      role: member.role ?? "",
      capacity_hours_per_week: member.capacityHoursPerWeek ?? 40,
    })),
    phases: [],
    tasks: [],
    dependencies: [],
  };

  const { data, error } = await admin().rpc("commit_project_plan", { payload });
  throwIfError(error);
  return data as string;
}

export async function commitPlan(payload: unknown) {
  const { data, error } = await admin().rpc("commit_project_plan", { payload });
  throwIfError(error);
  return data as string;
}

export async function addProjectMember(
  projectId: string,
  personId: string,
  member: {
    firstName: string;
    lastName: string;
    email: string;
    role?: string;
    capacityHoursPerWeek?: number;
  },
) {
  await assertProjectAccess(projectId, personId);
  const person = await upsertPerson({
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
    role: member.role,
    capacityHoursPerWeek: member.capacityHoursPerWeek,
  });
  const { error } = await admin()
    .from("project_members")
    .upsert(
      { project_id: projectId, person_id: person.id, role: member.role ?? null },
      { onConflict: "project_id,person_id" },
    );
  throwIfError(error);
  return person;
}

export async function addTask(
  projectId: string,
  personId: string,
  input: {
    title: string;
    description?: string;
    phaseId?: string | null;
    ownerId?: string | null;
    status?: Task["status"];
    priority?: Task["priority"];
    estimateHours?: number | null;
    startDate?: string | null;
    dueDate?: string | null;
  },
) {
  await assertProjectAccess(projectId, personId);
  const { data, error } = await admin()
    .from("tasks")
    .insert({
      project_id: projectId,
      title: input.title,
      description: input.description ?? null,
      phase_id: input.phaseId || null,
      owner_id: input.ownerId || null,
      status: input.status ?? "todo",
      priority: input.priority ?? "medium",
      estimate_hours: input.estimateHours ?? null,
      start_date: input.startDate || null,
      due_date: input.dueDate || null,
    })
    .select("*")
    .single();
  throwIfError(error);
  return data as Task;
}

export async function updateTaskStatus(
  projectId: string,
  personId: string,
  taskId: string,
  status: Task["status"],
) {
  await assertProjectAccess(projectId, personId);
  const { error } = await admin()
    .from("tasks")
    .update({ status })
    .eq("id", taskId)
    .eq("project_id", projectId);
  throwIfError(error);
}

export async function updateTask(
  projectId: string,
  personId: string,
  taskId: string,
  patch: Partial<{
    title: string;
    owner_id: string | null;
    status: Task["status"];
    start_date: string | null;
    due_date: string | null;
    phase_id: string | null;
    estimate_hours: number | null;
    priority: Task["priority"];
  }>,
) {
  await assertProjectAccess(projectId, personId);
  const { error } = await admin()
    .from("tasks")
    .update(patch)
    .eq("id", taskId)
    .eq("project_id", projectId);
  throwIfError(error);
}

export async function addPhase(
  projectId: string,
  personId: string,
  input: { name: string; startDate?: string; endDate?: string },
) {
  await assertProjectAccess(projectId, personId);
  const { data: existing } = await admin()
    .from("phases")
    .select("sort_order")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: false })
    .limit(1);
  const sortOrder = (existing?.[0]?.sort_order ?? -1) + 1;
  const { data, error } = await admin()
    .from("phases")
    .insert({
      project_id: projectId,
      name: input.name,
      sort_order: sortOrder,
      start_date: input.startDate || null,
      end_date: input.endDate || null,
    })
    .select("*")
    .single();
  throwIfError(error);
  return data as Phase;
}

export async function saveStatusReport(input: {
  projectId: string;
  personId: string;
  generatedBody: string;
  body: string;
  snapshot: unknown;
  asOf: string;
}) {
  await assertProjectAccess(input.projectId, input.personId);
  const { data, error } = await admin()
    .from("status_reports")
    .insert({
      project_id: input.projectId,
      generated_body: input.generatedBody,
      body: input.body,
      snapshot: input.snapshot,
      as_of: input.asOf,
    })
    .select("*")
    .single();
  throwIfError(error);
  return data as StatusReport;
}

export async function listStatusReports(projectId: string, personId: string) {
  await assertProjectAccess(projectId, personId);
  const { data, error } = await admin()
    .from("status_reports")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  throwIfError(error);
  return (data ?? []) as StatusReport[];
}

export async function listPortfoliosForPerson(personId: string) {
  const { data, error } = await admin()
    .from("portfolios")
    .select("*")
    .eq("created_by_id", personId)
    .order("updated_at", { ascending: false });
  throwIfError(error);
  return (data ?? []) as Portfolio[];
}

export async function listPortfolioItems(portfolioIds: string[]) {
  if (portfolioIds.length === 0) return [] as PortfolioProject[];
  const { data, error } = await admin()
    .from("portfolio_projects")
    .select("id, portfolio_id, project_id, color, sort_order, project:projects(*)")
    .in("portfolio_id", portfolioIds)
    .order("sort_order", { ascending: true });
  throwIfError(error);
  return ((data ?? []) as Array<Record<string, unknown>>).flatMap((row) => {
    const project = Array.isArray(row.project) ? row.project[0] : row.project;
    if (!project) return [];
    return [
      {
        id: row.id as string,
        portfolio_id: row.portfolio_id as string,
        project_id: row.project_id as string,
        color: row.color as string,
        sort_order: row.sort_order as number,
        project: project as Project,
      } satisfies PortfolioProject,
    ];
  });
}

export async function assertPortfolioAccess(portfolioId: string, personId: string) {
  const { data, error } = await admin()
    .from("portfolios")
    .select("*")
    .eq("id", portfolioId)
    .eq("created_by_id", personId)
    .maybeSingle();
  throwIfError(error);
  if (!data) {
    throw new Error("You do not have access to this portfolio.");
  }
  return data as Portfolio;
}

export async function getAccessiblePortfolio(
  portfolioId: string,
  personId: string,
): Promise<PortfolioBundle | null> {
  try {
    const portfolio = await assertPortfolioAccess(portfolioId, personId);
    const items = await listPortfolioItems([portfolioId]);
    const projectIds = items.map((item) => item.project_id);
    const [tasks, phases, people] = await Promise.all([
      listTasksForProjects(projectIds),
      listPhasesForProjects(projectIds),
      listPeopleForProjects(projectIds),
    ]);
    const dependencies = await listDependenciesForTasks(tasks.map((task) => task.id));
    return {
      portfolio,
      items,
      projects: items.map((item) => item.project),
      phases,
      tasks,
      people,
      dependencies,
    };
  } catch {
    return null;
  }
}

export async function createPortfolio(personId: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Portfolio name is required.");
  const { data, error } = await admin()
    .from("portfolios")
    .insert({ name: trimmed, created_by_id: personId })
    .select("*")
    .single();
  throwIfError(error);
  return data as Portfolio;
}

export async function addProjectToPortfolio(
  portfolioId: string,
  personId: string,
  projectId: string,
) {
  await assertPortfolioAccess(portfolioId, personId);
  await assertProjectAccess(projectId, personId);
  const items = await listPortfolioItems([portfolioId]);
  if (items.some((item) => item.project_id === projectId)) {
    return;
  }
  const { error } = await admin().from("portfolio_projects").insert({
    portfolio_id: portfolioId,
    project_id: projectId,
    color: nextPortfolioColor(items.map((item) => item.color)),
    sort_order: items.length,
  });
  throwIfError(error);
}

export async function removeProjectFromPortfolio(
  portfolioId: string,
  personId: string,
  projectId: string,
) {
  await assertPortfolioAccess(portfolioId, personId);
  const { error } = await admin()
    .from("portfolio_projects")
    .delete()
    .eq("portfolio_id", portfolioId)
    .eq("project_id", projectId);
  throwIfError(error);
}
