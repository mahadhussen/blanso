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
        3D room model · prototype
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
        Drag to rotate, scroll to zoom. This is the viewer side of photo-to-3D,
        running on Google model-viewer (open source), entirely in the browser —
        no server, no paid service. The room here is a sample model, not a real
        reconstruction: building a 3D model from a host&rsquo;s photos needs GPU
        compute and is a separate, paid step we switch on later. When we do, the
        result drops straight into this viewer.
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
        <Model3D src="/demo/sample-room.glb" alt="Sample 3D room model" />
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
