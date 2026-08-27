import "server-only";

import { createAdminClient } from "./supabase/admin";
import type {
  AccessRole,
  AccountBundle,
  PasswordReset,
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
  TaskAssignee,
  TaskDependency,
  Team,
  TeamBundle,
  TeamMember,
} from "./types";
import { TASK_STATUS_LABEL } from "./types";
import { writeAuditEvent, listAuditEvents } from "./audit-store";
import { sendAddedToWorkEmail, sendRoleChangedEmail } from "./mail";
import { joinName, splitName } from "./names";
import { colorsForProjects, nextPortfolioColor } from "./portfolio-colors";

const admin = () => createAdminClient();

function throwIfError(error: { message: string } | null) {
  if (error) {
    throw new Error(error.message);
  }
}

/**
 * The caller is not allowed to see this record. Distinct from a database or
 * network failure so callers can render "not found" for the former without
 * hiding the latter behind the same blank 404.
 */
export class AccessDeniedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AccessDeniedError";
  }
}

function asPerson(value: Person | Person[] | null | undefined): Person | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function uniqueIds(ids: Array<string | null | undefined>) {
  return [...new Set(ids.filter((id): id is string => Boolean(id)))];
}

function normalizeAccessRole(value: unknown): AccessRole {
  return value === "admin" ? "admin" : "view";
}

function maxAccessRole(
  a: AccessRole | null,
  b: AccessRole | null,
): AccessRole | null {
  if (a === "admin" || b === "admin") return "admin";
  if (a === "view" || b === "view") return "view";
  return null;
}

async function getWorkName(kind: "project" | "portfolio", id: string) {
  if (kind === "project") {
    const { data, error } = await admin()
      .from("projects")
      .select("name")
      .eq("id", id)
      .maybeSingle();
    throwIfError(error);
    return (data?.name as string | undefined) ?? "a project";
  }
  const { data, error } = await admin()
    .from("portfolios")
    .select("name")
    .eq("id", id)
    .maybeSingle();
  throwIfError(error);
  return (data?.name as string | undefined) ?? "a portfolio";
}

