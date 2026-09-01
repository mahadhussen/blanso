import Image from "next/image";
import Link from "next/link";
import { getPropertyById, getBookedRanges } from "@/lib/queries";
import { priceForDates } from "@/lib/pricing";
import { isAvailable } from "@/lib/availability";
import { isoDate, validateStay } from "@/lib/dates";
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
  const checkIn = first(sp.checkIn);
  const checkOut = first(sp.checkOut);
  const guests = Math.max(1, parseInt(first(sp.guests) ?? "2", 10) || 2);

  if (!propertyId || !checkIn || !checkOut) {
    return <Problem message="The booking is missing details. Go back and pick a stay and dates." />;
  }
  const property = await getPropertyById(propertyId);
  if (!property) return <Problem message="Stay not found." />;

  const stay = validateStay(checkIn, checkOut);
  if (!stay.ok) return <Problem message={stay.error} href={`/rooms/${property.slug}`} />;
  if (guests > property.maxGuests) {
    return <Problem message={`This stay takes at most ${property.maxGuests} guests.`} href={`/rooms/${property.slug}`} />;
  }

  let breakdown;
  try {
    breakdown = priceForDates({
      nightlyPriceCents: property.nightlyPriceCents,
      cleaningFeeCents: property.cleaningFeeCents,
      checkIn,
      checkOut,
    });
  } catch {
    return <Problem message="Invalid dates. Choose at least one night." />;
  }

  const ranges = await getBookedRanges(property.id);
  const free = isAvailable(
    { checkIn, checkOut },
    ranges.map((r) => ({ checkIn: isoDate(r.checkIn), checkOut: isoDate(r.checkOut) })),
  );
  if (!free) return <Problem message="Those dates are already booked." href={`/rooms/${property.slug}`} />;

  const $ = (c: number) => "$" + (c % 100 === 0 ? c / 100 : (c / 100).toFixed(2));
  const cover = property.images[0];

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
          <CheckoutForm propertyId={property.id} checkIn={checkIn} checkOut={checkOut} guests={guests} title={property.title} />

          <div>
            <div style={{ position: "sticky", top: 24, border: "1px solid var(--ink)" }}>
              <span className="b-media" style={{ height: 180, display: "block", position: "relative" }}>
                {cover && <Image src={cover} alt={property.title} fill sizes="380px" />}
              </span>
              <div style={{ padding: "24px 28px 28px" }}>
                <div className="b-label">{property.city}, {property.country}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-h3)", marginTop: 6 }}>{property.title}</div>
                <div style={{ fontSize: "var(--text-body)", color: "var(--ink-2)", marginTop: 4 }}>
                  {checkIn} – {checkOut} · {guests} {guests === 1 ? "adult" : "adults"}
                </div>
                <div style={{ marginTop: "var(--s-4)", display: "flex", flexDirection: "column", gap: 10, fontSize: "var(--text-body)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{$(property.nightlyPriceCents)} × {breakdown.nights} {breakdown.nights === 1 ? "night" : "nights"}</span>
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
        Back to search
      </Link>
    </div>
  );
}
