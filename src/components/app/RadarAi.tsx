"use client";

import { useState, useTransition } from "react";
import { interpretRadar } from "@/actions/radar";
import type { RadarInterpretation } from "@/lib/schemas";
import { Card, Pill, PrimaryButton, SecondaryButton, Spinner } from "./ui";

export type RadarAiScope =
  | { kind: "project"; id: string }
  | { kind: "portfolio"; id: string }
  | { kind: "account" };

export type RadarAiFinding = {
  id: string;
  title: string;
  projectName: string;
};

export function RadarAi({
  scope,
  asOf,
  ownerId,
  findings,
  showProject,
}: {
  scope: RadarAiScope;
  asOf: string;
  ownerId: string | null;
  findings: RadarAiFinding[];
  showProject: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [read, setRead] = useState<RadarInterpretation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const titles = new Map(findings.map((finding) => [finding.id, finding]));

  function run() {
    setError(null);
    startTransition(async () => {
      const result = await interpretRadar({ scope, asOf, ownerId });
      if (result.ok) {
        setRead(result.data);
      } else {
        setRead(null);
        setError(result.error);
      }
    });
  }

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-mute">
              AI read
            </p>
            <Pill>Optional</Pill>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-mute">
            The numbers above are computed from your plan and are always current. Ask
            the model to turn them into a narrative you can send to a stakeholder.
          </p>
        </div>
        {read ? (
          <SecondaryButton type="button" onClick={run} disabled={pending}>
            {pending ? <Spinner /> : "Refresh read"}
          </SecondaryButton>
        ) : (
          <PrimaryButton type="button" onClick={run} disabled={pending}>
            {pending ? (
              <span className="flex items-center gap-2">
                <Spinner />
                Reading the radar
              </span>
            ) : (
              "Get AI read"
            )}
          </PrimaryButton>
        )}
      </div>

      {error ? (
        <p className="mt-4 rounded-xl bg-[#ffe8df] px-4 py-3 text-sm text-[#c43d12]">
          {error}
        </p>
      ) : null}

      {read ? (
        <div className="mt-5 border-t border-flour pt-5">
          <p className="text-lg font-semibold leading-snug tracking-tight">
            {read.headline}
          </p>
          <p className="mt-2 text-sm leading-6">{read.summary}</p>

          {read.findings.length > 0 ? (
            <ul className="mt-5 space-y-4">
              {read.findings.map((item) => {
                const finding = titles.get(item.id);
                return (
                  <li key={item.id} className="border-l-2 border-flour pl-4">
                    <p className="text-sm font-medium">
                      {finding?.title ?? "Finding"}
                    </p>
                    {showProject && finding ? (
                      <p className="text-[12px] text-mute">{finding.projectName}</p>
                    ) : null}
                    <p className="mt-1.5 text-sm leading-6 text-mute">
                      {item.interpretation}
                    </p>
                    <p className="mt-1 text-sm font-medium text-crust">
                      {item.recommendation}
                    </p>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
