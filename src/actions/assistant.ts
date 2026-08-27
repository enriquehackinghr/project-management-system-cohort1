"use server";

import { revalidatePath } from "next/cache";
import {
  addProjectToPortfolio,
  addTask,
  getAccessiblePortfolio,
  getPortfolioAccessRole,
  getProjectAccessRole,
  getProjectBundle,
  listMembersForProjects,
  listProjectsForPerson,
  removeProjectFromPortfolio,
  setTaskAssignees,
  updatePortfolioName,
  updateTask,
} from "@/lib/db";
import { completeJson } from "@/lib/openai";
import {
  assistantSchema,
  type ProposedAction,
} from "@/lib/schemas";
import { requireSession } from "@/lib/session";
import { writeAuditEvent } from "@/lib/audit-store";
import type { Person, ProjectBundle, TaskAssignee, TaskStatus } from "@/lib/types";

/** Emails, keyed by task, so the model can name people the same way it assigns them. */
function assigneeEmailsByTask(assignees: TaskAssignee[], people: Person[]) {
  const emailById = new Map(people.map((person) => [person.id, person.email]));
  const byTask = new Map<string, string[]>();
  for (const row of assignees) {
    const email = emailById.get(row.person_id);
    if (!email) continue;
    byTask.set(row.task_id, [...(byTask.get(row.task_id) ?? []), email]);
  }
  return byTask;
}

function compactProject(bundle: ProjectBundle, canEdit: boolean) {
  const emailsByTask = assigneeEmailsByTask(
    bundle.assignees,
    bundle.members.map((member) => member.person),
  );
  return {
    id: bundle.project.id,
    can_edit: canEdit,
    name: bundle.project.name,
    description: bundle.project.description,
    goal: bundle.project.goal,
    status: bundle.project.status,
    start_date: bundle.project.start_date,
    target_date: bundle.project.target_date,
    members: bundle.members.map((member) => ({
      name: member.person.full_name,
      email: member.person.email,
      role: member.role,
    })),
    phases: bundle.phases,
    tasks: bundle.tasks.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      assignee_emails: emailsByTask.get(task.id) ?? [],
      start_date: task.start_date,
      due_date: task.due_date,
      estimate_hours: task.estimate_hours,
      phase_id: task.phase_id,
    })),
  };
}

function revalidateProject(projectId: string) {
  revalidatePath(`/app/projects/${projectId}`);
  revalidatePath(`/app/projects/${projectId}/assistant`);
}

function revalidatePortfolio(portfolioId: string) {
  revalidatePath("/app/dashboard");
  revalidatePath(`/app/portfolios/${portfolioId}`);
  revalidatePath(`/app/portfolios/${portfolioId}`, "layout");
}

async function applyProjectAction(
  projectId: string,
  personId: string,
  action: ProposedAction,
) {
  const bundle = await getProjectBundle(projectId, personId);
  const members = bundle.members.map((member) => member.person);

  const resolveAssignees = (emails: string[]) =>
    emails.flatMap((raw) => {
      const email = raw.trim().toLowerCase();
      if (!email) return [];
      const person = members.find((member) => member.email === email);
      if (!person) {
        throw new Error(`${raw} is not a member of this project.`);
      }
      return [person.id];
    });

  if (action.type === "create_task") {
    if (action.phase_id) {
      const phaseOk = bundle.phases.some((phase) => phase.id === action.phase_id);
      if (!phaseOk) throw new Error("That phase is not on this project.");
    }
    await addTask(projectId, personId, {
      title: action.title || action.summary,
      assigneeIds: resolveAssignees(action.assignee_emails),
      status: action.status ?? "todo",
      estimateHours: action.estimate_hours,
      startDate: action.start_date,
      dueDate: action.due_date,
      phaseId: action.phase_id,
    });
    return;
  }

  if (
    action.type === "rename_portfolio" ||
    action.type === "add_project" ||
    action.type === "remove_project"
  ) {
    throw new Error("That action is only available on a portfolio.");
  }

  if (!action.task_id) throw new Error("A task id is required.");
  const exists = bundle.tasks.some((task) => task.id === action.task_id);
  if (!exists) throw new Error("That task is not on this project.");

  if (action.type === "reassign_task") {
    await setTaskAssignees(
      projectId,
      personId,
      action.task_id,
      resolveAssignees(action.assignee_emails),
    );
  }
  if (action.type === "reschedule_task") {
    await updateTask(projectId, personId, action.task_id, {
      start_date: action.start_date,
      due_date: action.due_date,
    });
  }
  if (action.type === "update_status" && action.status) {
    await updateTask(projectId, personId, action.task_id, {
      status: action.status as TaskStatus,
    });
  }
}

export async function askAssistant(
  projectId: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  userMessage: string,
) {
  const session = await requireSession();
  const [bundle, role] = await Promise.all([
    getProjectBundle(projectId, session.personId),
    getProjectAccessRole(projectId, session.personId),
  ]);
  const canEdit = role === "admin";
  const result = await completeJson(
    assistantSchema,
    "project_assistant",
    [
      { role: "user", content: JSON.stringify(compactProject(bundle, canEdit)) },
      ...history,
      { role: "user", content: userMessage },
    ],
    "You are the Baguette project assistant. Answer only from the provided project JSON. If can_edit is true you may propose create_task, reassign_task, reschedule_task, or update_status; if can_edit is false propose nothing and explain that this person has view-only access. A task can have several people responsible for it: assignee_emails is always the complete list after the change, so to add somebody include the emails already on the task, and use an empty list to leave the task unassigned. Leave assignee_emails empty for actions that are not about assignment. Leave project_id null. Never claim a write happened. Proposed actions wait for explicit user confirmation. Use only member emails and task ids from the JSON. If you cannot do something from the data, say so.",
  );
  await writeAuditEvent({
    actorId: session.personId,
    kind: "change",
    action: "assistant.asked",
    summary: "Asked the project assistant",
    projectId,
  });
  return result;
}

