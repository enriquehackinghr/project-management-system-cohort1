"use server";

import { z } from "zod";
import { parseAsOf } from "@/lib/dates";
import { completeJson } from "@/lib/openai";
import { buildRadarSnapshot, radarPromptPayload } from "@/lib/radar";
import {
  radarInterpretationSchema,
  type RadarInterpretation,
} from "@/lib/schemas";
import { requireSession } from "@/lib/session";

const scopeInput = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("project"), id: z.uuid() }),
  z.object({ kind: z.literal("portfolio"), id: z.uuid() }),
  z.object({ kind: z.literal("account") }),
]);

const requestInput = z.object({
  scope: scopeInput,
  asOf: z.string().optional(),
  ownerId: z.uuid().nullable().optional(),
});

export type RadarInterpretationResult =
  | { ok: true; data: RadarInterpretation }
  | { ok: false; error: string };

const INSTRUCTIONS = [
  "You read a deterministic project risk radar and write the narrative around it.",
  "Detection already happened. Never invent, drop, or re-score a finding.",
  "headline: one sentence, under 90 characters, naming the single biggest exposure.",
  "summary: two or three sentences a delivery lead can paste into an update. Reference the concrete numbers you were given.",
  "findings: for every id you receive, write a short interpretation of why it matters here and one concrete recommendation.",
  "Be specific and plain. No hedging, no bullet lists, no markdown.",
].join(" ");

/** Findings sent to the model, capped so a large portfolio stays inside a sane prompt. */
const MAX_FINDINGS = 40;

export async function interpretRadar(
  raw: unknown,
): Promise<RadarInterpretationResult> {
  const session = await requireSession();

  const parsed = requestInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "That radar request was not valid." };
  }

  // The client sends only a scope reference. Everything the model sees is
  // re-derived here through the access-checked loaders.
  const snapshot = await buildRadarSnapshot({
    scope: parsed.data.scope,
    personId: session.personId,
    asOf: parseAsOf(parsed.data.asOf),
    ownerId: parsed.data.ownerId ?? null,
  });

  if (!snapshot) {
    return { ok: false, error: "You do not have access to that work." };
  }

  if (snapshot.findings.length === 0) {
    return {
      ok: true,
      data: {
        headline: "No rule fired on this radar.",
        summary: `Nothing is overdue, blocked, or over capacity as of ${snapshot.asOf}. Keep the due dates current so the radar stays honest.`,
        findings: [],
      },
    };
  }

  const payload = radarPromptPayload({
    ...snapshot,
    findings: snapshot.findings.slice(0, MAX_FINDINGS),
  });

  try {
    const interpreted = await completeJson(
      radarInterpretationSchema,
      "risk_radar",
      [{ role: "user", content: JSON.stringify(payload) }],
      INSTRUCTIONS,
    );

    const allowed = new Set(payload.findings.map((finding) => finding.id));
    return {
      ok: true,
      data: {
        headline: interpreted.headline,
        summary: interpreted.summary,
        findings: interpreted.findings.filter((finding) => allowed.has(finding.id)),
      },
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "The model could not read this radar.",
    };
  }
}
