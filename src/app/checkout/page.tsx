import Image from "next/image";
import Link from "next/link";
import { getPropertyById, getBookedRanges } from "@/lib/queries";
import { priceForDates } from "@/lib/pricing";
import { isAvailable } from "@/lib/availability";
import { isoDate, validateStay } from "@/lib/dates";
import { PriceBreakdown } from "@/components/PriceBreakdown";
import { CheckoutForm } from "@/components/CheckoutForm";

export const metadata = { title: "Checka ut" };

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
  const guests = Math.max(1, parseInt(first(sp.guests) ?? "1", 10) || 1);

  if (!propertyId || !checkIn || !checkOut) {
    return <Problem message="Bokningen saknar uppgifter. Gå tillbaka och välj boende och datum." />;
  }

  const property = await getPropertyById(propertyId);
  if (!property) return <Problem message="Boendet hittades inte." />;

  const stay = validateStay(checkIn, checkOut);
  if (!stay.ok) return <Problem message={stay.error} href={`/rooms/${property.slug}`} />;

  if (guests > property.maxGuests) {
    return (
      <Problem
        message={`Detta boende tar högst ${property.maxGuests} gäster.`}
        href={`/rooms/${property.slug}`}
      />
    );
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
    return <Problem message="Ogiltiga datum. Välj minst en natt." />;
  }

  const ranges = await getBookedRanges(property.id);
  const free = isAvailable(
    { checkIn, checkOut },
    ranges.map((r) => ({ checkIn: isoDate(r.checkIn), checkOut: isoDate(r.checkOut), status: r.status })),
  );
  if (!free) {
    return (
      <Problem
        message="De valda datumen är tyvärr redan bokade."
        href={`/rooms/${property.slug}`}
      />
    );
  }

  const cover = property.images[0];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link href={`/rooms/${property.slug}`} className="text-sm font-medium text-brand hover:text-brand-dark">
        ← Tillbaka till boendet
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-ink sm:text-3xl">Slutför din bokning</h1>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_22rem]">
        <div className="rounded-2xl border border-line bg-background p-6">
          <CheckoutForm
            propertyId={property.id}
            checkIn={checkIn}
            checkOut={checkOut}
            guests={guests}
          />
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-line bg-background p-5 shadow-card">
            <div className="flex gap-3">
              <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-panel">
                {cover && (
                  <Image src={cover} alt={property.title} fill sizes="96px" className="object-cover" />
                )}
              </div>
              <div className="min-w-0">
                <h2 className="truncate font-semibold text-ink">{property.title}</h2>
                <p className="truncate text-sm text-muted">
                  {property.city}, {property.country}
                </p>
              </div>
            </div>

            <dl className="mt-4 space-y-1 border-t border-line pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Incheckning</dt>
                <dd className="text-ink">{checkIn}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Utcheckning</dt>
                <dd className="text-ink">{checkOut}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Gäster</dt>
                <dd className="text-ink">{guests}</dd>
              </div>
            </dl>

            <div className="mt-4 border-t border-line pt-4">
              <PriceBreakdown breakdown={breakdown} currency={property.currency} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Problem({ message, href }: { message: string; href?: string }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <p className="text-lg font-semibold text-ink">{message}</p>
      <Link
        href={href ?? "/s"}
        className="mt-4 inline-block rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
      >
        Tillbaka till sökningen
      </Link>
    </div>
  );
}
