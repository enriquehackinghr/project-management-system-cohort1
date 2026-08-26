"use server";

import { revalidatePath } from "next/cache";
import { commitPlan } from "@/lib/db";
import { documentsPromptBlock, extractDocuments } from "@/lib/documents";
import { completeJson } from "@/lib/openai";
import { planSchema, type PlanDraft } from "@/lib/schemas";
import { requireSession } from "@/lib/session";

const SYSTEM = `You are Baguette, a project operating system. You help a user turn a plain-language brief into a structured plan.

Rules:
- Ask for anything missing: goal, timeline, budget, people and what each owns.
- When you have enough, set ready_for_review to true and fill the plan.
- If the user attached documents, treat them as source material. Extract goals, phases, tasks, owners, dates, estimates, dependencies, and budget from those documents. Prefer document facts over invention.
- People: only use people the user named or that appear in the attached documents. Never invent names or emails.
- If the user did not give emails, leave members empty and list that in missing.
- Dates must be ISO YYYY-MM-DD.
- Tasks must belong to a phase via phase_temp_id.
- Dependencies use temp ids (t1, t2, p1).
- status is todo | in_progress | blocked | done. priority is low | medium | high.
- You do not write to a database. This is a draft until the user approves.`;

export async function continuePlanChat(input: {
  history: Array<{ role: "user" | "assistant"; content: string }>;
  userMessage: string;
  files?: File[];
}): Promise<PlanDraft> {
  const session = await requireSession();
  const documents = input.files?.length
    ? await extractDocuments(input.files)
    : [];
  const documentBlock = documentsPromptBlock(documents);
  const userMessage =
    documentBlock.length > 0
      ? `${documentBlock}\n\n--- User message ---\n${input.userMessage.trim() || "Create a project plan from the attached documents."}`
      : input.userMessage;
  const messages = [
    ...input.history,
    { role: "user" as const, content: userMessage },
  ];

  return completeJson(
    planSchema,
    "project_plan",
    messages,
    `${SYSTEM}\nThe person creating this project is ${session.fullName} <${session.email}>. Include them as a member unless they say otherwise.`,
  );
}

export async function approvePlan(draft: PlanDraft) {
  const session = await requireSession();
  if (!draft.ready_for_review || !draft.project) {
    throw new Error("The draft is not ready to write.");
  }

  const members = [...draft.members];
  if (
    !members.some(
      (member) => member.email.trim().toLowerCase() === session.email,
    )
  ) {
    members.unshift({
      full_name: session.fullName,
      email: session.email,
      role: "Owner",
      capacity_hours_per_week: 40,
    });
  }

  const memberEmails = new Set(
    members.map((member) => member.email.trim().toLowerCase()),
  );
  const unknownOwners = draft.tasks
    .map((task) => task.owner_email.trim().toLowerCase())
    .filter((email) => email && !memberEmails.has(email));
  if (unknownOwners.length > 0) {
    throw new Error(
      `Tasks assign work to people not on the project: ${[...new Set(unknownOwners)].join(", ")}`,
    );
  }

  const projectId = await commitPlan({
    created_by_id: session.personId,
    project: {
      ...draft.project,
      owner_email: session.email,
      status: "planning",
    },
    members: members,
    phases: draft.phases,
    tasks: draft.tasks,
    dependencies: draft.dependencies,
  });

  revalidatePath("/app/projects");
  revalidatePath("/app/executive", "layout");
  return projectId;
}
