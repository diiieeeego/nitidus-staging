/** Placeholder wordmark until the official logo is supplied. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden focusable="false">
        <path d="M16 2c5 6.5 10 11.7 10 17.2A10 10 0 0 1 6 19.2C6 13.7 11 8.5 16 2z" fill="#74C054" />
        <path d="M12.5 19.5a4 4 0 0 0 4 4" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      </svg>
      <span className="text-xl font-extrabold tracking-tight text-ink">
        NITIDUS<span className="sr-only"> d.o.o.</span>
      </span>
    </span>
  );
}
