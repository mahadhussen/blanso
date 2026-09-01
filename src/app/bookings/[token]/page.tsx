import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStore } from "@/lib/store";
import { formatMoney } from "@/lib/money";
import { PriceBreakdown } from "@/components/PriceBreakdown";

export const metadata = { title: "Bokningsbekräftelse" };

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
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-line bg-background p-8 shadow-card">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-11 w-11 items-center justify-center rounded-full text-white ${
              confirmed ? "bg-brand" : "bg-muted"
            }`}
            aria-hidden
          >
            {confirmed ? "✓" : "•"}
          </span>
          <div>
            <h1 className="text-xl font-semibold text-ink">
              {confirmed ? "Bokning bekräftad" : "Bokning avbokad"}
            </h1>
            <p className="text-sm text-muted">
              Bokningsnummer {booking.id.replace("bok_", "").slice(0, 8).toUpperCase()}
            </p>
          </div>
        </div>

        <div className="mt-6 flex gap-4 rounded-xl bg-panel p-4">
          <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-line">
            {cover && (
              <Image src={cover} alt={listing.title} fill sizes="96px" className="object-cover" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-ink">{listing.title}</h2>
            <p className="text-sm text-muted">
              {listing.city}, {listing.country}
            </p>
            <p className="mt-1 text-sm text-ink">
              {booking.checkIn} → {booking.checkOut} · {booking.guests}{" "}
              {booking.guests === 1 ? "gäst" : "gäster"}
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-line pt-4">
          <PriceBreakdown
            breakdown={{
              nights: booking.nights,
              nightlyPriceCents: listing.nightlyPriceCents,
              subtotalCents: booking.subtotalCents,
              cleaningFeeCents: booking.cleaningFeeCents,
              serviceFeeCents: booking.serviceFeeCents,
              totalCents: booking.totalCents,
            }}
            currency={booking.currency}
          />
        </div>

        <dl className="mt-4 space-y-1 text-sm">
          <Row label="Gäst" value={booking.guestName} />
          <Row label="E-post" value={booking.guestEmail} />
          <Row label="Betalstatus" value="Betald (sandbox)" />
        </dl>

        <p className="mt-6 text-sm text-muted">
          Spara den här länken — den är din bokningsbekräftelse. Detta är en demo: inga
          riktiga pengar har dragits ({formatMoney(booking.totalCents, booking.currency)} i
          sandbox) och inget mejl skickas.
        </p>

        <div className="mt-6 flex gap-3">
          <Link
            href={`/rooms/${listing.slug}`}
            className="rounded-xl border border-line px-5 py-2.5 text-sm font-semibold text-ink hover:border-brand hover:text-brand"
          >
            Visa boendet
          </Link>
          <Link
            href="/s"
            className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Hitta fler boenden
          </Link>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}
