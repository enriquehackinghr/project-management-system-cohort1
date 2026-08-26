"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "./Logo";

const links = [
  { href: "#product", label: "Product" },
  { href: "#how", label: "How it works" },
  { href: "#features", label: "Features" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#111318]/80 backdrop-blur-xl">
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto] items-center px-5 sm:px-8 lg:grid-cols-[1fr_auto_1fr]">
        <Logo tone="light" />
        <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[14px] font-medium text-white/70 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-white/70 transition-colors hover:text-white sm:inline"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="hidden h-10 items-center rounded-full bg-crust px-4 text-sm font-medium text-white transition-colors hover:bg-crust-deep sm:inline-flex"
          >
            Sign up
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((value) => !value)}
          >
            <span className="sr-only">Menu</span>
            <span className="flex flex-col gap-1.5">
              <span className={`h-px w-4 bg-white transition ${open ? "translate-y-[4px] rotate-45" : ""}`} />
              <span className={`h-px w-4 bg-white transition ${open ? "-translate-y-[3px] -rotate-45" : ""}`} />
            </span>
          </button>
        </div>
      </div>
      {open ? (
        <nav
          id="mobile-nav"
          className="border-t border-white/10 px-5 py-5 lg:hidden"
          aria-label="Mobile"
        >
          <div className="flex flex-col gap-4">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-base font-medium text-white"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/login"
              className="mt-1 text-base font-medium text-white/80"
              onClick={() => setOpen(false)}
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-12 items-center justify-center rounded-full bg-crust text-sm font-medium text-white"
              onClick={() => setOpen(false)}
            >
              Sign up
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
