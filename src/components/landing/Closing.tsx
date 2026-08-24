import { Logo } from "./Logo";

export function Principles() {
  const items = [
    {
      title: "One schema, two paths",
      body: "Manual and AI creation write identical rows.",
    },
    {
      title: "Human approval before write",
      body: "The model proposes. You edit. Then the database changes.",
    },
    {
      title: "Structured output only",
      body: "Validated JSON against a fixed schema. Prose is never parsed.",
    },
    {
      title: "Rules find risk",
      body: "Detection is deterministic. Interpretation is written.",
    },
  ];

  return (
    <section className="px-6 py-24 sm:px-10 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-16">
        {items.map((item) => (
          <article key={item.title}>
            <p className="text-lg font-semibold tracking-tight">{item.title}</p>
            <p className="mt-3 text-[15px] leading-7 text-mute">{item.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function Closing() {
  return (
    <section className="px-6 py-24 sm:px-10 sm:py-32 lg:py-40">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-medium text-crust">Start with a sentence</p>
        <h2 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
          Describe the work. Approve the plan. Let Baguette run the rest of the week.
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-mute">
          A project operating system for people who are done translating briefs,
          chasing status, and noticing slippage after the date has passed.
        </p>
        <a
          href="#product"
          className="mt-10 inline-flex h-12 items-center rounded-full bg-crust px-8 text-sm font-semibold text-white transition-colors hover:bg-crust-deep"
        >
          See the system
        </a>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-flour px-6 py-12 sm:px-10">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <Logo />
        <p className="text-sm text-mute">
          Baguette is the project operating system. Tracking tasks is the floor.
        </p>
      </div>
    </footer>
  );
}
