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
    <div className="b-page" style={{ paddingTop: "var(--s-5)" }}>
      <Link href={`/rooms/${property.slug}`} className="b-label">
        ← {property.title}
      </Link>
      <h1 className="b-h1 mt-3">Slutför bokning</h1>

      <div className="b-detail-grid mt-14">
        <CheckoutForm
          propertyId={property.id}
          checkIn={checkIn}
          checkOut={checkOut}
          guests={guests}
        />

        <aside className="lg:sticky lg:self-start" style={{ top: 96 }}>
          <div style={{ border: "1px solid var(--ink)", background: "var(--paper)" }}>
            <div className="b-media" style={{ height: 180 }}>
              {cover && <Image src={cover} alt={property.title} fill sizes="380px" />}
            </div>
            <div style={{ padding: 24 }}>
              <p className="b-label">
                {property.city} · {property.country}
              </p>
              <h2 className="b-h3 mt-1">{property.title}</h2>

              <dl className="mt-5 space-y-1" style={{ fontSize: 15 }}>
                <div className="flex justify-between">
                  <dt className="text-muted">Incheckning</dt>
                  <dd>{checkIn}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Utcheckning</dt>
                  <dd>{checkOut}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Gäster</dt>
                  <dd>{guests}</dd>
                </div>
              </dl>

              <div className="mt-6">
                <PriceBreakdown breakdown={breakdown} currency={property.currency} />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Problem({ message, href }: { message: string; href?: string }) {
  return (
    <div className="b-page py-24 text-center" style={{ maxWidth: 640 }}>
      <p className="b-h3">{message}</p>
      <Link href={href ?? "/s"} className="b-btn mt-8 inline-block">
        Tillbaka till sökningen
      </Link>
    </div>
  );
}
