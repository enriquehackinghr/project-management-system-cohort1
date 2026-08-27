"use client";

import Link from "next/link";
import { useState } from "react";
import { BaguetteMark } from "./CafeArt";

const links = [
  { href: "#service", label: "How we serve" },
  { href: "#menu", label: "On the table" },
  { href: "#stay", label: "Stay a while" },
];

export function CafeHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#e8d7c4]/80 bg-[#fbf6ee]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/cafe#top" className="inline-flex items-center gap-2.5">
          <BaguetteMark className="h-8 w-8" />
          <span className="font-serif text-[1.35rem] font-semibold tracking-tight text-[#2c1d14]">
            Baguette
          </span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[14px] font-medium text-[#5c3d2e] transition-colors hover:text-[#2c1d14]"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-[#5c3d2e] hover:text-[#2c1d14] sm:inline"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="hidden h-10 items-center rounded-full bg-[#c45c2a] px-4 text-sm font-medium text-[#fff6e8] transition-colors hover:bg-[#a84b22] sm:inline-flex"
          >
            Take a seat
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#e8d7c4] md:hidden"
            aria-expanded={open}
            aria-controls="cafe-mobile-nav"
            onClick={() => setOpen((value) => !value)}
          >
            <span className="sr-only">Menu</span>
            <span className="flex flex-col gap-1.5">
              <span className={`h-px w-4 bg-[#2c1d14] transition ${open ? "translate-y-[4px] rotate-45" : ""}`} />
              <span className={`h-px w-4 bg-[#2c1d14] transition ${open ? "-translate-y-[3px] -rotate-45" : ""}`} />
            </span>
          </button>
        </div>
      </div>
      {open ? (
        <nav id="cafe-mobile-nav" className="border-t border-[#e8d7c4] px-5 py-5 md:hidden">
          <div className="flex flex-col gap-4">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-base font-medium text-[#2c1d14]"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <Link href="/login" className="text-base font-medium text-[#5c3d2e]" onClick={() => setOpen(false)}>
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-12 items-center justify-center rounded-full bg-[#c45c2a] text-sm font-medium text-[#fff6e8]"
              onClick={() => setOpen(false)}
            >
              Take a seat
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
