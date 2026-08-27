export function BaguetteMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center justify-center rounded-full bg-[#c45c2a] ${className}`}>
      <svg viewBox="0 0 32 32" className="h-[62%] w-[62%]" aria-hidden="true">
        <path
          d="M4.2 17.2c.4-3.2 4.6-6.4 11.8-6.8 7.4-.4 12.4 2.2 13.2 5.4.4 1.8-.8 3.2-3.2 4.2-4.6 1.8-10.4 2.4-14.6 2.1-3.6-.3-7.4-1.6-7.2-4.9z"
          fill="#fff6e8"
        />
        <path
          d="M10.2 13.4l1.6 5.2M14.4 12.6l1.2 6M18.8 12.6l.2 6.1M23 13.6l-1.4 5.2"
          fill="none"
          stroke="#c45c2a"
          strokeLinecap="round"
          strokeWidth="1.55"
        />
      </svg>
    </span>
  );
}

function Steam() {
  return (
    <svg viewBox="0 0 48 40" className="h-10 w-12" aria-hidden="true">
      <g fill="none" stroke="#c4b09a" strokeLinecap="round">
        <path className="cafe-steam-path" d="M10 36c4-10-2-18-6-28" strokeWidth="2.2" />
        <path className="cafe-steam-path" d="M24 38c5-12 0-20-4-32" strokeWidth="2.6" />
        <path className="cafe-steam-path" d="M38 36c3-11-1-18-5-28" strokeWidth="2" />
      </g>
    </svg>
  );
}

function Awning() {
  return (
    <div className="relative">
      <div className="cafe-awning-stripes h-12" />
      <svg viewBox="0 0 640 16" className="block h-4 w-full" aria-hidden="true" preserveAspectRatio="none">
        <path d="M0 0h640v4H0z" fill="#a84b22" />
        <path
          d="M0 4c16 14 32 14 48 0s32-14 48 0 32 14 48 0 32-14 48 0 32 14 48 0 32-14 48 0 32 14 48 0 32-14 48 0 32 14 48 0 32-14 48 0 32 14 48 0 32-14 48 0 32 14 48 0 32-14 48 0v0H0z"
          fill="#a84b22"
        />
      </svg>
    </div>
  );
}

function Ticket({
  kicker,
  title,
  note,
  className = "",
}: {
  kicker: string;
  title: string;
  note: string;
  className?: string;
}) {
  return (
    <div className={`cafe-ticket px-4 py-3 text-[#2c1d14] shadow-[0_14px_32px_rgba(44,29,20,0.12)] ${className}`}>
      <p className="font-serif text-[10px] tracking-[0.18em] text-[#c45c2a] uppercase">{kicker}</p>
      <p className="mt-1 font-serif text-[1.15rem] leading-6">{title}</p>
      <p className="mt-2 text-[11px] leading-4 text-[#7a5a45]">{note}</p>
    </div>
  );
}

const menuLines = [
  ["01", "The brief", "You order"],
  ["02", "The plan", "We plate"],
  ["03", "The taste", "You approve"],
  ["04", "The table", "You stay"],
];

