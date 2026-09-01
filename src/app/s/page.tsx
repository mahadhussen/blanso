import Image from "next/image";
import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";
import { searchProperties } from "@/lib/queries";
import { formatPriceShort } from "@/lib/money";
import type { PropertyView } from "@/lib/queries";

export const metadata = { title: "Sök boende" };
export const dynamic = "force-dynamic";

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}
function all(v: string | string[] | undefined): string[] {
  return Array.isArray(v) ? v : v ? [v] : [];
}

// Prisintervall i cent — filtren är verkliga, inte attrapper.
const PRICE_BANDS = [
  { key: "0-75", label: "Under $75", min: 0, max: 7500 },
  { key: "75-120", label: "$75–120", min: 7500, max: 12000 },
  { key: "120+", label: "Över $120", min: 12000, max: Infinity },
];

const FILTER_AMENITIES = ["Wifi", "Pool", "Havsutsikt", "Kök", "Parkering", "Frukost"];

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const destination = first(sp.destination);
  const checkIn = first(sp.checkIn);
  const checkOut = first(sp.checkOut);
  const guestsRaw = first(sp.guests);
  const guests = guestsRaw ? Math.max(1, parseInt(guestsRaw, 10) || 1) : undefined;
  const sort = first(sp.sort) === "price" ? "price" : "rating";
  const priceKeys = all(sp.price);
  const amenityKeys = all(sp.amenity);

  let properties = await searchProperties({ destination, guests });

  if (priceKeys.length > 0) {
    const bands = PRICE_BANDS.filter((b) => priceKeys.includes(b.key));
    properties = properties.filter((p) =>
      bands.some((b) => p.nightlyPriceCents >= b.min && p.nightlyPriceCents < b.max),
    );
  }
  if (amenityKeys.length > 0) {
    properties = properties.filter((p) =>
      amenityKeys.every((a) => p.amenities.includes(a)),
    );
  }
  properties = [...properties].sort((a, b) =>
    sort === "price"
      ? a.nightlyPriceCents - b.nightlyPriceCents
      : b.rating - a.rating || b.reviewsCount - a.reviewsCount,
  );

  // Bevara alla aktiva parametrar när en enskild ändras.
  const baseParams = new URLSearchParams();
  if (destination) baseParams.set("destination", destination);
  if (checkIn) baseParams.set("checkIn", checkIn);
  if (checkOut) baseParams.set("checkOut", checkOut);
  if (guests) baseParams.set("guests", String(guests));
  for (const k of priceKeys) baseParams.append("price", k);
  for (const k of amenityKeys) baseParams.append("amenity", k);

  const sortHref = (s: "price" | "rating") => {
    const p = new URLSearchParams(baseParams);
    p.set("sort", s);
    return `/s?${p.toString()}`;
  };
  const toggleHref = (kind: "price" | "amenity", key: string) => {
    const p = new URLSearchParams();
    if (destination) p.set("destination", destination);
    if (checkIn) p.set("checkIn", checkIn);
    if (checkOut) p.set("checkOut", checkOut);
    if (guests) p.set("guests", String(guests));
    p.set("sort", sort);
    const current = kind === "price" ? priceKeys : amenityKeys;
    const next = current.includes(key) ? current.filter((x) => x !== key) : [...current, key];
    const prices = kind === "price" ? next : priceKeys;
    const amenities = kind === "amenity" ? next : amenityKeys;
    for (const k of prices) p.append("price", k);
    for (const k of amenities) p.append("amenity", k);
    return `/s?${p.toString()}`;
  };

  const forward = new URLSearchParams();
  if (checkIn) forward.set("checkIn", checkIn);
  if (checkOut) forward.set("checkOut", checkOut);
  if (guests) forward.set("guests", String(guests));
  const query = forward.toString();

  const metaBits = [
    `${properties.length} ${properties.length === 1 ? "boende" : "boenden"}`,
    checkIn && checkOut ? `${checkIn} – ${checkOut}` : null,
    guests ? `${guests} ${guests === 1 ? "gäst" : "gäster"}` : null,
  ].filter(Boolean);

  return (
    <div className="b-page" style={{ paddingTop: "var(--s-5)" }}>
      <SearchBar initial={{ destination, checkIn, checkOut, guests: guests ?? 1 }} />

      {/* Titelrad med sortering */}
      <div className="mt-12 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="b-label">{metaBits.join(" · ")}</p>
          <h1 className="b-h1 mt-2">{destination || "Alla boenden"}</h1>
        </div>
        <div className="flex gap-2">
          <Link href={sortHref("price")} className={`b-btn ${sort === "price" ? "b-btn-solid" : ""}`}>
            Pris
          </Link>
          <Link href={sortHref("rating")} className={`b-btn ${sort === "rating" ? "b-btn-solid" : ""}`}>
            Betyg
          </Link>
        </div>
      </div>

      <div className="b-search-grid mt-12">
        {/* Filterspalt */}
        <aside className="b-search-filters flex flex-col" style={{ gap: "var(--s-6)" }}>
          <FilterGroup title="Pris per natt">
            {PRICE_BANDS.map((b) => (
              <FilterRow
                key={b.key}
                href={toggleHref("price", b.key)}
                active={priceKeys.includes(b.key)}
                label={b.label}
              />
            ))}
          </FilterGroup>
          <FilterGroup title="Faciliteter">
            {FILTER_AMENITIES.map((a) => (
              <FilterRow
                key={a}
                href={toggleHref("amenity", a)}
                active={amenityKeys.includes(a)}
                label={a}
              />
            ))}
          </FilterGroup>
        </aside>

        {/* Resultat */}
        <div>
          {properties.length === 0 ? (
            <div className="py-24 text-center" style={{ borderTop: "1px solid var(--ink)" }}>
              <p className="b-h3 mt-8">Inga boenden matchade</p>
              <p className="b-lead mt-2">
                Prova en annan stad — Nairobi, Zanzibar eller Hargeisa — eller släpp ett filter.
              </p>
            </div>
          ) : (
            <div style={{ borderTop: "1px solid var(--ink)" }}>
              {properties.map((p) => (
                <ResultRow key={p.id} property={p} query={query} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="b-label b-label-ink" style={{ marginBottom: "var(--s-3)" }}>
        {title}
      </p>
      <div className="flex flex-col" style={{ gap: 10 }}>{children}</div>
    </div>
  );
}

function FilterRow({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-3" aria-pressed={active}>
      <span
        aria-hidden
        style={{
          width: 14,
          height: 14,
          border: "1px solid var(--ink)",
          background: active ? "var(--ink)" : "var(--paper)",
          display: "inline-block",
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: "var(--text-body)" }}>{label}</span>
    </Link>
  );
}

function ResultRow({ property, query }: { property: PropertyView; query: string }) {
  const href = `/rooms/${property.slug}${query ? `?${query}` : ""}`;
  const cover = property.images[0];
  return (
    <Link
      href={href}
      className="b-result-row block py-7"
      style={{ borderBottom: "1px solid var(--hairline)" }}
    >
      <div className="b-media" style={{ width: 240, height: 170 }}>
        {cover && <Image src={cover} alt={property.title} fill sizes="240px" />}
      </div>
      <div className="min-w-0">
        <p className="b-label">
          {property.city} · {property.country}
        </p>
        <h2 className="b-h3 mt-1">{property.title}</h2>
        <p className="mt-2 text-muted" style={{ fontSize: 15, maxWidth: "52ch" }}>
          {property.description.slice(0, 110)}…
        </p>
      </div>
      <div className="text-right">
        {property.rating > 0 ? (
          <>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-num)", fontWeight: 500 }}>
              {property.rating.toFixed(1)}
            </p>
            <p className="b-label mt-1">{property.reviewsCount} recensioner</p>
          </>
        ) : (
          <p className="b-label b-label-ink">Ny</p>
        )}
        <p className="mt-4" style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 500 }}>
          {formatPriceShort(property.nightlyPriceCents, property.currency)}
        </p>
        <p className="b-label">per natt</p>
      </div>
    </Link>
  );
}
