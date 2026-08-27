"use server";

import { revalidatePath } from "next/cache";
import {
  addPhase,
  addTask,
  setTaskAssignees,
  updateTask,
  updateTaskStatus,
} from "@/lib/db";
import { requireSession } from "@/lib/session";
import type { TaskPriority, TaskStatus } from "@/lib/types";

export async function createTask(projectId: string, formData: FormData) {
  const session = await requireSession();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("Task title is required.");

  await addTask(projectId, session.personId, {
    title,
    description: String(formData.get("description") ?? "").trim(),
    phaseId: String(formData.get("phaseId") ?? "") || null,
    assigneeIds: formData
      .getAll("assigneeIds")
      .map((value) => String(value))
      .filter(Boolean),
    status: (String(formData.get("status") ?? "todo") as TaskStatus) || "todo",
    priority: (String(formData.get("priority") ?? "medium") as TaskPriority) || "medium",
    estimateHours: Number(formData.get("estimateHours") || 0) || null,
    startDate: String(formData.get("startDate") ?? "") || null,
    dueDate: String(formData.get("dueDate") ?? "") || null,
  });
  revalidatePath(`/app/projects/${projectId}`);
}

export async function createPhase(projectId: string, formData: FormData) {
  const session = await requireSession();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Phase name is required.");
  await addPhase(projectId, session.personId, {
    name,
    startDate: String(formData.get("startDate") ?? ""),
    endDate: String(formData.get("endDate") ?? ""),
  });
  revalidatePath(`/app/projects/${projectId}`);
}

/** The same task shows up on project, portfolio, and account views of the board. */
function revalidateTaskViews(projectId: string) {
  revalidatePath(`/app/projects/${projectId}`, "layout");
  revalidatePath("/app/dashboard");
  revalidatePath("/app/portfolios", "layout");
  revalidatePath("/app/executive", "layout");
}

export async function moveTask(
  projectId: string,
  taskId: string,
  status: TaskStatus,
) {
  const session = await requireSession();
  await updateTaskStatus(projectId, session.personId, taskId, status);
  revalidateTaskViews(projectId);
}

export async function assignTask(
  projectId: string,
  taskId: string,
  assigneeIds: string[],
) {
  const session = await requireSession();
  await setTaskAssignees(projectId, session.personId, taskId, assigneeIds);
  revalidateTaskViews(projectId);
}

export async function patchTask(
  projectId: string,
  taskId: string,
  patch: Parameters<typeof updateTask>[3],
) {
  const session = await requireSession();
  await updateTask(projectId, session.personId, taskId, patch);
  revalidatePath(`/app/projects/${projectId}`);
}
