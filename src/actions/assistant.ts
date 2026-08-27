"use server";

import { revalidatePath } from "next/cache";
import {
  addProjectToPortfolio,
  addTask,
  getAccessiblePortfolio,
  getProjectBundle,
  listMembersForProjects,
  listProjectsForPerson,
  removeProjectFromPortfolio,
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
import type { ProjectBundle, TaskStatus } from "@/lib/types";

function compactProject(bundle: ProjectBundle) {
  return {
    id: bundle.project.id,
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
      owner_id: task.owner_id,
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

  if (action.type === "create_task") {
    const owner = members.find(
      (person) =>
        person.email === action.owner_email?.trim().toLowerCase(),
    );
    if (action.phase_id) {
      const phaseOk = bundle.phases.some((phase) => phase.id === action.phase_id);
      if (!phaseOk) throw new Error("That phase is not on this project.");
    }
    await addTask(projectId, personId, {
      title: action.title || action.summary,
      ownerId: owner?.id ?? null,
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
    const owner = members.find(
      (person) =>
        person.email === action.owner_email?.trim().toLowerCase(),
    );
    if (!owner) throw new Error("Owner must already be a project member.");
    await updateTask(projectId, personId, action.task_id, {
      owner_id: owner.id,
    });
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
  const bundle = await getProjectBundle(projectId, session.personId);
  const result = await completeJson(
    assistantSchema,
    "project_assistant",
    [
      { role: "user", content: JSON.stringify(compactProject(bundle)) },
      ...history,
      { role: "user", content: userMessage },
    ],
    "You are the Baguette project assistant. Answer only from the provided project JSON. You may propose create_task, reassign_task, reschedule_task, or update_status. Leave project_id null. Never claim a write happened. Proposed actions wait for explicit user confirmation. Use only member emails and task ids from the JSON. If you cannot do something from the data, say so.",
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

  const inPortfolio = new Set(projectIds);
  const canManage = bundle.portfolio.created_by_id === session.personId;
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
            owner_id: task.owner_id,
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
    "You are the Baguette portfolio assistant. Answer only from the provided portfolio JSON. If can_manage is true, you may propose rename_portfolio (set name), add_project (project_id from available_projects_to_add), or remove_project (project_id from projects). Otherwise do not propose those. You may also propose create_task, reassign_task, reschedule_task, or update_status for a specific project in this portfolio — always set project_id, and use only that project's member emails, task ids, and phase ids. Never claim a write happened. Proposed actions wait for explicit user confirmation. Include the project name in each project-level action summary. If you cannot do something from the data, say so.",
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
