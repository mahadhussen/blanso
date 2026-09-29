import Image from "next/image";
import Link from "next/link";
import { getPropertyById } from "@/lib/queries";
import { priceForDates } from "@/lib/pricing";
import { validateStay } from "@/lib/dates";
import { getStore } from "@/lib/store";
import { formatPriceShort } from "@/lib/money";
import { roomsLeftMessage } from "@/lib/roomCopy";
import { CheckoutForm } from "@/components/CheckoutForm";

// Checkout — 1:1-port av "Balaanso Booking.dc.html", med riktiga priser och
// riktig server action. "Confirm and pay" i sammanfattningen skickar formuläret.

export const metadata = { title: "Complete your booking" };
export const dynamic = "force-dynamic";

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const propertyId = first(sp.propertyId);
  const roomTypeId = first(sp.roomTypeId);
  const checkIn = first(sp.checkIn);
  const checkOut = first(sp.checkOut);
  const guests = Math.max(1, parseInt(first(sp.guests) ?? "2", 10) || 2);
  const rooms = parseInt(first(sp.rooms) ?? "1", 10);

  if (!propertyId || !roomTypeId || !checkIn || !checkOut) {
    return <Problem message="The booking is missing details. Go back and choose a room and dates." />;
  }
  const property = await getPropertyById(propertyId);
  if (!property) return <Problem message="Stay not found." />;
  const back = `/rooms/${property.slug}?${new URLSearchParams({ checkIn, checkOut, guests: String(guests) }).toString()}#rooms`;

  const store = getStore();
  const roomType = await store.getRoomType(roomTypeId);
  if (!roomType || roomType.listingId !== property.id || roomType.archivedAt !== null) {
    return <Problem message="That room is no longer offered. Choose another room." href={back} />;
  }
  // Samma gräns som bokningsvalideringen (validation.ts: 1–50 rum).
  if (!Number.isInteger(rooms) || rooms < 1 || rooms > 50) {
    return <Problem message="Choose between 1 and 50 rooms." href={back} />;
  }

  const stay = validateStay(checkIn, checkOut);
  if (!stay.ok) return <Problem message={stay.error} href={back} />;
  const capacity = roomType.maxGuests * rooms;
  if (guests > capacity) {
    return (
      <Problem
        message={`${rooms} × ${roomType.name} sleeps at most ${capacity} ${capacity === 1 ? "guest" : "guests"}. Add a room or choose a larger room.`}
        href={back}
      />
    );
  }

  // Lagret för just dessa nätter — samma motor som den atomiska bokningen.
  const current = (await store.getRoomAvailability(property.id, checkIn, checkOut)).find(
    (a) => a.roomType.id === roomType.id,
  );
  if (!current || current.closed) {
    return <Problem message={`The ${roomType.name} is not available on those dates.`} href={back} />;
  }
  if (current.available < rooms) {
    return <Problem message={roomsLeftMessage(current.available, rooms, roomType.name)} href={back} />;
  }

  // Priset räknas ALLTID här på servern ur rumstypens pris — aldrig ur URL:en.
  const breakdown = priceForDates({
    nightlyPriceCents: roomType.nightlyPriceCents,
    cleaningFeeCents: property.cleaningFeeCents,
    checkIn,
    checkOut,
    rooms,
  });

  const $ = (c: number) => formatPriceShort(c);
  const cover = roomType.images[0] ?? property.images[0];
  const roomLabel = `${rooms} × ${roomType.name}`;
  const nightsLabel = `${breakdown.nights} ${breakdown.nights === 1 ? "night" : "nights"}`;

  return (
    <div style={{ background: "var(--paper)", color: "var(--ink)", fontFamily: "var(--font-body)" }}>
      <div style={{ maxWidth: "var(--page-max)", margin: "0 auto", padding: "40px var(--page-pad) var(--s-8)" }}>
        <div className="b-rise">
          <div className="b-label">
            <Link href={`/rooms/${property.slug}`} style={{ color: "var(--muted)" }}>{property.title}</Link>
            &nbsp;/&nbsp; Booking
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 300, fontSize: "var(--text-h1)", lineHeight: 1, letterSpacing: "var(--ls-display)", textTransform: "uppercase", margin: "var(--s-3) 0 0" }}>
            Complete your booking
          </h1>
        </div>

        <div className="b-detail-grid" style={{ padding: "var(--s-6) 0 0" }}>
          <CheckoutForm
            propertyId={property.id}
            roomTypeId={roomType.id}
            rooms={rooms}
            checkIn={checkIn}
            checkOut={checkOut}
            guests={guests}
            roomLabel={roomLabel}
          />

          <div>
            <div style={{ position: "sticky", top: 24, border: "1px solid var(--ink)" }}>
              <span className="b-media" style={{ height: 180, display: "block", position: "relative" }}>
                {cover && <Image src={cover} alt={roomType.name} fill sizes="380px" />}
              </span>
              <div style={{ padding: "24px 28px 28px" }}>
                <div className="b-label">{property.city}, {property.country}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-h3)", marginTop: 6 }}>{property.title}</div>
                <div style={{ fontSize: "var(--text-body)", marginTop: 8 }} data-testid="checkout-room">
                  {roomLabel}
                </div>
                <div style={{ fontSize: "var(--text-body)", color: "var(--ink-2)", marginTop: 4 }}>
                  {roomType.sizeSqm ? `${roomType.sizeSqm} m² · ` : ""}{roomType.bedConfig}
                </div>
                <div style={{ fontSize: "var(--text-body)", color: "var(--ink-2)", marginTop: 4 }}>
                  {checkIn} – {checkOut} · {nightsLabel} · {guests} {guests === 1 ? "guest" : "guests"}
                </div>
                <div style={{ marginTop: "var(--s-4)", display: "flex", flexDirection: "column", gap: 10, fontSize: "var(--text-body)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>
                      {$(roomType.nightlyPriceCents)} × {nightsLabel}
                      {rooms > 1 ? ` × ${rooms} rooms` : ""}
                    </span>
                    <span>{$(breakdown.subtotalCents)}</span>
                  </div>
                  {breakdown.cleaningFeeCents > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Cleaning fee{rooms > 1 ? ` × ${rooms}` : ""}</span>
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
                <button type="submit" form="booking-form" className="b-btn b-btn-solid b-btn-block" style={{ marginTop: 22 }}>
                  Confirm and pay
                </button>
                <div className="b-label" style={{ fontSize: 9, letterSpacing: 1, fontWeight: 400, textAlign: "center", marginTop: 14 }}>
                  Sandbox payment · No real money is charged
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Problem({ message, href }: { message: string; href?: string }) {
  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "96px var(--page-pad)", textAlign: "center" }}>
      <p style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-h3)" }}>{message}</p>
      <Link href={href ?? "/s"} className="b-btn" style={{ marginTop: 32, display: "inline-block" }}>
        {href ? "Back to the rooms" : "Back to search"}
      </Link>
    </div>
  );
}
