import Link from "next/link";
import { HeroOrbit } from "./Visuals";

const surfaces = [
  "AI planning",
  "Document drop",
  "Human approval",
  "Kanban board",
  "Timeline",
  "Portfolios",
  "Dashboards",
  "Weekly status",
  "Risk radar",
  "Project assistant",
];

export function Hero() {
  return (
    <section className="relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden px-5 py-10 sm:px-8">
      <div className="landing-grain-light pointer-events-none absolute inset-0" />
      <HeroOrbit />

      <div className="landing-rise relative mx-auto max-w-3xl text-center">
        <p className="text-sm font-medium text-[#ffb45a]">Project operating system</p>
        <h1 className="mt-4 text-[2.5rem] font-semibold leading-[1.08] tracking-tight text-white sm:text-6xl">
          From a brief to a running project.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/65">
          Describe the work, drop a SOW, or fill in the form. Edit the draft.
          Approve once. Then the board, timeline, dashboards, weekly status, and
          risk radar all read the same records.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="inline-flex h-12 min-w-40 items-center justify-center rounded-full bg-crust px-7 text-sm font-semibold text-white transition-colors hover:bg-crust-deep"
          >
            Sign up
          </Link>
          <a
            href="#product"
            className="inline-flex h-12 min-w-40 items-center justify-center rounded-full border border-white/20 bg-white/5 px-7 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            See the product
          </a>
        </div>
        <p className="mt-6 text-sm text-white/50">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[#ffb45a] hover:text-white">
            Log in
          </Link>
        </p>
      </div>

      <ul className="landing-rise landing-rise-delay relative mx-auto mt-10 flex max-w-5xl flex-wrap items-center justify-center gap-2">
        {surfaces.map((item) => (
          <li
            key={item}
            className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[13px] font-medium text-white/70"
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
