import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPropertyBySlug, getBookedRanges } from "@/lib/queries";
import { BookingWidget } from "@/components/BookingWidget";
import { isoDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property) return { title: "Boende hittades inte" };
  return {
    title: property.title,
    description: property.description.slice(0, 150),
  };
}

export default async function PropertyPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property) notFound();

  const [rangesRaw, sp] = await Promise.all([getBookedRanges(property.id), searchParams]);
  const bookedRanges = rangesRaw.map((r) => ({
    checkIn: isoDate(r.checkIn),
    checkOut: isoDate(r.checkOut),
  }));

  const guestsRaw = first(sp.guests);
  const initial = {
    checkIn: first(sp.checkIn),
    checkOut: first(sp.checkOut),
    guests: guestsRaw ? Math.max(1, parseInt(guestsRaw, 10) || 1) : 1,
  };

  // Alla fyra bilder fyller griden: huvudbild spänner 2 rader, sista sidobilden
  // spänner 2 kolumner — inga tomma celler (Heisenbergs villkor 1).
  const photos = property.images.slice(0, 4);

  return (
    <div className="b-page" style={{ paddingTop: "var(--s-5)" }}>
      {/* Brödsmula + titelrad */}
      <p className="b-label">
        {property.country} · {property.city}
      </p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-6">
        <h1 className="b-h1" style={{ maxWidth: 760 }}>
          {property.title}
        </h1>
        {property.rating > 0 && (
          <div className="text-right">
            <p style={{ fontFamily: "var(--font-display)", fontSize: 38, fontWeight: 500, lineHeight: 1 }}>
              {property.rating.toFixed(1)}
            </p>
            <p className="b-label mt-1">{property.reviewsCount} recensioner</p>
          </div>
        )}
      </div>

      {/* Fotogrid 2fr 1fr 1fr, huvudbilden spänner två rader */}
      <div className="b-photo-grid mt-8">
        {photos.map((src, i) => (
          <div
            key={i}
            className={`b-media ${i === 0 ? "b-photo-main" : ""} ${i === 3 ? "b-photo-wide" : ""}`}
          >
            <Image
              src={src}
              alt={`${property.title} bild ${i + 1}`}
              fill
              sizes={i === 0 ? "50vw" : "25vw"}
              priority={i === 0}
            />
          </div>
        ))}
      </div>

      <div className="b-detail-grid mt-16">
        {/* Vänsterspalt */}
        <div>
          <p className="b-label">
            {property.maxGuests} gäster · {property.bedrooms} sovrum · {property.beds} sängar ·{" "}
            {property.baths} badrum · Värd {property.hostName}
          </p>

          <section className="mt-8">
            <h2 className="b-h3">Om boendet</h2>
            <p className="b-lead mt-4" style={{ maxWidth: "60ch" }}>
              {property.description}
            </p>
          </section>

          {property.amenities.length > 0 && (
            <section className="mt-12" style={{ borderTop: "1px solid var(--ink)", paddingTop: "var(--s-5)" }}>
              <h2 className="b-h3">Faciliteter</h2>
              <ul className="mt-6 grid grid-cols-1 gap-x-12 gap-y-3 sm:grid-cols-2">
                {property.amenities.map((a) => (
                  <li
                    key={a}
                    style={{
                      fontSize: "var(--text-body)",
                      borderBottom: "1px solid var(--hairline)",
                      paddingBottom: 10,
                    }}
                  >
                    {a}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Sticky bokningspanel: 1px svart ram */}
        <aside className="lg:sticky lg:self-start" style={{ top: 96 }}>
          <BookingWidget
            propertyId={property.id}
            nightlyPriceCents={property.nightlyPriceCents}
            cleaningFeeCents={property.cleaningFeeCents}
            currency={property.currency}
            maxGuests={property.maxGuests}
            bookedRanges={bookedRanges}
            initial={initial}
          />
        </aside>
      </div>
    </div>
  );
}
