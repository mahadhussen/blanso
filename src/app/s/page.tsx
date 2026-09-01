import Link from "next/link";
import { searchProperties } from "@/lib/queries";
import type { PropertyView } from "@/lib/queries";
import { SearchBarDc } from "@/components/SearchBarDc";

// Sökresultat — 1:1-port av "Balaanso Search.dc.html". Chrome och typografi är
// prototypens; data och filter är riktiga (querystring → serverfiltrering).

export const metadata = { title: "Stays" };
export const dynamic = "force-dynamic";

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}
function all(v: string | string[] | undefined): string[] {
  return Array.isArray(v) ? v : v ? [v] : [];
}

// Prisband i cent — exakt prototypens etiketter.
const PRICE_BANDS = [
  { key: "u60", label: "Under $60", min: 0, max: 6000 },
  { key: "60-120", label: "$60–120", min: 6000, max: 12000 },
  { key: "o120", label: "Over $120", min: 12000, max: Infinity },
];
// Typ härleds ur titeln (domänen har en bokningsbar enhet per listning).
const TYPES = [
  { key: "suite", label: "Suite", match: /suite/i },
  { key: "villa", label: "Entire villa", match: /villa|house/i },
  { key: "apartment", label: "Apartment", match: /apartment|loft|flat|residence/i },
];
const AMENITIES = ["Sea view", "Breakfast included", "Airport transfer", "24h electricity"];