export function CafeHeroScene() {
  return (
    <div className="relative overflow-hidden bg-[#f7f1e8]" aria-label="Today's cafe menu">
      <Awning />
      <div className="relative px-7 pb-8 pt-6 sm:px-8">
        <p className="font-serif text-sm tracking-[0.16em] text-[#c45c2a] uppercase">Today&apos;s board</p>
        <p className="mt-2 font-serif text-[1.65rem] leading-8 tracking-tight text-[#2c1d14] sm:text-[1.85rem]">
          Sit down. We will take it from here.
        </p>
        <ul className="mt-7 space-y-3.5 sm:pr-36">
          {menuLines.map(([n, left, right]) => (
            <li key={n} className="flex items-baseline gap-3 font-serif text-[1.05rem] text-[#2c1d14]">
              <span className="w-6 text-[13px] text-[#c45c2a]">{n}</span>
              <span>{left}</span>
              <span className="mb-1 flex-1 border-b border-dotted border-[#d9cbb8]" />
              <span className="text-[15px] text-[#7a5a45]">{right}</span>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex items-center justify-between border-t border-[#e8d7c4] pt-5">
          <span className="flex items-center gap-2.5">
            <BaguetteMark className="h-9 w-9" />
            <span className="font-serif text-sm text-[#5c3d2e]">House loaf</span>
          </span>
          <span className="font-serif text-sm italic text-[#7a5a45]">On the house</span>
        </div>
      </div>
      <Ticket
        kicker="Table 4"
        title="The brief"
        note="Nothing writes until you taste it."
        className="absolute right-5 top-[4.75rem] hidden w-36 rotate-[7deg] sm:block"
      />
      <div className="cafe-grain pointer-events-none absolute inset-0" />
    </div>
  );
}

export function CourseArt({
  kind,
}: {
  kind: "order" | "plate" | "taste" | "stay";
}) {
  const copy = {
    order: { kicker: "Counter", title: "The brief", note: "Talk it through." },
    plate: { kicker: "Kitchen", title: "The plan", note: "Drafted, not written." },
    taste: { kicker: "Table", title: "You approve", note: "Then it all lands." },
    stay: { kicker: "House pour", title: "You sit", note: "The shop stays open." },
  }[kind];

  return (
    <div className="relative h-[148px] overflow-hidden bg-[#efe4d4]">
      <div className="cafe-awning-stripes h-3" />
      {kind === "order" ? (
        <Ticket
          kicker={copy.kicker}
          title={copy.title}
          note={copy.note}
          className="absolute left-1/2 top-[1.35rem] w-[9.75rem] -translate-x-1/2 rotate-[-3deg]"
        />
      ) : null}
      {kind === "plate" ? (
        <div className="px-5 pt-6">
          {["Market validation", "Entity setup", "First hires"].map((line, i) => (
            <p key={line} className="flex items-baseline gap-2 font-serif text-[13px] text-[#2c1d14]">
              <span className="text-[#c45c2a]">0{i + 1}</span>
              <span className="truncate">{line}</span>
              <span className="mb-1 flex-1 border-b border-dotted border-[#d9cbb8]" />
            </p>
          ))}
        </div>
      ) : null}
      {kind === "taste" ? (
        <div className="flex h-[calc(100%-0.75rem)] flex-col items-center justify-center">
          <Steam />
          <p className="mt-1 font-serif text-lg text-[#2c1d14]">{copy.title}</p>
          <p className="text-[11px] text-[#7a5a45]">{copy.note}</p>
        </div>
      ) : null}
      {kind === "stay" ? (
        <div className="flex h-[calc(100%-0.75rem)] flex-col items-center justify-center bg-[#2c1d14] text-center">
          <BaguetteMark className="h-9 w-9" />
          <p className="mt-2 font-serif text-lg text-[#f7f1e8]">{copy.title}</p>
          <p className="text-[11px] text-[#e2b07a]">{copy.note}</p>
        </div>
      ) : null}
      <div className="cafe-grain pointer-events-none absolute inset-0" />
    </div>
  );
}

export function MenuMark({
  kind,
}: {
  kind: "board" | "timeline" | "table" | "weekly";
}) {
  return (
    <svg viewBox="0 0 48 48" className="h-10 w-10" aria-hidden="true">
      {kind === "board" ? (
        <>
          <path d="M16 16h16l-2 22H18z" fill="#fff6e8" />
          <ellipse cx="24" cy="16" rx="8" ry="3" fill="#5c3d2e" />
          <path
            d="M32 22c7 2 10 8 10 13s-4 10-10 11"
            fill="none"
            stroke="#c45c2a"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      ) : null}
      {kind === "timeline" ? (
        <>
          <circle cx="24" cy="24" r="15" fill="#e2b07a" />
          <circle cx="24" cy="24" r="11" fill="#2c1d14" />
          <path d="M24 24v-7" stroke="#f7f1e8" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M24 24l6 4" stroke="#c45c2a" strokeWidth="2.4" strokeLinecap="round" />
        </>
      ) : null}
      {kind === "table" ? (
        <>
          <path
            d="M6 28c2-7 10-12 18-12s16 5 18 12c1 3-2 5-6 6-8 2-16 2-24 0-4-1-7-3-6-6z"
            fill="#e2b07a"
          />
          <path
            d="M16 22l2 8M22 20l1 10M28 20l-1 10M34 22l-2 8"
            stroke="#c45c2a"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </>
      ) : null}
      {kind === "weekly" ? (
        <>
          <path d="M13 14h20l5 6v16H13z" fill="#fff6e8" />
          <path d="M33 14v6h6" fill="none" stroke="#e2b07a" strokeWidth="2" />
          <path d="M19 26h14M19 31h9" stroke="#c45c2a" strokeWidth="2" strokeLinecap="round" />
        </>
      ) : null}
    </svg>
  );
}

export function WindowNook() {
  return (
    <div className="relative overflow-hidden bg-[#2c1d14] text-[#f7f1e8]" aria-label="House chalkboard">
      <div className="cafe-awning-stripes h-10" />
      <div className="relative px-8 py-10 sm:px-10 sm:py-12">
        <p className="font-serif text-sm tracking-[0.16em] text-[#e2b07a] uppercase">On the sill</p>
        <p className="mt-4 font-serif text-3xl leading-snug tracking-tight sm:text-4xl">
          Warm crust.
          <br />
          Slow pour.
          <br />
          Live records.
        </p>
        <p className="mt-6 max-w-sm text-[15px] leading-7 text-[#d9cbb8]">
          The board, the dates, and the weekly stay in sync while you sit.
        </p>
        <div className="mt-10 flex items-center gap-3 border-t border-[#4a3426] pt-6">
          <BaguetteMark className="h-9 w-9" />
          <p className="font-serif text-sm text-[#e2b07a]">House rule — taste before we write.</p>
        </div>
      </div>
      <Ticket
        kicker="Stay"
        title="You sit"
        note="The shop stays open."
        className="absolute right-6 bottom-8 hidden w-36 rotate-[6deg] lg:block"
      />
      <div className="cafe-grain pointer-events-none absolute inset-0 opacity-40" />
    </div>
  );
}

export function BaguetteDivider() {
  return (
    <svg viewBox="0 0 220 28" className="mx-auto h-6 w-44" aria-hidden="true">
      <path
        d="M8 16C22 4 70 2 110 4c40 2 80 8 102 16"
        fill="none"
        stroke="#c45c2a"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path d="M52 8l4 12M88 6l2 14M124 6l-2 14M158 10l-6 12" stroke="#fff6e8" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
