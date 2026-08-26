"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { generateStatusDraft, saveWeeklyStatus } from "@/actions/status";
import { formatDate } from "@/lib/dates";
import type { StatusReport } from "@/lib/types";
import { Card, Pill, PrimaryButton, textareaClass } from "./ui";

export function StatusEngine({
  projectId,
  asOf,
  reports,
}: {
  projectId: string;
  asOf: string;
  reports: StatusReport[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [body, setBody] = useState("");
  const [generated, setGenerated] = useState("");
  const [snapshot, setSnapshot] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  function draft() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await generateStatusDraft(projectId, asOf);
        setBody(result.draft.body);
        setGenerated(result.draft.body);
        setSnapshot(result.snapshot);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not draft status.");
      }
    });
  }

  function save() {
    if (!snapshot || !body) return;
    startTransition(async () => {
      await saveWeeklyStatus({
        projectId,
        asOf,
        generatedBody: generated,
        body,
        snapshot,
      });
      setBody("");
      setGenerated("");
      setSnapshot(null);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-mute">
              Weekly status
            </p>
            <p className="mt-1 text-sm text-mute">As of {formatDate(asOf)}</p>
          </div>
          <PrimaryButton type="button" onClick={draft} disabled={pending}>
            {pending ? "Drafting" : "Draft from live data"}
          </PrimaryButton>
        </div>
        {error ? <p className="mt-3 text-sm text-crust">{error}</p> : null}
        <textarea
          className={`${textareaClass} mt-4 min-h-56`}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="The draft appears here. Edit it before saving."
        />
        <PrimaryButton
          type="button"
          className="mt-4"
          onClick={save}
          disabled={pending || !body || !snapshot}
        >
          Save report
        </PrimaryButton>
      </Card>
      <div className="space-y-3">
        {reports.map((report) => (
          <Card key={report.id}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{formatDate(report.as_of)}</p>
              <Pill>Stored with snapshot</Pill>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-mute">
              {report.body}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
