"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { computePricing } from "@/lib/pricing";
import { nightsBetween, isoDate, validateStay } from "@/lib/dates";
import { isAvailable } from "@/lib/availability";
import { formatMoney, formatPriceShort } from "@/lib/money";
import { PriceBreakdown } from "./PriceBreakdown";

export interface BookingWidgetProps {
  propertyId: string;
  nightlyPriceCents: number;
  cleaningFeeCents: number;
  currency: string;
  maxGuests: number;
  bookedRanges: { checkIn: string; checkOut: string }[];
  initial?: { checkIn?: string; checkOut?: string; guests?: number };
}

export function BookingWidget(props: BookingWidgetProps) {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState(props.initial?.checkIn ?? "");
  const [checkOut, setCheckOut] = useState(props.initial?.checkOut ?? "");
  const [guests, setGuests] = useState(props.initial?.guests ?? 1);

  const nights = useMemo(
    () => (checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0),
    [checkIn, checkOut],
  );

  const breakdown = useMemo(() => {
    if (nights < 1) return null;
    return computePricing({
      nightlyPriceCents: props.nightlyPriceCents,
      cleaningFeeCents: props.cleaningFeeCents,
      nights,
    });
  }, [nights, props.nightlyPriceCents, props.cleaningFeeCents]);

  const available = useMemo(() => {
    if (nights < 1) return true;
    return isAvailable({ checkIn, checkOut }, props.bookedRanges);
  }, [checkIn, checkOut, nights, props.bookedRanges]);

  const today = isoDate(new Date());

  let error: string | null = null;
  if (checkIn && checkOut) {
    const stay = validateStay(checkIn, checkOut);
    if (!stay.ok) error = stay.error;
    else if (!available) error = "De valda datumen är tyvärr redan bokade.";
  }
  if (!error && guests > props.maxGuests) {
    error = `Max ${props.maxGuests} gäster för detta boende.`;
  }

  const canBook =
    nights >= 1 && available && guests >= 1 && guests <= props.maxGuests && !error;

  function reserve() {
    if (!canBook) return;
    const params = new URLSearchParams({
      propertyId: props.propertyId,
      checkIn,
      checkOut,
      guests: String(guests),
    });
    router.push(`/checkout?${params.toString()}`);
  }

  return (
    <div style={{ border: "1px solid var(--ink)", background: "var(--paper)", padding: 28 }}>
      <div className="flex items-baseline gap-3">
        <span style={{ fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 500, lineHeight: 1 }}>
          {formatPriceShort(props.nightlyPriceCents, props.currency)}
        </span>
        <span className="b-label">per natt</span>
      </div>

      <div className="mt-6 grid grid-cols-2" style={{ border: "1px solid var(--hairline)" }}>
        <label className="p-3" style={{ borderRight: "1px solid var(--hairline)" }}>
          <span className="b-field-label">Incheckning</span>
          <input
            type="date"
            value={checkIn}
            min={today}
            onChange={(e) => setCheckIn(e.target.value)}
            className="w-full bg-transparent outline-none"
            style={{ fontFamily: "var(--font-body)", fontSize: 15 }}
          />
        </label>
        <label className="p-3">
          <span className="b-field-label">Utcheckning</span>
          <input
            type="date"
            value={checkOut}
            min={checkIn || today}
            onChange={(e) => setCheckOut(e.target.value)}
            className="w-full bg-transparent outline-none"
            style={{ fontFamily: "var(--font-body)", fontSize: 15 }}
          />
        </label>
        <label className="col-span-2 p-3" style={{ borderTop: "1px solid var(--hairline)" }}>
          <span className="b-field-label">Gäster</span>
          <input
            type="number"
            min={1}
            max={props.maxGuests}
            value={guests}
            onChange={(e) => setGuests(Math.max(1, Number(e.target.value) || 1))}
            className="w-full bg-transparent outline-none"
            style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-body)" }}
          />
        </label>
      </div>

      {error && (
        <p
          className="mt-4"
          style={{ fontSize: 15, borderLeft: "2px solid var(--ink)", paddingLeft: 12 }}
          role="alert"
        >
          {error}
        </p>
      )}

      {breakdown && !error && (
        <div className="mt-6">
          <PriceBreakdown breakdown={breakdown} currency={props.currency} />
        </div>
      )}

      <button onClick={reserve} disabled={!canBook} className="b-btn b-btn-solid b-btn-block mt-6">
        {nights >= 1 ? "Boka" : "Välj datum"}
      </button>

      <p
        className="mt-4 text-center"
        style={{
          fontFamily: "var(--font-label)",
          fontSize: 9,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: "var(--muted)",
        }}
      >
        {breakdown ? `${formatMoney(breakdown.totalCents, props.currency)} · ` : ""}
        Sandbox — inga riktiga pengar dras
      </p>
    </div>
  );
}
