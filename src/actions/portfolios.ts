"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  addProjectToPortfolio,
  createPortfolio,
  removeProjectFromPortfolio,
} from "@/lib/db";
import { requireSession } from "@/lib/session";

export async function createPortfolioAction(formData: FormData) {
  const session = await requireSession();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Portfolio name is required.");
  const portfolio = await createPortfolio(session.personId, name);
  revalidatePath("/app/dashboard");
  redirect(`/app/portfolios/${portfolio.id}`);
}

export async function addProjectsToPortfolioAction(
  portfolioId: string,
  formData: FormData,
) {
  const session = await requireSession();
  const selected = formData.getAll("projectId").map((value) => String(value));
  for (const projectId of selected) {
    await addProjectToPortfolio(portfolioId, session.personId, projectId);
  }
  revalidatePath("/app/dashboard");
  revalidatePath(`/app/portfolios/${portfolioId}`);
  revalidatePath(`/app/portfolios/${portfolioId}`, "layout");
}

export async function removeProjectFromPortfolioAction(
  portfolioId: string,
  projectId: string,
) {
  const session = await requireSession();
  await removeProjectFromPortfolio(portfolioId, session.personId, projectId);
  revalidatePath("/app/dashboard");
  revalidatePath(`/app/portfolios/${portfolioId}`);
  revalidatePath(`/app/portfolios/${portfolioId}`, "layout");
}
