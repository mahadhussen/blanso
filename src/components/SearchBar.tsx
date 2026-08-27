"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SearchBar({
  variant = "hero",
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

  const dark = variant === "hero";

  return (
    <form
      onSubmit={submit}
      className={`grid gap-2 rounded-2xl p-2 sm:grid-cols-[1.4fr_1fr_1fr_0.8fr_auto] sm:items-end ${
        dark ? "bg-background shadow-pop" : "border border-line bg-background shadow-card"
      }`}
    >
      <Field label="Vart vill du åka?">
        <input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Stad eller land"
          className="w-full bg-transparent text-sm font-medium text-ink outline-none placeholder:text-muted"
        />
      </Field>
      <Field label="Incheckning">
        <input
          type="date"
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          className="w-full bg-transparent text-sm font-medium text-ink outline-none"
        />
      </Field>
      <Field label="Utcheckning">
        <input
          type="date"
          value={checkOut}
          min={checkIn || undefined}
          onChange={(e) => setCheckOut(e.target.value)}
          className="w-full bg-transparent text-sm font-medium text-ink outline-none"
        />
      </Field>
      <Field label="Gäster">
        <input
          type="number"
          min={1}
          max={16}
          value={guests}
          onChange={(e) => setGuests(Math.max(1, Number(e.target.value) || 1))}
          className="w-full bg-transparent text-sm font-medium text-ink outline-none"
        />
      </Field>
      <button
        type="submit"
        className="flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        Sök
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="rounded-xl px-3 py-2 hover:bg-panel">
      <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </span>
      <span className="mt-0.5 block">{children}</span>
    </label>
  );
}