export async function askPortfolioAssistant(
  portfolioId: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  userMessage: string,
) {
  const session = await requireSession();
  const [bundle, accessible] = await Promise.all([
    getAccessiblePortfolio(portfolioId, session.personId),
    listProjectsForPerson(session.personId),
  ]);
  if (!bundle) throw new Error("You do not have access to this portfolio.");

  const projectIds = bundle.items.map((item) => item.project_id);
  const memberships = await listMembersForProjects(projectIds);
  const membersByProject = new Map<string, typeof memberships>();
  for (const membership of memberships) {
    const list = membersByProject.get(membership.project_id) ?? [];
    list.push(membership);
    membersByProject.set(membership.project_id, list);
  }

  const emailsByTask = assigneeEmailsByTask(bundle.assignees, bundle.people);
  const inPortfolio = new Set(projectIds);
  const canManage =
    (await getPortfolioAccessRole(portfolioId, session.personId)) === "admin";
  const context = {
    portfolio: {
      id: bundle.portfolio.id,
      name: bundle.portfolio.name,
      can_manage: canManage,
      members: bundle.members.map((member) => ({
        name: member.person.full_name,
        email: member.person.email,
        role: member.role,
      })),
    },
    projects: bundle.items.map((item) => {
      const members = membersByProject.get(item.project_id) ?? [];
      return {
        id: item.project.id,
        name: item.project.name,
        description: item.project.description,
        goal: item.project.goal,
        status: item.project.status,
        start_date: item.project.start_date,
        target_date: item.project.target_date,
        members: members.map((member) => ({
          name: member.person.full_name,
          email: member.person.email,
          role: member.role,
        })),
        phases: bundle.phases.filter((phase) => phase.project_id === item.project_id),
        tasks: bundle.tasks
          .filter((task) => task.project_id === item.project_id)
          .map((task) => ({
            id: task.id,
            title: task.title,
            status: task.status,
            assignee_emails: emailsByTask.get(task.id) ?? [],
            start_date: task.start_date,
            due_date: task.due_date,
            estimate_hours: task.estimate_hours,
            phase_id: task.phase_id,
          })),
      };
    }),
    available_projects_to_add: canManage
      ? accessible
          .filter((project) => !inPortfolio.has(project.id))
          .map((project) => ({
            id: project.id,
            name: project.name,
            status: project.status,
            goal: project.goal,
          }))
      : [],
  };

  const result = await completeJson(
    assistantSchema,
    "portfolio_assistant",
    [
      { role: "user", content: JSON.stringify(context) },
      ...history,
      { role: "user", content: userMessage },
    ],
    "You are the Baguette portfolio assistant. Answer only from the provided portfolio JSON. If can_manage is true, you may propose rename_portfolio (set name), add_project (project_id from available_projects_to_add), or remove_project (project_id from projects). Otherwise do not propose those. You may also propose create_task, reassign_task, reschedule_task, or update_status for a specific project in this portfolio — always set project_id, and use only that project's member emails, task ids, and phase ids. A task can have several people responsible for it: assignee_emails is always the complete list after the change, so to add somebody include the emails already on the task, and use an empty list to leave the task unassigned. Leave assignee_emails empty for actions that are not about assignment. Never claim a write happened. Proposed actions wait for explicit user confirmation. Include the project name in each project-level action summary. If you cannot do something from the data, say so.",
  );
  await writeAuditEvent({
    actorId: session.personId,
    kind: "change",
    action: "assistant.asked",
    summary: "Asked the portfolio assistant",
    portfolioId,
  });
  return result;
}

export async function confirmAssistantAction(
  projectId: string,
  action: ProposedAction,
) {
  const session = await requireSession();
  await applyProjectAction(projectId, session.personId, action);
  revalidateProject(projectId);
}

export async function confirmPortfolioAssistantAction(
  portfolioId: string,
  action: ProposedAction,
) {
  const session = await requireSession();
  const bundle = await getAccessiblePortfolio(portfolioId, session.personId);
  if (!bundle) throw new Error("You do not have access to this portfolio.");
  const projectIds = new Set(bundle.items.map((item) => item.project_id));

  if (action.type === "rename_portfolio") {
    const name = action.name?.trim() || action.title?.trim();
    if (!name) throw new Error("A portfolio name is required.");
    await updatePortfolioName(portfolioId, session.personId, name);
    revalidatePortfolio(portfolioId);
    return;
  }

  if (action.type === "add_project") {
    if (!action.project_id) throw new Error("A project id is required.");
    if (projectIds.has(action.project_id)) {
      throw new Error("That project is already in this portfolio.");
    }
    await addProjectToPortfolio(portfolioId, session.personId, action.project_id);
    revalidatePortfolio(portfolioId);
    return;
  }

  if (action.type === "remove_project") {
    if (!action.project_id) throw new Error("A project id is required.");
    if (!projectIds.has(action.project_id)) {
      throw new Error("That project is not in this portfolio.");
    }
    await removeProjectFromPortfolio(
      portfolioId,
      session.personId,
      action.project_id,
    );
    revalidatePortfolio(portfolioId);
    return;
  }

  if (!action.project_id) {
    throw new Error("Pick a project in this portfolio.");
  }
  if (!projectIds.has(action.project_id)) {
    throw new Error("That project is not in this portfolio.");
  }

  await applyProjectAction(action.project_id, session.personId, action);
  revalidateProject(action.project_id);
  revalidatePortfolio(portfolioId);
}
