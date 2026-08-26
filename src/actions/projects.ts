"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addProjectMember, createManualProject } from "@/lib/db";
import { requireSession } from "@/lib/session";

export async function createProjectFromForm(formData: FormData) {
  const session = await requireSession();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Project name is required.");

  const memberFirstNames = formData.getAll("memberFirstName").map(String);
  const memberLastNames = formData.getAll("memberLastName").map(String);
  const memberEmails = formData.getAll("memberEmail").map(String);
  const memberRoles = formData.getAll("memberRole").map(String);
  const memberCaps = formData.getAll("memberCapacity").map(String);

  const members = memberEmails
    .map((email, index) => ({
      firstName: memberFirstNames[index]?.trim() ?? "",
      lastName: memberLastNames[index]?.trim() ?? "",
      email: email.trim().toLowerCase(),
      role: memberRoles[index]?.trim() || "Member",
      capacityHoursPerWeek: Number(memberCaps[index] || 40),
    }))
    .filter((member) => member.email && member.firstName && member.lastName);

  const budgetRaw = String(formData.get("budget") ?? "").trim();
  const projectId = await createManualProject({
    createdById: session.personId,
    createdByEmail: session.email,
    createdByFirstName: session.firstName,
    createdByLastName: session.lastName,
    name,
    description: String(formData.get("description") ?? "").trim(),
    goal: String(formData.get("goal") ?? "").trim(),
    startDate: String(formData.get("startDate") ?? "").trim(),
    targetDate: String(formData.get("targetDate") ?? "").trim(),
    budget: budgetRaw ? Number(budgetRaw) : null,
    members,
  });

  revalidatePath("/app/projects");
  revalidatePath("/app/executive", "layout");
  redirect(`/app/projects/${projectId}`);
}

export async function addMemberToProject(projectId: string, formData: FormData) {
  const session = await requireSession();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!firstName || !lastName || !email) {
    throw new Error("First name, last name, and email are required.");
  }

  await addProjectMember(projectId, session.personId, {
    firstName,
    lastName,
    email,
    role: String(formData.get("role") ?? "").trim() || "Member",
    capacityHoursPerWeek: Number(formData.get("capacity") || 40),
  });
  revalidatePath(`/app/projects/${projectId}`);
}
