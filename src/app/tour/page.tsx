import Link from "next/link";
import { Panorama360 } from "@/components/Panorama360";

export const metadata = { title: "360° tour (prototype)" };

// Isolerad prototyp: visar känslan av en 360°-rundvandring på en boendesida.
// Bilden är ett lokalt genererat exempel (public/demo/sample-tour.jpg), inte ett
// riktigt hotell. I skarpt läge laddar värden upp sitt eget 360-panorama.
export default function TourPage() {
  return (
    <div className="b-page" style={{ paddingTop: "var(--s-6)", paddingBottom: "var(--s-8)" }}>
      <div
        style={{
          fontFamily: "var(--font-label)",
          fontSize: "var(--text-label)",
          fontWeight: 700,
          letterSpacing: "var(--ls-label)",
          textTransform: "uppercase",
          color: "var(--muted)",
        }}
      >
        360° virtual tour · prototype
      </div>
      <h1
        className="b-owner-h2"
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 300,
          lineHeight: 1.1,
          margin: "14px 0 0",
        }}
      >
        Look around the stay
      </h1>
      <p
        style={{
          fontSize: "var(--text-body)",
          lineHeight: 1.6,
          color: "var(--ink-2)",
          margin: "16px 0 28px",
          maxWidth: "60ch",
        }}
      >
        Drag to look around, scroll to zoom. This is a sample room, not a real
        hotel — in the live product a host uploads one 360° photo per room and it
        renders right here, on the stay page, next to the gallery. Runs on
        Pannellum (open source), entirely on our own site — no paid service.
      </p>

      <div
        style={{
          height: "70vh",
          minHeight: 420,
          border: "1px solid var(--ink)",
          overflow: "hidden",
          background: "var(--wash)",
        }}
      >
        <Panorama360 src="/demo/sample-tour.jpg" title="Sample room · Balaanso" />
      </div>

      <div style={{ marginTop: "var(--s-5)", display: "flex", gap: 28, flexWrap: "wrap" }}>
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-label)",
            fontSize: "var(--text-label)",
            fontWeight: 700,
            letterSpacing: "var(--ls-label-tight)",
            textTransform: "uppercase",
            color: "var(--ink)",
            borderBottom: "1px solid var(--ink)",
            paddingBottom: 2,
          }}
        >
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
