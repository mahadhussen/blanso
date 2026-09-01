import Link from "next/link";

// Header — 1:1 från Balaanso Landing.html (84px, hairline, B-märke + alaanso).
export function SiteHeader() {
  return (
    <header
      className="sticky top-0 z-40"
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
      <div style={{ display: "flex", gap: 40 }} className="b-nav">
        <Link href="/s" style={{ color: "var(--ink)" }}>Stays</Link>
        <Link href="/#map" style={{ color: "var(--ink)" }}>Destinations</Link>
        <Link href="/host" style={{ color: "var(--ink)" }}>List your property</Link>
        <Link href="/host/login" style={{ color: "var(--ink)" }}>Sign in</Link>
      </div>
    </header>
  );
}
