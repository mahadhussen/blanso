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
    <div className="rounded-2xl border border-line bg-background p-5 shadow-card">
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-semibold text-ink">
          {formatPriceShort(props.nightlyPriceCents, props.currency)}
        </span>
        <span className="text-muted">/ natt</span>
      </div>

      <div className="mt-4 grid grid-cols-2 overflow-hidden rounded-xl border border-line">
        <label className="border-r border-line p-3">
          <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted">
            Incheckning
          </span>
          <input
            type="date"
            value={checkIn}
            min={today}
            onChange={(e) => setCheckIn(e.target.value)}
            className="mt-1 w-full bg-transparent text-sm font-medium text-ink outline-none"
          />
        </label>
        <label className="p-3">
          <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted">
            Utcheckning
          </span>
          <input
            type="date"
            value={checkOut}
            min={checkIn || today}
            onChange={(e) => setCheckOut(e.target.value)}
            className="mt-1 w-full bg-transparent text-sm font-medium text-ink outline-none"
          />
        </label>
        <label className="col-span-2 border-t border-line p-3">
          <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted">
            Gäster
          </span>
          <input
            type="number"
            min={1}
            max={props.maxGuests}
            value={guests}
            onChange={(e) => setGuests(Math.max(1, Number(e.target.value) || 1))}
            className="mt-1 w-full bg-transparent text-sm font-medium text-ink outline-none"
          />
        </label>
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <button
        onClick={reserve}
        disabled={!canBook}
        className="mt-4 w-full rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
      >
        {nights >= 1 ? "Reservera" : "Välj datum"}
      </button>

      {breakdown && !error && (
        <div className="mt-5 border-t border-line pt-5">
          <PriceBreakdown breakdown={breakdown} currency={props.currency} />
        </div>
      )}

      <p className="mt-4 text-center text-xs text-muted">
        Du betalar {breakdown ? formatMoney(breakdown.totalCents, props.currency) : "inget"} nu.
        Sandbox-betalning, inga riktiga pengar dras.
      </p>
    </div>
  );
}