function specLine(p: PropertyView): string {
  const bits = [
    `${p.maxGuests} guests`,
    `${p.bedrooms} ${p.bedrooms === 1 ? "bedroom" : "bedrooms"}`,
    `${p.beds} ${p.beds === 1 ? "bed" : "beds"}`,
  ];
  if (p.amenities.includes("Sea view")) bits.push("Sea view");
  return bits.join(" · ");
}
function noteLine(p: PropertyView): string {
  const bits = ["Free cancellation"];
  if (p.amenities.includes("Breakfast included")) bits.push("Breakfast included");
  return bits.join(" · ");
}

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
  const typeKeys = all(sp.type);
  const amenityKeys = all(sp.amenity);

  let properties = await searchProperties({ destination, guests });
  if (priceKeys.length > 0) {
    const bands = PRICE_BANDS.filter((b) => priceKeys.includes(b.key));
    properties = properties.filter((p) =>
      bands.some((b) => p.nightlyPriceCents >= b.min && p.nightlyPriceCents < b.max),
    );
  }
  if (typeKeys.length > 0) {
    const types = TYPES.filter((t) => typeKeys.includes(t.key));
    properties = properties.filter((p) => types.some((t) => t.match.test(p.title)));
  }
  if (amenityKeys.length > 0) {
    properties = properties.filter((p) => amenityKeys.every((a) => p.amenities.includes(a)));
  }
  properties = [...properties].sort((a, b) =>
    sort === "price"
      ? a.nightlyPriceCents - b.nightlyPriceCents
      : b.rating - a.rating || b.reviewsCount - a.reviewsCount,
  );

  const keep = (over: Record<string, string | undefined>, toggles?: { kind: string; key: string }) => {
    const p = new URLSearchParams();
    if (destination) p.set("destination", destination);
    if (checkIn) p.set("checkIn", checkIn);
    if (checkOut) p.set("checkOut", checkOut);
    if (guests) p.set("guests", String(guests));
    p.set("sort", over.sort ?? sort);
    const lists: Record<string, string[]> = { price: [...priceKeys], type: [...typeKeys], amenity: [...amenityKeys] };
    if (toggles) {
      const cur = lists[toggles.kind];
      lists[toggles.kind] = cur.includes(toggles.key) ? cur.filter((x) => x !== toggles.key) : [...cur, toggles.key];
    }
    for (const k of lists.price) p.append("price", k);
    for (const k of lists.type) p.append("type", k);
    for (const k of lists.amenity) p.append("amenity", k);
    return `/s?${p.toString()}`;
  };

  const forward = new URLSearchParams();
  if (checkIn) forward.set("checkIn", checkIn);
  if (checkOut) forward.set("checkOut", checkOut);
  if (guests) forward.set("guests", String(guests));
  const q = forward.toString();

  const metaBits = [
    `${properties.length} ${properties.length === 1 ? "stay" : "stays"}`,
    checkIn && checkOut ? `${checkIn} – ${checkOut}` : null,
    guests ? `${guests} ${guests === 1 ? "guest" : "guests"}` : null,
  ].filter(Boolean);

  const onS = { background: "var(--ink)", color: "var(--paper)" };
  const offS = { background: "var(--paper)", color: "var(--ink)" };

  return (
    <div style={{ background: "var(--paper)", color: "var(--ink)", fontFamily: "var(--font-body)" }}>
      <div style={{ borderBottom: "1px solid var(--hairline)", padding: "var(--s-4) var(--page-pad)" }}>
        <SearchBarDc initial={{ destination, checkIn, checkOut, guests: guests ?? 2 }} />
      </div>

      <div style={{ maxWidth: "var(--page-max)", margin: "0 auto", padding: "var(--s-6) var(--page-pad) var(--s-8)" }}>
        <div className="b-rise" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "var(--s-4)", flexWrap: "wrap" }}>
          <div>
            <div className="b-label">{metaBits.join(" · ")}</div>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 300, fontSize: "var(--text-h1)", lineHeight: 1, letterSpacing: "var(--ls-display)", textTransform: "uppercase", margin: "var(--s-3) 0 0" }}>
              {destination || "East Africa"}
            </h1>
          </div>
          <div style={{ display: "flex", gap: "var(--s-2)" }}>
            <Link href={keep({ sort: "price" })} className="b-btn" style={{ padding: "10px 18px", ...(sort === "price" ? onS : offS) }}>Price</Link>
            <Link href={keep({ sort: "rating" })} className="b-btn" style={{ padding: "10px 18px", ...(sort === "rating" ? onS : offS) }}>Rating</Link>
          </div>
        </div>

        <div className="b-search-grid" style={{ marginTop: "var(--s-6)" }}>
          <div className="b-search-filters" style={{ display: "flex", flexDirection: "column", gap: "var(--s-5)" }}>
            <FilterGroup title="Price per night">
              {PRICE_BANDS.map((b) => (
                <FilterRow key={b.key} href={keep({}, { kind: "price", key: b.key })} on={priceKeys.includes(b.key)} label={b.label} />
              ))}
            </FilterGroup>
            <FilterGroup title="Type">
              {TYPES.map((t) => (
                <FilterRow key={t.key} href={keep({}, { kind: "type", key: t.key })} on={typeKeys.includes(t.key)} label={t.label} />
              ))}
            </FilterGroup>
            <FilterGroup title="Amenities">
              {AMENITIES.map((a) => (
                <FilterRow key={a} href={keep({}, { kind: "amenity", key: a })} on={amenityKeys.includes(a)} label={a} />
              ))}
            </FilterGroup>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ borderTop: "1px solid var(--ink)" }} />
            {properties.length === 0 ? (
              <div style={{ padding: "64px 0", borderBottom: "1px solid var(--hairline)" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-h3)" }}>No stays matched</div>
                <div style={{ fontSize: "var(--text-body)", color: "var(--ink-2)", marginTop: 8 }}>
                  Try another destination — Nairobi, Zanzibar or Hargeisa — or clear a filter.
                </div>
              </div>
            ) : (
              properties.map((r) => (
                <a key={r.id} href={`/rooms/${r.slug}${q ? `?${q}` : ""}`} className="b-result-row" style={{ padding: "28px 0", borderBottom: "1px solid var(--hairline)", color: "var(--ink)" }}>
                  <span className="b-media" style={{ width: 240, height: 170 }}>
                    <div style={{ width: "100%", height: "100%", backgroundSize: "cover", backgroundPosition: "center", backgroundImage: `url("${r.images[0]}")` }} />
                  </span>
                  <div>
                    <div className="b-label">{r.city}, {r.country}</div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-h3)", marginTop: 6 }}>{r.title}</div>
                    <div className="b-label" style={{ fontSize: 11, letterSpacing: 1.5, fontWeight: 600, marginTop: "var(--s-1)" }}>{specLine(r)}</div>
                    <div style={{ fontSize: "var(--text-body)", color: "var(--ink-2)", marginTop: "var(--s-1)" }}>{noteLine(r)}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {r.rating > 0 ? (
                      <>
                        <span style={{ background: "var(--ink)", color: "var(--paper)", fontFamily: "var(--font-label)", fontSize: 13, fontWeight: 700, padding: "4px 8px" }}>{r.rating.toFixed(1)}</span>
                        <div className="b-label" style={{ letterSpacing: "var(--ls-label-tight)", marginTop: 2 }}>{r.reviewsCount} reviews</div>
                      </>
                    ) : (
                      <span className="b-label b-label-ink">New</span>
                    )}
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-num)", marginTop: "var(--s-3)" }}>${Math.round(r.nightlyPriceCents / 100)}</div>
                    <div className="b-label" style={{ letterSpacing: "var(--ls-label-tight)", marginTop: 2 }}>per night</div>
                  </div>
                </a>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="b-label b-label-ink">{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: "var(--s-3)", fontSize: "var(--text-body)" }}>{children}</div>
    </div>
  );
}

function FilterRow({ href, on, label }: { href: string; on: boolean; label: string }) {
  return (
    <Link href={href} style={{ display: "flex", gap: 10, alignItems: "center", cursor: "pointer", color: "var(--ink)" }}>
      <span
        aria-hidden
        style={{ width: 14, height: 14, border: "1px solid var(--ink)", background: on ? "var(--ink)" : "var(--paper)", display: "inline-block", flexShrink: 0 }}
      />
      {label}
    </Link>
  );
}
