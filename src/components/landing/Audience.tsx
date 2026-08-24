import { SectionIntro } from "./SectionIntro";

const people = [
  {
    title: "Project and program managers",
    body: "Multi-workstream initiatives where the plan, the status letter, and the risk list are currently three separate jobs.",
  },
  {
    title: "Operations leads",
    body: "A portfolio that has to stay honest across teams, with capacity you can defend and dates that mean the same thing on every page.",
  },
  {
    title: "Founders and consultants",
    body: "A brief on Monday, a plan you can stand behind by lunch, and a weekly update that does not take Thursday afternoon.",
  },
  {
    title: "Internal teams",
    body: "People who already have Slack, Gmail, and Calendar, and do not need another place that only stores the work they still do by hand.",
  },
];

export function Audience() {
  return (
    <section className="bg-foam px-6 py-24 sm:px-10 sm:py-32 lg:py-40">
      <div className="mx-auto max-w-7xl">
        <SectionIntro
          eyebrow="Who it is for"
          title="Built for people who still make the plan themselves."
        />
        <div className="mt-16 grid gap-8 sm:grid-cols-2">
          {people.map((item) => (
            <article key={item.title} className="rounded-[24px] bg-white p-8 sm:p-10">
              <h3 className="text-2xl font-semibold tracking-tight">{item.title}</h3>
              <p className="mt-4 text-[15px] leading-7 text-mute">{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
