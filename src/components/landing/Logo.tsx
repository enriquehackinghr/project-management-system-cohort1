export function Logo({ className = "" }: { className?: string }) {
  return (
    <a href="#top" className={`group inline-flex items-center gap-2.5 ${className}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-crust">
        <svg viewBox="0 0 32 32" className="h-[18px] w-[18px]" aria-hidden="true">
          <path
            d="M4.5 16.5c0-3.1 5.1-6.2 11.5-6.2s11.5 3.1 11.5 6.2-5.1 6.2-11.5 6.2S4.5 19.6 4.5 16.5z"
            fill="#ffffff"
          />
          <path
            d="M12 13.1l1.7 6.6M16 12.6v8M20 13.1l-1.7 6.6"
            fill="none"
            stroke="#e04e1b"
            strokeLinecap="round"
            strokeWidth="1.6"
          />
        </svg>
      </span>
      <span className="text-[1.2rem] font-semibold tracking-tight text-ink">Baguette</span>
    </a>
  );
}
