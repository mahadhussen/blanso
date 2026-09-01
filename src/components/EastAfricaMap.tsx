"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

// Leaflet-karta över Östafrika med boende-popups (facit four-seasons.html).
// Svarta cirkelmarkörer i stället för ikonbilder — monokromt och utan assets.

export interface MapStay {
  slug: string;
  title: string;
  city: string;
  priceLabel: string;
}

const CITY_COORDS: Record<string, [number, number]> = {
  Mogadishu: [2.0469, 45.3182],
  Hargeisa: [9.5624, 44.077],
  Bosaso: [11.2842, 49.1816],
  Kismayo: [-0.3582, 42.5454],
  Nairobi: [-1.2921, 36.8219],
  Mombasa: [-4.0435, 39.6682],
  "Addis Ababa": [9.03, 38.74],
  Zanzibar: [-6.1659, 39.2026],
  "Dar es Salaam": [-6.7924, 39.2083],
  Kampala: [0.3476, 32.5825],
  Kigali: [-1.9441, 30.0619],
  Djibouti: [11.5721, 43.1456],
};

export function EastAfricaMap({ stays }: { stays: MapStay[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    let map: import("leaflet").Map | null = null;

    (async () => {
      const L = await import("leaflet");
      if (disposed || !ref.current) return;
      map = L.map(ref.current, { scrollWheelZoom: false }).setView([2.5, 40], 4);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap-bidragsgivare",
      }).addTo(map);

      for (const s of stays) {
        const coords = CITY_COORDS[s.city];
        if (!coords) continue;
        L.circleMarker(coords, {
          radius: 7,
          color: "#000",
          weight: 1,
          fillColor: "#000",
          fillOpacity: 1,
        })
          .addTo(map)
          .bindPopup(
            `<a href="/rooms/${s.slug}" style="font-family:serif;font-size:15px;color:#000;text-decoration:none"><strong>${s.title}</strong><br>${s.city} · ${s.priceLabel}/natt</a>`,
          );
      }
    })();

    return () => {
      disposed = true;
      map?.remove();
    };
  }, [stays]);

  return (
    <div
      ref={ref}
      style={{ height: 420, border: "1px solid var(--ink)" }}
      role="region"
      aria-label="Karta över boenden i Östafrika"
    />
  );
}
