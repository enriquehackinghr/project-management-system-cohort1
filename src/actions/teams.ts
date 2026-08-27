"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  addPeopleToProject,
  addPeopleToPortfolio,
  addPeopleToTeam,
  attachWorkToTeam,
  createTeam,
  deleteTeam,
  removePeopleFromTeam,
  updateTeamName,
} from "@/lib/db";
import { requireSession } from "@/lib/session";

function idsFrom(formData: FormData, name: string) {
  return formData.getAll(name).map((value) => String(value)).filter(Boolean);
}

function revalidateWork(projectIds: string[], portfolioIds: string[], teamId?: string) {
  revalidatePath("/app/projects");
  revalidatePath("/app/dashboard");
  revalidatePath("/app/executive", "layout");
  revalidatePath("/app/teams");
  if (teamId) {
    revalidatePath(`/app/teams/${teamId}`);
  }
  for (const id of projectIds) {
    revalidatePath(`/app/projects/${id}`);
    revalidatePath(`/app/projects/${id}`, "layout");
  }
  for (const id of portfolioIds) {
    revalidatePath(`/app/portfolios/${id}`);
    revalidatePath(`/app/portfolios/${id}`, "layout");
  }
}

export async function createTeamAction(formData: FormData) {
  const session = await requireSession();
  const name = String(formData.get("name") ?? "").trim();
  const team = await createTeam(session.personId, name, idsFrom(formData, "personId"));
  revalidatePath("/app/teams");
  redirect(`/app/teams/${team.id}`);
}

export async function renameTeamAction(teamId: string, formData: FormData) {
  const session = await requireSession();
  const name = String(formData.get("name") ?? "").trim();
  await updateTeamName(teamId, session.personId, name);
  revalidatePath("/app/teams");
  revalidatePath(`/app/teams/${teamId}`);
}

export async function addPeopleToTeamAction(teamId: string, formData: FormData) {
  const session = await requireSession();
  await addPeopleToTeam(teamId, session.personId, idsFrom(formData, "personId"));
  revalidatePath("/app/teams");
  revalidatePath(`/app/teams/${teamId}`);
  revalidatePath("/app/projects");
  revalidatePath("/app/dashboard");
}

export async function removeTeamMemberAction(teamId: string, personId: string) {
  const session = await requireSession();
  await removePeopleFromTeam(teamId, session.personId, [personId]);
  revalidatePath("/app/teams");
  revalidatePath(`/app/teams/${teamId}`);
  revalidatePath("/app/projects");
  revalidatePath("/app/dashboard");
  revalidatePath("/app/executive", "layout");
}

export async function deleteTeamAction(teamId: string) {
  const session = await requireSession();
  await deleteTeam(teamId, session.personId);
  revalidatePath("/app/teams");
  revalidatePath("/app/projects");
  revalidatePath("/app/dashboard");
  revalidatePath("/app/executive", "layout");
  redirect("/app/teams");
}

export async function addTeamToWorkAction(teamId: string, formData: FormData) {
  const session = await requireSession();
  const projectIds = idsFrom(formData, "projectId");
  const portfolioIds = idsFrom(formData, "portfolioId");
  await attachWorkToTeam(teamId, session.personId, projectIds, portfolioIds);
  revalidateWork(projectIds, portfolioIds, teamId);
}

export async function addTeamPeopleToProjectAction(
  projectId: string,
  formData: FormData,
) {
  const session = await requireSession();
  await addPeopleToProject(projectId, session.personId, idsFrom(formData, "personId"));
  revalidateWork([projectId], []);
}

export async function addTeamPeopleToPortfolioAction(
  portfolioId: string,
  formData: FormData,
) {
  const session = await requireSession();
  await addPeopleToPortfolio(
    portfolioId,
    session.personId,
    idsFrom(formData, "personId"),
  );
  revalidateWork([], [portfolioId]);
  revalidatePath(`/app/projects`, "layout");
}
