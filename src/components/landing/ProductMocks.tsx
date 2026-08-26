import type { ReactNode } from "react";

function Mark({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path
        d="M1.8 16c0-1.5 2.2-3.2 6.4-4.1C11.2 11.2 13.6 10.9 16 10.9s4.8.3 8.2 1c4.2.9 6.4 2.6 6.4 4.1s-2.2 3.2-6.4 4.1c-3.4.7-5.8 1-8.2 1s-4.8-.3-8.2-1C4 19.2 1.8 17.5 1.8 16z"
        fill="#ffffff"
      />
      <path
        d="M9.2 13.2l2.6 5.6M13.1 12.8l1.6 6.4M17.3 12.8l-1.6 6.4M21.2 13.2l-2.6 5.6"
        fill="none"
        stroke="#fff4d5"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
    </svg>
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
    mute: "bg-foam text-mute",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function AppChrome({
  children,
  person = "Priya",
}: {
  children: ReactNode;
  person?: string;
}) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-flour bg-foam shadow-[0_28px_80px_rgba(31,33,40,0.12)]">
      <div className="flex h-12 items-center justify-between border-b border-flour/80 bg-white/90 px-4">
        <div className="flex items-center gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-crust">
            <Mark />
          </span>
          <span className="text-[13px] font-semibold tracking-tight">Baguette</span>
          <span className="hidden h-4 w-px bg-flour sm:block" />
          <span className="hidden rounded-full bg-foam px-2.5 py-1 text-[11px] font-medium text-ink sm:inline">
            Projects
          </span>
          <span className="hidden text-[11px] font-medium text-mute sm:inline">Portfolio</span>
        </div>
        <span className="text-[12px] text-mute">{person}</span>
      </div>
      {children}
    </div>
  );
}

const PROJECT_NAV = ["Overview", "Board", "Timeline", "Dashboard", "Risks", "Status"] as const;
const PORTFOLIO_NAV = ["Overview", "Board", "Timeline"] as const;

export function WorkspaceFrame({
  name,
  active,
  kind = "project",
  children,
}: {
  name: string;
  active: string;
  kind?: "project" | "portfolio";
  children: ReactNode;
}) {
  const links = kind === "portfolio" ? PORTFOLIO_NAV : PROJECT_NAV;
  const back = kind === "portfolio" ? "All portfolios" : "All projects";

  return (
    <AppChrome person={kind === "portfolio" ? "Priya" : "Priya"}>
      <div className="flex min-h-[22rem] bg-foam">
        <aside className="hidden w-[188px] shrink-0 flex-col border-r border-flour bg-white px-2.5 py-4 sm:flex">
          <p className="px-2 text-[10px] font-medium text-mute">{back}</p>
          <p className="mt-1.5 px-2 text-[13px] font-semibold leading-snug tracking-tight">{name}</p>
          <nav className="mt-4 space-y-0.5">
            {links.map((label) => (
              <div
                key={label}
                className={`rounded-xl px-3 py-1.5 text-[12px] ${
                  label === active
                    ? "bg-foam font-semibold text-ink"
                    : "font-medium text-mute"
                }`}
              >
                {label}
              </div>
            ))}
          </nav>
        </aside>
        <div className="min-w-0 flex-1 overflow-hidden p-3 sm:p-4">{children}</div>
      </div>
    </AppChrome>
  );
}

