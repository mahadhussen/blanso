import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPropertyBySlug, getBookedRanges } from "@/lib/queries";
import { BookingWidget } from "@/components/BookingWidget";
import { StarRating } from "@/components/StarRating";
import { isoDate } from "@/lib/dates";

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

  const [cover, ...rest] = property.images;
  const thumbs = rest.slice(0, 4);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold text-ink sm:text-3xl">{property.title}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
        <StarRating rating={property.rating} reviewsCount={property.reviewsCount} />
        <span aria-hidden>·</span>
        <span>
          {property.city}, {property.country}
        </span>
      </div>

      {/* Galleri */}
      <div className="mt-5 grid grid-cols-1 gap-2 overflow-hidden rounded-2xl sm:grid-cols-2">
        <div className="relative aspect-[4/3] sm:aspect-auto sm:min-h-[22rem] bg-panel">
          {cover && (
            <Image
              src={cover}
              alt={property.title}
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {thumbs.map((src, i) => (
            <div key={i} className="relative aspect-[4/3] bg-panel">
              <Image
                src={src}
                alt={`${property.title} bild ${i + 2}`}
                fill
                sizes="25vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_22rem]">
        <div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 border-b border-line pb-6 text-sm text-ink">
            <span>{property.maxGuests} gäster</span>
            <span>{property.bedrooms} sovrum</span>
            <span>{property.beds} sängar</span>
            <span>{property.baths} badrum</span>
          </div>

          <div className="border-b border-line py-6">
            <p className="text-sm text-muted">Värd</p>
            <p className="font-medium text-ink">{property.hostName}</p>
          </div>

          <div className="border-b border-line py-6">
            <h2 className="text-lg font-semibold text-ink">Om boendet</h2>
            <p className="mt-2 leading-relaxed text-ink/90">{property.description}</p>
          </div>

          <div className="py-6">
            <h2 className="text-lg font-semibold text-ink">Bekvämligheter</h2>
            <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {property.amenities.map((a) => (
                <li key={a} className="flex items-center gap-2 text-ink/90">
                  <span className="text-brand" aria-hidden>
                    ✓
                  </span>
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
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
