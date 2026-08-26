import {
  AssistantMock,
  BoardMock,
  PlanMock,
  RadarMock,
  WorkspaceFrame,
} from "./ProductMocks";
import {
  MiniApprove,
  MiniBoard,
  MiniChat,
  MiniDashboard,
  MiniDocs,
  MiniPortfolio,
  MiniTimeline,
} from "./Visuals";
import { SectionIntro } from "./SectionIntro";

const bento = [
  {
    title: "Two paths, one schema",
    body: "A form for the fallback. A chat panel — and document drop — for the brief you can say out loud. Both write identical rows.",
    span: "lg:col-span-4",
    visual: "chat" as const,
  },
  {
    title: "Human approval before write",
    body: "The plan renders as an editable draft that is not yet saved. You rename, reassign, move dates, then approve. One transaction.",
    span: "lg:col-span-4",
    visual: "approve" as const,
  },
  {
    title: "Documents as source material",
    body: "Drop a PDF, Word doc, Markdown, or notes. Goals, phases, owners, and dates are extracted from the file.",
    span: "lg:col-span-4",
    visual: "docs" as const,
  },
  {
    title: "Kanban that is a query",
    body: "Columns by status. Drag a card, update the record. The board does not keep its own copy of the project.",
    span: "lg:col-span-3",
    visual: "board" as const,
  },
  {
    title: "Timeline with dependency arrows",
    body: "Gantt-style bars from start and due dates, grouped by phase. Blocked work is visible before it is overdue.",
    span: "lg:col-span-3",
    visual: "timeline" as const,
  },
  {
    title: "Portfolios",
    body: "Group projects. Run a combined board and timeline. Color-coded cards. Status changes write back to each project.",
    span: "lg:col-span-3",
    visual: "portfolio" as const,
  },
  {
    title: "Dashboards with an as-of date",
    body: "Progress, burn against the calendar, team load, open risk. Printed dates so two pages cannot disagree about late.",
    span: "lg:col-span-3",
    visual: "dashboard" as const,
  },
];

function BentoVisual({ kind }: { kind: (typeof bento)[number]["visual"] }) {
  if (kind === "chat") return <MiniChat />;
  if (kind === "docs") return <MiniDocs />;
  if (kind === "approve") return <MiniApprove />;
  if (kind === "board") return <MiniBoard />;
  if (kind === "timeline") return <MiniTimeline />;
  if (kind === "portfolio") return <MiniPortfolio />;
  return <MiniDashboard />;
}

export function Features() {
  return (
    <section id="features" className="px-5 py-20 sm:px-8 sm:py-28 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <SectionIntro
          eyebrow="In the product"
          title="Task tracking is the floor. The product is everything after."
        />

        <div className="mt-14 grid gap-4 lg:grid-cols-12">
          {bento.map((item) => (
            <article
              key={item.title}
              className={`rounded-[28px] border border-flour bg-foam/70 p-7 sm:p-8 ${item.span}`}
            >
              <h3 className="text-xl font-semibold tracking-tight">{item.title}</h3>
              <p className="mt-3 text-[15px] leading-7 text-mute">{item.body}</p>
              <BentoVisual kind={item.visual} />
            </article>
          ))}
        </div>

        <div className="mt-24 grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-sm font-medium text-crust">From a sentence or a file</p>
            <h3 className="mt-4 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              Drop the brief. Approve the plan.
            </h3>
            <p className="mt-5 text-lg leading-8 text-mute">
              The AI path is a full-screen chat. You can talk, attach a SOW, or both.
              The draft stays local until you hit approve. Then phases, tasks, members,
              and dependencies land in one write.
            </p>
          </div>
          <PlanMock />
        </div>

        <div className="mt-24 grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="lg:order-2">
            <p className="text-sm font-medium text-crust">Portfolios</p>
            <h3 className="mt-4 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              Several projects. One operating picture.
            </h3>
            <p className="mt-5 text-lg leading-8 text-mute">
              Group the work that belongs together. The combined board keeps a color on
              each project. Drag a card and the task updates in its home project — there
              is no second copy to drift.
            </p>
          </div>
          <div className="lg:order-1">
            <WorkspaceFrame name="APAC 2026" active="Board" kind="portfolio">
              <BoardMock portfolio />
            </WorkspaceFrame>
          </div>
        </div>

        <div className="mt-24 grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-sm font-medium text-crust">Status and radar</p>
            <h3 className="mt-4 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              The week, written from live data.
            </h3>
            <p className="mt-5 text-lg leading-8 text-mute">
              Status drafts what moved, what slipped, and what needs a decision.
              Radar fires on overdue work, blocked chains, over-capacity owners, silent
              projects, and slipped phases. Rules find the signal. The model writes the
              interpretation.
            </p>
          </div>
          <WorkspaceFrame name="Singapore market entry" active="Risks">
            <RadarMock />
          </WorkspaceFrame>
        </div>

        <div className="mt-24 grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="lg:order-2">
            <p className="text-sm font-medium text-crust">Project assistant</p>
            <h3 className="mt-4 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              Ask the live data. Confirm before it writes.
            </h3>
            <p className="mt-5 text-lg leading-8 text-mute">
              A chat panel scoped to the project. It answers from current records and
              can create, reassign, or reschedule tasks. Every write action requires
              confirmation in the interface — the same rule as planning.
            </p>
          </div>
          <div className="mx-auto w-full max-w-md lg:order-1">
            <AssistantMock />
          </div>
        </div>
      </div>
    </section>
  );
}
