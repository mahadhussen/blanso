"use client";

import { useEffect, useRef } from "react";
import "pannellum/build/pannellum.css";

// 360°-visare byggd på Pannellum (MIT, körs helt lokalt — inga API-nycklar,
// inga externa tjänster). Laddas dynamiskt i klienten, precis som Leaflet-kartan,
// så den aldrig körs under SSR. Tar en equirektangulär bild (2:1).
interface PannellumViewer {
  destroy: () => void;
}
interface PannellumGlobal {
  viewer: (el: HTMLElement, cfg: Record<string, unknown>) => PannellumViewer;
}

export function Panorama360({ src, title }: { src: string; title?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let viewer: PannellumViewer | null = null;
    let disposed = false;

    (async () => {
      // Kör UMD-bygget för sin sidoeffekt: det sätter window.pannellum.
      await import("pannellum/build/pannellum.js");
      if (disposed || !el) return;
      const pan = (window as unknown as { pannellum?: PannellumGlobal }).pannellum;
      if (!pan) return;
      viewer = pan.viewer(el, {
        type: "equirectangular",
        panorama: src,
        autoLoad: true,
        showControls: true,
        autoRotate: -2,
        autoRotateInactivityDelay: 3000,
        compass: false,
        hfov: 100,
        minHfov: 50,
        maxHfov: 120,
        title,
      });
    })();

    return () => {
      disposed = true;
      try {
        viewer?.destroy();
      } catch {}
    };
  }, [src, title]);

  return <div ref={ref} style={{ width: "100%", height: "100%" }} />;
}
