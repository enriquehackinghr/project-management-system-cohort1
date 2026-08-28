"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { commitPlan } from "@/lib/db";
import { documentsPromptBlock, extractDocuments } from "@/lib/documents";
import { completeJson } from "@/lib/openai";
import { planSchema, type PlanDraft } from "@/lib/schemas";
import { requireSession } from "@/lib/session";

/**
 * Next.js strips the message off anything a server action throws in production,
 * so every failure a person is meant to read comes back as a return value.
 */
export type PlanChatResult =
  | { ok: true; draft: PlanDraft }
  | { ok: false; message: string };

export type ApprovePlanResult =
  | { ok: true; projectId: string }
  | { ok: false; message: string };

type PlanMember = PlanDraft["members"][number];

const emailFormat = z.email();

/** The model writes "tbd" or "" when nobody was named. Those are not people. */
function realEmail(value: string) {
  const email = value.trim().toLowerCase();
  return emailFormat.safeParse(email).success ? email : "";
}

const SYSTEM = `You are Baguette, a project operating system. You help a user turn a plain-language brief into a structured plan.

Rules:
- Ask for anything missing: goal, timeline, budget, people and what each owns.
- When you have enough, set ready_for_review to true and fill the plan.
- If the user attached documents, treat them as source material. Extract goals, phases, tasks, owners, dates, estimates, dependencies, and budget from those documents. Prefer document facts over invention.
- People: only use people the user named or that appear in the attached documents. Never invent names or emails.
- If the user did not give emails, leave members empty and list that in missing.
- owner_email is either the email of somebody in members or an empty string. Never write a placeholder such as "tbd" — an empty string means the task is unassigned for now, which is fine.
- Dates must be ISO YYYY-MM-DD.
- Tasks must belong to a phase via phase_temp_id.
- Dependencies use temp ids (t1, t2, p1).
- status is todo | in_progress | blocked | done. priority is low | medium | high.
- You do not write to a database. This is a draft until the user approves.`;

export async function continuePlanChat(input: {
  history: Array<{ role: "user" | "assistant"; content: string }>;
  userMessage: string;
  files?: File[];
}): Promise<PlanChatResult> {
  const session = await requireSession();

  let documentBlock = "";
  if (input.files?.length) {
    try {
      documentBlock = documentsPromptBlock(await extractDocuments(input.files));
    } catch (error) {
      return {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Those documents could not be read.",
      };
    }
  }

  const userMessage =
    documentBlock.length > 0
      ? `${documentBlock}\n\n--- User message ---\n${input.userMessage.trim() || "Create a project plan from the attached documents."}`
      : input.userMessage;
  const messages = [
    ...input.history,
    { role: "user" as const, content: userMessage },
  ];

  try {
    const draft = await completeJson(
      planSchema,
      "project_plan",
      messages,
      `${SYSTEM}\nThe person creating this project is ${session.fullName} <${session.email}>. Include them as a member unless they say otherwise.`,
    );
    return { ok: true, draft };
  } catch (error) {
    console.error("continuePlanChat failed", error);
    return {
      ok: false,
      message: "The model could not return a plan. Try sending that again.",
    };
  }
}

export async function approvePlan(draft: PlanDraft): Promise<ApprovePlanResult> {
  const session = await requireSession();
  if (!draft.ready_for_review || !draft.project) {
    return { ok: false, message: "The draft is not ready to write." };
  }

  const ownerEmail = session.email.trim().toLowerCase();
  const members: PlanMember[] = [];
  const memberEmails = new Set<string>();
  for (const member of draft.members) {
    const email = realEmail(member.email);
    if (!email || memberEmails.has(email)) continue;
    memberEmails.add(email);
    members.push({ ...member, email });
  }
  if (!memberEmails.has(ownerEmail)) {
    memberEmails.add(ownerEmail);
    members.unshift({
      full_name: session.fullName,
      email: ownerEmail,
      role: "Owner",
      capacity_hours_per_week: 40,
    });
  }

  const unknownOwners = new Set<string>();
  const tasks = draft.tasks.map((task) => {
    const email = realEmail(task.owner_email);
    if (email && !memberEmails.has(email)) unknownOwners.add(email);
    return { ...task, owner_email: memberEmails.has(email) ? email : "" };
  });
  if (unknownOwners.size > 0) {
    return {
      ok: false,
      message: `Tasks assign work to people who are not on the project: ${[...unknownOwners].join(", ")}. Ask me to add them as members, then approve again.`,
    };
  }

  try {
    const projectId = await commitPlan({
      created_by_id: session.personId,
      project: {
        ...draft.project,
        owner_email: ownerEmail,
        status: "planning",
      },
      members,
      phases: draft.phases,
      tasks,
      dependencies: draft.dependencies,
    });
    revalidatePath("/app/projects");
    revalidatePath("/app/executive", "layout");
    return { ok: true, projectId };
  } catch (error) {
    console.error("approvePlan failed", error);
    return { ok: false, message: "Could not write the plan. Try approving again." };
  }
}
