import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { isoDate } from "@/lib/dates";

export const metadata = { title: "Bokningsbekräftelse" };

export default async function BookingConfirmationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  // Slås upp på den ogenomskinliga token, aldrig på databasens id. Utan giltig
  // token går bokningens uppgifter inte att nå (skydd mot IDOR).
  const booking = await db.booking.findUnique({
    where: { accessToken: token },
    include: { property: true, payment: true },
  });
  if (!booking) notFound();

  const cover = JSON.parse(booking.property.images || "[]")[0] as string | undefined;
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
              {confirmed ? "Bokning bekräftad" : "Bokning registrerad"}
            </h1>
            <p className="text-sm text-muted">Bokningsnummer {booking.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>

        <div className="mt-6 flex gap-4 rounded-xl bg-panel p-4">
          <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-line">
            {cover && (
              <Image src={cover} alt={booking.property.title} fill sizes="96px" className="object-cover" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-ink">{booking.property.title}</h2>
            <p className="text-sm text-muted">
              {booking.property.city}, {booking.property.country}
            </p>
            <p className="mt-1 text-sm text-ink">
              {isoDate(booking.checkIn)} → {isoDate(booking.checkOut)} · {booking.guests}{" "}
              {booking.guests === 1 ? "gäst" : "gäster"}
            </p>
          </div>
        </div>

        <dl className="mt-6 space-y-2 text-sm">
          <Row label="Gäst" value={booking.guestName} />
          <Row label="E-post" value={booking.guestEmail} />
          <Row
            label="Betalstatus"
            value={booking.payment?.status === "succeeded" ? "Betald (sandbox)" : booking.payment?.status ?? "—"}
          />
          <div className="flex items-center justify-between border-t border-line pt-3 text-base font-semibold text-ink">
            <dt>Totalt betalt</dt>
            <dd>{formatMoney(booking.totalCents, booking.currency)}</dd>
          </div>
        </dl>

        <p className="mt-6 text-sm text-muted">
          En bekräftelse har skickats till {booking.guestEmail}. Detta är en demo — inga riktiga
          pengar har dragits och inget mejl skickas på riktigt.
        </p>

        <div className="mt-6 flex gap-3">
          <Link
            href={`/rooms/${booking.property.slug}`}
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
