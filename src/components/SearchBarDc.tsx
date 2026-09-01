"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Sökraden — 1:1 chrome från dc-sidorna (bordered grid, b-label, solid Search),
// men med riktiga inputs bakom prototypens utseende.
export function SearchBarDc({
  initial,
}: {
  initial?: { destination?: string; checkIn?: string; checkOut?: string; guests?: number };
}) {
  const router = useRouter();
  const [destination, setDestination] = useState(initial?.destination ?? "");
  const [checkIn, setCheckIn] = useState(initial?.checkIn ?? "");
  const [checkOut, setCheckOut] = useState(initial?.checkOut ?? "");
  const [guests, setGuests] = useState(initial?.guests ?? 2);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (destination) p.set("destination", destination);
    if (checkIn) p.set("checkIn", checkIn);
    if (checkOut) p.set("checkOut", checkOut);
    if (guests > 1) p.set("guests", String(guests));
    router.push(`/s?${p.toString()}`);
  }

  const cell: React.CSSProperties = { padding: "var(--s-2) 20px", borderRight: "1px solid var(--hairline)" };
  const input: React.CSSProperties = {
    fontSize: 18,
    marginTop: 4,
    width: "100%",
    border: 0,
    outline: "none",
    background: "transparent",
    fontFamily: "var(--font-body)",
    color: "var(--ink)",
  };

  return (
    <form
      onSubmit={submit}
      style={{
        maxWidth: "var(--page-max)",
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "minmax(0,1.3fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) auto",
        border: "1px solid var(--ink)",
      }}
    >
      <label style={cell}>
        <span className="b-label" style={{ letterSpacing: "var(--ls-label-tight)" }}>Destination</span>
        <input type="text" placeholder="Where to?" value={destination} onChange={(e) => setDestination(e.target.value)} style={input} />
      </label>
      <label style={cell}>
        <span className="b-label" style={{ letterSpacing: "var(--ls-label-tight)" }}>Check-in</span>
        <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} style={input} />
      </label>
      <label style={cell}>
        <span className="b-label" style={{ letterSpacing: "var(--ls-label-tight)" }}>Check-out</span>
        <input type="date" value={checkOut} min={checkIn || undefined} onChange={(e) => setCheckOut(e.target.value)} style={input} />
      </label>
      <label style={cell}>
        <span className="b-label" style={{ letterSpacing: "var(--ls-label-tight)" }}>Guests</span>
        <input type="number" min={1} max={16} value={guests} onChange={(e) => setGuests(Math.max(1, Number(e.target.value) || 1))} style={input} />
      </label>
      <button type="submit" className="b-btn b-btn-solid" style={{ border: 0, padding: "0 40px" }}>
        Search
      </button>
    </form>
  );
}
