import Image from "next/image";
import Link from "next/link";
import { getPropertyBySlug } from "@/lib/queries";
import { priceForDates } from "@/lib/pricing";
import { validateStay } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { PriceBreakdown } from "@/components/PriceBreakdown";

export const metadata = { title: "Bokningsbekräftelse" };

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

// Kort, läsbar bokningsreferens ur boende + datum (deterministisk, ingen databas).
function reference(slug: string, checkIn: string): string {
  let h = 0;
  for (const ch of `${slug}${checkIn}`) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return "BL" + h.toString(36).toUpperCase().slice(0, 6).padStart(6, "0");
}

export default async function BookingConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const slug = first(sp.slug);
  const checkIn = first(sp.checkIn);
  const checkOut = first(sp.checkOut);
  const guests = Math.max(1, parseInt(first(sp.guests) ?? "1", 10) || 1);

  const property = slug ? await getPropertyBySlug(slug) : null;
  const stay = validateStay(checkIn, checkOut);

  if (!property || !stay.ok || !checkIn || !checkOut) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-lg font-semibold text-ink">Bokningen kunde inte visas.</p>
        <Link
          href="/s"
          className="mt-4 inline-block rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Tillbaka till sökningen
        </Link>
      </div>
    );
  }

  const breakdown = priceForDates({
    nightlyPriceCents: property.nightlyPriceCents,
    cleaningFeeCents: property.cleaningFeeCents,
    checkIn,
    checkOut,
  });
  const cover = property.images[0];

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-line bg-background p-8 shadow-card">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white" aria-hidden>
            ✓
          </span>
          <div>
            <h1 className="text-xl font-semibold text-ink">Bokning bekräftad</h1>
            <p className="text-sm text-muted">Bokningsnummer {reference(property.slug, checkIn)}</p>
          </div>
        </div>

        <div className="mt-6 flex gap-4 rounded-xl bg-panel p-4">
          <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-line">
            {cover && (
              <Image src={cover} alt={property.title} fill sizes="96px" className="object-cover" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-ink">{property.title}</h2>
            <p className="text-sm text-muted">
              {property.city}, {property.country}
            </p>
            <p className="mt-1 text-sm text-ink">
              {checkIn} → {checkOut} · {guests} {guests === 1 ? "gäst" : "gäster"}
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-line pt-4">
          <PriceBreakdown breakdown={breakdown} currency={property.currency} />
        </div>

        <dl className="mt-4 flex items-center justify-between text-sm">
          <dt className="text-muted">Betalstatus</dt>
          <dd className="font-medium text-ink">Betald (sandbox)</dd>
        </dl>

        <p className="mt-6 text-sm text-muted">
          Detta är en demo — inga riktiga pengar har dragits, ingen bokning har sparats och
          inget mejl skickas på riktigt. Totalt {formatMoney(breakdown.totalCents, property.currency)}.
        </p>

        <div className="mt-6 flex gap-3">
          <Link
            href={`/rooms/${property.slug}`}
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
