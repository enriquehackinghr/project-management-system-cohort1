"use client";

import { useState } from "react";
import {
  BoardMock,
  DashboardMock,
  PlanMock,
  PortfolioOverviewMock,
  RadarMock,
  StatusMock,
  TimelineMock,
  WorkspaceFrame,
} from "./ProductMocks";
import { HeroCollage } from "./Visuals";
import { SectionIntro } from "./SectionIntro";

const tabs = [
  {
    id: "plan",
    label: "AI plan",
    kicker: "Conversation or a document in. Structured plan out.",
    copy: "Describe the goal, timeline, budget, and who owns what — or drop a brief. Baguette returns phases, tasks, owners, estimates, and dependencies as an editable draft. Names come from the people you named or the files you attached. The model does not invent a roster.",
  },
  {
    id: "board",
    label: "Board",
    kicker: "Status columns. Drag writes the row.",
    copy: "Ready, in progress, blocked, done. Cards show owner, due date, and priority. Move a card and the task record updates. The board is a query, not a second copy of the work.",
  },
  {
    id: "timeline",
    label: "Timeline",
    kicker: "Dates and arrows, not a slide.",
    copy: "Bars are drawn from start and due dates, grouped by phase. Predecessor and successor pairs are first-class, so blocked work is visible before it is overdue.",
  },
  {
    id: "dashboard",
    label: "Dashboard",
    kicker: "Progress, burn, load — as of a date you can print.",
    copy: "Completion against the plan, calendar elapsed against the target, open risks, and hours by owner. As-of dates stay on the page, so Wednesday’s dashboard and Friday’s status do not disagree about what late means.",
  },
  {
    id: "radar",
    label: "Risks",
    kicker: "Rules detect. The model writes what to do.",
    copy: "Overdue work, blocked predecessors, owners above capacity, silent projects, slipped phases. Detection is deterministic. Interpretation and the recommendation are written on top.",
  },
  {
    id: "status",
    label: "Status",
    kicker: "The update you stop writing by hand.",
    copy: "One button drafts what moved, what slipped, what is next, and what needs a decision. You edit it. It is stored with the snapshot it was written from.",
  },
  {
    id: "portfolio",
    label: "Portfolio",
    kicker: "Several projects. One board. One timeline.",
    copy: "Group the work that belongs together. Color-coded cards on a combined board, a combined Gantt, and status changes that write back to each project.",
  },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function ProductShowcase() {
  const [active, setActive] = useState<TabId>("plan");
  const current = tabs.find((tab) => tab.id === active) ?? tabs[0];

  return (
    <section id="product" className="px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <HeroCollage />

        <div className="mt-20 sm:mt-24">
        <SectionIntro
          eyebrow="The system"
          title="One set of records. Every view the team actually uses."
          body="Create the plan in chat, from a document, or by form. Downstream does not know which path you used. Board, timeline, dashboard, radar, and status are reads against the same tables."
        />

        <div className="mt-10 flex justify-center">
          <div className="flex max-w-full gap-1 overflow-x-auto rounded-full bg-foam p-1.5">
            {tabs.map((tab) => {
              const selected = tab.id === active;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActive(tab.id)}
                  aria-pressed={selected}
                  className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
                    selected ? "bg-white text-ink shadow-sm" : "text-mute hover:text-ink"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-2xl text-center">
          <p className="text-sm font-medium text-crust">{current.kicker}</p>
          <p className="mt-3 text-[15px] leading-7 text-mute">{current.copy}</p>
        </div>

        <div className="mt-10" aria-live="polite">
          {active === "plan" ? <PlanMock /> : null}
          {active === "board" ? (
            <WorkspaceFrame name="Singapore market entry" active="Board">
              <BoardMock />
            </WorkspaceFrame>
          ) : null}
          {active === "timeline" ? (
            <WorkspaceFrame name="Singapore market entry" active="Timeline">
              <TimelineMock />
            </WorkspaceFrame>
          ) : null}
          {active === "dashboard" ? (
            <WorkspaceFrame name="Singapore market entry" active="Dashboard">
              <DashboardMock />
            </WorkspaceFrame>
          ) : null}
          {active === "radar" ? (
            <WorkspaceFrame name="Singapore market entry" active="Risks">
              <RadarMock />
            </WorkspaceFrame>
          ) : null}
          {active === "status" ? (
            <WorkspaceFrame name="Singapore market entry" active="Status">
              <StatusMock />
            </WorkspaceFrame>
          ) : null}
          {active === "portfolio" ? (
            <WorkspaceFrame name="APAC 2026" active="Overview" kind="portfolio">
              <PortfolioOverviewMock />
            </WorkspaceFrame>
          ) : null}
        </div>
        </div>
      </div>
    </section>
  );
}
