import Link from "next/link";
import { Model3D } from "@/components/Model3D";

export const metadata = { title: "3D room model (prototype)" };

// Isolerad prototyp: mottagarsidan av foto-till-3D. Modellen är ett lokalt
// genererat exempelrum (public/demo/sample-room.glb), inte ett riktigt hotell
// och inte resultatet av en riktig fotorekonstruktion — den visar att sajten
// kan visa 3D gratis i webbläsaren. Rekonstruktionen (foton -> modell) kräver
// GPU och är ett separat, betalt steg vi slår på senare.
export default function Room3DPage() {
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
        3D room model · Damal Hargeisa
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
        Turn the room in your hand
      </h1>
      <p
        style={{
          fontSize: "var(--text-body)",
          lineHeight: 1.6,
          color: "var(--ink-2)",
          margin: "16px 0 28px",
          maxWidth: "62ch",
        }}
      >
        Drag to rotate, scroll to zoom. A 3D model of the Damal Hargeisa room —
        the tall dark headboard, wardrobe, olive curtains, the chairs by the
        window and the terracotta tile floor — hand-built from the photos, the
        way an interior 3D artist works. Runs on Google model-viewer (open
        source), entirely in the browser: no server, no paid service, no GPU.
        This is a built model, not a laser scan; a fully automatic photo-to-3D
        pipeline is the separate step that needs GPU compute.
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
        <Model3D src="/demo/damal-room.glb" alt="3D model of the Damal Hargeisa room" />
      </div>

      <div style={{ marginTop: "var(--s-5)", display: "flex", gap: 28, flexWrap: "wrap" }}>
        <Link
          href="/tour"
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
          See the 360° tour →
        </Link>
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