export function PlanMock() {
  return (
    <AppChrome>
      <div className="grid min-h-[22rem] bg-foam lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col p-4 sm:p-5">
          <p className="text-[11px] font-medium text-crust">New project with AI</p>
          <div className="mt-4 space-y-3">
            <div className="ml-auto max-w-[90%] rounded-2xl bg-white px-4 py-3 text-[13px] leading-6">
              Singapore market entry, twelve weeks. Partnerships owns it. Entity
              and employment have to close before the first hire.
              <span className="mt-2 flex items-center gap-2 text-[11px] text-mute">
                <span className="inline-flex items-center rounded-full bg-foam px-2 py-0.5 font-medium text-ink">
                  singapore-entry-sow.pdf
                </span>
              </span>
            </div>
            <div className="text-[13px] leading-6 text-ink">
              Drafting five phases from the SOW, owners from the people you named,
              and the dependency that blocks first hire. Nothing is saved until you
              approve.
            </div>
          </div>
          <div className="mt-auto flex items-center gap-2 rounded-xl border border-flour bg-white px-3 py-2.5 text-[12px] text-mute">
            Add a constraint, or drop another document…
          </div>
        </div>
        <div className="flex flex-col border-t border-flour bg-white lg:border-t-0 lg:border-l">
          <div className="flex items-center justify-between border-b border-flour px-4 py-3">
            <div>
              <p className="text-[13px] font-semibold">Plan draft</p>
              <p className="text-[11px] text-mute">Ready to write</p>
            </div>
            <Pill tone="wheat">Not written yet</Pill>
          </div>
          <div className="flex-1 space-y-2 p-4">
            {[
              ["01", "Market validation", "Priya Shah", "2 wks"],
              ["02", "Entity and employment", "Daniel Okonkwo", "3 wks"],
              ["03", "Localization readiness", "Mei Lin", "2 wks"],
              ["04", "First hires", "Priya Shah", "3 wks"],
              ["05", "Pilot customer", "Jonah Reed", "2 wks"],
            ].map(([num, name, owner, time]) => (
              <div key={num} className="flex items-center justify-between gap-2 rounded-xl bg-foam px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium">
                    <span className="mr-2 font-mono text-[10px] text-mute">{num}</span>
                    {name}
                  </p>
                  <p className="truncate text-[11px] text-mute">{owner}</p>
                </div>
                <span className="shrink-0 text-[11px] text-mute">{time}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-flour p-3">
            <div className="flex h-10 items-center justify-center rounded-full bg-crust text-[13px] font-semibold text-white">
              Approve and write plan
            </div>
          </div>
        </div>
      </div>
    </AppChrome>
  );
}

export function BoardMock({ portfolio = false }: { portfolio?: boolean }) {
  const columns = [
    {
      name: "Ready",
      tint: "bg-[#e3f0ff]",
      cards: [
        ["Entity registration pack", "Daniel", "High", "#2563eb", "Entity setup"],
        ["Pilot customer shortlist", "Jonah", "Med", "#e04e1b", "Singapore market entry"],
      ],
    },
    {
      name: "In progress",
      tint: "bg-[#fff4d5]",
      cards: [
        ["Market interviews × 12", "Priya", "High", "#e04e1b", "Singapore market entry"],
        ["Offer letter templates", "Mei", "Med", "#2563eb", "Entity setup"],
      ],
    },
    {
      name: "Blocked",
      tint: "bg-[#ffe8df]",
      cards: [["EOR contract", "Daniel", "High", "#2563eb", "Entity setup"]],
    },
    {
      name: "Done",
      tint: "bg-[#e8f8f0]",
      cards: [["Kickoff brief", "Priya", "Low", "#e04e1b", "Singapore market entry"]],
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
      {columns.map((column) => (
        <div key={column.name} className={`rounded-2xl border border-flour/80 p-2.5 ${column.tint}`}>
          <div className="mb-2 flex items-center justify-between px-1">
            <p className="text-[11px] font-semibold">{column.name}</p>
            <span className="text-[11px] text-mute">{column.cards.length}</span>
          </div>
          <div className="space-y-2">
            {column.cards.map(([title, owner, priority, color, project]) => (
              <div
                key={title}
                className="rounded-xl border border-flour/70 bg-white p-2.5 shadow-sm"
                style={{ borderLeftWidth: portfolio ? 4 : undefined, borderLeftColor: portfolio ? color : undefined }}
              >
                {portfolio ? (
                  <p className="mb-1 truncate text-[10px] font-medium" style={{ color }}>
                    {project}
                  </p>
                ) : null}
                <p className="text-[12px] font-medium leading-snug">{title}</p>
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-mute">{owner}</span>
                  <Pill tone={priority === "High" ? "crust" : priority === "Med" ? "wheat" : "mute"}>
                    {priority}
                  </Pill>
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
    ["Market validation", "8%", "28%", "bg-olive"],
    ["Entity setup", "34%", "26%", "bg-crust"],
    ["Localization", "52%", "20%", "bg-[#c5cad6]"],
    ["First hires", "64%", "24%", "bg-[#c47d00]"],
    ["Pilot customer", "78%", "16%", "bg-[#c5cad6]"],
  ];

  return (
    <div className="rounded-2xl border border-flour bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-mute">
          Grouped by phase
        </p>
        <p className="font-mono text-[11px] text-mute">W1 — W12</p>
      </div>
      <div className="space-y-3.5">
        {rows.map(([name, left, width, color], index) => (
          <div key={name} className="grid grid-cols-[7.5rem_1fr] items-center gap-3">
            <p className="truncate text-[12px] text-ink">{name}</p>
            <div className="relative h-7 rounded-lg bg-foam">
              <div className={`absolute top-1.5 h-4 rounded-md ${color}`} style={{ left, width }} />
              {index === 1 ? (
                <div
                  className="absolute top-1/2 h-px w-[24%] -translate-y-1/2 bg-mute/35"
                  style={{ left: "58%" }}
                />
              ) : null}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[12px] text-mute">
        Dependency: entity registration → first hire start date
      </p>
    </div>
  );
}

export function DashboardMock() {
  return (
    <div className="space-y-3">
      <div className="grid gap-2.5 sm:grid-cols-3">
        {[
          ["Progress", "28%", "4 of 14 tasks done"],
          ["Burn vs timeline", "22%", "Calendar elapsed"],
          ["Open risks", "3", "5 phases in the plan"],
        ].map(([label, value, note]) => (
          <div key={label} className="rounded-2xl border border-flour bg-white p-3.5">
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-mute">{label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
            <p className="mt-1 text-[11px] text-mute">{note}</p>
            {label !== "Open risks" ? (
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-flour">
                <div
                  className="h-full rounded-full bg-crust"
                  style={{ width: label === "Progress" ? "28%" : "22%" }}
                />
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-2xl border border-flour bg-white">
        <div className="grid grid-cols-4 bg-foam px-3 py-2 text-[10px] font-medium uppercase tracking-[0.12em] text-mute">
          <span>Owner</span>
          <span>Open hours</span>
          <span>Capacity</span>
          <span>Overdue</span>
        </div>
        {[
          ["Priya Shah", "18", "32h", "0"],
          ["Mei Lin", "41", "20h", "2"],
          ["Daniel Okonkwo", "22", "32h", "1"],
        ].map(([name, hours, cap, overdue]) => (
          <div key={name} className="grid grid-cols-4 border-t border-flour px-3 py-2 text-[12px]">
            <span className="font-medium">{name}</span>
            <span className={hours === "41" ? "font-semibold text-crust" : ""}>{hours}</span>
            <span>{cap}</span>
            <span>{overdue}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RadarMock() {
  const risks = [
    ["slipped phase", "Market validation closed 16 days ago with 4 tasks still open.", "Close or replan the phase before hiring starts."],
    ["over capacity", "Mei Lin is at 2.1× load across two projects.", "Move localization freeze off Mei this week."],
    ["blocked predecessor", "EOR contract incomplete. Four downstream tasks cannot start.", "Unblock entity setup before the hire date moves."],
    ["silent project", "No task updated in 31 days on the governance programme.", "Ask the owner for a status or park the work."],
  ];

  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {risks.map(([kind, title, rec]) => (
        <div key={kind} className="rounded-2xl border border-flour bg-white p-3.5">
          <Pill tone="crust">{kind}</Pill>
          <p className="mt-2 text-[13px] font-semibold leading-snug">{title}</p>
          <p className="mt-2 text-[12px] font-medium text-crust">{rec}</p>
        </div>
      ))}
    </div>
  );
}

export function StatusMock() {
  return (
    <div className="rounded-2xl border border-flour bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-mute">
            Weekly status
          </p>
          <p className="mt-1 font-mono text-[11px] text-mute">As of 24 Aug 2026 · snapshot stored</p>
        </div>
        <Pill tone="olive">Draft</Pill>
      </div>
      <div className="space-y-3 text-[13px] leading-6 text-ink">
        <p>
          <span className="font-semibold">Moved.</span> Market interviews are 8 of 12 complete.
          Kickoff brief signed.
        </p>
        <p>
          <span className="font-semibold">Slipped.</span> Entity registration is still open, so
          the hire date cannot move.
        </p>
        <p>
          <span className="font-semibold">Next.</span> Close the EOR contract. Freeze localization
          strings after entity setup.
        </p>
        <p>
          <span className="font-semibold">Needs a decision.</span> Start the AE search now, or wait
          until registration is filed.
        </p>
      </div>
      <div className="mt-5 flex h-10 w-fit items-center rounded-full bg-crust px-4 text-[13px] font-semibold text-white">
        Save weekly status
      </div>
    </div>
  );
}

export function PortfolioOverviewMock() {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-flour bg-white p-4">
        <p className="text-[12px] text-mute">Portfolio</p>
        <p className="mt-1 text-lg font-semibold tracking-tight">APAC 2026</p>
        <p className="mt-1 text-[12px] leading-5 text-mute">
          Combined board and timeline. Moving a card here updates the same task inside the project.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            ["Projects", "2"],
            ["Tasks", "9/22"],
            ["Complete", "41%"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-foam px-2.5 py-2">
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-mute">{label}</p>
              <p className="mt-0.5 text-[15px] font-semibold">{value}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-flour bg-white">
        {[
          ["Singapore market entry", "#e04e1b", "Active", "4/14"],
          ["Entity setup", "#2563eb", "Active", "5/8"],
        ].map(([name, color, status, done]) => (
          <div key={name} className="flex items-center justify-between gap-3 border-t border-flour px-4 py-2.5 first:border-t-0">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="truncate text-[13px] font-medium">{name}</span>
            </div>
            <span className="text-[11px] text-mute">
              {status} · {done} done
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AssistantMock() {
  return (
    <div className="overflow-hidden rounded-[24px] border border-flour bg-white shadow-[0_18px_48px_rgba(31,33,40,0.16)]">
      <div className="flex items-center gap-3 bg-crust px-4 py-3 text-white">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
          <svg viewBox="0 0 32 32" className="h-5 w-5" aria-hidden="true">
            <path
              d="M1.8 16c0-1.5 2.2-3.2 6.4-4.1C11.2 11.2 13.6 10.9 16 10.9s4.8.3 8.2 1c4.2.9 6.4 2.6 6.4 4.1s-2.2 3.2-6.4 4.1c-3.4.7-5.8 1-8.2 1s-4.8-.3-8.2-1C4 19.2 1.8 17.5 1.8 16z"
              fill="#FFF4D5"
            />
            <path
              d="M9.2 13.2l2.6 5.6M13.1 12.8l1.6 6.4M17.3 12.8l-1.6 6.4M21.2 13.2l-2.6 5.6"
              fill="none"
              stroke="#C43D12"
              strokeLinecap="round"
              strokeWidth="1.7"
            />
          </svg>
        </span>
        <div>
          <p className="text-[14px] font-semibold leading-5">Assistant</p>
          <p className="text-[11px] text-white/80">Singapore market entry</p>
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div className="rounded-2xl bg-foam px-3.5 py-3 text-[13px] leading-6">
          Who is over capacity this week, and what can we move?
        </div>
        <div className="rounded-2xl bg-[#fff1ea] px-3.5 py-3 text-[13px] leading-6">
          Mei Lin is at 2.1×. I can reassign “localization string freeze” to Jonah Reed.
        </div>
        <div className="rounded-xl border border-flour px-3 py-2.5">
          <p className="text-[12px] leading-5">Reassign localization string freeze to Jonah Reed.</p>
          <div className="mt-2 flex gap-2">
            <span className="inline-flex h-8 items-center rounded-full border border-flour px-3 text-[11px] text-mute">
              Dismiss
            </span>
            <span className="inline-flex h-8 items-center rounded-full bg-crust px-3 text-[11px] font-semibold text-white">
              Confirm write
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DropHint() {
  return (
    <div className="rounded-3xl border-2 border-dashed border-crust/50 bg-white/90 px-6 py-8 text-center shadow-sm">
      <p className="text-lg font-semibold tracking-tight">Drop a brief anywhere</p>
      <p className="mt-2 text-[13px] leading-6 text-mute">
        PDF, Word, Markdown, text, CSV, JSON, or HTML. Up to 8 files.
      </p>
    </div>
  );
}
