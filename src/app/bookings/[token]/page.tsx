import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStore } from "@/lib/store";

// Bekräftelsen — 1:1-port av "Balaanso Confirmation.dc.html", datadriven.
export const metadata = { title: "Booking confirmation" };
export const dynamic = "force-dynamic";

// Bokningsnummer: suffixet ÄR bokningens unika id — aldrig en härledd summa.
function displayNumber(id: string, createdAt: string): string {
  const year = new Date(createdAt).getUTCFullYear();
  return `BLN-${year}-${id.replace("bok_", "").replace(/-/g, "").toUpperCase()}`;
}

export default async function BookingConfirmationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const store = getStore();
  // Slås upp på den ogenomskinliga token, aldrig på id (IDOR-skydd).
  const booking = await store.getBookingByToken(token);
  if (!booking) notFound();
  const listing = await store.getListingById(booking.listingId);
  if (!listing) notFound();

  const cover = listing.images[0];
  const confirmed = booking.status === "confirmed";
  const $ = (c: number) => "$" + (c % 100 === 0 ? c / 100 : (c / 100).toFixed(2));
  const label9: React.CSSProperties = { fontSize: 9, letterSpacing: "var(--ls-label-tight)", display: "block" };

  return (
    <div style={{ background: "var(--paper)", color: "var(--ink)", fontFamily: "var(--font-body)" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "var(--s-8) var(--page-pad)", textAlign: "center" }}>
        <div className="b-rise">
          <div className="b-label">
            Booking {displayNumber(booking.id, booking.createdAt)} · {confirmed ? "Confirmed" : "Cancelled"}
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 300, fontSize: "var(--text-h1)", lineHeight: 1.05, letterSpacing: "var(--ls-display)", textTransform: "uppercase", margin: "var(--s-4) 0 0" }}>
            {confirmed ? `Welcome to ${listing.city}` : "Booking cancelled"}
          </h1>
          <p style={{ fontSize: "var(--text-lead)", lineHeight: 1.7, margin: "var(--s-4) auto 0", maxWidth: "48ch" }}>
            {confirmed
              ? `Your booking is confirmed. Your host ${listing.hostName} will be in touch about arrival. This is a demo — no email is sent and bookings live in the sandbox.`
              : "The host has cancelled this stay. Your payment has been reversed."}
          </p>
        </div>

        <div className="b-rise-2" style={{ marginTop: "var(--s-6)", border: "1px solid var(--ink)", textAlign: "left" }}>
          <span className="b-media" style={{ height: 220, display: "block", position: "relative" }}>
            {cover && <Image src={cover} alt={listing.title} fill sizes="760px" priority />}
          </span>
          <div style={{ padding: 28 }}>
            <div className="b-label">{listing.city}, {listing.country}</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-h3)", marginTop: 6 }}>{listing.title}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--s-4)", marginTop: "var(--s-4)", fontSize: "var(--text-body)" }}>
              <div>
                <span className="b-label" style={label9}>Check-in</span>
                <span style={{ display: "block", marginTop: 4 }}>{booking.checkIn}</span>
              </div>
              <div>
                <span className="b-label" style={label9}>Check-out</span>
                <span style={{ display: "block", marginTop: 4 }}>{booking.checkOut}</span>
              </div>
              <div>
                <span className="b-label" style={label9}>Guests</span>
                <span style={{ display: "block", marginTop: 4 }}>{booking.guests} {booking.guests === 1 ? "adult" : "adults"}</span>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--hairline)", marginTop: "var(--s-4)", paddingTop: "var(--s-3)", fontSize: "var(--text-body)", fontWeight: 500 }}>
              <span>{confirmed ? "Total paid (sandbox)" : "Reversed (sandbox)"}</span>
              <span>{$(booking.totalCents)}</span>
            </div>
          </div>
        </div>

        <div className="b-rise-3" style={{ display: "flex", gap: "var(--s-3)", justifyContent: "center", marginTop: "var(--s-6)", flexWrap: "wrap" }}>
          <Link href={`/rooms/${listing.slug}`} className="b-btn b-btn-solid">View the stay</Link>
          <Link href="/s" className="b-btn">Keep exploring</Link>
        </div>
      </div>
    </div>
  );
}
