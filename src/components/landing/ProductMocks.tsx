import type { ReactNode } from "react";

export function ProductFrame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-flour bg-white shadow-[0_24px_80px_rgba(50,51,56,0.08)]">
      <div className="flex items-center justify-between gap-3 border-b border-flour bg-foam px-5 py-3.5">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5ac4]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#ffcb00]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#00c875]" />
        </div>
        <div className="min-w-0 text-center">
          <p className="truncate text-[13px] font-medium text-ink">{title}</p>
          <p className="truncate text-[11px] text-mute">{subtitle}</p>
        </div>
        <div className="w-10" />
      </div>
      <div className="bg-foam/60 p-4 sm:p-6">{children}</div>
    </div>
  );
}

function Pill({
  children,
  tone = "mute",
}: {
  children: ReactNode;
  tone?: "wheat" | "olive" | "crust" | "mute";
}) {
  const tones = {
    wheat: "bg-[#fff4d5] text-[#c47d00]",
    olive: "bg-[#e8f8f0] text-[#00854d]",
    crust: "bg-[#ffe8df] text-[#c43d12]",
    mute: "bg-white text-mute",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function PlanMock() {
  return (
    <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.14em] text-mute">
          Assistant
        </p>
        <div className="space-y-3">
          <div className="rounded-2xl rounded-tl-md bg-foam px-4 py-3 text-[13px] leading-relaxed text-ink">
            Singapore market entry, twelve weeks. Partnerships owns it. Entity
            and employment have to close before the first hire.
          </div>
          <div className="rounded-2xl rounded-tr-md bg-[#fff1ea] px-4 py-3 text-[13px] leading-relaxed text-ink">
            Drafting five phases, owners from your roster, and the dependency
            that blocks first hire. Nothing is saved until you approve.
          </div>
        </div>
        <div className="mt-4 flex h-10 items-center rounded-xl border border-flour px-3 text-[12px] text-mute">
          Add a constraint…
        </div>
      </div>
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-mute">
            Editable draft
          </p>
          <Pill tone="wheat">Not written yet</Pill>
        </div>
        <div className="space-y-2">
          {[
            ["01", "Market validation", "Priya Shah", "2 wks"],
            ["02", "Entity and employment", "Daniel Okonkwo", "3 wks"],
            ["03", "Localization readiness", "Mei Lin", "2 wks"],
            ["04", "First hires", "Priya Shah", "3 wks"],
            ["05", "Pilot customer", "Jonah Reed", "2 wks"],
          ].map(([num, name, owner, time]) => (
            <div
              key={num}
              className="flex items-center justify-between gap-2 rounded-xl bg-foam px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium">
                  <span className="mr-2 text-[11px] text-mute">{num}</span>
                  {name}
                </p>
                <p className="truncate text-[12px] text-mute">{owner}</p>
              </div>
              <span className="shrink-0 text-[11px] text-mute">{time}</span>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="mt-4 flex h-10 w-full items-center justify-center rounded-full bg-crust text-[13px] font-semibold text-white"
        >
          Approve and write plan
        </button>
      </div>
    </div>
  );
}

export function BoardMock() {
  const columns = [
    {
      name: "Ready",
      tint: "bg-[#e3f0ff]",
      cards: [
        ["Entity registration pack", "Daniel", "High"],
        ["Pilot customer shortlist", "Jonah", "Med"],
      ],
    },
    {
      name: "In progress",
      tint: "bg-[#fff4d5]",
      cards: [
        ["Market interviews × 12", "Priya", "High"],
        ["Offer letter templates", "Mei", "Med"],
      ],
    },
    {
      name: "Blocked",
      tint: "bg-[#ffe8df]",
      cards: [["EOR contract", "Daniel", "High"]],
    },
    {
      name: "Done",
      tint: "bg-[#e8f8f0]",
      cards: [["Kickoff brief", "Priya", "Low"]],
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {columns.map((column) => (
        <div key={column.name} className={`rounded-2xl p-3 ${column.tint}`}>
          <div className="mb-3 flex items-center justify-between px-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink">
              {column.name}
            </p>
            <span className="text-[11px] text-mute">{column.cards.length}</span>
          </div>
          <div className="space-y-2">
            {column.cards.map(([title, owner, priority]) => (
              <div key={title} className="rounded-xl bg-white p-3 shadow-sm">
                <p className="text-[13px] font-medium leading-snug">{title}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[12px] text-mute">{owner}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      priority === "High"
                        ? "bg-[#ffe8df] text-[#c43d12]"
                        : "bg-foam text-mute"
                    }`}
                  >
                    {priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function TimelineMock() {
  const rows = [
    ["Market validation", "18%", "32%", "bg-[#579bfc]"],
    ["Entity setup", "38%", "28%", "bg-crust"],
    ["Localization", "52%", "22%", "bg-[#ffcb00]"],
    ["First hires", "64%", "26%", "bg-[#a25ddc]"],
    ["Pilot customer", "78%", "18%", "bg-[#00c875]"],
  ];

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-mute">
          Grouped by phase
        </p>
        <p className="text-[11px] text-mute">W1 — W12</p>
      </div>
      <div className="space-y-4">
        {rows.map(([name, left, width, color], index) => (
          <div key={name} className="grid grid-cols-[8rem_1fr] items-center gap-4">
            <p className="truncate text-[13px] text-ink">{name}</p>
            <div className="relative h-8 rounded-lg bg-foam">
              <div
                className={`absolute top-2 h-4 rounded-md ${color}`}
                style={{ left, width }}
              />
              {index === 1 ? (
                <div
                  className="absolute top-1/2 h-px w-[22%] -translate-y-1/2 bg-mute/40"
                  style={{ left: "58%" }}
                />
              ) : null}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-5 text-[12px] text-mute">
        Dependency: entity registration → first hire start date
      </p>
    </div>
  );
}

export function RadarMock() {
  const risks = [
    ["Slipped phase", "Market validation closed 16 days ago with 4 tasks still open.", "Rules"],
    ["Owner over capacity", "Mei Lin is at 2.1× load across two projects.", "Portfolio"],
    ["Blocked chain", "EOR contract incomplete. Four downstream tasks cannot start.", "Deps"],
    ["Silent project", "No task updated in 31 days on the governance programme.", "Activity"],
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {risks.map(([title, body, tag]) => (
        <div key={title} className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[14px] font-semibold">{title}</p>
            <Pill tone="crust">{tag}</Pill>
          </div>
          <p className="text-[13px] leading-relaxed text-mute">{body}</p>
        </div>
      ))}
    </div>
  );
}

export function StatusMock() {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold">Weekly status</p>
          <p className="mt-1 text-[12px] text-mute">As of 24 Aug 2026 · snapshot stored</p>
        </div>
        <Pill tone="olive">Draft</Pill>
      </div>
      <div className="space-y-4 text-[14px] leading-7 text-ink">
        <p>
          <span className="font-semibold">Moved.</span> Market interviews are 8 of 12
          complete. Kickoff brief signed.
        </p>
        <p>
          <span className="font-semibold">Slipped.</span> Entity registration is still
          open, so the hire date cannot move.
        </p>
        <p>
          <span className="font-semibold">Next.</span> Close the EOR contract. Freeze
          localization strings after entity setup.
        </p>
        <p>
          <span className="font-semibold">Needs a decision.</span> Start the AE search
          now, or wait until registration is filed.
        </p>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <span className="inline-flex h-10 items-center rounded-full bg-crust px-4 text-[13px] font-semibold text-white">
          Edit then send
        </span>
        <span className="inline-flex h-10 items-center rounded-full border border-flour px-4 text-[13px] font-medium text-mute">
          Post to Slack
        </span>
      </div>
    </div>
  );
}

export function AssistantMock() {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-4 space-y-3">
        <div className="rounded-2xl rounded-tl-md bg-foam px-4 py-3 text-[13px] text-ink">
          Who is over capacity this week, and what can we move?
        </div>
        <div className="rounded-2xl rounded-tr-md bg-[#fff1ea] px-4 py-3 text-[13px] leading-relaxed text-ink">
          Mei Lin is at 2.1×. I can reassign “localization string freeze” to Jonah
          Reed. Confirm before I write it.
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <span className="inline-flex h-10 items-center rounded-full bg-crust px-4 text-[13px] font-semibold text-white">
          Confirm write
        </span>
        <span className="inline-flex h-10 items-center rounded-full border border-flour px-4 text-[13px] text-mute">
          Keep as-is
        </span>
      </div>
    </div>
  );
}
