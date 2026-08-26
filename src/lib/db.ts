import "server-only";

import { createAdminClient } from "./supabase/admin";
import type {
  AccountBundle,
  Person,
  Phase,
  Portfolio,
  PortfolioBundle,
  PortfolioMember,
  PortfolioProject,
  Project,
  ProjectBundle,
  ProjectMember,
  StatusReport,
  Task,
  TaskDependency,
  Team,
  TeamBundle,
  TeamMember,
} from "./types";
import { joinName } from "./names";
import { colorsForProjects, nextPortfolioColor } from "./portfolio-colors";

const admin = () => createAdminClient();

function throwIfError(error: { message: string } | null) {
  if (error) {
    throw new Error(error.message);
  }
}

function asPerson(value: Person | Person[] | null | undefined): Person | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function uniqueIds(ids: Array<string | null | undefined>) {
  return [...new Set(ids.filter((id): id is string => Boolean(id)))];
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

export async function getPersonByEmail(email: string) {
  const { data, error } = await admin()
    .from("people")
    .select("*")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();
  throwIfError(error);
  return data as Person | null;
}

export async function updatePersonProfile(
  personId: string,
  input: {
    firstName: string;
    lastName: string;
    industry: string;
    country: string;
  },
) {
  const { data, error } = await admin()
    .from("people")
    .update({
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim(),
      industry: input.industry,
      country: input.country,
    })
    .eq("id", personId)
    .select("*")
    .single();
  throwIfError(error);
  return data as Person;
}

export async function getAccountByPersonId(personId: string) {
  const { data, error } = await admin()
    .from("accounts")
    .select("person_id")
    .eq("person_id", personId)
    .maybeSingle();
  throwIfError(error);
  return data as { person_id: string } | null;
}

export async function getPasswordHashForPerson(personId: string) {
  const { data, error } = await admin()
    .from("accounts")
    .select("password_hash")
    .eq("person_id", personId)
    .maybeSingle();
  throwIfError(error);
  return (data?.password_hash as string | undefined) ?? null;
}

export async function createAccount(personId: string, passwordHash: string) {
  const now = new Date().toISOString();
  const { error } = await admin().from("accounts").insert({
    person_id: personId,
    password_hash: passwordHash,
    last_login_at: now,
  });
  if (error?.code === "23505") {
    throw new Error("An account with this email already exists.");
  }
  throwIfError(error);
  await stampLastLogin(personId, now);
}

export async function recordLastLogin(personId: string) {
  await stampLastLogin(personId, new Date().toISOString());
}

async function stampLastLogin(personId: string, at: string) {
  const db = admin();
  const { error: accountError } = await db
    .from("accounts")
    .update({ last_login_at: at })
    .eq("person_id", personId);
  throwIfError(accountError);
  const { error: personError } = await db
    .from("people")
    .update({ last_login_at: at })
    .eq("id", personId);
  throwIfError(personError);
}

export async function listAccountPeople(excludePersonId?: string) {
  const { data: accounts, error: accountError } = await admin()
    .from("accounts")
    .select("person_id");
  throwIfError(accountError);
  const ids = (accounts ?? [])
    .map((row) => row.person_id as string)
    .filter((id) => id !== excludePersonId);
  if (ids.length === 0) return [] as Person[];
  const { data, error } = await admin()
    .from("people")
    .select("*")
    .in("id", ids)
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });
  throwIfError(error);
  return (data ?? []) as Person[];
}

export async function listProjectsForPerson(personId: string) {
  const ids = await listAccessibleProjectIds(personId);
  if (ids.length === 0) return [] as Project[];

  const { data, error: projectError } = await admin()
    .from("projects")
    .select("*")
    .in("id", ids)
    .order("updated_at", { ascending: false });
  throwIfError(projectError);
  return (data ?? []) as Project[];
}

