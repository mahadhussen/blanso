export function BlansoLogo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        width="26"
        height="26"
        viewBox="0 0 26 26"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect width="26" height="26" rx="7" fill="currentColor" />
        <path
          d="M8 18V8.5C8 8.22 8.22 8 8.5 8H13.2c2.1 0 3.4 1 3.4 2.7 0 1.2-.7 2-1.7 2.3 1.3.25 2.2 1.1 2.2 2.5 0 1.8-1.4 2.9-3.7 2.9H8.5C8.22 18.4 8 18.2 8 18Z"
          fill="white"
        />
      </svg>
      <span className="text-xl font-semibold tracking-tight">Blanso</span>
    </span>
  );
}
