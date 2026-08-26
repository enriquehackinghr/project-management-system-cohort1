"use client";

import { addProjectsToPortfolioAction, createPortfolioAction } from "@/actions/portfolios";
import type { Project } from "@/lib/types";
import { inputClass, PrimaryButton } from "./ui";

export function CreatePortfolioForm() {
  return (
    <form action={createPortfolioAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <label className="block min-w-0 flex-1">
        <span className="mb-1.5 block text-[13px] font-medium text-mute">Portfolio name</span>
        <input className={inputClass} name="name" required placeholder="APAC 2026" />
      </label>
      <PrimaryButton type="submit" className="shrink-0">
        Create portfolio
      </PrimaryButton>
    </form>
  );
}

export function AddProjectsForm({
  portfolioId,
  projects,
}: {
  portfolioId: string;
  projects: Project[];
}) {
  if (projects.length === 0) {
    return (
      <p className="text-sm text-mute">
        Every project you can access is already in this portfolio, or you have none yet.
      </p>
    );
  }

  const action = addProjectsToPortfolioAction.bind(null, portfolioId);
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        {projects.map((project) => (
          <label
            key={project.id}
            className="flex items-start gap-3 rounded-xl border border-flour bg-foam/50 px-3 py-3 text-sm"
          >
            <input
              type="checkbox"
              name="projectId"
              value={project.id}
              className="mt-1"
            />
            <span>
              <span className="block font-medium">{project.name}</span>
              <span className="mt-0.5 block text-[12px] text-mute">
                {project.goal || project.description || "No goal yet"}
              </span>
            </span>
          </label>
        ))}
      </div>
      <PrimaryButton type="submit">Add selected</PrimaryButton>
    </form>
  );
}
