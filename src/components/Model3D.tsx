"use client";

import { createElement, useEffect, useState } from "react";

// 3D-modellvisare byggd på Googles <model-viewer> (Apache-2.0, gratis, körs
// helt i webbläsaren — ingen server, ingen tjänst). Visar en glTF/GLB-modell
// med omloppskontroll (dra = rotera, scroll = zooma). Detta är MOTTAGARSIDAN
// av foto-till-3D: den visar vilken modell som helst vi senare producerar.
// Laddas dynamiskt i klienten så custom-elementet aldrig rörs under SSR.
export function Model3D({ src, alt }: { src: string; alt: string }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let on = true;
    import("@google/model-viewer").then(() => {
      if (on) setReady(true);
    });
    return () => {
      on = false;
    };
  }, []);

  if (!ready) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-label)",
          fontSize: "var(--text-label)",
          letterSpacing: "var(--ls-label)",
          textTransform: "uppercase",
          color: "var(--muted)",
        }}
      >
        Loading 3D…
      </div>
    );
  }

  // createElement undviker JSX-typning för custom-elementet.
  return createElement("model-viewer", {
    src,
    alt,
    "camera-controls": true,
    "auto-rotate": true,
    "auto-rotate-delay": 0,
    "rotation-per-second": "18deg",
    "interaction-prompt": "none",
    "shadow-intensity": "1",
    "camera-orbit": "20deg 62deg 135%",
    "min-camera-orbit": "auto auto 100%",
    "max-camera-orbit": "auto auto 220%",
    "field-of-view": "42deg",
    "touch-action": "pan-y",
    exposure: "1.15",
    style: { width: "100%", height: "100%", backgroundColor: "var(--wash)" },
  });
}
