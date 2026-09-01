import Image from "next/image";
import Link from "next/link";
import { formatPriceShort } from "@/lib/money";
import type { PropertyView } from "@/lib/queries";

// Kort enligt facit: bild 3:4 i .b-media, versal ortsetikett, titel 26px i
// display-snitt, pris. Ingen ram, ingen radie — luft och typografi bär.
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
    <Link href={href} className="block">
      <div className="b-media aspect-[3/4] bg-panel">
        {cover && (
          <Image
            src={cover}
            alt={property.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        )}
      </div>
      <p className="b-label mt-4">
        {property.city} · {property.country}
      </p>
      <h3 className="b-h3 mt-1">{property.title}</h3>
      <p className="mt-1" style={{ fontSize: "var(--text-body)" }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 500 }}>
          {formatPriceShort(property.nightlyPriceCents, property.currency)}
        </span>
        <span className="b-label" style={{ marginLeft: 8 }}>
          per natt
        </span>
      </p>
    </Link>
  );
}
