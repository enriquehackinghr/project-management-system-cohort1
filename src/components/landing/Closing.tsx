import Link from "next/link";
import { Logo } from "./Logo";

const principles = [
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

const people = [
  "Project and program managers",
  "Operations leads",
  "Founders and consultants",
  "Internal teams",
];

export function Principles() {
  return (
    <section className="border-y border-flour px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
        {principles.map((item) => (
          <article key={item.title}>
            <p className="text-[17px] font-semibold tracking-tight">{item.title}</p>
            <p className="mt-2 text-[15px] leading-7 text-mute">{item.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function Closing() {
  return (
    <section className="bg-ink px-5 py-24 text-white sm:px-8 sm:py-32 lg:py-40">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-medium text-[#ffb45a]">Start with a sentence</p>
        <h2 className="mt-5 font-serif text-4xl font-semibold tracking-tight sm:text-5xl lg:text-[3.5rem] lg:leading-[1.12]">
          Describe the work. Approve the plan. Let Baguette run the rest of the week.
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-white/65">
          Built for people who are done translating briefs, chasing status, and
          noticing slippage after the date has passed.
        </p>
        <ul className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] text-white/50">
          {people.map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-crust" />
              {item}
            </li>
          ))}
        </ul>
        <Link
          href="/signup"
          className="mt-10 inline-flex h-12 items-center rounded-full bg-crust px-8 text-sm font-semibold text-white transition-colors hover:bg-crust-deep"
        >
          Sign up
        </Link>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-flour bg-paper px-5 py-10 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <Logo />
        <p className="text-sm text-mute">
          Baguette is the project operating system. Tracking tasks is the floor.
        </p>
      </div>
    </footer>
  );
}
