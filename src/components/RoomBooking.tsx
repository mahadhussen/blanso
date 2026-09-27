"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { computePricing } from "@/lib/pricing";
import { isoDate } from "@/lib/dates";
import { scarcityLabel } from "@/lib/roomCopy";
import { formatPriceShort } from "@/lib/money";
import type { RoomOffer } from "@/lib/queries";

// Boendesidans bokningsdel — booking.com-modellen i designfacits form:
// datumrad, rumstabell ("Room type | Sleeps | Price for N nights | Rooms") med
// facitets .b-room-row-rytm, och den klistriga bokningsrutan till höger som
// sammanfattar valet. En rumstyp per bokning (flera rum av den); väljer man
// antal på en annan rad nollställs den förra. Priset här är en förhandsvisning
// ur samma motor som servern — checkout räknar alltid om på servern.

export interface RoomBookingProps {
  slug: string;
  propertyId: string;
  cleaningFeeCents: number;
  fromPriceCents: number;
  offers: RoomOffer[];
  stay: { checkIn: string; checkOut: string; nights: number } | null;
  initial: { checkIn?: string; checkOut?: string; guests: number };
  dateError: string | null;
  about: React.ReactNode;
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

// Samma formatering som checkout och bekräftelse (money.ts).
const $ = (cents: number) => formatPriceShort(cents);

function specLine(o: RoomOffer): string {
  return [o.sizeSqm ? `${o.sizeSqm} m²` : null, o.bedConfig].filter(Boolean).join(" · ");
}

export function RoomBooking(p: RoomBookingProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<{ id: string; rooms: number } | null>(null);
  const [guests, setGuests] = useState(p.initial.guests);
  const today = isoDate(new Date());

  const offer = selected ? p.offers.find((o) => o.id === selected.id) ?? null : null;
  const nights = p.stay?.nights ?? 0;

  const breakdown = useMemo(() => {
    if (!offer || !selected || nights < 1) return null;
    return computePricing({
      nightlyPriceCents: offer.nightlyPriceCents,
      cleaningFeeCents: p.cleaningFeeCents,
      nights,
      rooms: selected.rooms,
    });
  }, [offer, selected, nights, p.cleaningFeeCents]);

  const capacity = offer && selected ? offer.maxGuests * selected.rooms : 0;
  const guestError =
    offer && selected && guests > capacity
      ? `${selected.rooms} × ${offer.name} sleeps ${capacity}. Add a room or choose a larger room for ${guests} guests.`
      : null;
  const canReserve = Boolean(p.stay && offer && selected && breakdown && !guestError);

  function choose(o: RoomOffer, rooms: number) {
    setSelected(rooms > 0 ? { id: o.id, rooms } : selected?.id === o.id ? null : selected);
  }

  function reserve() {
    if (!canReserve || !p.stay || !selected) return;
    const params = new URLSearchParams({
      propertyId: p.propertyId,
      roomTypeId: selected.id,
      rooms: String(selected.rooms),
      checkIn: p.stay.checkIn,
      checkOut: p.stay.checkOut,
      guests: String(guests),
    });
    router.push(`/checkout?${params.toString()}`);
  }

  const summary = (
    <div className="b-rise-3 b-summary" style={{ position: "sticky", top: 24, border: "1px solid var(--ink)", padding: 28 }}>
      {offer && selected && p.stay ? (
        <>
          <div className="b-label">Your selection</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-h3)", marginTop: 6 }}>
            {selected.rooms} × {offer.name}
          </div>
          <div style={{ fontSize: "var(--text-body)", color: "var(--ink-2)", marginTop: 4 }}>
            {p.stay.checkIn} – {p.stay.checkOut} · {nights} {nights === 1 ? "night" : "nights"} · {guests} {guests === 1 ? "guest" : "guests"}
          </div>
        </>
      ) : (
        <div style={{ display: "flex", alignItems: "baseline", gap: "var(--s-1)" }}>
          {p.fromPriceCents > 0 && (
            <>
              <span className="b-label" style={{ letterSpacing: "var(--ls-label-tight)" }}>From</span>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 36 }}>{$(p.fromPriceCents)}</span>
              <span className="b-label" style={{ letterSpacing: "var(--ls-label-tight)" }}>per night</span>
            </>
          )}
        </div>
      )}

      {breakdown && offer && selected && !guestError && (
        <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 10, fontSize: "var(--text-body)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <span>
              {$(offer.nightlyPriceCents)} × {nights} {nights === 1 ? "night" : "nights"}
              {selected.rooms > 1 ? ` × ${selected.rooms} rooms` : ""}
            </span>
            <span>{$(breakdown.subtotalCents)}</span>
          </div>
          {breakdown.cleaningFeeCents > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span>Cleaning fee{selected.rooms > 1 ? ` × ${selected.rooms}` : ""}</span>
              <span>{$(breakdown.cleaningFeeCents)}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <span>Service fee</span>
            <span>{$(breakdown.serviceFeeCents)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--ink)", paddingTop: "var(--s-2)", fontWeight: 500 }}>
            <span>Total</span>
            <span data-testid="summary-total">{$(breakdown.totalCents)}</span>
          </div>
        </div>
      )}

      {guestError && (
        <div role="alert" style={{ marginTop: 16, fontSize: 15, borderLeft: "2px solid var(--ink)", paddingLeft: 12 }}>{guestError}</div>
      )}
      {!offer && (
        <div style={{ marginTop: 16, fontSize: "var(--text-body)", color: "var(--ink-2)" }}>
          {p.stay ? "Choose how many rooms you want in the table." : "Choose your dates to see which rooms are free."}
        </div>
      )}

      <button onClick={reserve} disabled={!canReserve} className="b-btn b-btn-solid b-btn-block" style={{ marginTop: 22 }}>
        {p.stay ? "Reserve" : "Select dates"}
      </button>
      <div className="b-label" style={{ fontSize: 9, letterSpacing: 1, fontWeight: 400, textAlign: "center", marginTop: 14 }}>
        Sandbox — no real money is charged
      </div>
    </div>
  );

  return (
    <div className="b-detail-grid" style={{ padding: "var(--s-7) 0" }}>
      <div style={{ minWidth: 0 }}>
        {p.about}

        <section id="rooms" style={{ marginTop: "var(--s-7)", scrollMarginTop: 24 }}>
          <div className="b-label">Choose your room</div>

          {/* Datumrad — GET mot samma sida så servern räknar lagret för datumen. */}
          <form action={`/rooms/${p.slug}#rooms`} method="get" className="b-datebar" style={{ marginTop: "var(--s-4)" }}>
            <label>
              <span className="b-label" style={label9}>Check-in</span>
              <input type="date" name="checkIn" defaultValue={p.initial.checkIn} min={today} required style={cellIn} />
            </label>
            <label>
              <span className="b-label" style={label9}>Check-out</span>
              <input type="date" name="checkOut" defaultValue={p.initial.checkOut} min={today} required style={cellIn} />
            </label>
            <label>
              <span className="b-label" style={label9}>Guests</span>
              <input
                type="number"
                name="guests"
                min={1}
                max={50}
                value={guests}
                onChange={(e) => setGuests(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
                style={cellIn}
              />
            </label>
            <button type="submit" className="b-btn b-btn-solid">{p.stay ? "Update" : "Check availability"}</button>
          </form>
          {p.dateError && (
            <div role="alert" style={{ marginTop: 12, fontSize: 15, borderLeft: "2px solid var(--ink)", paddingLeft: 12 }}>{p.dateError}</div>
          )}

          {p.offers.length === 0 ? (
            <div style={{ marginTop: "var(--s-4)", borderTop: "1px solid var(--ink)", padding: "28px 0", fontSize: "var(--text-body)", color: "var(--ink-2)" }}>
              This property has not added any rooms yet.
            </div>
          ) : (
            <div role="table" aria-label="Rooms" style={{ marginTop: "var(--s-4)", borderTop: "1px solid var(--ink)" }}>
              <div role="row" className="b-room-head">
                <span role="columnheader" className="b-label" style={{ gridColumn: "1 / 3" }}>Room type</span>
                <span role="columnheader" className="b-label">Sleeps</span>
                <span role="columnheader" className="b-label" style={{ textAlign: "right" }}>
                  {p.stay ? `Price for ${nights} ${nights === 1 ? "night" : "nights"}` : "Price per night"}
                </span>
                <span role="columnheader" className="b-label" style={{ textAlign: "right" }}>Rooms</span>
              </div>
              {p.offers.map((o) => {
                const scarce = scarcityLabel(o.closed ? 0 : o.available);
                const soldOut = p.stay !== null && (o.closed || (o.available ?? 0) < 1);
                const qty = selected?.id === o.id ? selected.rooms : 0;
                const max = Math.min(o.available ?? 0, 30);
                return (
                  <div role="row" key={o.id} className="b-room-row b-room-row-x" data-room={o.name} style={{ padding: "28px 0", borderBottom: "1px solid var(--hairline)", opacity: soldOut ? 0.62 : 1 }}>
                    <span className="b-media b-room-img" style={{ width: 140, height: 104, position: "relative" }}>
                      {o.image && <Image src={o.image} alt={o.name} fill sizes="140px" />}
                    </span>
                    <div role="cell" style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-h3)", lineHeight: 1.15 }}>{o.name}</div>
                      <div className="b-label" style={{ fontSize: 11, letterSpacing: 1.5, fontWeight: 600, marginTop: "var(--s-1)" }}>{specLine(o)}</div>
                      <div style={{ fontSize: "var(--text-body)", color: "var(--ink-2)", marginTop: "var(--s-1)" }}>Free cancellation</div>
                      {scarce && (
                        <div className="b-label b-label-ink" style={{ marginTop: "var(--s-1)", letterSpacing: 1.5 }} data-testid="scarcity">
                          {o.closed ? "Not available on these dates" : scarce}
                        </div>
                      )}
                    </div>
                    <div role="cell" className="b-room-sleeps" style={{ fontSize: "var(--text-body)" }}>
                      <span className="b-room-mlabel b-label">Sleeps </span>
                      {o.maxGuests} {o.maxGuests === 1 ? "guest" : "guests"}
                    </div>
                    <div role="cell" className="b-room-price">
                      <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-num)", lineHeight: 1.1 }}>
                        {$(o.nightlyPriceCents * Math.max(1, nights))}
                      </div>
                      <div className="b-label" style={{ letterSpacing: "var(--ls-label-tight)", marginTop: 2 }}>
                        {p.stay ? `${$(o.nightlyPriceCents)} per night` : "per night"}
                      </div>
                    </div>
                    <div role="cell" className="b-room-qty">
                      {!p.stay ? (
                        <a href="#rooms" className="b-label b-label-ink" style={{ borderBottom: "1px solid var(--ink)", paddingBottom: 3 }}>Add dates</a>
                      ) : soldOut ? (
                        <span className="b-label b-label-ink">{o.closed ? "Closed" : "Sold out"}</span>
                      ) : (
                        <select
                          aria-label={`Number of ${o.name} rooms`}
                          value={qty}
                          onChange={(e) => choose(o, Number(e.target.value))}
                          className="b-select"
                        >
                          {Array.from({ length: max + 1 }, (_, n) => (
                            <option key={n} value={n}>
                              {n === 0 ? "0" : `${n} (${$(o.nightlyPriceCents * nights * n)})`}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                );
              })}
              <div style={{ fontSize: 15, color: "var(--muted)", marginTop: "var(--s-3)" }}>
                One room type per booking. Prices exclude the 8% service fee{p.cleaningFeeCents > 0 ? " and cleaning" : ""}.
              </div>
            </div>
          )}
        </section>
      </div>

      <div>{summary}</div>

      {/* Mobil: klistrig bokningsrad när ett val finns (rutan hamnar annars långt ner). */}
      {canReserve && breakdown && offer && selected && (
        <div className="b-reserve-bar">
          <div style={{ minWidth: 0 }}>
            <div className="b-label" style={{ letterSpacing: 1.5 }}>{selected.rooms} × {offer.name}</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 24 }}>{$(breakdown.totalCents)}</div>
          </div>
          <button onClick={reserve} className="b-btn b-btn-solid" style={{ padding: "14px 22px", flexShrink: 0 }}>Reserve</button>
        </div>
      )}
    </div>
  );
}
