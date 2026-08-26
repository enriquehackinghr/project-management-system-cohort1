import Link from "next/link";

export function Logo({
  className = "",
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  return (
    <Link href="/#top" className={`group inline-flex items-center gap-2.5 ${className}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-crust">
        <svg viewBox="0 0 32 32" className="h-[18px] w-[18px]" aria-hidden="true">
          <path
            d="M1.8 16c0-1.5 2.2-3.2 6.4-4.1C11.2 11.2 13.6 10.9 16 10.9s4.8.3 8.2 1c4.2.9 6.4 2.6 6.4 4.1s-2.2 3.2-6.4 4.1c-3.4.7-5.8 1-8.2 1s-4.8-.3-8.2-1C4 19.2 1.8 17.5 1.8 16z"
            fill="#ffffff"
          />
          <path
            d="M9.2 13.2l2.6 5.6M13.1 12.8l1.6 6.4M17.3 12.8l-1.6 6.4M21.2 13.2l-2.6 5.6"
            fill="none"
            stroke="#fff4d5"
            strokeLinecap="round"
            strokeWidth="1.7"
          />
        </svg>
      </span>
      <span
        className={`text-[1.2rem] font-semibold tracking-tight ${
          tone === "light" ? "text-white" : "text-ink"
        }`}
      >
        Baguette
      </span>
    </Link>
  );
}
