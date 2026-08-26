import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Field({
  label,
  children,
  error,
  hint,
}: {
  label: string;
  children: ReactNode;
  error?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-mute">{label}</span>
      {children}
      {error ? (
        <span className="mt-1.5 block text-[12px] leading-5 text-crust">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-[12px] leading-5 text-mute">{hint}</span>
      ) : null}
    </label>
  );
}

export const inputClass =
  "h-11 w-full rounded-xl border border-flour bg-white px-3 text-sm text-ink outline-none transition focus:border-crust";

export const selectClass = `${inputClass} bg-[length:12px] pr-8`;

export const textareaClass =
  "min-h-24 w-full rounded-xl border border-flour bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-crust";

export function PrimaryButton({
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex h-11 cursor-pointer items-center justify-center rounded-full bg-crust px-5 text-sm font-semibold text-white transition-colors hover:bg-crust-deep disabled:cursor-not-allowed disabled:opacity-50 ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex h-11 cursor-pointer items-center justify-center rounded-full border border-flour bg-white px-5 text-sm font-medium text-ink transition-colors hover:bg-foam disabled:cursor-not-allowed disabled:opacity-50 ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function Pill({
  children,
  tone = "mute",
}: {
  children: ReactNode;
  tone?: "wheat" | "olive" | "crust" | "mute";
}) {
  const tones = {
    wheat: "bg-[#fff4d5] text-[#c47d00]",
    olive: "bg-[#e8f8f0] text-[#00854d]",
    crust: "bg-[#ffe8df] text-[#c43d12]",
    mute: "bg-foam text-mute",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-flour bg-white p-5 ${className}`}>
      {children}
    </div>
  );
}

export function ProgressBar({
  value,
  indeterminate = false,
}: {
  value?: number;
  indeterminate?: boolean;
}) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-flour">
      {indeterminate ? (
        <div className="baguette-indeterminate h-full w-1/3 rounded-full bg-crust" />
      ) : (
        <div
          className="h-full rounded-full bg-crust transition-[width] duration-300"
          style={{ width: `${Math.min(100, Math.max(0, value ?? 0))}%` }}
        />
      )}
    </div>
  );
}

export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`baguette-spin ${className}`}
      aria-hidden="true"
    >
      <circle
        cx="10"
        cy="10"
        r="7"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.2"
        strokeWidth="2.4"
      />
      <path
        d="M10 3a7 7 0 0 1 7 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PageHeader({
  kicker,
  title,
  description,
  actions,
}: {
  kicker?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {kicker ? <p className="text-sm font-medium text-crust">{kicker}</p> : null}
        <h1 className={`text-3xl font-semibold tracking-tight ${kicker ? "mt-2" : ""}`}>
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-mute">{description}</p>
        ) : null}
      </div>
      {actions}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-flour bg-foam/60 px-6 py-12 text-center">
      <p className="text-lg font-semibold tracking-tight">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-mute">{body}</p>
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  );
}
