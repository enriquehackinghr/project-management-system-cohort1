import { formatDate } from "@/lib/dates";
import type { InterpretedRisk } from "@/actions/radar";
import { Card, Pill } from "./ui";

export function RiskRadar({
  asOf,
  findings,
}: {
  asOf: string;
  findings: InterpretedRisk[];
}) {
  if (findings.length === 0) {
    return (
      <p className="text-sm text-mute">
        No rule fired as of {formatDate(asOf)}. Overdue work, blocked predecessors,
        over-capacity owners, silent projects, and slipped phases will appear here.
      </p>
    );
  }

  return (
    <div className="grid gap-4">
      {findings.map((finding) => (
        <Card key={finding.id}>
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone={finding.severity === "high" ? "crust" : "wheat"}>
              {finding.kind.replace(/_/g, " ")}
            </Pill>
            <span className="text-sm text-mute">{finding.projectName}</span>
          </div>
          <p className="mt-3 text-lg font-semibold tracking-tight">{finding.title}</p>
          <p className="mt-1 text-sm text-mute">{finding.detail}</p>
          <p className="mt-4 text-sm leading-6">{finding.interpretation}</p>
          <p className="mt-2 text-sm font-medium text-crust">{finding.recommendation}</p>
        </Card>
      ))}
    </div>
  );
}
