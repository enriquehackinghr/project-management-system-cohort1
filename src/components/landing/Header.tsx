"use client";

import { useState } from "react";
import { Logo } from "./Logo";

const links = [
  { href: "#product", label: "Product" },
  { href: "#how", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#integrations", label: "Integrations" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-flour/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 sm:px-10">
        <Logo />
        <nav className="hidden items-center gap-10 md:flex" aria-label="Primary">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[15px] font-medium text-mute transition-colors hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="hidden md:block">
          <a
            href="/start"
            className="inline-flex h-11 items-center rounded-full bg-crust px-5 text-sm font-medium text-white transition-colors hover:bg-crust-deep"
          >
            Start project
          </a>
        </div>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-flour md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="sr-only">Menu</span>
          <span className="flex flex-col gap-1.5">
            <span className={`h-px w-4 bg-ink transition ${open ? "translate-y-[4px] rotate-45" : ""}`} />
            <span className={`h-px w-4 bg-ink transition ${open ? "-translate-y-[3px] -rotate-45" : ""}`} />
          </span>
        </button>
      </div>
      {open ? (
        <nav
          id="mobile-nav"
          className="border-t border-flour px-6 py-6 md:hidden"
          aria-label="Mobile"
        >
          <div className="flex flex-col gap-4">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-base font-medium text-ink"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <a
              href="/start"
              className="mt-2 inline-flex h-12 items-center justify-center rounded-full bg-crust text-sm font-medium text-white"
              onClick={() => setOpen(false)}
            >
              Start project
            </a>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
