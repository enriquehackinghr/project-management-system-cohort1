"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";

const PROJECT_PAGES: Array<[RegExp, string]> = [
  [/\/audit\/?$/, "Audit Log"],
  [/\/board\/?$/, "Board"],
  [/\/timeline\/?$/, "Timeline"],
  [/\/dashboard\/?$/, "Dashboard"],
  [/\/risks\/?$/, "Risks"],
  [/\/status\/?$/, "Status"],
  [/\/assistant\/?$/, "Assistant"],
];

const PORTFOLIO_PAGES: Array<[RegExp, string]> = [
  [/\/audit\/?$/, "Audit Log"],
  [/\/board\/?$/, "Board"],
  [/\/timeline\/?$/, "Timeline"],
];

function pageLabel(pathname: string, scope: "project" | "portfolio") {
  const pages = scope === "project" ? PROJECT_PAGES : PORTFOLIO_PAGES;
  for (const [pattern, label] of pages) {
    if (pattern.test(pathname)) return label;
  }
  return "Overview";
}

function sendAudit(payload: {
  kind: "view" | "click";
  action: string;
  summary: string;
  projectId?: string;
  portfolioId?: string;
  href?: string;
}) {
  void fetch("/api/audit", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  });
}

function clickLabel(target: EventTarget | null) {
  if (!(target instanceof Element)) return null;
  const control = target.closest("a, button, [role='button'], summary");
  if (!(control instanceof HTMLElement)) return null;
  if (control.dataset.auditIgnore === "true") return null;
  const named =
    control.getAttribute("aria-label") ||
    control.getAttribute("title") ||
    control.textContent;
  const label = named?.replace(/\s+/g, " ").trim();
  if (!label || label.length > 140) return null;
  const href = control instanceof HTMLAnchorElement ? control.getAttribute("href") : null;
  return { label, href };
}

export function AuditTracker({
  scope,
  projectId,
  portfolioId,
  className,
  children,
}: {
  scope: "project" | "portfolio";
  projectId?: string;
  portfolioId?: string;
  className?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const lastClick = useRef({ key: "", at: 0 });

  useEffect(() => {
    const label = pageLabel(pathname, scope);
    sendAudit({
      kind: "view",
      action: "page.viewed",
      summary: `Opened ${label}`,
      projectId,
      portfolioId,
      href: pathname,
    });
  }, [pathname, projectId, portfolioId, scope]);

  function onClickCapture(event: MouseEvent<HTMLDivElement>) {
    const clicked = clickLabel(event.target);
    if (!clicked) return;
    const key = `${pathname}:${clicked.label}`;
    const at = performance.now();
    if (lastClick.current.key === key && at - lastClick.current.at < 1500) return;
    lastClick.current = { key, at };
    sendAudit({
      kind: "click",
      action: "ui.clicked",
      summary: `Clicked "${clicked.label}"`,
      projectId,
      portfolioId,
      href: clicked.href ?? pathname,
    });
  }

  return (
    <div className={className} onClickCapture={onClickCapture}>
      {children}
    </div>
  );
}
