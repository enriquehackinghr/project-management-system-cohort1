"use client";

import { useState } from "react";
import {
  BoardMock,
  PlanMock,
  ProductFrame,
  RadarMock,
  StatusMock,
  TimelineMock,
} from "./ProductMocks";
import { SectionIntro } from "./SectionIntro";

const tabs = [
  {
    id: "plan",
    label: "AI plan",
    title: "Singapore market entry",
    subtitle: "Draft · awaiting approval",
    kicker: "Conversation in. Structured plan out.",
    copy: "Describe the goal, timeline, budget, and who owns what. Baguette asks for anything missing, then returns phases, tasks, owners, estimates, and dependencies as an editable draft. The people list is real roster records. The model does not invent names.",
  },
  {
    id: "board",
    label: "Board",
    title: "Singapore market entry",
    subtitle: "Kanban · live records",
    kicker: "Status columns. Drag writes the row.",
    copy: "Cards show owner, due date, and priority. Move a card and the task record updates. The board is a query, not a second copy of the work.",
  },
  {
    id: "timeline",
    label: "Timeline",
    title: "Singapore market entry",
    subtitle: "Gantt · grouped by phase",
    kicker: "Dates and arrows, not a slide.",
    copy: "Bars are drawn from start and due dates. Phases group the work. Dependency arrows show what cannot start until something else finishes — including the chain that is blocked but not yet overdue.",
  },
  {
    id: "radar",
    label: "Risk radar",
    title: "Portfolio radar",
    subtitle: "Rules detect · model interprets",
    kicker: "Reproducible detection. Written recommendation.",
    copy: "Overdue work, blocked predecessors, owners above capacity, silent projects, phases whose end dates have passed. Rules find the signal so the output is honest. The model writes the interpretation and what to do next.",
  },
  {
    id: "status",
    label: "Weekly status",
    title: "Singapore market entry",
    subtitle: "Generated from live data",
    kicker: "The update you stop writing by hand.",
    copy: "One button drafts what moved, what slipped, what is next, and what needs a decision. You edit it. It is stored with the snapshot it was written from, so Friday’s report and Wednesday’s dashboard agree about what late means.",
  },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function ProductShowcase() {
  const [active, setActive] = useState<TabId>("plan");
  const current = tabs.find((tab) => tab.id === active) ?? tabs[0];

  return (
    <section id="product" className="px-6 py-24 sm:px-10 sm:py-32 lg:py-40">
      <div className="mx-auto max-w-7xl">
        <SectionIntro
          eyebrow="The system"
          title="One project. Five ways to see it."
          body="Board, timeline, dashboards, and radar are reads against the same tables. Create the plan in chat or by form. Downstream does not know which path you used."
        />

        <div className="mt-12 flex justify-center">
          <div className="flex max-w-full gap-2 overflow-x-auto rounded-full bg-foam p-1.5">
            {tabs.map((tab) => {
              const selected = tab.id === active;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActive(tab.id)}
                  aria-pressed={selected}
                  className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                    selected ? "bg-white text-ink shadow-sm" : "text-mute hover:text-ink"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-2xl text-center">
          <p className="text-sm font-medium text-crust">{current.kicker}</p>
          <p className="mt-3 text-[15px] leading-7 text-mute">{current.copy}</p>
        </div>

        <div className="mt-12">
          <ProductFrame title={current.title} subtitle={current.subtitle}>
            {active === "plan" ? <PlanMock /> : null}
            {active === "board" ? <BoardMock /> : null}
            {active === "timeline" ? <TimelineMock /> : null}
            {active === "radar" ? <RadarMock /> : null}
            {active === "status" ? <StatusMock /> : null}
          </ProductFrame>
        </div>
      </div>
    </section>
  );
}
