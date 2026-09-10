import Link from "next/link";
import { HeaderNav } from "./HeaderNav";

// Header — 1:1 från Balaanso Landing.html (84px, hairline, B-märke + alaanso).
// Desktop-utseendet är orört; menyn faller ihop till hamburgare under 760px
// (se .b-nav-* i globals.css + HeaderNav).
export function SiteHeader() {
  return (
    <header
      className="b-site-header sticky top-0 z-40"
      style={{
        height: 84,
        borderBottom: "1px solid var(--hairline)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 var(--page-pad)",
        background: "var(--paper)",
      }}
    >
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--ink)" }}>
        <span className="b-mark">B</span>
        <span
          className="b-wordmark"
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: 30,
            letterSpacing: 7,
            textTransform: "uppercase",
          }}
        >
          alaanso
        </span>
      </Link>
      <HeaderNav />
    </header>
  );
}
