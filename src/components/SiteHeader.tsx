import Link from "next/link";
import { BlansoLogo } from "./BlansoLogo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-brand" aria-label="Blanso, till startsidan">
          <BlansoLogo />
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/s"
            className="rounded-full px-4 py-2 text-sm font-medium text-ink hover:bg-panel"
          >
            Utforska
          </Link>
          <Link
            href="/host"
            className="rounded-full px-4 py-2 text-sm font-medium text-ink hover:bg-panel"
          >
            Bli värd
          </Link>
          <Link
            href="/host/bookings"
            className="hidden rounded-full border border-line px-4 py-2 text-sm font-medium text-ink hover:border-brand hover:text-brand sm:inline-block"
          >
            Bokningar
          </Link>
        </nav>
      </div>
    </header>
  );
}
