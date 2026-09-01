import Link from "next/link";
import { BalaansoLogo } from "./BalaansoLogo";

// Header 84px, hairline undertill, B-märke + "alaanso" (facit four-seasons).
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-background">
      <div className="b-page flex h-[84px] items-center justify-between">
        <Link href="/" aria-label="Balaanso, till startsidan">
          <BalaansoLogo />
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
