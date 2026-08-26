import { PlanMock, ProductFrame } from "./ProductMocks";

export function Hero() {
  return (
    <section className="px-6 pb-8 pt-14 sm:px-10 sm:pt-20 lg:pt-24">
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-sm font-medium text-crust">Project operating system</p>
        <h1 className="mt-4 text-[2.35rem] font-semibold leading-[1.12] tracking-tight text-ink sm:text-5xl lg:text-6xl">
          Describe the initiative.
          <br className="hidden sm:block" /> Approve the plan.
          <br className="hidden sm:block" /> Run the project.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-mute">
          Baguette turns a plain-language brief into phases, tasks, owners, and
          dependencies. You edit. You approve. Only then does anything get saved.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <a
            href="/start"
            className="inline-flex h-12 min-w-44 items-center justify-center rounded-full bg-crust px-7 text-sm font-semibold text-white transition-colors hover:bg-crust-deep"
          >
            Start project
          </a>
          <a
            href="#how"
            className="inline-flex h-12 min-w-44 items-center justify-center rounded-full border border-flour bg-white px-7 text-sm font-semibold text-ink transition-colors hover:bg-foam"
          >
            How it works
          </a>
        </div>
        <p className="mt-6 text-sm text-mute">
          Tracking tasks is the floor, not the product.
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-6xl sm:mt-16">
        <ProductFrame title="New project" subtitle="AI plan · draft, not saved">
          <PlanMock />
        </ProductFrame>
      </div>

      <ul className="mx-auto mt-16 flex max-w-5xl flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-mute sm:mt-20">
        {[
          "AI planning",
          "Human approval",
          "Kanban board",
          "Timeline",
          "Dashboards",
          "Weekly status",
          "Risk radar",
          "Project assistant",
        ].map((item) => (
          <li key={item} className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-crust" />
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
