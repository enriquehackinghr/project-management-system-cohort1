"use server";

import {
  getProjectBundle,
  listPeopleForProjects,
  listPhasesForProjects,
  listProjectsForPerson,
  listTasksForProjects,
} from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/admin";
import { completeJson } from "@/lib/openai";
import { detectRisks, type RiskFinding } from "@/lib/risk";
import { radarInterpretationSchema } from "@/lib/schemas";
import { requireSession } from "@/lib/session";
import { parseAsOf } from "@/lib/dates";
import type { TaskDependency } from "@/lib/types";

export type InterpretedRisk = RiskFinding & {
  interpretation: string;
  recommendation: string;
};

export async function loadRadar(projectId: string | null, asOfRaw?: string) {
  const session = await requireSession();
  const asOf = parseAsOf(asOfRaw);
  const projects = await listProjectsForPerson(session.personId);
  const scoped = projectId
    ? projects.filter((project) => project.id === projectId)
    : projects;
  if (projectId) {
    await getProjectBundle(projectId, session.personId);
  }
  const ids = scoped.map((project) => project.id);
  const [tasks, phases, people] = await Promise.all([
    listTasksForProjects(ids),
    listPhasesForProjects(ids),
    listPeopleForProjects(ids),
  ]);
  const taskIds = tasks.map((task) => task.id);
  let dependencies: TaskDependency[] = [];
  if (taskIds.length > 0) {
    const { data } = await createAdminClient()
      .from("task_dependencies")
      .select("*")
      .in("predecessor_id", taskIds);
    dependencies = (data ?? []) as TaskDependency[];
  }

  const findings = detectRisks({
    asOf,
    projects: scoped,
    tasks,
    phases,
    people,
    dependencies,
  });

  if (findings.length === 0) {
    return { asOf, findings: [] as InterpretedRisk[] };
  }

  const interpreted = await completeJson(
    radarInterpretationSchema,
    "risk_radar",
    [{ role: "user", content: JSON.stringify({ as_of: asOf, findings }) }],
    "You interpret deterministic project-risk findings. Do not add or drop findings. For each id, write a short interpretation and a concrete recommendation. Detection already happened; you only write.",
  );

  const byId = new Map(
    interpreted.findings.map((item) => [item.id, item]),
  );

  return {
    asOf,
    findings: findings.map((finding) => ({
      ...finding,
      interpretation:
        byId.get(finding.id)?.interpretation ??
        "The rule fired. Review the live records before changing the plan.",
      recommendation:
        byId.get(finding.id)?.recommendation ??
        "Open the board and resolve the blocked or overdue work first.",
    })),
  };
}
