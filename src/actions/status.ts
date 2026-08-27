"use server";

import { revalidatePath } from "next/cache";
import {
  getProjectBundle,
  listStatusReports,
  saveStatusReport,
} from "@/lib/db";
import { completeJson } from "@/lib/openai";
import { buildStatusSnapshot } from "@/lib/risk";
import { statusDraftSchema } from "@/lib/schemas";
import { requireSession } from "@/lib/session";
import { parseAsOf } from "@/lib/dates";
import { writeAuditEvent } from "@/lib/audit-store";

export async function generateStatusDraft(projectId: string, asOfRaw?: string) {
  const session = await requireSession();
  const asOf = parseAsOf(asOfRaw);
  const bundle = await getProjectBundle(projectId, session.personId);
  const people = bundle.members.map((member) => member.person).filter(Boolean);
  const snapshot = buildStatusSnapshot({
    asOf,
    project: bundle.project,
    tasks: bundle.tasks,
    people,
    assignees: bundle.assignees,
  });

  const draft = await completeJson(
    statusDraftSchema,
    "status_update",
    [{ role: "user", content: JSON.stringify(snapshot) }],
    "Write a weekly project status from the JSON snapshot only. Do not invent tasks. Body is editable prose: what moved, what slipped, what is next, what needs a decision. Be concise.",
  );

  await writeAuditEvent({
    actorId: session.personId,
    kind: "change",
    action: "status.generated",
    summary: "Generated a weekly status draft",
    projectId,
  });
  return { snapshot, draft, asOf };
}

export async function saveWeeklyStatus(input: {
  projectId: string;
  asOf: string;
  generatedBody: string;
  body: string;
  snapshot: unknown;
}) {
  const session = await requireSession();
  await saveStatusReport({
    projectId: input.projectId,
    personId: session.personId,
    generatedBody: input.generatedBody,
    body: input.body,
    snapshot: input.snapshot,
    asOf: input.asOf,
  });
  revalidatePath(`/app/projects/${input.projectId}/status`);
}

export async function getStatusHistory(projectId: string) {
  const session = await requireSession();
  return listStatusReports(projectId, session.personId);
}
