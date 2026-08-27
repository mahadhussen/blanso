import Image from "next/image";
import Link from "next/link";
import { formatPriceShort } from "@/lib/money";
import { StarRating } from "./StarRating";
import type { PropertyView } from "@/lib/queries";

export function PropertyCard({
  property,
  query = "",
}: {
  property: PropertyView;
  query?: string;
}) {
  const href = `/rooms/${property.slug}${query ? `?${query}` : ""}`;
  const cover = property.images[0];
  return (
    <Link href={href} className="group block">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-panel">
        {cover && (
          <Image
            src={cover}
            alt={property.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        )}
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-ink">{property.title}</h3>
          <p className="truncate text-sm text-muted">
            {property.city}, {property.country}
          </p>
        </div>
        <StarRating rating={property.rating} className="shrink-0" />
      </div>
      <p className="mt-1 text-sm text-ink">
        <span className="font-semibold">{formatPriceShort(property.nightlyPriceCents, property.currency)}</span>
        <span className="text-muted"> / natt</span>
      </p>
    </Link>
  );
}
