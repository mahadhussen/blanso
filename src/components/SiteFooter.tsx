import Link from "next/link";

// Footer — 1:1 från Balaanso Landing.html (litet B-märke + städer/copyright).
export function SiteFooter() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--hairline)",
        padding: "var(--s-6) var(--page-pad)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
      }}
    >
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--ink)" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 30,
            height: 30,
            background: "var(--ink)",
            color: "var(--paper)",
            fontFamily: "var(--font-display)",
            fontSize: 19,
          }}
        >
          B
        </span>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: 22,
            letterSpacing: 5,
            textTransform: "uppercase",
          }}
        >
          alaanso
        </span>
      </Link>
      <div
        style={{
          fontFamily: "var(--font-label)",
          fontSize: "var(--text-label)",
          fontWeight: 700,
          letterSpacing: "var(--ls-label-tight)",
          textTransform: "uppercase",
          color: "var(--muted)",
          textAlign: "right",
          lineHeight: 2.4,
        }}
      >
        Mogadishu · Hargeisa · Nairobi
        <br />
        Addis Abeba · Zanzibar · Kampala
        <br />© 2026 Balaanso — demo, sandbox payments
      </div>
    </footer>
  );
}
