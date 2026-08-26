"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { logOut } from "@/actions/session";
import type { SessionPerson } from "@/lib/types";

export function BaguetteIcon({
  className = "h-[18px] w-[18px]",
  tone = "mark",
}: {
  className?: string;
  tone?: "mark" | "loaf";
}) {
  const fill = tone === "loaf" ? "#FFF4D5" : "#ffffff";
  const slash = tone === "loaf" ? "#C43D12" : "#fff4d5";
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path
        d="M1.8 16c0-1.5 2.2-3.2 6.4-4.1C11.2 11.2 13.6 10.9 16 10.9s4.8.3 8.2 1c4.2.9 6.4 2.6 6.4 4.1s-2.2 3.2-6.4 4.1c-3.4.7-5.8 1-8.2 1s-4.8-.3-8.2-1C4 19.2 1.8 17.5 1.8 16z"
        fill={fill}
      />
      <path
        d="M9.2 13.2l2.6 5.6M13.1 12.8l1.6 6.4M17.3 12.8l-1.6 6.4M21.2 13.2l-2.6 5.6"
        fill="none"
        stroke={slash}
        strokeLinecap="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

export function AppMark() {
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-crust">
      <BaguetteIcon />
    </span>
  );
}

function isAiCreate(pathname: string) {
  return pathname === "/app/projects/new/ai";
}

function isProjectWorkspace(pathname: string) {
  return /^\/app\/projects\/[^/]+/.test(pathname) && !pathname.startsWith("/app/projects/new");
}

function isPortfolioWorkspace(pathname: string) {
  return /^\/app\/portfolios\/[^/]+/.test(pathname);
}

function isExecutiveWorkspace(pathname: string) {
  return pathname.startsWith("/app/executive");
}

export function AppShell({
  person,
  children,
}: {
  person: SessionPerson;
  children: ReactNode;
}) {
  const pathname = usePathname();
  if (isAiCreate(pathname)) {
    return <div className="h-dvh overflow-hidden bg-foam">{children}</div>;
  }

  const projectWorkspace =
    isProjectWorkspace(pathname) ||
    isPortfolioWorkspace(pathname) ||
    isExecutiveWorkspace(pathname);

  return (
    <div className="flex min-h-dvh flex-col bg-foam">
      <header className="sticky top-0 z-40 border-b border-flour/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/app/projects" className="inline-flex items-center gap-2.5">
              <AppMark />
              <span className="text-[1.1rem] font-semibold tracking-tight">Baguette</span>
            </Link>
            <nav className="hidden items-center gap-1 text-sm font-medium sm:flex">
              <NavItem href="/app/projects" active={pathname.startsWith("/app/projects")}>
                Projects
              </NavItem>
              <NavItem
                href="/app/dashboard"
                active={
                  pathname.startsWith("/app/dashboard") ||
                  pathname.startsWith("/app/portfolios")
                }
              >
                Portfolio
              </NavItem>
              <NavItem
                href="/app/executive"
                active={pathname.startsWith("/app/executive")}
              >
                Executive Dashboard
              </NavItem>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <p className="hidden text-sm text-mute sm:block">{person.firstName}</p>
            <form action={logOut}>
              <button
                type="submit"
                className="text-sm font-medium text-mute hover:text-ink"
              >
                Log out
              </button>
            </form>
            <Link href="/" className="text-sm font-medium text-mute hover:text-ink">
              Home
            </Link>
          </div>
        </div>
      </header>
      {projectWorkspace ? (
        <div className="min-h-0 flex-1">{children}</div>
      ) : (
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10">{children}</main>
      )}
    </div>
  );
}

function NavItem({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1.5 ${
        active ? "bg-foam text-ink" : "text-mute hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

const PROJECT_LINKS = [
  ["Overview", ""],
  ["Board", "/board"],
  ["Timeline", "/timeline"],
  ["Dashboard", "/dashboard"],
  ["Risks", "/risks"],
  ["Status", "/status"],
] as const;

export function ProjectNav({
  projectId,
  name,
}: {
  projectId: string;
  name: string;
}) {
  const pathname = usePathname();
  const base = `/app/projects/${projectId}`;

  return (
    <aside className="flex w-[232px] shrink-0 flex-col border-r border-flour bg-white px-3 py-5">
      <Link
        href="/app/projects"
        className="px-2 text-[12px] font-medium text-mute hover:text-ink"
      >
        All projects
      </Link>
      <h1 className="mt-2 px-2 text-[15px] font-semibold leading-snug tracking-tight">
        {name}
      </h1>
      <nav className="mt-6 space-y-0.5">
        {PROJECT_LINKS.map(([label, suffix]) => {
          const href = `${base}${suffix}`;
          const active =
            suffix === ""
              ? pathname === base || pathname === `${base}/`
              : pathname.startsWith(href);
          return (
            <Link
              key={label}
              href={href}
              className={`block rounded-xl px-3 py-2 text-sm ${
                active
                  ? "bg-foam font-semibold text-ink"
                  : "font-medium text-mute hover:bg-foam/80 hover:text-ink"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

const PORTFOLIO_LINKS = [
  ["Overview", ""],
  ["Board", "/board"],
  ["Timeline", "/timeline"],
] as const;

const EXECUTIVE_LINKS = [
  ["Overview", ""],
  ["Board", "/board"],
  ["Timeline", "/timeline"],
] as const;

export function PortfolioNav({
  portfolioId,
  name,
}: {
  portfolioId: string;
  name: string;
}) {
  const pathname = usePathname();
  const base = `/app/portfolios/${portfolioId}`;

  return (
    <aside className="flex w-[232px] shrink-0 flex-col border-r border-flour bg-white px-3 py-5">
      <Link
        href="/app/dashboard"
        className="px-2 text-[12px] font-medium text-mute hover:text-ink"
      >
        All portfolios
      </Link>
      <h1 className="mt-2 px-2 text-[15px] font-semibold leading-snug tracking-tight">
        {name}
      </h1>
      <nav className="mt-6 space-y-0.5">
        {PORTFOLIO_LINKS.map(([label, suffix]) => {
          const href = `${base}${suffix}`;
          const active =
            suffix === ""
              ? pathname === base || pathname === `${base}/`
              : pathname.startsWith(href);
          return (
            <Link
              key={label}
              href={href}
              className={`block rounded-xl px-3 py-2 text-sm ${
                active
                  ? "bg-foam font-semibold text-ink"
                  : "font-medium text-mute hover:bg-foam/80 hover:text-ink"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function ExecutiveNav() {
  const pathname = usePathname();
  const base = "/app/executive";

  return (
    <aside className="flex w-[232px] shrink-0 flex-col border-r border-flour bg-white px-3 py-5">
      <p className="px-2 text-[12px] font-medium text-mute">Account</p>
      <h1 className="mt-2 px-2 text-[15px] font-semibold leading-snug tracking-tight">
        Executive Dashboard
      </h1>
      <nav className="mt-6 space-y-0.5">
        {EXECUTIVE_LINKS.map(([label, suffix]) => {
          const href = `${base}${suffix}`;
          const active =
            suffix === ""
              ? pathname === base || pathname === `${base}/`
              : pathname.startsWith(href);
          return (
            <Link
              key={label}
              href={href}
              className={`block rounded-xl px-3 py-2 text-sm ${
                active
                  ? "bg-foam font-semibold text-ink"
                  : "font-medium text-mute hover:bg-foam/80 hover:text-ink"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
