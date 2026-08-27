import Link from "next/link";
import { formatDate } from "@/lib/dates";
import {
  AUDIT_KIND_LABEL,
  type AuditEvent,
  type AuditKind,
} from "@/lib/types";
import { EmptyState, Pill } from "./ui";

const KIND_TONE: Record<AuditKind, "wheat" | "olive" | "mute"> = {
  change: "olive",
  view: "wheat",
  click: "mute",
};

function formatStamp(iso: string) {
  const date = new Date(iso);
  return date.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

export function AuditLogView({
  kicker,
  title,
  description,
  events,
  filterHref,
  kind,
}: {
  kicker: string;
  title: string;
  description: string;
  events: AuditEvent[];
  filterHref: string;
  kind?: AuditKind;
}) {
  const visible = kind ? events.filter((event) => event.kind === kind) : events;
  const days = new Map<string, AuditEvent[]>();
  for (const event of visible) {
    const key = dayKey(event.created_at);
    const list = days.get(key) ?? [];
    list.push(event);
    days.set(key, list);
  }

  const filters: Array<{ id?: AuditKind; label: string }> = [
    { label: "All" },
    { id: "change", label: "Changes" },
    { id: "view", label: "Views" },
    { id: "click", label: "Clicks" },
  ];

  return (
    <div>
      <p className="text-sm font-medium text-crust">{kicker}</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-mute">{description}</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {filters.map((item) => {
          const href = item.id ? `${filterHref}?kind=${item.id}` : filterHref;
          const active = item.id ? kind === item.id : !kind;
          return (
            <Link
              key={item.label}
              href={href}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                active ? "bg-crust text-white" : "bg-foam text-mute hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
      {visible.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No activity yet"
            body="Views, clicks, and changes from everyone with access will show up here."
          />
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          {[...days.entries()].map(([day, items]) => (
            <section key={day}>
              <h3 className="mb-3 text-[13px] font-medium text-mute">
                {formatDate(day)}
              </h3>
              <ol className="divide-y divide-flour overflow-hidden rounded-2xl border border-flour bg-white">
                {items.map((event) => (
                  <li key={event.id} className="flex items-start justify-between gap-4 px-4 py-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">{event.actor.full_name}</p>
                        <Pill tone={KIND_TONE[event.kind]}>
                          {AUDIT_KIND_LABEL[event.kind]}
                        </Pill>
                      </div>
                      <p className="mt-1 text-sm leading-6">{event.summary}</p>
                    </div>
                    <p className="shrink-0 text-[12px] text-mute">
                      {formatStamp(event.created_at)}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
