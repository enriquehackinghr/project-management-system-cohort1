import { SectionIntro } from "./SectionIntro";

const steps = [
  {
    n: "01",
    title: "Talk, or fill in the form",
    body: "Describe the initiative: goal, timeline, budget, people, and what each person owns. The form is the same schema, and the fallback if the model’s output does not validate.",
  },
  {
    n: "02",
    title: "Get a plan, not a paragraph",
    body: "Baguette returns phases, tasks, owners, estimates, and dependencies as structured data. Temporary local IDs keep the draft coherent until commit.",
  },
  {
    n: "03",
    title: "Edit. Then approve.",
    body: "Rename tasks, reassign owners, move dates, delete or add work. AI proposes. You approve. Only then does the database change — in a single transaction.",
  },
  {
    n: "04",
    title: "Run it from live records",
    body: "Board, timeline, three dashboards, weekly status, risk radar, and a project assistant. Every view is a query. Every write from the assistant asks for confirmation first.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="bg-foam px-6 py-24 sm:px-10 sm:py-32 lg:py-40">
      <div className="mx-auto max-w-7xl">
        <SectionIntro
          eyebrow="How it works"
          title="Four steps. Nothing writes until you say so."
        />
        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <article key={step.n} className="px-2">
              <p className="text-sm font-semibold text-crust">{step.n}</p>
              <h3 className="mt-5 text-xl font-semibold tracking-tight">{step.title}</h3>
              <p className="mt-4 text-[15px] leading-7 text-mute">{step.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
