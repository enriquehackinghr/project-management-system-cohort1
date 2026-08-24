import { SectionIntro } from "./SectionIntro";

const pains = [
  {
    title: "The brief still becomes a plan by hand",
    body: "Someone sits down, invents phases, estimates, owners, and a start order. That translation is the actual project, and most tools wait until after it is done.",
  },
  {
    title: "Status is a scavenger hunt",
    body: "Owners are chased. The weekly update is rewritten from memory. Two people can disagree about what late means because nothing was snapshotted.",
  },
  {
    title: "Risk shows up after the date",
    body: "Blocked work does not look overdue yet. Quiet programmes do not raise their hands. Over-capacity only appears when you look across every project at once.",
  },
];

export function Problem() {
  return (
    <section className="bg-foam px-6 py-24 sm:px-10 sm:py-32 lg:py-40">
      <div className="mx-auto max-w-7xl">
        <SectionIntro
          eyebrow="The gap"
          title="Existing tools store work. They do not do work."
          body="You still translate a brief into a plan, chase owners for status, write the weekly update, and notice slippage late. Those are jobs a model can do — if a human signs off first."
        />
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {pains.map((pain) => (
            <article key={pain.title} className="rounded-[24px] bg-white p-8 sm:p-10">
              <h3 className="text-xl font-semibold leading-snug tracking-tight">{pain.title}</h3>
              <p className="mt-4 text-[15px] leading-7 text-mute">{pain.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