export async function listAccessibleProjectIds(personId: string) {
  const db = admin();
  const [{ data: memberships, error: memberError }, portfolioIds] = await Promise.all([
    db.from("project_members").select("project_id").eq("person_id", personId),
    listAccessiblePortfolioIds(personId),
  ]);
  throwIfError(memberError);
  const direct = (memberships ?? []).map((row) => row.project_id as string);
  if (portfolioIds.length === 0) return uniqueIds(direct);

  const { data: portfolioProjects, error: portfolioError } = await db
    .from("portfolio_projects")
    .select("project_id")
    .in("portfolio_id", portfolioIds);
  throwIfError(portfolioError);
  return uniqueIds([
    ...direct,
    ...(portfolioProjects ?? []).map((row) => row.project_id as string),
  ]);
}

export async function assertProjectAccess(projectId: string, personId: string) {
  const ids = await listAccessibleProjectIds(personId);
  if (!ids.includes(projectId)) {
    throw new Error("You do not have access to this project.");
  }
}

export async function assertProjectOwner(projectId: string, personId: string) {
  const { data, error } = await admin()
    .from("projects")
    .select("id, owner_id, created_by_id")
    .eq("id", projectId)
    .maybeSingle();
  throwIfError(error);
  if (!data) {
    throw new Error("You do not have access to this project.");
  }
  if (data.owner_id !== personId && data.created_by_id !== personId) {
    throw new Error("Only the project owner can add members.");
  }
  await assertProjectAccess(projectId, personId);
  return data as Pick<Project, "id" | "owner_id" | "created_by_id">;
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

export async function listMembersForProjects(projectIds: string[]) {
  if (projectIds.length === 0) {
    return [] as Array<{ project_id: string; role: string | null; person: Person }>;
  }
  const { data, error } = await admin()
    .from("project_members")
    .select("project_id, role, person:people(*)")
    .in("project_id", projectIds);
  throwIfError(error);
  return ((data ?? []) as Array<{
    project_id: string;
    role: string | null;
    person: Person | Person[] | null;
  }>).flatMap((row) => {
    const person = Array.isArray(row.person) ? row.person[0] : row.person;
    if (!person) return [];
    return [{ project_id: row.project_id, role: row.role, person }];
  });
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
  await grantProjectMembership(projectId, person.id, member.role ?? "Member");
  return person;
}

export async function grantProjectMembership(
  projectId: string,
  memberId: string,
  role = "Member",
) {
  const { error } = await admin()
    .from("project_members")
    .upsert(
      { project_id: projectId, person_id: memberId, role },
      { onConflict: "project_id,person_id", ignoreDuplicates: true },
    );
  throwIfError(error);
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

export async function updateProjectName(
  projectId: string,
  personId: string,
  name: string,
) {
  await assertProjectOwner(projectId, personId);
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Project name is required.");
  const { error } = await admin()
    .from("projects")
    .update({ name: trimmed })
    .eq("id", projectId);
  throwIfError(error);
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

export async function listAccessiblePortfolioIds(personId: string) {
  const db = admin();
  const [{ data: created, error: createdError }, { data: memberships, error: memberError }] =
    await Promise.all([
      db.from("portfolios").select("id").eq("created_by_id", personId),
      db.from("portfolio_members").select("portfolio_id").eq("person_id", personId),
    ]);
  throwIfError(createdError);
  throwIfError(memberError);
  return uniqueIds([
    ...(created ?? []).map((row) => row.id as string),
    ...(memberships ?? []).map((row) => row.portfolio_id as string),
  ]);
}

export async function listPortfoliosForPerson(personId: string) {
  const ids = await listAccessiblePortfolioIds(personId);
  if (ids.length === 0) return [] as Portfolio[];
  const { data, error } = await admin()
    .from("portfolios")
    .select("*")
    .in("id", ids)
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
  const ids = await listAccessiblePortfolioIds(personId);
  if (!ids.includes(portfolioId)) {
    throw new Error("You do not have access to this portfolio.");
  }
  const { data, error } = await admin()
    .from("portfolios")
    .select("*")
    .eq("id", portfolioId)
    .maybeSingle();
  throwIfError(error);
  if (!data) {
    throw new Error("You do not have access to this portfolio.");
  }
  return data as Portfolio;
}

export async function assertPortfolioOwner(portfolioId: string, personId: string) {
  const portfolio = await assertPortfolioAccess(portfolioId, personId);
  if (portfolio.created_by_id !== personId) {
    throw new Error("Only the portfolio owner can change membership or projects.");
  }
  return portfolio;
}

export async function listPortfolioMembers(portfolioId: string) {
  const { data, error } = await admin()
    .from("portfolio_members")
    .select("id, portfolio_id, person_id, role, person:people(*)")
    .eq("portfolio_id", portfolioId);
  throwIfError(error);
  return ((data ?? []) as Array<Omit<PortfolioMember, "person"> & { person: Person | Person[] | null }>)
    .flatMap((row) => {
      const person = asPerson(row.person);
      if (!person) return [];
      return [{ ...row, person }];
    });
}

export async function getAccessiblePortfolio(
  portfolioId: string,
  personId: string,
): Promise<PortfolioBundle | null> {
  try {
    const portfolio = await assertPortfolioAccess(portfolioId, personId);
    const items = await listPortfolioItems([portfolioId]);
    const projectIds = items.map((item) => item.project_id);
    const [tasks, phases, people, members] = await Promise.all([
      listTasksForProjects(projectIds),
      listPhasesForProjects(projectIds),
      listPeopleForProjects(projectIds),
      listPortfolioMembers(portfolioId),
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
      members,
    };
  } catch {
    return null;
  }
}

export async function getAccountProjectBundle(
  personId: string,
): Promise<AccountBundle> {
  const projects = await listProjectsForPerson(personId);
  const projectIds = projects.map((project) => project.id);
  const [tasks, phases, people] = await Promise.all([
    listTasksForProjects(projectIds),
    listPhasesForProjects(projectIds),
    listPeopleForProjects(projectIds),
  ]);
  const dependencies = await listDependenciesForTasks(tasks.map((task) => task.id));
  return {
    projects,
    colors: colorsForProjects(projects),
    phases,
    tasks,
    people,
    dependencies,
  };
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
  const portfolio = data as Portfolio;
  await grantPortfolioMembership(portfolio.id, personId, "Owner");
  return portfolio;
}

export async function updatePortfolioName(
  portfolioId: string,
  personId: string,
  name: string,
) {
  await assertPortfolioOwner(portfolioId, personId);
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Portfolio name is required.");
  const { error } = await admin()
    .from("portfolios")
    .update({ name: trimmed })
    .eq("id", portfolioId);
  throwIfError(error);
}

export async function addProjectToPortfolio(
  portfolioId: string,
  personId: string,
  projectId: string,
) {
  await assertPortfolioOwner(portfolioId, personId);
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
  await grantPortfolioProjectsToMembers(portfolioId, [projectId]);
}

export async function removeProjectFromPortfolio(
  portfolioId: string,
  personId: string,
  projectId: string,
) {
  await assertPortfolioOwner(portfolioId, personId);
  const { error } = await admin()
    .from("portfolio_projects")
    .delete()
    .eq("portfolio_id", portfolioId)
    .eq("project_id", projectId);
  throwIfError(error);
}

export async function grantPortfolioMembership(
  portfolioId: string,
  memberId: string,
  role = "Member",
) {
  const { error } = await admin()
    .from("portfolio_members")
    .upsert(
      { portfolio_id: portfolioId, person_id: memberId, role },
      { onConflict: "portfolio_id,person_id", ignoreDuplicates: true },
    );
  throwIfError(error);
}

async function grantPortfolioProjectsToMembers(
  portfolioId: string,
  projectIds?: string[],
) {
  const members = await listPortfolioMembers(portfolioId);
  const ids =
    projectIds ??
    (await listPortfolioItems([portfolioId])).map((item) => item.project_id);
  if (ids.length === 0 || members.length === 0) return;
  const rows = ids.flatMap((projectId) =>
    members.map((member) => ({
      project_id: projectId,
      person_id: member.person_id,
      role: member.role === "Owner" ? "Owner" : "Member",
    })),
  );
  const { error } = await admin()
    .from("project_members")
    .upsert(rows, { onConflict: "project_id,person_id", ignoreDuplicates: true });
  throwIfError(error);
}

export async function addPeopleToPortfolio(
  portfolioId: string,
  actorId: string,
  memberIds: string[],
) {
  await assertPortfolioOwner(portfolioId, actorId);
  const unique = uniqueIds(memberIds).filter((id) => id !== actorId);
  await assertPeopleOnOwnedTeams(actorId, unique);
  for (const memberId of unique) {
    await grantPortfolioMembership(portfolioId, memberId, "Member");
  }
  await grantPortfolioProjectsToMembers(portfolioId);
}

export async function addPeopleToProject(
  projectId: string,
  actorId: string,
  memberIds: string[],
) {
  await assertProjectOwner(projectId, actorId);
  const unique = uniqueIds(memberIds).filter((id) => id !== actorId);
  await assertPeopleOnOwnedTeams(actorId, unique);
  for (const memberId of unique) {
    await grantProjectMembership(projectId, memberId, "Member");
  }
}

export async function listOwnedProjects(personId: string) {
  const projects = await listProjectsForPerson(personId);
  return projects.filter(
    (project) =>
      project.owner_id === personId || project.created_by_id === personId,
  );
}

export async function listOwnedPortfolios(personId: string) {
  const portfolios = await listPortfoliosForPerson(personId);
  return portfolios.filter((portfolio) => portfolio.created_by_id === personId);
}

export async function listOwnedTeams(personId: string) {
  const { data, error } = await admin()
    .from("teams")
    .select("*")
    .eq("created_by_id", personId)
    .order("updated_at", { ascending: false });
  throwIfError(error);
  return (data ?? []) as Team[];
}

export async function listTeamMembers(teamIds: string[]) {
  if (teamIds.length === 0) return [] as TeamMember[];
  const { data, error } = await admin()
    .from("team_members")
    .select("id, team_id, person_id, role, person:people(*)")
    .in("team_id", teamIds);
  throwIfError(error);
  return ((data ?? []) as Array<Omit<TeamMember, "person"> & { person: Person | Person[] | null }>)
    .flatMap((row) => {
      const person = asPerson(row.person);
      if (!person) return [];
      return [{ ...row, person }];
    })
    .sort((a, b) => a.person.full_name.localeCompare(b.person.full_name));
}

export async function listTeamProjects(teamIds: string[]) {
  if (teamIds.length === 0) return [] as Array<{ team_id: string; project: Project }>;
  const { data, error } = await admin()
    .from("team_projects")
    .select("team_id, project:projects(*)")
    .in("team_id", teamIds);
  throwIfError(error);
  return ((data ?? []) as Array<{ team_id: string; project: Project | Project[] | null }>)
    .flatMap((row) => {
      const project = Array.isArray(row.project) ? row.project[0] : row.project;
      if (!project) return [];
      return [{ team_id: row.team_id, project }];
    });
}

export async function listTeamPortfolios(teamIds: string[]) {
  if (teamIds.length === 0) {
    return [] as Array<{ team_id: string; portfolio: Portfolio }>;
  }
  const { data, error } = await admin()
    .from("team_portfolios")
    .select("team_id, portfolio:portfolios(*)")
    .in("team_id", teamIds);
  throwIfError(error);
  return ((data ?? []) as Array<{
    team_id: string;
    portfolio: Portfolio | Portfolio[] | null;
  }>).flatMap((row) => {
    const portfolio = Array.isArray(row.portfolio) ? row.portfolio[0] : row.portfolio;
    if (!portfolio) return [];
    return [{ team_id: row.team_id, portfolio }];
  });
}

export async function getOwnedTeamBundle(
  teamId: string,
  personId: string,
): Promise<TeamBundle | null> {
  try {
    const team = await assertTeamOwner(teamId, personId);
    const [members, teamProjects, teamPortfolios] = await Promise.all([
      listTeamMembers([teamId]),
      listTeamProjects([teamId]),
      listTeamPortfolios([teamId]),
    ]);
    return {
      team,
      members,
      projects: teamProjects.map((row) => row.project),
      portfolios: teamPortfolios.map((row) => row.portfolio),
    };
  } catch {
    return null;
  }
}

export async function assertTeamOwner(teamId: string, personId: string) {
  const { data, error } = await admin()
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .eq("created_by_id", personId)
    .maybeSingle();
  throwIfError(error);
  if (!data) {
    throw new Error("You do not have access to this team.");
  }
  return data as Team;
}

export async function listOwnedTeamMemberPeople(personId: string) {
  const teams = await listOwnedTeams(personId);
  const members = await listTeamMembers(teams.map((team) => team.id));
  const byId = new Map<string, Person>();
  for (const member of members) {
    if (member.person_id === personId) continue;
    byId.set(member.person_id, member.person);
  }
  return [...byId.values()].sort((a, b) => a.full_name.localeCompare(b.full_name));
}

async function listOwnedTeamIds(personId: string) {
  const teams = await listOwnedTeams(personId);
  return teams.map((team) => team.id);
}

async function assertPeopleOnOwnedTeams(actorId: string, memberIds: string[]) {
  if (memberIds.length === 0) return;
  const teamIds = await listOwnedTeamIds(actorId);
  if (teamIds.length === 0) {
    throw new Error("Add people to one of your teams before granting access.");
  }
  const { data, error } = await admin()
    .from("team_members")
    .select("person_id")
    .in("team_id", teamIds)
    .in("person_id", memberIds);
  throwIfError(error);
  const allowed = new Set((data ?? []).map((row) => row.person_id as string));
  if (memberIds.some((id) => !allowed.has(id))) {
    throw new Error("You can only add people from your teams.");
  }
}

async function assertAccountPeople(memberIds: string[]) {
  if (memberIds.length === 0) return;
  const { data, error } = await admin()
    .from("accounts")
    .select("person_id")
    .in("person_id", memberIds);
  throwIfError(error);
  const allowed = new Set((data ?? []).map((row) => row.person_id as string));
  if (memberIds.some((id) => !allowed.has(id))) {
    throw new Error("You can only add existing users on the platform.");
  }
}

export async function createTeam(
  personId: string,
  name: string,
  memberIds: string[],
  projectIds: string[] = [],
  portfolioIds: string[] = [],
) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Team name is required.");
  const unique = uniqueIds(memberIds).filter((id) => id !== personId);
  await assertAccountPeople(unique);

  const { data, error } = await admin()
    .from("teams")
    .insert({ name: trimmed, created_by_id: personId })
    .select("*")
    .single();
  throwIfError(error);
  const team = data as Team;
  const rows = [
    { team_id: team.id, person_id: personId, role: "Owner" },
    ...unique.map((id) => ({ team_id: team.id, person_id: id, role: "Member" })),
  ];
  const { error: memberError } = await admin().from("team_members").insert(rows);
  throwIfError(memberError);
  if (projectIds.length > 0 || portfolioIds.length > 0) {
    await attachWorkToTeam(team.id, personId, projectIds, portfolioIds);
  }
  return team;
}

export async function addPeopleToTeam(
  teamId: string,
  actorId: string,
  memberIds: string[],
) {
  await assertTeamOwner(teamId, actorId);
  const unique = uniqueIds(memberIds).filter((id) => id !== actorId);
  await assertAccountPeople(unique);
  if (unique.length === 0) return;
  const { error } = await admin()
    .from("team_members")
    .upsert(
      unique.map((id) => ({ team_id: teamId, person_id: id, role: "Member" })),
      { onConflict: "team_id,person_id", ignoreDuplicates: true },
    );
  throwIfError(error);
}

export async function attachWorkToTeam(
  teamId: string,
  actorId: string,
  projectIds: string[],
  portfolioIds: string[],
) {
  await assertTeamOwner(teamId, actorId);
  const projects = uniqueIds(projectIds);
  const portfolios = uniqueIds(portfolioIds);
  if (projects.length === 0 && portfolios.length === 0) return;

  const ownedProjectIds = new Set(
    (await listOwnedProjects(actorId)).map((project) => project.id),
  );
  if (projects.some((id) => !ownedProjectIds.has(id))) {
    throw new Error("You can only add projects you own to a team.");
  }
  const ownedPortfolioIds = new Set(
    (await listOwnedPortfolios(actorId)).map((portfolio) => portfolio.id),
  );
  if (portfolios.some((id) => !ownedPortfolioIds.has(id))) {
    throw new Error("You can only add portfolios you own to a team.");
  }

  if (projects.length > 0) {
    const { error } = await admin()
      .from("team_projects")
      .upsert(
        projects.map((projectId) => ({ team_id: teamId, project_id: projectId })),
        { onConflict: "team_id,project_id", ignoreDuplicates: true },
      );
    throwIfError(error);
  }
  if (portfolios.length > 0) {
    const { error } = await admin()
      .from("team_portfolios")
      .upsert(
        portfolios.map((portfolioId) => ({
          team_id: teamId,
          portfolio_id: portfolioId,
        })),
        { onConflict: "team_id,portfolio_id", ignoreDuplicates: true },
      );
    throwIfError(error);
  }
}

export async function grantTeamAccess(
  teamId: string,
  actorId: string,
  input: {
    memberIds: string[];
    projectIds: string[];
    portfolioIds: string[];
  },
) {
  await assertTeamOwner(teamId, actorId);
  const memberIds = uniqueIds(input.memberIds);
  const projectIds = uniqueIds(input.projectIds);
  const portfolioIds = uniqueIds(input.portfolioIds);
  if (memberIds.length === 0) {
    throw new Error("Select at least one team member.");
  }
  if (projectIds.length === 0 && portfolioIds.length === 0) {
    throw new Error("Select a project or a portfolio from this team.");
  }

  const members = await listTeamMembers([teamId]);
  const onTeam = new Set(members.map((member) => member.person_id));
  if (memberIds.some((id) => !onTeam.has(id))) {
    throw new Error("You can only grant access to people on this team.");
  }

  const [teamProjects, teamPortfolios] = await Promise.all([
    listTeamProjects([teamId]),
    listTeamPortfolios([teamId]),
  ]);
  const teamProjectIds = new Set(teamProjects.map((row) => row.project.id));
  const teamPortfolioIds = new Set(teamPortfolios.map((row) => row.portfolio.id));
  if (projectIds.some((id) => !teamProjectIds.has(id))) {
    throw new Error("Add that project to this team first.");
  }
  if (portfolioIds.some((id) => !teamPortfolioIds.has(id))) {
    throw new Error("Add that portfolio to this team first.");
  }

  for (const projectId of projectIds) {
    for (const memberId of memberIds) {
      await grantProjectMembership(projectId, memberId, "Member");
    }
  }
  for (const portfolioId of portfolioIds) {
    for (const memberId of memberIds) {
      await grantPortfolioMembership(portfolioId, memberId, "Member");
    }
    await grantPortfolioProjectsToMembers(portfolioId);
  }
}

export async function listMembershipPairs(
  personIds: string[],
  projectIds: string[],
  portfolioIds: string[],
) {
  const db = admin();
  const [projectRows, portfolioRows] = await Promise.all([
    projectIds.length === 0
      ? Promise.resolve({ data: [], error: null })
      : db
          .from("project_members")
          .select("project_id, person_id")
          .in("project_id", projectIds)
          .in("person_id", personIds),
    portfolioIds.length === 0
      ? Promise.resolve({ data: [], error: null })
      : db
          .from("portfolio_members")
          .select("portfolio_id, person_id")
          .in("portfolio_id", portfolioIds)
          .in("person_id", personIds),
  ]);
  throwIfError(projectRows.error);
  throwIfError(portfolioRows.error);
  return {
    projects: (projectRows.data ?? []) as Array<{
      project_id: string;
      person_id: string;
    }>,
    portfolios: (portfolioRows.data ?? []) as Array<{
      portfolio_id: string;
      person_id: string;
    }>,
  };
}
