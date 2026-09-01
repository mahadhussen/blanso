"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { computePricing } from "@/lib/pricing";
import { nightsBetween, isoDate, validateStay } from "@/lib/dates";
import { isAvailable } from "@/lib/availability";

// Bokningspanelen — 1:1 chrome från "Balaanso Hotel.dc.html" (sticky, svart ram,
// 36px pris, bordered datumgrid, prisrader, Book, trustrad) med riktig logik.

export interface BookingPanelProps {
  propertyId: string;
  nightlyPriceCents: number;
  cleaningFeeCents: number;
  maxGuests: number;
  bookedRanges: { checkIn: string; checkOut: string }[];
  initial?: { checkIn?: string; checkOut?: string; guests?: number };
}

const label9: React.CSSProperties = { fontSize: 9, letterSpacing: "var(--ls-label-tight)" };
const cellIn: React.CSSProperties = {
  fontSize: "var(--text-body)",
  marginTop: 4,
  width: "100%",
  border: 0,
  outline: "none",
  background: "transparent",
  fontFamily: "var(--font-body)",
  color: "var(--ink)",
};

export function BookingPanelDc(p: BookingPanelProps) {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState(p.initial?.checkIn ?? "");
  const [checkOut, setCheckOut] = useState(p.initial?.checkOut ?? "");
  const [guests, setGuests] = useState(p.initial?.guests ?? 2);

  const nights = useMemo(
    () => (checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0),
    [checkIn, checkOut],
  );
  const breakdown = useMemo(() => {
    if (nights < 1) return null;
    return computePricing({ nightlyPriceCents: p.nightlyPriceCents, cleaningFeeCents: p.cleaningFeeCents, nights });
  }, [nights, p.nightlyPriceCents, p.cleaningFeeCents]);
  const available = useMemo(() => {
    if (nights < 1) return true;
    return isAvailable({ checkIn, checkOut }, p.bookedRanges);
  }, [checkIn, checkOut, nights, p.bookedRanges]);

  const today = isoDate(new Date());
  let error: string | null = null;
  if (checkIn && checkOut) {
    const stay = validateStay(checkIn, checkOut);
    if (!stay.ok) error = stay.error;
    else if (!available) error = "Those dates are already booked.";
  }
  if (!error && guests > p.maxGuests) error = `This stay takes at most ${p.maxGuests} guests.`;
  const canBook = nights >= 1 && available && guests >= 1 && guests <= p.maxGuests && !error;

  const $ = (cents: number) => "$" + (cents % 100 === 0 ? cents / 100 : (cents / 100).toFixed(2));

  function book() {
    if (!canBook) return;
    const params = new URLSearchParams({ propertyId: p.propertyId, checkIn, checkOut, guests: String(guests) });
    router.push(`/checkout?${params.toString()}`);
  }

  return (
    <div className="b-rise-3" style={{ position: "sticky", top: 24, border: "1px solid var(--ink)", padding: 28 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "var(--s-1)" }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 36 }}>{$(p.nightlyPriceCents)}</span>
        <span className="b-label" style={{ letterSpacing: "var(--ls-label-tight)" }}>per night</span>
      </div>
      <div style={{ marginTop: 22, border: "1px solid var(--hairline)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
          <label style={{ padding: "var(--s-2) var(--s-3)", borderRight: "1px solid var(--hairline)", borderBottom: "1px solid var(--hairline)" }}>
            <span className="b-label" style={label9}>Check-in</span>
            <input type="date" value={checkIn} min={today} onChange={(e) => setCheckIn(e.target.value)} style={cellIn} />
          </label>
          <label style={{ padding: "var(--s-2) var(--s-3)", borderBottom: "1px solid var(--hairline)" }}>
            <span className="b-label" style={label9}>Check-out</span>
            <input type="date" value={checkOut} min={checkIn || today} onChange={(e) => setCheckOut(e.target.value)} style={cellIn} />
          </label>
        </div>
        <label style={{ display: "block", padding: "var(--s-2) var(--s-3)" }}>
          <span className="b-label" style={label9}>Guests</span>
          <input type="number" min={1} max={p.maxGuests} value={guests} onChange={(e) => setGuests(Math.max(1, Number(e.target.value) || 1))} style={cellIn} />
        </label>
      </div>

      {error && (
        <div role="alert" style={{ marginTop: 16, fontSize: 15, borderLeft: "2px solid var(--ink)", paddingLeft: 12 }}>{error}</div>
      )}

      {breakdown && !error && (
        <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 10, fontSize: "var(--text-body)" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>{$(p.nightlyPriceCents)} × {nights} {nights === 1 ? "night" : "nights"}</span>
            <span>{$(breakdown.subtotalCents)}</span>
          </div>
          {breakdown.cleaningFeeCents > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Cleaning fee</span>
              <span>{$(breakdown.cleaningFeeCents)}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Service fee</span>
            <span>{$(breakdown.serviceFeeCents)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--ink)", paddingTop: "var(--s-2)", fontWeight: 500 }}>
            <span>Total</span>
            <span>{$(breakdown.totalCents)}</span>
          </div>
        </div>
      )}

      <button onClick={book} disabled={!canBook} className="b-btn b-btn-solid b-btn-block" style={{ marginTop: 22 }}>
        {nights >= 1 ? "Book" : "Select dates"}
      </button>
      <div className="b-label" style={{ fontSize: 9, letterSpacing: 1, fontWeight: 400, textAlign: "center", marginTop: 14 }}>
        Sandbox — no real money is charged
      </div>
    </div>
  );
}
