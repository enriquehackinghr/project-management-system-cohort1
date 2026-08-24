import { SectionIntro } from "./SectionIntro";

const views = [
  {
    kicker: "Portfolio",
    title: "Executive rollup",
    body: "Every project in one read: progress, dates, open risk. Built for the person who cannot sit in every standup.",
    bars: "bg-[#579bfc]",
  },
  {
    kicker: "People",
    title: "Team load",
    body: "Overdue work and assigned hours by owner, including people who sit on more than one project. Capacity is a rule, not a guess in a cell.",
    bars: "bg-crust",
  },
  {
    kicker: "Delivery",
    title: "Project detail",
    body: "Progress against the plan, burn against the timeline, and the risks still open. Same tables as the board. A different question.",
    bars: "bg-[#00c875]",
  },
];

export function Dashboards() {
  return (
    <section className="bg-foam px-6 py-24 sm:px-10 sm:py-32 lg:py-40">
      <div className="mx-auto max-w-7xl">
        <SectionIntro
          eyebrow="Dashboards"
          title="Three reads of the same data."
          body="No extra storage. As-of dates are printed on the page, so a dashboard opened on Wednesday and a status report generated on Friday do not disagree about what late means."
        />
        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {views.map((view) => (
            <article key={view.title} className="rounded-[24px] bg-white p-8 sm:p-10">
              <p className="text-sm font-medium text-crust">{view.kicker}</p>
              <div className="mt-8 h-20 overflow-hidden rounded-2xl bg-foam">
                <div className="flex h-full items-end gap-2 px-4 pb-3">
                  {[40, 62, 48, 78, 55, 88, 70].map((h, bar) => (
                    <span
                      key={`${view.title}-${bar}`}
                      className={`flex-1 rounded-md ${view.bars}`}
                      style={{ height: `${h}%`, opacity: 0.35 + bar * 0.08 }}
                    />
                  ))}
                </div>
              </div>
              <h3 className="mt-8 text-2xl font-semibold tracking-tight">{view.title}</h3>
              <p className="mt-4 text-[15px] leading-7 text-mute">{view.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
