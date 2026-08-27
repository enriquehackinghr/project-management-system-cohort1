"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { logOut } from "@/actions/session";
import { joinName } from "@/lib/names";
import type { SessionPerson } from "@/lib/types";

export function AccountMenu({ person }: { person: SessionPerson }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const displayName =
    person.fullName || joinName(person.firstName, person.lastName);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="inline-flex max-w-[14rem] items-center gap-1 text-sm font-medium text-mute hover:text-ink sm:max-w-[18rem]"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="truncate">{displayName}</span>
        <ChevronIcon open={open} />
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-flour bg-white py-1 shadow-lg"
        >
          <p className="truncate px-3 py-2 text-[12px] text-mute">{person.email}</p>
          <Link
            href="/app/account"
            role="menuitem"
            className="block px-3 py-2 text-sm font-medium text-ink hover:bg-foam"
          >
            Edit account
          </Link>
          <form action={logOut}>
            <button
              type="submit"
              role="menuitem"
              className="block w-full cursor-pointer px-3 py-2 text-left text-sm font-medium text-ink hover:bg-foam"
            >
              Log out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 7.5L10 12.5L15 7.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