async function notifyAddedToWork(input: {
  actorId: string;
  recipients: Array<{ email?: string | null; firstName?: string | null; id?: string | null }>;
  kind: "project" | "portfolio";
  workId: string;
  workName?: string;
}) {
  const actor = await getPersonById(input.actorId);
  const inviterName = actor?.full_name?.trim() || "A teammate";
  const actorEmail = actor?.email?.trim().toLowerCase();
  const workName = input.workName ?? (await getWorkName(input.kind, input.workId));
  const seen = new Set<string>();

  await Promise.all(
    input.recipients.map((recipient) => {
      const email = recipient.email?.trim().toLowerCase() ?? "";
      if (!email || email === actorEmail || seen.has(email)) return;
      if (recipient.id && recipient.id === input.actorId) return;
      seen.add(email);
      return sendAddedToWorkEmail({
        to: email,
        recipientFirstName: recipient.firstName?.trim() || "there",
        inviterName,
        workKind: input.kind,
        workName,
        workId: input.workId,
      });
    }),
  );
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
    email?: string;
  },
) {
  const patch: {
    first_name: string;
    last_name: string;
    industry: string;
    country: string;
    email?: string;
  } = {
    first_name: input.firstName.trim(),
    last_name: input.lastName.trim(),
    industry: input.industry,
    country: input.country,
  };
  if (input.email) {
    const email = input.email.trim().toLowerCase();
    const existing = await getPersonByEmail(email);
    if (existing && existing.id !== personId) {
      throw new Error("That email is already in use.");
    }
    patch.email = email;
  }
  const { data, error } = await admin()
    .from("people")
    .update(patch)
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

export async function updatePasswordHash(personId: string, passwordHash: string) {
  const { error } = await admin()
    .from("accounts")
    .update({ password_hash: passwordHash })
    .eq("person_id", personId);
  throwIfError(error);
}

export async function createPasswordReset(input: {
  personId: string;
  tokenHash: string;
  expiresAt: string;
}) {
  const db = admin();
  // A fresh request retires the older links so only the newest email works.
  const { error: clearError } = await db
    .from("password_resets")
    .update({ used_at: new Date().toISOString() })
    .eq("person_id", input.personId)
    .is("used_at", null);
  throwIfError(clearError);

  const { error } = await db.from("password_resets").insert({
    person_id: input.personId,
    token_hash: input.tokenHash,
    expires_at: input.expiresAt,
  });
  throwIfError(error);
}

export async function getPasswordResetByTokenHash(tokenHash: string) {
  const { data, error } = await admin()
    .from("password_resets")
    .select("id, person_id, expires_at, used_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();
  throwIfError(error);
  return data as PasswordReset | null;
}

export async function consumePasswordReset(input: {
  tokenHash: string;
  passwordHash: string;
}) {
  const reset = await getPasswordResetByTokenHash(input.tokenHash);
  if (!reset || reset.used_at || new Date(reset.expires_at) <= new Date()) {
    return { ok: false as const };
  }

  // Claiming the row before touching the password means a double submit cannot
  // spend the same link twice.
  const { data: claimed, error: claimError } = await admin()
    .from("password_resets")
    .update({ used_at: new Date().toISOString() })
    .eq("id", reset.id)
    .is("used_at", null)
    .select("id")
    .maybeSingle();
  throwIfError(claimError);
  if (!claimed) return { ok: false as const };

  await updatePasswordHash(reset.person_id, input.passwordHash);
  return { ok: true as const, personId: reset.person_id };
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
    throw new AccessDeniedError("You do not have access to this project.");
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
    throw new AccessDeniedError("You do not have access to this project.");
  }
  if (data.owner_id !== personId && data.created_by_id !== personId) {
    throw new Error("Only the project owner can add members.");
  }
  await assertProjectAccess(projectId, personId);
  return data as Pick<Project, "id" | "owner_id" | "created_by_id">;
}

/**
 * Effective role on a project: the strongest of the direct membership and any
 * portfolio that contains it. Owners and creators are always admins.
 * Returns null when the person has no access at all.
 */
export async function getProjectAccessRole(
  projectId: string,
  personId: string,
): Promise<AccessRole | null> {
  const db = admin();
  const { data: project, error: projectError } = await db
    .from("projects")
    .select("owner_id, created_by_id")
    .eq("id", projectId)
    .maybeSingle();
  throwIfError(projectError);
  if (!project) return null;
  if (project.owner_id === personId || project.created_by_id === personId) {
    return "admin";
  }

  const [{ data: direct, error: directError }, portfolioIds] = await Promise.all([
    db
      .from("project_members")
      .select("access_role")
      .eq("project_id", projectId)
      .eq("person_id", personId)
      .maybeSingle(),
    listAccessiblePortfolioIds(personId),
  ]);
  throwIfError(directError);

  let role: AccessRole | null = direct
    ? normalizeAccessRole(direct.access_role)
    : null;

  if (portfolioIds.length > 0) {
    const { data: containers, error: containerError } = await db
      .from("portfolio_projects")
      .select("portfolio_id")
      .eq("project_id", projectId)
      .in("portfolio_id", portfolioIds);
    throwIfError(containerError);
    const ids = uniqueIds((containers ?? []).map((row) => row.portfolio_id as string));
    if (ids.length > 0) {
      const [{ data: owned, error: ownedError }, { data: memberships, error: memberError }] =
        await Promise.all([
          db.from("portfolios").select("id").in("id", ids).eq("created_by_id", personId),
          db
            .from("portfolio_members")
            .select("access_role")
            .in("portfolio_id", ids)
            .eq("person_id", personId),
        ]);
      throwIfError(ownedError);
      throwIfError(memberError);
      if ((owned ?? []).length > 0) return "admin";
      for (const row of memberships ?? []) {
        role = maxAccessRole(role, normalizeAccessRole(row.access_role));
      }
    }
  }

  return role;
}

export async function getPortfolioAccessRole(
  portfolioId: string,
  personId: string,
): Promise<AccessRole | null> {
  const db = admin();
  const { data: portfolio, error } = await db
    .from("portfolios")
    .select("created_by_id")
    .eq("id", portfolioId)
    .maybeSingle();
  throwIfError(error);
  if (!portfolio) return null;
  if (portfolio.created_by_id === personId) return "admin";

  const { data, error: memberError } = await db
    .from("portfolio_members")
    .select("access_role")
    .eq("portfolio_id", portfolioId)
    .eq("person_id", personId)
    .maybeSingle();
  throwIfError(memberError);
  return data ? normalizeAccessRole(data.access_role) : null;
}

export async function assertProjectEditor(projectId: string, personId: string) {
  const role = await getProjectAccessRole(projectId, personId);
  if (!role) {
    throw new AccessDeniedError("You do not have access to this project.");
  }
  if (role !== "admin") {
    throw new Error(
      "Your role on this project is view only. Ask a team owner for admin access.",
    );
  }
}

export async function assertPortfolioEditor(portfolioId: string, personId: string) {
  const role = await getPortfolioAccessRole(portfolioId, personId);
  if (!role) {
    throw new AccessDeniedError("You do not have access to this portfolio.");
  }
  if (role !== "admin") {
    throw new Error(
      "Your role on this portfolio is view only. Ask a team owner for admin access.",
    );
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
      .select("id, project_id, person_id, role, access_role, person:people(*)")
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
  const assignees = await listAssigneesForTasks(taskIds);

  const members = ((memberRows ?? []) as Array<
    Omit<ProjectMember, "person"> & { person: Person | Person[] }
  >).map((row) => ({
    ...row,
    access_role: normalizeAccessRole(row.access_role),
    person: Array.isArray(row.person) ? row.person[0] : row.person,
  }));

  return {
    project: project as Project,
    owner: (owner as Person | null) ?? null,
    members,
    phases: (phases ?? []) as Phase[],
    tasks: taskList,
    assignees,
    dependencies: projectDeps,
  };
}

export async function getAccessibleProject(projectId: string, personId: string) {
  try {
    return await getProjectBundle(projectId, personId);
  } catch (error) {
    if (error instanceof AccessDeniedError) return null;
    throw error;
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

/** Assignable people keyed by project, since a task can only go to its own members. */
export async function listMembersByProject(projectIds: string[]) {
  const rows = await listMembersForProjects(projectIds);
  const byProject: Record<string, Person[]> = {};
  for (const row of rows) {
    const list = byProject[row.project_id] ?? [];
    list.push(row.person);
    byProject[row.project_id] = list;
  }
  for (const list of Object.values(byProject)) {
    list.sort((a, b) => a.full_name.localeCompare(b.full_name));
  }
  return byProject;
}

export async function listAssigneesForTasks(taskIds: string[]) {
  if (taskIds.length === 0) return [] as TaskAssignee[];
  const { data, error } = await admin()
    .from("task_assignees")
    .select("id, task_id, person_id, created_at")
    .in("task_id", taskIds)
    .order("created_at", { ascending: true });
  throwIfError(error);
  return (data ?? []) as TaskAssignee[];
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
  const projectId = data as string;
  await writeAuditEvent({
    actorId: input.createdById,
    kind: "change",
    action: "project.created",
    summary: `Created project "${input.name}"`,
    projectId,
  });
  await notifyAddedToWork({
    actorId: input.createdById,
    kind: "project",
    workId: projectId,
    workName: input.name,
    recipients: members
      .filter(
        (member) =>
          member.email.trim().toLowerCase() !==
          input.createdByEmail.trim().toLowerCase(),
      )
      .map((member) => ({
        email: member.email,
        firstName: member.firstName,
      })),
  });
  return projectId;
}

export async function commitPlan(payload: unknown) {
  const { data, error } = await admin().rpc("commit_project_plan", { payload });
  throwIfError(error);
  const projectId = data as string;
  const name =
    payload &&
    typeof payload === "object" &&
    "project" in payload &&
    payload.project &&
    typeof payload.project === "object" &&
    "name" in payload.project
      ? String(payload.project.name)
      : "a project";
  const createdById =
    payload && typeof payload === "object" && "created_by_id" in payload
      ? String(payload.created_by_id)
      : null;
  const ownerEmail =
    payload &&
    typeof payload === "object" &&
    "project" in payload &&
    payload.project &&
    typeof payload.project === "object" &&
    "owner_email" in payload.project
      ? String(payload.project.owner_email).trim().toLowerCase()
      : "";
  if (createdById) {
    await writeAuditEvent({
      actorId: createdById,
      kind: "change",
      action: "project.created",
      summary: `Created project "${name}"`,
      projectId,
    });
    const members =
      payload && typeof payload === "object" && "members" in payload
        ? payload.members
        : [];
    if (Array.isArray(members)) {
      await notifyAddedToWork({
        actorId: createdById,
        kind: "project",
        workId: projectId,
        workName: name,
        recipients: members.flatMap((member) => {
          if (!member || typeof member !== "object") return [];
          const email =
            "email" in member ? String(member.email).trim().toLowerCase() : "";
          if (!email || (ownerEmail && email === ownerEmail)) return [];
          const firstName =
            "first_name" in member && String(member.first_name).trim()
              ? String(member.first_name).trim()
              : splitName(
                  "full_name" in member ? String(member.full_name) : "",
                ).firstName;
          return [{ email, firstName }];
        }),
      });
    }
  }
  return projectId;
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
  await assertProjectEditor(projectId, personId);
  const person = await upsertPerson({
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
    role: member.role,
    capacityHoursPerWeek: member.capacityHoursPerWeek,
  });
  const existing = await listMembershipPairs([person.id], [projectId], []);
  const alreadyOnProject = existing.projects.length > 0;
  await grantProjectMembership(projectId, person.id, member.role ?? "Member");
  await writeAuditEvent({
    actorId: personId,
    kind: "change",
    action: "member.added",
    summary: `Added ${person.full_name} to the project`,
    projectId,
    targetType: "person",
    targetId: person.id,
  });
  if (!alreadyOnProject) {
    await notifyAddedToWork({
      actorId: personId,
      kind: "project",
      workId: projectId,
      recipients: [
        {
          id: person.id,
          email: person.email,
          firstName: person.first_name,
        },
      ],
    });
  }
  return person;
}

export async function grantProjectMembership(
  projectId: string,
  memberId: string,
  role = "Member",
  accessRole: AccessRole = "view",
) {
  const { error } = await admin()
    .from("project_members")
    .upsert(
      { project_id: projectId, person_id: memberId, role, access_role: accessRole },
      { onConflict: "project_id,person_id", ignoreDuplicates: true },
    );
  throwIfError(error);
}

/** Nobody can be made responsible for work they cannot even open. */
async function assertProjectMembers(projectId: string, personIds: string[]) {
  if (personIds.length === 0) return;
  const { data, error } = await admin()
    .from("project_members")
    .select("person_id")
    .eq("project_id", projectId)
    .in("person_id", personIds);
  throwIfError(error);
  const allowed = new Set((data ?? []).map((row) => row.person_id as string));
  if (personIds.some((id) => !allowed.has(id))) {
    throw new Error("You can only assign people who are already on this project.");
  }
}

async function listPeopleByIds(ids: string[]) {
  if (ids.length === 0) return [] as Person[];
  const { data, error } = await admin().from("people").select("*").in("id", ids);
  throwIfError(error);
  return (data ?? []) as Person[];
}

export async function addTask(
  projectId: string,
  personId: string,
  input: {
    title: string;
    description?: string;
    phaseId?: string | null;
    ownerId?: string | null;
    assigneeIds?: string[];
    status?: Task["status"];
    priority?: Task["priority"];
    estimateHours?: number | null;
    startDate?: string | null;
    dueDate?: string | null;
  },
) {
  await assertProjectEditor(projectId, personId);
  const assigneeIds = uniqueIds([
    ...(input.assigneeIds ?? []),
    ...(input.ownerId ? [input.ownerId] : []),
  ]);
  await assertProjectMembers(projectId, assigneeIds);

  const { data, error } = await admin()
    .from("tasks")
    .insert({
      project_id: projectId,
      title: input.title,
      description: input.description ?? null,
      phase_id: input.phaseId || null,
      owner_id: assigneeIds[0] ?? null,
      status: input.status ?? "todo",
      priority: input.priority ?? "medium",
      estimate_hours: input.estimateHours ?? null,
      start_date: input.startDate || null,
      due_date: input.dueDate || null,
    })
    .select("*")
    .single();
  throwIfError(error);
  const task = data as Task;

  // The insert trigger already recorded the first assignee from owner_id.
  if (assigneeIds.length > 1) {
    const { error: assigneeError } = await admin()
      .from("task_assignees")
      .upsert(
        assigneeIds.slice(1).map((id) => ({ task_id: task.id, person_id: id })),
        { onConflict: "task_id,person_id", ignoreDuplicates: true },
      );
    throwIfError(assigneeError);
  }

  await writeAuditEvent({
    actorId: personId,
    kind: "change",
    action: "task.created",
    summary: `Created task "${task.title}"`,
    projectId,
    targetType: "task",
    targetId: task.id,
  });
  return task;
}

/**
 * Replaces the whole assignee list for a task. Everyone named has to already be
 * on the project. A database trigger keeps tasks.owner_id pointing at whoever
 * was added first.
 */
export async function setTaskAssignees(
  projectId: string,
  personId: string,
  taskId: string,
  assigneeIds: string[],
) {
  await assertProjectEditor(projectId, personId);
  const wanted = uniqueIds(assigneeIds);
  await assertProjectMembers(projectId, wanted);

  const db = admin();
  const { data: task, error: taskError } = await db
    .from("tasks")
    .select("id, title")
    .eq("id", taskId)
    .eq("project_id", projectId)
    .maybeSingle();
  throwIfError(taskError);
  if (!task) throw new Error("That task is not on this project.");

  const { data: current, error: currentError } = await db
    .from("task_assignees")
    .select("person_id")
    .eq("task_id", taskId);
  throwIfError(currentError);

  const before = new Set((current ?? []).map((row) => row.person_id as string));
  const after = new Set(wanted);
  const added = wanted.filter((id) => !before.has(id));
  const removed = [...before].filter((id) => !after.has(id));
  if (added.length === 0 && removed.length === 0) return;

  if (removed.length > 0) {
    const { error } = await db
      .from("task_assignees")
      .delete()
      .eq("task_id", taskId)
      .in("person_id", removed);
    throwIfError(error);
  }
  if (added.length > 0) {
    const { error } = await db
      .from("task_assignees")
      .upsert(
        added.map((id) => ({ task_id: taskId, person_id: id })),
        { onConflict: "task_id,person_id", ignoreDuplicates: true },
      );
    throwIfError(error);
  }

  const people = await listPeopleByIds(wanted);
  const names = wanted
    .map((id) => people.find((person) => person.id === id)?.full_name)
    .filter((name): name is string => Boolean(name));
  const title = task.title as string;

  await writeAuditEvent({
    actorId: personId,
    kind: "change",
    action: "task.assigned",
    summary:
      names.length > 0
        ? `Assigned "${title}" to ${names.join(", ")}`
        : `Unassigned "${title}"`,
    projectId,
    targetType: "task",
    targetId: taskId,
    metadata: { assignee_ids: wanted },
  });
}

export async function updateProjectName(
  projectId: string,
  personId: string,
  name: string,
) {
  await assertProjectEditor(projectId, personId);
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Project name is required.");
  const { error } = await admin()
    .from("projects")
    .update({ name: trimmed })
    .eq("id", projectId);
  throwIfError(error);
  await writeAuditEvent({
    actorId: personId,
    kind: "change",
    action: "project.renamed",
    summary: `Renamed the project to "${trimmed}"`,
    projectId,
  });
}

export async function updateTaskStatus(
  projectId: string,
  personId: string,
  taskId: string,
  status: Task["status"],
) {
  await assertProjectEditor(projectId, personId);
  const current = await admin()
    .from("tasks")
    .select("title, status")
    .eq("id", taskId)
    .eq("project_id", projectId)
    .maybeSingle();
  const { error } = await admin()
    .from("tasks")
    .update({ status })
    .eq("id", taskId)
    .eq("project_id", projectId);
  throwIfError(error);
  const title = current.data?.title ?? "a task";
  const from = current.data?.status
    ? TASK_STATUS_LABEL[current.data.status as Task["status"]]
    : null;
  await writeAuditEvent({
    actorId: personId,
    kind: "change",
    action: "task.status",
    summary: from
      ? `Moved "${title}" from ${from} to ${TASK_STATUS_LABEL[status]}`
      : `Moved "${title}" to ${TASK_STATUS_LABEL[status]}`,
    projectId,
    targetType: "task",
    targetId: taskId,
    metadata: { status },
  });
}

export async function updateTask(
  projectId: string,
  personId: string,
  taskId: string,
  // Assignment deliberately lives in setTaskAssignees so owner_id can never
  // drift away from the task_assignees rows behind it.
  patch: Partial<{
    title: string;
    status: Task["status"];
    start_date: string | null;
    due_date: string | null;
    phase_id: string | null;
    estimate_hours: number | null;
    priority: Task["priority"];
  }>,
) {
  await assertProjectEditor(projectId, personId);
  const current = await admin()
    .from("tasks")
    .select("title, status")
    .eq("id", taskId)
    .eq("project_id", projectId)
    .maybeSingle();
  const { error } = await admin()
    .from("tasks")
    .update(patch)
    .eq("id", taskId)
    .eq("project_id", projectId);
  throwIfError(error);
  const title = patch.title?.trim() || current.data?.title || "a task";
  let summary = `Updated "${title}"`;
  if (patch.status) {
    summary = `Moved "${title}" to ${TASK_STATUS_LABEL[patch.status]}`;
  } else if (patch.due_date !== undefined || patch.start_date !== undefined) {
    summary = `Rescheduled "${title}"`;
  } else if (patch.title) {
    summary = `Renamed a task to "${title}"`;
  }
  await writeAuditEvent({
    actorId: personId,
    kind: "change",
    action: "task.updated",
    summary,
    projectId,
    targetType: "task",
    targetId: taskId,
    metadata: patch,
  });
}

export async function addPhase(
  projectId: string,
  personId: string,
  input: { name: string; startDate?: string; endDate?: string },
) {
  await assertProjectEditor(projectId, personId);
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
  const phase = data as Phase;
  await writeAuditEvent({
    actorId: personId,
    kind: "change",
    action: "phase.created",
    summary: `Added phase "${phase.name}"`,
    projectId,
    targetType: "phase",
    targetId: phase.id,
  });
  return phase;
}

export async function saveStatusReport(input: {
  projectId: string;
  personId: string;
  generatedBody: string;
  body: string;
  snapshot: unknown;
  asOf: string;
}) {
  await assertProjectEditor(input.projectId, input.personId);
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
  await writeAuditEvent({
    actorId: input.personId,
    kind: "change",
    action: "status.saved",
    summary: `Saved a weekly status update`,
    projectId: input.projectId,
  });
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
    throw new AccessDeniedError("You do not have access to this portfolio.");
  }
  const { data, error } = await admin()
    .from("portfolios")
    .select("*")
    .eq("id", portfolioId)
    .maybeSingle();
  throwIfError(error);
  if (!data) {
    throw new AccessDeniedError("You do not have access to this portfolio.");
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
    .select("id, portfolio_id, person_id, role, access_role, person:people(*)")
    .eq("portfolio_id", portfolioId);
  throwIfError(error);
  return ((data ?? []) as Array<Omit<PortfolioMember, "person"> & { person: Person | Person[] | null }>)
    .flatMap((row) => {
      const person = asPerson(row.person);
      if (!person) return [];
      return [{ ...row, access_role: normalizeAccessRole(row.access_role), person }];
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
    const [tasks, phases, people, membersByProject, members] = await Promise.all([
      listTasksForProjects(projectIds),
      listPhasesForProjects(projectIds),
      listPeopleForProjects(projectIds),
      listMembersByProject(projectIds),
      listPortfolioMembers(portfolioId),
    ]);
    const taskIds = tasks.map((task) => task.id);
    const [dependencies, assignees] = await Promise.all([
      listDependenciesForTasks(taskIds),
      listAssigneesForTasks(taskIds),
    ]);
    return {
      portfolio,
      items,
      projects: items.map((item) => item.project),
      phases,
      tasks,
      assignees,
      people,
      membersByProject,
      dependencies,
      members,
    };
  } catch (error) {
    if (error instanceof AccessDeniedError) return null;
    throw error;
  }
}

export async function getAccountProjectBundle(
  personId: string,
): Promise<AccountBundle> {
  const projects = await listProjectsForPerson(personId);
  const projectIds = projects.map((project) => project.id);
  const [tasks, phases, people, membersByProject] = await Promise.all([
    listTasksForProjects(projectIds),
    listPhasesForProjects(projectIds),
    listPeopleForProjects(projectIds),
    listMembersByProject(projectIds),
  ]);
  const taskIds = tasks.map((task) => task.id);
  const [dependencies, assignees] = await Promise.all([
    listDependenciesForTasks(taskIds),
    listAssigneesForTasks(taskIds),
  ]);
  return {
    projects,
    colors: colorsForProjects(projects),
    phases,
    tasks,
    assignees,
    people,
    membersByProject,
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
  await grantPortfolioMembership(portfolio.id, personId, "Owner", "admin");
  await writeAuditEvent({
    actorId: personId,
    kind: "change",
    action: "portfolio.created",
    summary: `Created portfolio "${portfolio.name}"`,
    portfolioId: portfolio.id,
  });
  return portfolio;
}

export async function updatePortfolioName(
  portfolioId: string,
  personId: string,
  name: string,
) {
  await assertPortfolioEditor(portfolioId, personId);
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Portfolio name is required.");
  const { error } = await admin()
    .from("portfolios")
    .update({ name: trimmed })
    .eq("id", portfolioId);
  throwIfError(error);
  await writeAuditEvent({
    actorId: personId,
    kind: "change",
    action: "portfolio.renamed",
    summary: `Renamed the portfolio to "${trimmed}"`,
    portfolioId,
  });
}

export async function addProjectToPortfolio(
  portfolioId: string,
  personId: string,
  projectId: string,
) {
  await assertPortfolioEditor(portfolioId, personId);
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
  const project = await admin()
    .from("projects")
    .select("name")
    .eq("id", projectId)
    .maybeSingle();
  await writeAuditEvent({
    actorId: personId,
    kind: "change",
    action: "portfolio.project_added",
    summary: `Added ${project.data?.name ?? "a project"} to the portfolio`,
    portfolioId,
    projectId,
    targetType: "project",
    targetId: projectId,
  });
}

export async function removeProjectFromPortfolio(
  portfolioId: string,
  personId: string,
  projectId: string,
) {
  await assertPortfolioEditor(portfolioId, personId);
  const project = await admin()
    .from("projects")
    .select("name")
    .eq("id", projectId)
    .maybeSingle();
  const { error } = await admin()
    .from("portfolio_projects")
    .delete()
    .eq("portfolio_id", portfolioId)
    .eq("project_id", projectId);
  throwIfError(error);
  await writeAuditEvent({
    actorId: personId,
    kind: "change",
    action: "portfolio.project_removed",
    summary: `Removed ${project.data?.name ?? "a project"} from the portfolio`,
    portfolioId,
    projectId,
    targetType: "project",
    targetId: projectId,
  });
}

export async function grantPortfolioMembership(
  portfolioId: string,
  memberId: string,
  role = "Member",
  accessRole: AccessRole = "view",
) {
  const { error } = await admin()
    .from("portfolio_members")
    .upsert(
      { portfolio_id: portfolioId, person_id: memberId, role, access_role: accessRole },
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
      access_role: normalizeAccessRole(member.access_role),
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
  const existing = await listMembershipPairs(unique, [], [portfolioId]);
  const already = new Set(existing.portfolios.map((row) => row.person_id));
  const newcomers: Person[] = [];
  for (const memberId of unique) {
    await grantPortfolioMembership(portfolioId, memberId, "Member");
    const person = await getPersonById(memberId);
    await writeAuditEvent({
      actorId,
      kind: "change",
      action: "member.added",
      summary: `Added ${person?.full_name ?? "a teammate"} to the portfolio`,
      portfolioId,
      targetType: "person",
      targetId: memberId,
    });
    if (person && !already.has(memberId)) newcomers.push(person);
  }
  await grantPortfolioProjectsToMembers(portfolioId);
  await notifyAddedToWork({
    actorId,
    kind: "portfolio",
    workId: portfolioId,
    recipients: newcomers.map((person) => ({
      id: person.id,
      email: person.email,
      firstName: person.first_name,
    })),
  });
}

export async function addPeopleToProject(
  projectId: string,
  actorId: string,
  memberIds: string[],
) {
  await assertProjectOwner(projectId, actorId);
  const unique = uniqueIds(memberIds).filter((id) => id !== actorId);
  await assertPeopleOnOwnedTeams(actorId, unique);
  const existing = await listMembershipPairs(unique, [projectId], []);
  const already = new Set(existing.projects.map((row) => row.person_id));
  const newcomers: Person[] = [];
  for (const memberId of unique) {
    await grantProjectMembership(projectId, memberId, "Member");
    const person = await getPersonById(memberId);
    await writeAuditEvent({
      actorId,
      kind: "change",
      action: "member.added",
      summary: `Added ${person?.full_name ?? "a teammate"} to the project`,
      projectId,
      targetType: "person",
      targetId: memberId,
    });
    if (person && !already.has(memberId)) newcomers.push(person);
  }
  await notifyAddedToWork({
    actorId,
    kind: "project",
    workId: projectId,
    recipients: newcomers.map((person) => ({
      id: person.id,
      email: person.email,
      firstName: person.first_name,
    })),
  });
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
    .select("id, team_id, person_id, role, access_role, person:people(*)")
    .in("team_id", teamIds);
  throwIfError(error);
  return ((data ?? []) as Array<Omit<TeamMember, "person"> & { person: Person | Person[] | null }>)
    .flatMap((row) => {
      const person = asPerson(row.person);
      if (!person) return [];
      return [{ ...row, access_role: normalizeAccessRole(row.access_role), person }];
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
    await grantAttachedWorkToMembers(teamId);
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
  } catch (error) {
    if (error instanceof AccessDeniedError) return null;
    throw error;
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
    throw new AccessDeniedError("You do not have access to this team.");
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

async function grantAttachedWorkToMembers(
  teamId: string,
  memberIds?: string[],
  actorId?: string,
) {
  const [members, teamProjects, teamPortfolios] = await Promise.all([
    listTeamMembers([teamId]),
    listTeamProjects([teamId]),
    listTeamPortfolios([teamId]),
  ]);
  const onTeam = new Set(members.map((member) => member.person_id));
  const people = uniqueIds(memberIds ?? [...onTeam]).filter((id) => onTeam.has(id));
  if (people.length === 0) return;
  const teamRoleByPerson = new Map(
    members.map((member) => [
      member.person_id,
      normalizeAccessRole(member.access_role),
    ]),
  );

  const projectIds = teamProjects.map((row) => row.project.id);
  const portfolioIds = teamPortfolios.map((row) => row.portfolio.id);
  const existing = actorId
    ? await listMembershipPairs(people, projectIds, portfolioIds)
    : { projects: [], portfolios: [] };
  const hadProject = new Set(
    existing.projects.map((row) => `${row.person_id}:${row.project_id}`),
  );
  const hadPortfolio = new Set(
    existing.portfolios.map((row) => `${row.person_id}:${row.portfolio_id}`),
  );

  const projectRows = teamProjects.flatMap((row) =>
    people.map((personId) => ({
      project_id: row.project.id,
      person_id: personId,
      role: "Member",
      access_role: teamRoleByPerson.get(personId) ?? "view",
    })),
  );
  if (projectRows.length > 0) {
    const { error } = await admin()
      .from("project_members")
      .upsert(projectRows, {
        onConflict: "project_id,person_id",
        ignoreDuplicates: true,
      });
    throwIfError(error);
  }

  const portfolioRows = teamPortfolios.flatMap((row) =>
    people.map((personId) => ({
      portfolio_id: row.portfolio.id,
      person_id: personId,
      role: "Member",
      access_role: teamRoleByPerson.get(personId) ?? "view",
    })),
  );
  if (portfolioRows.length > 0) {
    const { error } = await admin()
      .from("portfolio_members")
      .upsert(portfolioRows, {
        onConflict: "portfolio_id,person_id",
        ignoreDuplicates: true,
      });
    throwIfError(error);
    for (const row of teamPortfolios) {
      await grantPortfolioProjectsToMembers(row.portfolio.id);
    }
  }

  if (!actorId) return;

  const personById = new Map(members.map((member) => [member.person_id, member.person]));
  await Promise.all([
    ...teamProjects.flatMap((row) => {
      const recipients = people
        .filter(
          (personId) =>
            personId !== actorId &&
            !hadProject.has(`${personId}:${row.project.id}`),
        )
        .map((personId) => personById.get(personId))
        .filter((person): person is Person => Boolean(person));
      if (recipients.length === 0) return [];
      return [
        notifyAddedToWork({
          actorId,
          kind: "project",
          workId: row.project.id,
          workName: row.project.name,
          recipients: recipients.map((person) => ({
            id: person.id,
            email: person.email,
            firstName: person.first_name,
          })),
        }),
      ];
    }),
    ...teamPortfolios.flatMap((row) => {
      const recipients = people
        .filter(
          (personId) =>
            personId !== actorId &&
            !hadPortfolio.has(`${personId}:${row.portfolio.id}`),
        )
        .map((personId) => personById.get(personId))
        .filter((person): person is Person => Boolean(person));
      if (recipients.length === 0) return [];
      return [
        notifyAddedToWork({
          actorId,
          kind: "portfolio",
          workId: row.portfolio.id,
          workName: row.portfolio.name,
          recipients: recipients.map((person) => ({
            id: person.id,
            email: person.email,
            firstName: person.first_name,
          })),
        }),
      ];
    }),
  ]);
}

async function workGrantedByTeams(teamIds: string[]) {
  if (teamIds.length === 0) {
    return { projectIds: [] as string[], portfolioIds: [] as string[] };
  }
  const [teamProjects, teamPortfolios] = await Promise.all([
    listTeamProjects(teamIds),
    listTeamPortfolios(teamIds),
  ]);
  const portfolioIds = uniqueIds(
    teamPortfolios.map((row) => row.portfolio.id),
  );
  const items = await listPortfolioItems(portfolioIds);
  return {
    projectIds: uniqueIds([
      ...teamProjects.map((row) => row.project.id),
      ...items.map((item) => item.project_id),
    ]),
    portfolioIds,
  };
}

async function otherTeamIdsForPerson(personId: string, exceptTeamId: string) {
  const { data, error } = await admin()
    .from("team_members")
    .select("team_id")
    .eq("person_id", personId)
    .neq("team_id", exceptTeamId);
  throwIfError(error);
  return (data ?? []).map((row) => row.team_id as string);
}

async function revokeTeamWorkFromPeople(teamId: string, personIds: string[]) {
  const unique = uniqueIds(personIds);
  const revoked: Array<{
    personId: string;
    projectIds: string[];
    portfolioIds: string[];
  }> = [];
  if (unique.length === 0) return revoked;

  const leaving = await workGrantedByTeams([teamId]);
  for (const personId of unique) {
    const keep = await workGrantedByTeams(
      await otherTeamIdsForPerson(personId, teamId),
    );
    const keepProjects = new Set(keep.projectIds);
    const keepPortfolios = new Set(keep.portfolioIds);
    const projectCandidates = leaving.projectIds.filter(
      (id) => !keepProjects.has(id),
    );
    const portfolioCandidates = leaving.portfolioIds.filter(
      (id) => !keepPortfolios.has(id),
    );
    const revokedProjectIds: string[] = [];
    const revokedPortfolioIds: string[] = [];

    if (projectCandidates.length > 0) {
      const { data: projects, error } = await admin()
        .from("projects")
        .select("id, owner_id, created_by_id")
        .in("id", projectCandidates);
      throwIfError(error);
      const revoke = (projects ?? [])
        .filter(
          (row) => row.owner_id !== personId && row.created_by_id !== personId,
        )
        .map((row) => row.id as string);
      if (revoke.length > 0) {
        const { error: deleteError } = await admin()
          .from("project_members")
          .delete()
          .eq("person_id", personId)
          .in("project_id", revoke);
        throwIfError(deleteError);
        revokedProjectIds.push(...revoke);
      }
    }

    if (portfolioCandidates.length > 0) {
      const { data: portfolios, error } = await admin()
        .from("portfolios")
        .select("id, created_by_id")
        .in("id", portfolioCandidates);
      throwIfError(error);
      const revoke = (portfolios ?? [])
        .filter((row) => row.created_by_id !== personId)
        .map((row) => row.id as string);
      if (revoke.length > 0) {
        const { error: deleteError } = await admin()
          .from("portfolio_members")
          .delete()
          .eq("person_id", personId)
          .in("portfolio_id", revoke);
        throwIfError(deleteError);
        revokedPortfolioIds.push(...revoke);
      }
    }

    if (revokedProjectIds.length > 0 || revokedPortfolioIds.length > 0) {
      revoked.push({
        personId,
        projectIds: revokedProjectIds,
        portfolioIds: revokedPortfolioIds,
      });
    }
  }
  return revoked;
}

async function writeRevokedAccessAudit(
  actorId: string,
  revoked: Array<{
    personId: string;
    projectIds: string[];
    portfolioIds: string[];
  }>,
) {
  for (const item of revoked) {
    const person = await getPersonById(item.personId);
    const name = person?.full_name ?? "a teammate";
    for (const projectId of item.projectIds) {
      await writeAuditEvent({
        actorId,
        kind: "change",
        action: "member.removed",
        summary: `Removed ${name} from the project`,
        projectId,
        targetType: "person",
        targetId: item.personId,
      });
    }
    for (const portfolioId of item.portfolioIds) {
      await writeAuditEvent({
        actorId,
        kind: "change",
        action: "member.removed",
        summary: `Removed ${name} from the portfolio`,
        portfolioId,
        targetType: "person",
        targetId: item.personId,
      });
    }
  }
}

export async function syncOwnedTeamsAccess(personId: string) {
  const teams = await listOwnedTeams(personId);
  await Promise.all(teams.map((team) => grantAttachedWorkToMembers(team.id)));
}

export async function createTeam(
  personId: string,
  name: string,
  memberIds: string[],
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
    { team_id: team.id, person_id: personId, role: "Owner", access_role: "admin" },
    ...unique.map((id) => ({
      team_id: team.id,
      person_id: id,
      role: "Member",
      access_role: "view",
    })),
  ];
  const { error: memberError } = await admin().from("team_members").insert(rows);
  throwIfError(memberError);
  return team;
}

export async function updateTeamName(
  teamId: string,
  actorId: string,
  name: string,
) {
  await assertTeamOwner(teamId, actorId);
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Team name is required.");
  const { error } = await admin()
    .from("teams")
    .update({ name: trimmed })
    .eq("id", teamId);
  throwIfError(error);
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
      unique.map((id) => ({
        team_id: teamId,
        person_id: id,
        role: "Member",
        access_role: "view",
      })),
      { onConflict: "team_id,person_id", ignoreDuplicates: true },
    );
  throwIfError(error);
  await grantAttachedWorkToMembers(teamId, unique, actorId);
  for (const memberId of unique) {
    await syncPersonWorkRoles(memberId);
  }
  const [teamProjects, teamPortfolios] = await Promise.all([
    listTeamProjects([teamId]),
    listTeamPortfolios([teamId]),
  ]);
  for (const memberId of unique) {
    const person = await getPersonById(memberId);
    const name = person?.full_name ?? "a teammate";
    for (const row of teamProjects) {
      await writeAuditEvent({
        actorId,
        kind: "change",
        action: "member.added",
        summary: `Added ${name} to the project`,
        projectId: row.project.id,
        targetType: "person",
        targetId: memberId,
      });
    }
    for (const row of teamPortfolios) {
      await writeAuditEvent({
        actorId,
        kind: "change",
        action: "member.added",
        summary: `Added ${name} to the portfolio`,
        portfolioId: row.portfolio.id,
        targetType: "person",
        targetId: memberId,
      });
    }
  }
}

/**
 * Rewrites the person's project and portfolio roles from the teams they belong
 * to, taking the strongest role when several teams grant the same work. Work
 * they own is left alone so a team role can never lock an owner out.
 */
async function syncPersonWorkRoles(personId: string) {
  const db = admin();
  const { data: teamRows, error } = await db
    .from("team_members")
    .select("team_id, access_role")
    .eq("person_id", personId);
  throwIfError(error);

  const roleByProject = new Map<string, AccessRole>();
  const roleByPortfolio = new Map<string, AccessRole>();

  for (const row of teamRows ?? []) {
    const teamRole = normalizeAccessRole(row.access_role);
    const granted = await workGrantedByTeams([row.team_id as string]);
    for (const id of granted.projectIds) {
      roleByProject.set(id, maxAccessRole(roleByProject.get(id) ?? null, teamRole) ?? "view");
    }
    for (const id of granted.portfolioIds) {
      roleByPortfolio.set(
        id,
        maxAccessRole(roleByPortfolio.get(id) ?? null, teamRole) ?? "view",
      );
    }
  }

  if (roleByProject.size > 0) {
    const { data: owned, error: ownedError } = await db
      .from("projects")
      .select("id, owner_id, created_by_id")
      .in("id", [...roleByProject.keys()]);
    throwIfError(ownedError);
    for (const row of owned ?? []) {
      if (row.owner_id === personId || row.created_by_id === personId) {
        roleByProject.delete(row.id as string);
      }
    }
  }
  if (roleByPortfolio.size > 0) {
    const { data: owned, error: ownedError } = await db
      .from("portfolios")
      .select("id")
      .in("id", [...roleByPortfolio.keys()])
      .eq("created_by_id", personId);
    throwIfError(ownedError);
    for (const row of owned ?? []) roleByPortfolio.delete(row.id as string);
  }

  for (const role of ["view", "admin"] as AccessRole[]) {
    const projectIds = [...roleByProject]
      .filter(([, value]) => value === role)
      .map(([id]) => id);
    if (projectIds.length > 0) {
      const { error: updateError } = await db
        .from("project_members")
        .update({ access_role: role })
        .eq("person_id", personId)
        .in("project_id", projectIds);
      throwIfError(updateError);
    }

    const portfolioIds = [...roleByPortfolio]
      .filter(([, value]) => value === role)
      .map(([id]) => id);
    if (portfolioIds.length > 0) {
      const { error: updateError } = await db
        .from("portfolio_members")
        .update({ access_role: role })
        .eq("person_id", personId)
        .in("portfolio_id", portfolioIds);
      throwIfError(updateError);
    }
  }

  return {
    projectIds: [...roleByProject.keys()],
    portfolioIds: [...roleByPortfolio.keys()],
  };
}

export async function setTeamMemberRole(
  teamId: string,
  actorId: string,
  personId: string,
  accessRole: AccessRole,
) {
  const team = await assertTeamOwner(teamId, actorId);
  if (personId === team.created_by_id) {
    throw new Error("The team owner is always an admin.");
  }

  const members = await listTeamMembers([teamId]);
  const member = members.find((row) => row.person_id === personId);
  if (!member) throw new Error("That person is not on this team.");

  const previousRole = normalizeAccessRole(member.access_role);
  if (previousRole === accessRole) {
    return { previousRole, newRole: accessRole, changed: false as const };
  }

  const { error } = await admin()
    .from("team_members")
    .update({ access_role: accessRole })
    .eq("team_id", teamId)
    .eq("person_id", personId);
  throwIfError(error);

  const synced = await syncPersonWorkRoles(personId);
  const summary = `Changed ${member.person.full_name}'s role to ${
    accessRole === "admin" ? "Admin" : "View"
  }`;
  for (const projectId of synced.projectIds) {
    await writeAuditEvent({
      actorId,
      kind: "change",
      action: "member.role_changed",
      summary,
      projectId,
      targetType: "person",
      targetId: personId,
      metadata: { team_id: teamId, from: previousRole, to: accessRole },
    });
  }
  for (const portfolioId of synced.portfolioIds) {
    await writeAuditEvent({
      actorId,
      kind: "change",
      action: "member.role_changed",
      summary,
      portfolioId,
      targetType: "person",
      targetId: personId,
      metadata: { team_id: teamId, from: previousRole, to: accessRole },
    });
  }

  const actor = await getPersonById(actorId);
  await sendRoleChangedEmail({
    to: member.person.email,
    recipientFirstName: member.person.first_name,
    actorName: actor?.full_name?.trim() || "A teammate",
    teamName: team.name,
    previousRole,
    newRole: accessRole,
  });

  return { previousRole, newRole: accessRole, changed: true as const };
}

export async function removePeopleFromTeam(
  teamId: string,
  actorId: string,
  memberIds: string[],
) {
  const team = await assertTeamOwner(teamId, actorId);
  const unique = uniqueIds(memberIds);
  if (unique.some((id) => id === team.created_by_id)) {
    throw new Error("You cannot remove the team owner.");
  }
  if (unique.length === 0) return;

  const members = await listTeamMembers([teamId]);
  const onTeam = new Set(members.map((member) => member.person_id));
  const leaving = unique.filter((id) => onTeam.has(id));
  if (leaving.length === 0) return;

  const revoked = await revokeTeamWorkFromPeople(teamId, leaving);
  const { error } = await admin()
    .from("team_members")
    .delete()
    .eq("team_id", teamId)
    .in("person_id", leaving);
  throwIfError(error);
  for (const personId of leaving) {
    await syncPersonWorkRoles(personId);
  }
  await writeRevokedAccessAudit(actorId, revoked);
}

export async function deleteTeam(teamId: string, actorId: string) {
  await assertTeamOwner(teamId, actorId);
  const members = await listTeamMembers([teamId]);
  const revoked = await revokeTeamWorkFromPeople(
    teamId,
    members.map((member) => member.person_id),
  );
  await writeRevokedAccessAudit(actorId, revoked);
  const { error } = await admin().from("teams").delete().eq("id", teamId);
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
  if (projects.length === 0 && portfolios.length === 0) {
    throw new Error("Select a portfolio or a project.");
  }

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

  await grantAttachedWorkToMembers(teamId, undefined, actorId);
  for (const member of await listTeamMembers([teamId])) {
    await syncPersonWorkRoles(member.person_id);
  }
  const ownedProjects = await listOwnedProjects(actorId);
  const ownedPortfolios = await listOwnedPortfolios(actorId);
  for (const projectId of projects) {
    const project = ownedProjects.find((item) => item.id === projectId);
    await writeAuditEvent({
      actorId,
      kind: "change",
      action: "access.granted",
      summary: `Gave the team access to ${project?.name ?? "a project"}`,
      projectId,
    });
  }
  for (const portfolioId of portfolios) {
    const portfolio = ownedPortfolios.find((item) => item.id === portfolioId);
    await writeAuditEvent({
      actorId,
      kind: "change",
      action: "access.granted",
      summary: `Gave the team access to ${portfolio?.name ?? "a portfolio"}`,
      portfolioId,
    });
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

export async function listProjectAuditEvents(projectId: string, personId: string) {
  await assertProjectAccess(projectId, personId);
  return listAuditEvents({ projectIds: [projectId] });
}

export async function listPortfolioAuditEvents(
  portfolioId: string,
  personId: string,
) {
  await assertPortfolioAccess(portfolioId, personId);
  const items = await listPortfolioItems([portfolioId]);
  return listAuditEvents({
    portfolioIds: [portfolioId],
    projectIds: items.map((item) => item.project_id),
  });
}
