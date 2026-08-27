import Link from "next/link";
import {
  BaguetteDivider,
  BaguetteMark,
  CafeHeroScene,
  CourseArt,
  MenuMark,
  WindowNook,
} from "./CafeArt";
import { CafeHeader } from "./CafeHeader";

const specials = [
  {
    name: "The board",
    note: "Served all day",
    art: "board" as const,
    body: "Ready, in progress, blocked, done. Drag a card and the record updates. No second copy of the work.",
  },
  {
    name: "The timeline",
    note: "From the oven clock",
    art: "timeline" as const,
    body: "Bars from real dates, grouped by phase. Dependencies show what is stuck before it burns.",
  },
  {
    name: "The round table",
    note: "For the whole table",
    art: "table" as const,
    body: "Portfolios put several projects on one board and one timeline. Status writes back to each project.",
  },
  {
    name: "The weekly",
    note: "House pour",
    art: "weekly" as const,
    body: "What moved, what slipped, what needs a decision — drafted from live data, then you edit.",
  },
];

const service = [
  {
    n: "01",
    title: "You order",
    kind: "order" as const,
    body: "Describe the work, drop a brief, or fill in the form. Talk it through the way you would at the counter.",
  },
  {
    n: "02",
    title: "We plate a plan",
    kind: "plate" as const,
    body: "Phases, tasks, owners, and dates come back as a draft. Names come from people you named — never invented.",
  },
  {
    n: "03",
    title: "You taste",
    kind: "taste" as const,
    body: "Rename, reassign, move dates. Nothing is written until you approve. Then it all lands in one go.",
  },
  {
    n: "04",
    title: "You stay",
    kind: "stay" as const,
    body: "Board, timeline, dashboards, status, risk radar, and an assistant keep the kitchen moving while you sit.",
  },
];

