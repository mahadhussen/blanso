import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStore } from "@/lib/store";
import { formatMoney } from "@/lib/money";

export const metadata = { title: "Bokningsbekräftelse" };
export const dynamic = "force-dynamic";

// Bokningsnummer BLN-ÅÅÅÅ-XXXXXXXXXXX: suffixet ÄR bokningens unika id (hex),
// alltså garanterat unikt — aldrig en härledd summa med kollisionsrymd.
// Avvikelse från facits femsiffriga NNNNN, loggad: unikhet slår format på ett kvitto.
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

  return (
    <div className="b-page py-20" style={{ maxWidth: 760 }}>
      <div className="text-center">
        <p className="b-label b-rise">
          Bokning {displayNumber(booking.id, booking.createdAt)} ·{" "}
          {confirmed ? "Bekräftad" : "Avbokad"}
        </p>
        <h1 className="b-h1 b-rise-2 mt-4">
          {confirmed ? `Välkommen till ${listing.city}` : "Bokningen är avbokad"}
        </h1>
        <p className="b-lead b-rise-3 mx-auto mt-4" style={{ maxWidth: "46ch" }}>
          {confirmed
            ? `${listing.title} väntar på dig. En bekräftelse skickas till ${booking.guestEmail}.`
            : "Värden har avbokat vistelsen. Betalningen är återkallad."}
        </p>
      </div>

      {/* Kvittokort: 1px svart ram */}
      <div className="mt-12" style={{ border: "1px solid var(--ink)" }}>
        <div className="b-media" style={{ height: 220 }}>
          {cover && <Image src={cover} alt={listing.title} fill sizes="760px" priority />}
        </div>
        <div style={{ padding: 28 }}>
          <p className="b-label">
            {listing.city} · {listing.country} · Värd {listing.hostName}
          </p>
          <h2 className="b-h3 mt-1">{listing.title}</h2>

          <div
            className="mt-6 grid grid-cols-3"
            style={{ borderTop: "1px solid var(--hairline)", paddingTop: 20 }}
          >
            <Fact label="Incheckning" value={booking.checkIn} />
            <Fact label="Utcheckning" value={booking.checkOut} />
            <Fact label="Gäster" value={`${booking.guests}`} />
          </div>

          <div
            className="mt-6 flex items-baseline justify-between pt-5"
            style={{ borderTop: "1px solid var(--ink)" }}
          >
            <div>
              <p className="b-label b-label-ink">
                {confirmed ? "Betalt totalt" : "Återkallat belopp"}
              </p>
              <p className="b-label mt-1">
                {booking.nights} nätter · Gäst {booking.guestName} ·{" "}
                {confirmed ? "Betald (sandbox)" : "Återkallad (sandbox)"}
              </p>
            </div>
            <p style={{ fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 500 }}>
              {formatMoney(booking.totalCents, booking.currency)}
            </p>
          </div>
        </div>
      </div>

      <p className="mt-6 text-center b-label">
        Demo — inga riktiga pengar har dragits och inget mejl skickas
      </p>

      <div className="mt-10 flex justify-center gap-4">
        <Link href={`/rooms/${listing.slug}`} className="b-btn">
          Visa boendet
        </Link>
        <Link href="/s" className="b-btn b-btn-solid">
          Fortsätt utforska
        </Link>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="b-field-label" style={{ marginBottom: 2 }}>
        {label}
      </p>
      <p style={{ fontSize: 15 }}>{value}</p>
    </div>
  );
}
