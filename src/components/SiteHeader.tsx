import Link from "next/link";

// Header 72px, hairline undertill. Ordmärket BLANSO i Cormorant, ls 6px.
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-background">
      <div className="b-page flex h-[72px] items-center justify-between">
        <Link
          href="/"
          aria-label="Blanso, till startsidan"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 28,
            letterSpacing: 6,
            textTransform: "uppercase",
            fontWeight: 400,
          }}
        >
          Blanso
        </Link>
        <nav className="flex items-center gap-8">
          <Link href="/s" className="b-label b-label-ink">
            Utforska
          </Link>
          <Link href="/host" className="b-label b-label-ink">
            Bli värd
          </Link>
          <Link href="/host/bookings" className="b-label hidden sm:inline">
            Bokningar
          </Link>
        </nav>
      </div>
    </header>
  );
}