export function CafeLanding() {
  return (
    <div id="top" className="cafe-page min-h-full">
      <p className="border-b border-[#e8d7c4] bg-[#efe4d4] px-5 py-2.5 text-center text-[13px] text-[#5c3d2e]">
        Café-themed preview — the live homepage is unchanged.{" "}
        <Link href="/" className="font-medium text-[#c45c2a] underline-offset-2 hover:underline">
          View original
        </Link>
      </p>
      <div className="cafe-window relative">
        <div className="cafe-grain pointer-events-none absolute inset-0" />
        <CafeHeader />
        <section className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-24">
          <div>
            <p className="text-sm font-medium tracking-[0.14em] text-[#c45c2a] uppercase">
              Sit down. We will take it from here.
            </p>
            <h1 className="mt-4 font-serif text-[2.6rem] font-semibold leading-[1.12] tracking-tight text-[#2c1d14] sm:text-6xl">
              Have a coffee. We will run the project.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#5c3d2e]">
              Bring the brief. Baguette lays out the plan, keeps the board moving, and
              taps you when something is about to burn. You stay at the table.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/signup"
                className="inline-flex h-12 items-center justify-center rounded-full bg-[#c45c2a] px-7 text-sm font-semibold text-[#fff6e8] transition-colors hover:bg-[#a84b22]"
              >
                Take a seat
              </Link>
              <a
                href="#menu"
                className="inline-flex h-12 items-center justify-center rounded-full border border-[#d9cbb8] bg-[#fbf6ee] px-7 text-sm font-semibold text-[#2c1d14] hover:bg-white"
              >
                See what is on the table
              </a>
            </div>
            <p className="mt-6 text-sm text-[#7a5a45]">
              Already a regular?{" "}
              <Link href="/login" className="font-medium text-[#c45c2a] hover:text-[#2c1d14]">
                Log in
              </Link>
            </p>
          </div>
          <div className="relative">
            <div className="overflow-hidden rounded-[32px] border border-[#e8d7c4] bg-[#f7f1e8] shadow-[0_30px_80px_rgba(44,29,20,0.1)]">
              <CafeHeroScene />
            </div>
            <p className="mt-4 text-center font-serif text-sm italic text-[#7a5a45]">
              Warm crust. Slow pour. Live records.
            </p>
          </div>
        </section>
      </div>

      <section className="border-y border-[#e8d7c4] bg-[#efe4d4] px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm text-[#5c3d2e]">
          <span>No chasing status</span>
          <span className="hidden h-1 w-1 rounded-full bg-[#c45c2a] sm:block" />
          <span>Nothing writes until you approve</span>
          <span className="hidden h-1 w-1 rounded-full bg-[#c45c2a] sm:block" />
          <span>The board is the same kitchen as the plan</span>
        </div>
      </section>

      <section id="service" className="px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-medium tracking-[0.14em] text-[#c45c2a] uppercase">How we serve</p>
          <h2 className="mt-3 max-w-2xl font-serif text-4xl font-semibold tracking-tight text-[#2c1d14] sm:text-5xl">
            Four courses. You never have to get up.
          </h2>
          <div className="mt-10">
            <BaguetteDivider />
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {service.map((step) => (
              <article
                key={step.n}
                className="overflow-hidden rounded-[28px] border border-[#e8d7c4] bg-[#fbf6ee]"
              >
                <CourseArt kind={step.kind} />
                <div className="p-6 pt-5">
                  <p className="font-serif text-sm text-[#c45c2a]">{step.n}</p>
                  <h3 className="mt-2 font-serif text-2xl font-semibold tracking-tight">{step.title}</h3>
                  <p className="mt-3 text-[15px] leading-7 text-[#5c3d2e]">{step.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="menu" className="bg-[#2c1d14] px-5 py-20 text-[#f7f1e8] sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-medium tracking-[0.14em] text-[#e2b07a] uppercase">Today&apos;s board</p>
          <h2 className="mt-3 max-w-2xl font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
            What stays on the table while you sit.
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#d9cbb8]">
            One set of records. Board, timeline, portfolios, weekly status, and risk
            radar all read the same kitchen. You asked us to manage the project — this is
            how we do it.
          </p>
          <div className="mt-14 grid gap-px overflow-hidden rounded-[28px] bg-[#4a3426] sm:grid-cols-2">
            {specials.map((item) => (
              <article key={item.name} className="bg-[#352418] p-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <MenuMark kind={item.art} />
                    <h3 className="font-serif text-2xl font-semibold">{item.name}</h3>
                  </div>
                  <p className="text-[12px] tracking-wide text-[#e2b07a] uppercase">{item.note}</p>
                </div>
                <p className="mt-4 text-[15px] leading-7 text-[#d9cbb8]">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="overflow-hidden rounded-[32px] border border-[#e8d7c4] bg-[#efe4d4]">
            <WindowNook />
          </div>
          <div>
            <p className="text-sm font-medium tracking-[0.14em] text-[#c45c2a] uppercase">
              The feeling
            </p>
            <h2 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-[#2c1d14] sm:text-5xl">
              Relax. The work is still moving.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#5c3d2e]">
              This version of Baguette is not louder. It is slower on purpose: cream,
              crust, espresso, and a table that does not ask you to chase. You still
              approve the plan. After that, the operating system keeps the shop open.
            </p>
            <blockquote className="mt-8 rounded-[28px] border border-[#e8d7c4] bg-[#fbf6ee] p-7 sm:p-8">
              <p className="font-serif text-2xl leading-10 text-[#2c1d14]">
                “Describe it once. Taste the plan. Then sit with your coffee while the
                board, the dates, and the weekly update stay in sync.”
              </p>
              <p className="mt-5 text-sm text-[#7a5a45]">
                The house rule — human approval before anything is written.
              </p>
            </blockquote>
          </div>
        </div>
      </section>

      <section id="stay" className="cafe-window relative overflow-hidden px-5 py-24 sm:px-8 sm:py-32">
        <div className="cafe-grain pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-3xl text-center">
          <BaguetteMark className="mx-auto h-12 w-12" />
          <h2 className="mt-6 font-serif text-4xl font-semibold tracking-tight text-[#2c1d14] sm:text-5xl">
            Stay as long as you like.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-[#5c3d2e]">
            Sign up, bring a brief, and let Baguette run the week. The original homepage
            is still there if you want the sharper operating-system look.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex h-12 min-w-40 items-center justify-center rounded-full bg-[#c45c2a] px-7 text-sm font-semibold text-[#fff6e8] hover:bg-[#a84b22]"
            >
              Take a seat
            </Link>
            <Link
              href="/"
              className="inline-flex h-12 min-w-40 items-center justify-center rounded-full border border-[#d9cbb8] bg-[#fbf6ee] px-7 text-sm font-semibold text-[#2c1d14] hover:bg-white"
            >
              Original homepage
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#e8d7c4] px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <Link href="/cafe#top" className="inline-flex items-center gap-2.5">
            <BaguetteMark className="h-8 w-8" />
            <span className="font-serif text-[1.2rem] font-semibold text-[#2c1d14]">Baguette</span>
          </Link>
          <p className="text-sm text-[#7a5a45]">A quieter project operating system. Café preview.</p>
        </div>
      </footer>
    </div>
  );
}
