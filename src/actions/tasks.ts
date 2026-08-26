"use server";

import { revalidatePath } from "next/cache";
import { addPhase, addTask, updateTask, updateTaskStatus } from "@/lib/db";
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
    ownerId: String(formData.get("ownerId") ?? "") || null,
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

export async function moveTask(
  projectId: string,
  taskId: string,
  status: TaskStatus,
) {
  const session = await requireSession();
  await updateTaskStatus(projectId, session.personId, taskId, status);
  revalidatePath(`/app/projects/${projectId}`);
  revalidatePath(`/app/projects/${projectId}/board`);
  revalidatePath("/app/dashboard");
  revalidatePath("/app/portfolios", "layout");
  revalidatePath("/app/executive", "layout");
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
