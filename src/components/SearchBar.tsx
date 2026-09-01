"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Sökraden enligt facit: 1px svart ram, fem celler skiljda av hairlines,
// versaletiketter, solid svart sökknapp.
export function SearchBar({
  initial,
}: {
  variant?: "hero" | "compact";
  initial?: { destination?: string; checkIn?: string; checkOut?: string; guests?: number };
}) {
  const router = useRouter();
  const [destination, setDestination] = useState(initial?.destination ?? "");
  const [checkIn, setCheckIn] = useState(initial?.checkIn ?? "");
  const [checkOut, setCheckOut] = useState(initial?.checkOut ?? "");
  const [guests, setGuests] = useState(initial?.guests ?? 1);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (destination) params.set("destination", destination);
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    if (guests > 1) params.set("guests", String(guests));
    router.push(`/s?${params.toString()}`);
  }

  return (
    <form onSubmit={submit} className="b-searchbar">
      <Cell label="Destination">
        <input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Stad eller land"
          className="w-full bg-transparent outline-none"
          style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-body)" }}
        />
      </Cell>
      <Cell label="Incheckning">
        <input
          type="date"
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          className="w-full bg-transparent outline-none"
          style={{ fontFamily: "var(--font-body)", fontSize: 15 }}
        />
      </Cell>
      <Cell label="Utcheckning">
        <input
          type="date"
          value={checkOut}
          min={checkIn || undefined}
          onChange={(e) => setCheckOut(e.target.value)}
          className="w-full bg-transparent outline-none"
          style={{ fontFamily: "var(--font-body)", fontSize: 15 }}
        />
      </Cell>
      <Cell label="Gäster">
        <input
          type="number"
          min={1}
          max={16}
          value={guests}
          onChange={(e) => setGuests(Math.max(1, Number(e.target.value) || 1))}
          className="w-full bg-transparent outline-none"
          style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-body)" }}
        />
      </Cell>
      <button type="submit" className="b-btn b-btn-solid" style={{ border: "none", padding: "0 32px" }}>
        Sök
      </button>
    </form>
  );
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block px-4 py-3">
      <span className="b-field-label">{label}</span>
      {children}
    </label>
  );
}
