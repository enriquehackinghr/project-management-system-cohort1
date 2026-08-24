import { SectionIntro } from "./SectionIntro";

const tools = [
  {
    name: "Slack",
    body: "Weekly status posts and risk alerts land where the team already talks. No extra inbox for the update nobody reads.",
  },
  {
    name: "Google Calendar",
    body: "Deadlines and milestones become dates on the calendar the owner already opens. The plan stops living only inside Baguette.",
  },
  {
    name: "Gmail",
    body: "Reminders go out on the thread people actually answer. Inbound mail can become a task — after you confirm the write.",
  },
];

export function Integrations() {
  return (
    <section id="integrations" className="px-6 py-24 sm:px-10 sm:py-32 lg:py-40">
      <div className="mx-auto max-w-7xl">
        <SectionIntro
          eyebrow="Where work already lives"
          title="Slack, Gmail, Calendar. The project shows up there."
          body="Baguette is the system of record. Status, risk, and dates move into the tools the team already operates."
        />
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {tools.map((tool) => (
            <article key={tool.name} className="rounded-[24px] bg-foam p-8 sm:p-10">
              <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-ink shadow-sm">
                {tool.name === "Slack" ? <SlackMark /> : null}
                {tool.name === "Google Calendar" ? <CalendarMark /> : null}
                {tool.name === "Gmail" ? <MailMark /> : null}
              </div>
              <h3 className="text-2xl font-semibold tracking-tight">{tool.name}</h3>
              <p className="mt-4 text-[15px] leading-7 text-mute">{tool.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function SlackMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="currentColor"
        d="M6 15a2 2 0 1 1-2-2h2zm2 0a2 2 0 1 1 4 0v5a2 2 0 1 1-4 0zm4-9a2 2 0 1 1 2-2v2zm0 2a2 2 0 1 1 0 4H7a2 2 0 1 1 0-4zm9 4a2 2 0 1 1 2 2h-2zm-2 0a2 2 0 1 1-4 0V7a2 2 0 1 1 4 0zm-4 9a2 2 0 1 1-2 2v-2zm0-2a2 2 0 1 1 0-4h5a2 2 0 1 1 0 4z"
      />
    </svg>
  );
}

function CalendarMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 3.5v3M16 3.5v3M4 9.5h16" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function MailMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M4.5 7.5 12 13l7.5-5.5" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
