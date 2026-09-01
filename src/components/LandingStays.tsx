"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatPriceShort } from "@/lib/money";

// Boendekorten på landningssidan enligt facit four-seasons.html:
// bildkaruseller i korten, hjärtan som sparas i localStorage ("blanso-favs"),
// antal visade boenden 3/6/8 som också sparas ("blanso-stay-count").

export interface StayCard {
  id: string;
  slug: string;
  title: string;
  city: string;
  country: string;
  nightlyPriceCents: number;
  currency: string;
  images: string[];
}

const FAVS_KEY = "blanso-favs";
const COUNT_KEY = "blanso-stay-count";
const COUNTS = [3, 6, 8] as const;

export function LandingStays({ stays }: { stays: StayCard[] }) {
  const [count, setCount] = useState<number>(8);
  const [favs, setFavs] = useState<string[]>([]);

  useEffect(() => {
    // Läses asynkront efter hydrering: servern känner inte till localStorage,
    // och synkron setState i effekt triggar kaskadrenderingar (lint-regel).
    const t = setTimeout(() => {
      try {
        const c = parseInt(localStorage.getItem(COUNT_KEY) ?? "8", 10);
        if (COUNTS.includes(c as (typeof COUNTS)[number])) setCount(c);
        setFavs(JSON.parse(localStorage.getItem(FAVS_KEY) ?? "[]"));
      } catch {
        // trasig lagring får aldrig fälla sidan
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  function pickCount(c: number) {
    setCount(c);
    try {
      localStorage.setItem(COUNT_KEY, String(c));
    } catch {}
  }

  function toggleFav(id: string) {
    setFavs((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(FAVS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  return (
    <div>
      <div className="flex items-center justify-center gap-2">
        {COUNTS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => pickCount(c)}
            className={`b-btn ${count === c ? "b-btn-solid" : ""}`}
            style={{ padding: "10px 18px" }}
            aria-pressed={count === c}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
        {stays.slice(0, count).map((p) => (
          <StayCardView
            key={p.id}
            stay={p}
            fav={favs.includes(p.id)}
            onFav={() => toggleFav(p.id)}
          />
        ))}
      </div>
    </div>
  );
}

function StayCardView({
  stay,
  fav,
  onFav,
}: {
  stay: StayCard;
  fav: boolean;
  onFav: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const n = stay.images.length;
  const src = stay.images[((idx % n) + n) % n];

  return (
    <div>
      <div className="b-media relative aspect-[3/4] bg-panel">
        <Link href={`/rooms/${stay.slug}`} aria-label={stay.title}>
          <Image src={src} alt={stay.title} fill sizes="(max-width: 640px) 100vw, 33vw" />
        </Link>

        {n > 1 && (
          <>
            <CarouselBtn side="left" onClick={() => setIdx((i) => i - 1)} label="Föregående bild" />
            <CarouselBtn side="right" onClick={() => setIdx((i) => i + 1)} label="Nästa bild" />
          </>
        )}

        <button
          type="button"
          onClick={onFav}
          aria-pressed={fav}
          aria-label={fav ? "Ta bort från sparade" : "Spara boendet"}
          className="absolute right-3 top-3 flex items-center justify-center"
          style={{
            width: 36,
            height: 36,
            background: "var(--paper)",
            border: "1px solid var(--ink)",
            cursor: "pointer",
            fontSize: 16,
            lineHeight: 1,
            color: "var(--ink)",
          }}
        >
          {fav ? "♥" : "♡"}
        </button>
      </div>

      <p className="b-label mt-4">
        {stay.city} · {stay.country}
      </p>
      <Link href={`/rooms/${stay.slug}`}>
        <h3 className="b-h3 mt-1">{stay.title}</h3>
      </Link>
      <p className="mt-1">
        <span style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 500 }}>
          {formatPriceShort(stay.nightlyPriceCents, stay.currency)}
        </span>
        <span className="b-label" style={{ marginLeft: 8 }}>
          per natt
        </span>
      </p>
    </div>
  );
}

function CarouselBtn({
  side,
  onClick,
  label,
}: {
  side: "left" | "right";
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="absolute top-1/2 flex items-center justify-center"
      style={{
        [side]: 12,
        transform: "translateY(-50%)",
        width: 32,
        height: 32,
        background: "var(--paper)",
        border: "1px solid var(--ink)",
        cursor: "pointer",
        fontFamily: "var(--font-label)",
        fontSize: 12,
        color: "var(--ink)",
      }}
    >
      {side === "left" ? "←" : "→"}
    </button>
  );
}
