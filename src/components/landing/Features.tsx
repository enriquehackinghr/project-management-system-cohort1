import { AssistantMock, ProductFrame } from "./ProductMocks";
import { SectionIntro } from "./SectionIntro";

const features = [
  {
    title: "Two entry paths, identical rows",
    body: "A form for the fallback. A chat panel for the brief you can say out loud. Manual and AI creation write the same tables. Nothing downstream cares which path was used.",
  },
  {
    title: "Human approval before write",
    body: "The plan renders as an editable draft that is not yet saved. You rename, reassign, move dates, cut or add work, then approve. One transaction. No silent writes.",
  },
  {
    title: "Kanban that is a query",
    body: "Columns by status. Cards with owner, due date, and priority. Drag a card, update the record. The board does not keep its own copy of the project.",
  },
  {
    title: "Timeline with dependency arrows",
    body: "Gantt-style bars from start and due dates, grouped by phase. Predecessor and successor pairs are first-class, so blocked work is visible before it is overdue.",
  },
  {
    title: "Status engine",
    body: "A button drafts the weekly update from live data: what moved, what slipped, what is next, what needs a decision. You edit it. It is stored with the snapshot it was written from.",
  },
  {
    title: "Risk radar",
    body: "Rules find overdue tasks, blocked chains, owners above capacity, silent projects, and slipped phases. The model writes the interpretation and the recommendation. Detection stays reproducible.",
  },
];

export function Features() {
  return (
    <section id="features" className="px-6 py-24 sm:px-10 sm:py-32 lg:py-40">
      <div className="mx-auto max-w-7xl">
        <SectionIntro
          eyebrow="In the product"
          title="The floor is task tracking. The product is everything after."
        />
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="rounded-[24px] bg-foam p-8 sm:p-10">
              <h3 className="text-xl font-semibold tracking-tight">{feature.title}</h3>
              <p className="mt-4 text-[15px] leading-7 text-mute">{feature.body}</p>
            </article>
          ))}
        </div>

        <div className="mt-24 grid items-center gap-16 lg:grid-cols-2">
          <div className="max-w-xl">
            <p className="text-sm font-medium text-crust">Project assistant</p>
            <h3 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Ask the live data. Confirm before it writes.
            </h3>
            <p className="mt-5 text-lg leading-8 text-mute">
              A chat panel scoped to the project. It answers from current records
              and can create, reassign, or reschedule tasks. Every write action
              requires confirmation in the interface — the same rule as planning.
            </p>
          </div>
          <ProductFrame title="Project assistant" subtitle="Scoped to live records">
            <AssistantMock />
          </ProductFrame>
        </div>
      </div>
    </section>
  );
}
