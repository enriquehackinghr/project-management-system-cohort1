import { StepVisual } from "./Visuals";
import { SectionIntro } from "./SectionIntro";

const steps = [
  {
    n: "01",
    step: "talk" as const,
    title: "Talk, drop a file, or fill in the form",
    body: "Describe the initiative, attach a brief or SOW, or enter it by hand. Manual and AI creation write the same tables.",
  },
  {
    n: "02",
    step: "plan" as const,
    title: "Get a plan, not a paragraph",
    body: "Phases, tasks, owners, estimates, and dependencies come back as structured data. People are never invented.",
  },
  {
    n: "03",
    step: "approve" as const,
    title: "Edit. Then approve.",
    body: "Rename work, reassign owners, move dates. AI proposes. You approve. Only then does the database change.",
  },
  {
    n: "04",
    step: "run" as const,
    title: "Run it from live records",
    body: "Board, timeline, dashboards, weekly status, risk radar, portfolios, and a project assistant. Every view is a query.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="bg-foam px-5 py-20 sm:px-8 sm:py-28 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <SectionIntro
          align="left"
          eyebrow="How it works"
          title="Four steps. Nothing writes until you say so."
        />
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <article
              key={step.n}
              className="rounded-[28px] border border-flour bg-white p-6 shadow-[0_8px_30px_rgba(31,33,40,0.04)]"
            >
              <p className="font-mono text-[13px] font-medium text-crust">{step.n}</p>
              <h3 className="mt-4 text-xl font-semibold tracking-tight">{step.title}</h3>
              <p className="mt-3 text-[15px] leading-7 text-mute">{step.body}</p>
              <StepVisual step={step.step} />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
