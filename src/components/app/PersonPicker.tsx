"use client";

import { useMemo, useState } from "react";
import { inputClass } from "./ui";

export function CheckboxGroup({
  items,
  name,
  emptyLabel,
}: {
  items: Array<{ id: string; label: string; hint?: string }>;
  name: string;
  emptyLabel: string;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(needle) ||
        (item.hint ?? "").toLowerCase().includes(needle),
    );
  }, [items, query]);

  if (items.length === 0) {
    return <p className="text-sm text-mute">{emptyLabel}</p>;
  }

  return (
    <div className="space-y-3">
      {items.length > 6 ? (
        <input
          className={inputClass}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search"
        />
      ) : null}
      {filtered.length === 0 ? (
        <p className="text-sm text-mute">No matches.</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {filtered.map((item) => (
            <label
              key={item.id}
              className="flex items-start gap-3 rounded-xl border border-flour bg-foam/50 px-3 py-3 text-sm"
            >
              <input type="checkbox" name={name} value={item.id} className="mt-1" />
              <span>
                <span className="block font-medium">{item.label}</span>
                {item.hint ? (
                  <span className="mt-0.5 block text-[12px] text-mute">{item.hint}</span>
                ) : null}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export function PersonPicker({
  people,
  name = "personId",
  emptyLabel = "No people available.",
}: {
  people: Array<{ id: string; full_name: string; email: string }>;
  name?: string;
  emptyLabel?: string;
}) {
  return (
    <CheckboxGroup
      name={name}
      emptyLabel={emptyLabel}
      items={people.map((person) => ({
        id: person.id,
        label: person.full_name,
        hint: person.email,
      }))}
    />
  );
}
