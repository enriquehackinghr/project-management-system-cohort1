"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from "react";
import { createPortal } from "react-dom";
import { assignTask } from "@/actions/tasks";
import type { Person } from "@/lib/types";

const TONES = [
  "bg-[#e04e1b]",
  "bg-[#00854d]",
  "bg-[#c47d00]",
  "bg-[#3b6ea5]",
  "bg-[#7a4ea5]",
  "bg-[#a53b5f]",
];

/** Same person, same colour, everywhere they appear. */
function toneFor(id: string) {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) >>> 0;
  }
  return TONES[hash % TONES.length];
}

function initialsFor(person: Person) {
  const first = person.first_name?.trim().charAt(0) ?? "";
  const last = person.last_name?.trim().charAt(0) ?? "";
  const initials = `${first}${last}`.trim();
  return (initials || person.full_name.trim().charAt(0) || "?").toUpperCase();
}

const SIZES = {
  sm: { box: "h-5 w-5 text-[9px]", ring: "ring-1" },
  md: { box: "h-6 w-6 text-[10px]", ring: "ring-2" },
} as const;

type Size = keyof typeof SIZES;

function Avatar({ person, size }: { person: Person; size: Size }) {
  return (
    <span
      title={person.full_name}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-white ${SIZES[size].box} ${SIZES[size].ring} ${toneFor(person.id)}`}
    >
      {initialsFor(person)}
    </span>
  );
}

export function AssigneeStack({
  people,
  size = "sm",
  max = 3,
}: {
  people: Person[];
  size?: Size;
  max?: number;
}) {
  if (people.length === 0) {
    return <span className="text-mute">Unassigned</span>;
  }

  const shown = people.slice(0, max);
  const overflow = people.length - shown.length;

  return (
    <span
      className="inline-flex items-center"
      title={people.map((person) => person.full_name).join(", ")}
    >
      <span className="flex -space-x-1.5">
        {shown.map((person) => (
          <Avatar key={person.id} person={person} size={size} />
        ))}
        {overflow > 0 ? (
          <span
            className={`inline-flex shrink-0 items-center justify-center rounded-full bg-flour font-semibold text-ink ring-white ${SIZES[size].box} ${SIZES[size].ring}`}
          >
            +{overflow}
          </span>
        ) : null}
      </span>
      {people.length === 1 ? (
        <span className="ml-1.5 truncate">{people[0].full_name}</span>
      ) : null}
    </span>
  );
}

const PANEL_WIDTH = 264;
const PANEL_MAX_HEIGHT = 300;

type Position = { top: number; left: number };

/**
 * The panel is portalled and positioned fixed rather than absolutely, because
 * the timeline renders these rows inside a scrolling container that would
 * otherwise clip it.
 */
function placeFor(anchor: HTMLElement | null): Position | null {
  if (!anchor) return null;
  const rect = anchor.getBoundingClientRect();
  const left = Math.min(
    Math.max(8, rect.left),
    Math.max(8, window.innerWidth - PANEL_WIDTH - 8),
  );
  const roomBelow = window.innerHeight - rect.bottom;
  const flipUp = roomBelow < PANEL_MAX_HEIGHT && rect.top > roomBelow;
  return {
    top: flipUp ? Math.max(8, rect.top - PANEL_MAX_HEIGHT - 6) : rect.bottom + 6,
    left,
  };
}

export function TaskAssignees({
  projectId,
  taskId,
  assignees,
  candidates,
  canEdit,
  size = "sm",
}: {
  projectId: string;
  taskId: string;
  assignees: Person[];
  candidates: Person[];
  canEdit: boolean;
  size?: Size;
}) {
  const router = useRouter();
  const anchorRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Position doubles as the open flag so reopening can never flash the panel at
  // wherever the row happened to be last time.
  const [position, setPosition] = useState<Position | null>(null);
  const open = position !== null;

  const savedIds = useMemo(
    () => assignees.map((person) => person.id),
    [assignees],
  );
  const [selected, setSelected] = useOptimistic(savedIds);

  useEffect(() => {
    if (!open) return;
    const reposition = () => setPosition(placeFor(anchorRef.current));
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || anchorRef.current?.contains(target)) {
        return;
      }
      setPosition(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPosition(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return candidates;
    return candidates.filter(
      (person) =>
        person.full_name.toLowerCase().includes(needle) ||
        person.email.toLowerCase().includes(needle),
    );
  }, [candidates, query]);

  // Somebody can stay assigned after leaving the project, so resolve names from
  // the current assignees too and not only from the pickable members.
  const peopleById = useMemo(() => {
    const map = new Map<string, Person>();
    for (const person of [...candidates, ...assignees]) map.set(person.id, person);
    return map;
  }, [candidates, assignees]);

  const selectedPeople = selected
    .map((id) => peopleById.get(id))
    .filter((person): person is Person => Boolean(person));

  function save(next: string[]) {
    setError(null);
    startTransition(async () => {
      setSelected(next);
      try {
        await assignTask(projectId, taskId, next);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save that change.");
      }
    });
  }

  function toggle(personId: string) {
    save(
      selected.includes(personId)
        ? selected.filter((id) => id !== personId)
        : [...selected, personId],
    );
  }

  if (!canEdit) {
    return <AssigneeStack people={assignees} size={size} />;
  }

  return (
    // Kept off the board's drag listeners so opening the picker never drags a card.
    <span onPointerDown={(event) => event.stopPropagation()}>
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setPosition(open ? null : placeFor(anchorRef.current))}
        className={`inline-flex max-w-full items-center gap-1 rounded-full px-1.5 py-0.5 transition hover:bg-foam ${pending ? "opacity-60" : ""}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        title={
          selectedPeople.length > 0
            ? `Assigned to ${selectedPeople.map((person) => person.full_name).join(", ")}`
            : "Assign team members"
        }
      >
        <AssigneeStack people={selectedPeople} size={size} />
      </button>

      {position
        ? createPortal(
            <div
              ref={panelRef}
              role="dialog"
              aria-label="Assign team members"
              className="fixed z-[60] overflow-hidden rounded-2xl border border-flour bg-white shadow-[0_18px_44px_rgba(31,33,40,0.18)]"
              style={{ top: position.top, left: position.left, width: PANEL_WIDTH }}
            >
              <div className="flex items-center justify-between gap-2 border-b border-flour px-3 py-2">
                <p className="text-[12px] font-semibold">Assigned to</p>
                {selected.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => save([])}
                    className="text-[11px] font-medium text-crust hover:underline"
                  >
                    Clear
                  </button>
                ) : null}
              </div>

              {candidates.length > 6 ? (
                <div className="border-b border-flour px-3 py-2">
                  <input
                    autoFocus
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search members"
                    className="h-8 w-full rounded-lg border border-flour bg-foam/60 px-2.5 text-[13px] outline-none focus:border-crust"
                  />
                </div>
              ) : null}

              <div className="max-h-56 overflow-y-auto py-1">
                {candidates.length === 0 ? (
                  <p className="px-3 py-3 text-[12px] leading-5 text-mute">
                    Nobody is on this project yet. Add members from the project
                    overview first.
                  </p>
                ) : filtered.length === 0 ? (
                  <p className="px-3 py-3 text-[12px] text-mute">No matches.</p>
                ) : (
                  filtered.map((person) => (
                    <label
                      key={person.id}
                      className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-[13px] hover:bg-foam"
                    >
                      <input
                        type="checkbox"
                        checked={selected.includes(person.id)}
                        onChange={() => toggle(person.id)}
                        className="shrink-0"
                      />
                      <Avatar person={person} size="md" />
                      <span className="min-w-0">
                        <span className="block truncate font-medium">
                          {person.full_name}
                        </span>
                        <span className="block truncate text-[11px] text-mute">
                          {person.email}
                        </span>
                      </span>
                    </label>
                  ))
                )}
              </div>

              {error ? (
                <p className="border-t border-flour px-3 py-2 text-[11px] leading-4 text-crust">
                  {error}
                </p>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </span>
  );
}
