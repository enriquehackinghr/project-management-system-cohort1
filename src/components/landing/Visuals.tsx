import type { ReactNode } from "react";

function Chip({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white px-3.5 py-2.5 text-[12px] font-medium text-ink shadow-[0_12px_40px_rgba(0,0,0,0.28)] ${className}`}
    >
      {children}
    </div>
  );
}

function Avatar({ initials, color }: { initials: string; color: string }) {
  return (
    <span
      className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-semibold text-white"
      style={{ backgroundColor: color }}
    >
      {initials}
    </span>
  );
}

export function HeroOrbit() {
  return (
    <div className="pointer-events-none absolute inset-0 hidden xl:block" aria-hidden="true">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1200 800" fill="none" preserveAspectRatio="none">
        <path
          d="M80 160C260 80 460 120 600 180C780 250 960 140 1120 200"
          stroke="rgba(224,78,27,0.38)"
          strokeWidth="1.5"
          strokeDasharray="6 8"
        />
        <path
          d="M60 620C240 540 420 680 600 600C800 500 980 640 1140 560"
          stroke="rgba(255,180,90,0.28)"
          strokeWidth="1.5"
          strokeDasharray="6 8"
        />
      </svg>

      <Chip className="absolute left-[4%] top-[14%] flex items-center gap-2">
        <span className="rounded-md bg-foam px-2 py-0.5 font-medium">SOW.pdf</span>
        Extracted
      </Chip>
      <Chip className="absolute right-[4%] top-[14%] flex items-center gap-2">
        <span className="font-semibold text-crust">2.1×</span>
        Mei over capacity
      </Chip>
      <Chip className="absolute left-[5%] top-[38%] flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-olive" />
        Plan approved
      </Chip>
      <Chip className="absolute right-[5%] top-[36%] flex items-center gap-2">
        <Avatar initials="PS" color="#e04e1b" />
        Priya · Partnerships
      </Chip>
      <Chip className="absolute left-[4%] top-[68%] max-w-[220px] leading-5">
        Singapore market entry, 12 weeks.
      </Chip>
      <Chip className="absolute right-[4%] top-[68%] flex items-center gap-2">
        <span className="rounded-full bg-[#ffe8df] px-2 py-0.5 text-[10px] text-[#c43d12]">
          Blocked
        </span>
        EOR contract
      </Chip>
    </div>
  );
}

export function MiniDocs() {
  return (
    <div className="mt-6 space-y-2">
      {["singapore-entry-sow.pdf", "hiring-plan.docx", "notes.md"].map((name, index) => (
        <div
          key={name}
          className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-[12px] shadow-sm"
          style={{ marginLeft: index * 8 }}
        >
          <span className="h-7 w-5 rounded-sm bg-[#ffe8df]" />
          <span className="truncate font-medium">{name}</span>
        </div>
      ))}
    </div>
  );
}

export function MiniApprove() {
  return (
    <div className="mt-6 rounded-2xl bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between text-[11px]">
        <span className="font-medium">Draft · 5 phases</span>
        <span className="rounded-full bg-[#fff4d5] px-2 py-0.5 text-[#c47d00]">Not written</span>
      </div>
      <div className="h-9 rounded-full bg-crust text-center text-[12px] font-semibold leading-9 text-white">
        Approve and write
      </div>
    </div>
  );
}

export function MiniBoard() {
  return (
    <div className="mt-6 grid grid-cols-3 gap-1.5">
      {[
        ["Ready", "bg-[#e3f0ff]"],
        ["Doing", "bg-[#fff4d5]"],
        ["Done", "bg-[#e8f8f0]"],
      ].map(([name, tint]) => (
        <div key={name} className={`rounded-xl p-1.5 ${tint}`}>
          <p className="mb-1.5 text-[9px] font-semibold">{name}</p>
          <div className="h-8 rounded-lg bg-white shadow-sm" />
          <div className="mt-1 h-6 rounded-lg bg-white/80" />
        </div>
      ))}
    </div>
  );
}

export function MiniTimeline() {
  return (
    <div className="mt-6 space-y-2 rounded-2xl bg-white p-3 shadow-sm">
      {[
        ["18%", "32%", "bg-olive"],
        ["42%", "28%", "bg-crust"],
        ["68%", "22%", "bg-[#c5cad6]"],
      ].map(([left, width, color], index) => (
        <div key={index} className="relative h-3 rounded-full bg-foam">
          <span className={`absolute top-0.5 h-2 rounded-full ${color}`} style={{ left, width }} />
        </div>
      ))}
    </div>
  );
}

export function MiniPortfolio() {
  return (
    <div className="mt-6 space-y-2">
      {[
        ["Singapore market entry", "#e04e1b", "41%"],
        ["Entity setup", "#2563eb", "62%"],
      ].map(([name, color, pct]) => (
        <div key={name} className="rounded-xl bg-white px-3 py-2 shadow-sm">
          <div className="flex items-center gap-2 text-[12px] font-medium">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            {name}
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-foam">
            <div className="h-full rounded-full bg-crust" style={{ width: pct }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MiniDashboard() {
  return (
    <div className="mt-6 grid grid-cols-3 gap-1.5">
      {[
        ["28%", "Done"],
        ["22%", "Burn"],
        ["3", "Risks"],
      ].map(([value, label]) => (
        <div key={label} className="rounded-xl bg-white px-2 py-2.5 text-center shadow-sm">
          <p className="text-lg font-semibold tracking-tight">{value}</p>
          <p className="text-[10px] text-mute">{label}</p>
        </div>
      ))}
    </div>
  );
}

export function MiniChat() {
  return (
    <div className="mt-6 space-y-2">
      <div className="ml-6 rounded-2xl bg-white px-3 py-2 text-[11px] leading-4 shadow-sm">
        Who is over capacity?
      </div>
      <div className="mr-4 rounded-2xl bg-[#fff1ea] px-3 py-2 text-[11px] leading-4">
        Mei Lin at 2.1×. Confirm before I write.
      </div>
    </div>
  );
}

export function StepVisual({ step }: { step: "talk" | "plan" | "approve" | "run" }) {
  if (step === "talk") return <MiniDocs />;
  if (step === "plan") return <MiniTimeline />;
  if (step === "approve") return <MiniApprove />;
  return <MiniBoard />;
}

export function HeroCollage() {
  return (
    <div className="relative mx-auto max-w-6xl">
      <div className="overflow-hidden rounded-[28px] border border-flour bg-white shadow-[0_24px_80px_rgba(31,33,40,0.12)]">
        <HeroPlanStage />
      </div>
      <div className="absolute -left-3 top-10 hidden w-52 rotate-[-6deg] xl:block">
        <div className="rounded-2xl border border-flour bg-white p-3 shadow-[0_18px_40px_rgba(31,33,40,0.12)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-mute">Ready</p>
          <div className="mt-2 rounded-xl bg-[#e3f0ff] p-2.5">
            <p className="text-[12px] font-medium">Entity registration pack</p>
            <p className="mt-1 text-[11px] text-mute">Daniel · High</p>
          </div>
        </div>
      </div>
      <div className="absolute -right-2 bottom-8 hidden w-56 rotate-[5deg] xl:block">
        <div className="overflow-hidden rounded-2xl border border-flour bg-white shadow-[0_18px_40px_rgba(31,33,40,0.12)]">
          <div className="bg-crust px-3 py-2 text-[12px] font-semibold text-white">Assistant</div>
          <p className="px-3 py-2.5 text-[12px] leading-5">
            Confirm before I reassign localization freeze.
          </p>
        </div>
      </div>
    </div>
  );
}

function HeroPlanStage() {
  return (
    <div className="grid bg-foam lg:grid-cols-[1.05fr_0.95fr]">
      <div className="flex flex-col p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-crust">
            <svg viewBox="0 0 32 32" className="h-3.5 w-3.5" aria-hidden="true">
              <path
                d="M1.8 16c0-1.5 2.2-3.2 6.4-4.1C11.2 11.2 13.6 10.9 16 10.9s4.8.3 8.2 1c4.2.9 6.4 2.6 6.4 4.1s-2.2 3.2-6.4 4.1c-3.4.7-5.8 1-8.2 1s-4.8-.3-8.2-1C4 19.2 1.8 17.5 1.8 16z"
                fill="#ffffff"
              />
            </svg>
          </span>
          <p className="text-[13px] font-semibold">Baguette</p>
          <span className="text-[11px] text-mute">New project with AI</span>
        </div>
        <div className="mt-4 space-y-3">
          <div className="ml-auto max-w-[90%] rounded-2xl bg-white px-4 py-3 text-[13px] leading-6 shadow-sm">
            Singapore market entry, twelve weeks. Partnerships owns it. Entity and employment
            have to close before the first hire.
            <span className="mt-2 flex">
              <span className="rounded-full bg-foam px-2 py-0.5 text-[11px] font-medium">
                singapore-entry-sow.pdf
              </span>
            </span>
          </div>
          <div className="text-[13px] leading-6 text-ink">
            Drafting five phases from the SOW. Nothing is saved until you approve.
          </div>
        </div>
        <div className="mt-auto flex h-10 items-center rounded-xl border border-flour bg-white px-3 text-[12px] text-mute">
          Add a constraint, or drop another document…
        </div>
      </div>
      <div className="flex flex-col border-t border-flour bg-white lg:border-t-0 lg:border-l">
        <div className="flex items-center justify-between border-b border-flour px-4 py-3">
          <div>
            <p className="text-[13px] font-semibold">Plan draft</p>
            <p className="text-[11px] text-mute">Ready to write</p>
          </div>
          <span className="rounded-full bg-[#fff4d5] px-2.5 py-0.5 text-[10px] font-medium text-[#c47d00]">
            Not written yet
          </span>
        </div>
        <div className="flex-1 space-y-2 p-4">
          {[
            ["01", "Market validation", "Priya Shah"],
            ["02", "Entity and employment", "Daniel Okonkwo"],
            ["03", "Localization readiness", "Mei Lin"],
            ["04", "First hires", "Priya Shah"],
            ["05", "Pilot customer", "Jonah Reed"],
          ].map(([num, name, owner]) => (
            <div key={num} className="flex items-center justify-between rounded-xl bg-foam px-3 py-2">
              <p className="truncate text-[13px] font-medium">
                <span className="mr-2 font-mono text-[10px] text-mute">{num}</span>
                {name}
              </p>
              <span className="hidden text-[11px] text-mute sm:inline">{owner}</span>
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
  );
}
