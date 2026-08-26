"use server";

import { revalidatePath } from "next/cache";
import { addTask, getProjectBundle, updateTask } from "@/lib/db";
import { completeJson } from "@/lib/openai";
import {
  assistantSchema,
  type ProposedAction,
} from "@/lib/schemas";
import { requireSession } from "@/lib/session";
import type { TaskStatus } from "@/lib/types";

export async function askAssistant(
  projectId: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  userMessage: string,
) {
  const session = await requireSession();
  const bundle = await getProjectBundle(projectId, session.personId);
  const context = {
    project: bundle.project,
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

  return completeJson(
    assistantSchema,
    "project_assistant",
    [
      { role: "user", content: JSON.stringify(context) },
      ...history,
      { role: "user", content: userMessage },
    ],
    "You are the Baguette project assistant. Answer only from the provided project JSON. You may propose create_task, reassign_task, reschedule_task, or update_status. Never claim a write happened. Proposed actions wait for explicit user confirmation. Use only member emails and task ids from the JSON. If you cannot do something from the data, say so.",
  );
}

export async function confirmAssistantAction(
  projectId: string,
  action: ProposedAction,
) {
  const session = await requireSession();
  const bundle = await getProjectBundle(projectId, session.personId);
  const members = bundle.members.map((member) => member.person);

  if (action.type === "create_task") {
    const owner = members.find(
      (person) =>
        person.email === action.owner_email?.trim().toLowerCase(),
    );
    await addTask(projectId, session.personId, {
      title: action.title || action.summary,
      ownerId: owner?.id ?? null,
      status: action.status ?? "todo",
      estimateHours: action.estimate_hours,
      startDate: action.start_date,
      dueDate: action.due_date,
      phaseId: action.phase_id,
    });
  } else {
    if (!action.task_id) throw new Error("A task id is required.");
    const exists = bundle.tasks.some((task) => task.id === action.task_id);
    if (!exists) throw new Error("That task is not on this project.");

    if (action.type === "reassign_task") {
      const owner = members.find(
        (person) =>
          person.email === action.owner_email?.trim().toLowerCase(),
      );
      if (!owner) throw new Error("Owner must already be a project member.");
      await updateTask(projectId, session.personId, action.task_id, {
        owner_id: owner.id,
      });
    }
    if (action.type === "reschedule_task") {
      await updateTask(projectId, session.personId, action.task_id, {
        start_date: action.start_date,
        due_date: action.due_date,
      });
    }
    if (action.type === "update_status" && action.status) {
      await updateTask(projectId, session.personId, action.task_id, {
        status: action.status as TaskStatus,
      });
    }
  }

  revalidatePath(`/app/projects/${projectId}`);
  revalidatePath(`/app/projects/${projectId}/assistant`);
}
