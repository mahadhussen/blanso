import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPropertyBySlug, getBookedRanges } from "@/lib/queries";
import { BookingPanelDc } from "@/components/BookingPanelDc";
import { isoDate } from "@/lib/dates";

// Boendesidan — 1:1-port av "Balaanso Hotel.dc.html", datadriven.
// Loggade avvikelser (WORKLOG): en bokningsbar enhet (inga rumsrader),
// inga recensionscitat (fabricerat innehåll), inga nyckelavstånd (saknar data).

export const dynamic = "force-dynamic";

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property) return { title: "Stay not found" };
  return { title: property.title, description: property.description.slice(0, 150) };
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
  const bookedRanges = rangesRaw.map((r) => ({ checkIn: isoDate(r.checkIn), checkOut: isoDate(r.checkOut) }));
  const guestsRaw = first(sp.guests);
  const initial = {
    checkIn: first(sp.checkIn),
    checkOut: first(sp.checkOut),
    guests: guestsRaw ? Math.max(1, parseInt(guestsRaw, 10) || 1) : 2,
  };

  const imgs = property.images;
  const paragraphs = property.description.split(/\n+/).filter(Boolean);

  return (
    <div style={{ background: "var(--paper)", color: "var(--ink)", fontFamily: "var(--font-body)" }}>
      <div style={{ maxWidth: "var(--page-max)", margin: "0 auto", padding: "0 var(--page-pad)" }}>
        {/* Titelrad */}
        <div className="b-rise" style={{ padding: "40px 0 28px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "var(--s-5)", flexWrap: "wrap" }}>
          <div>
            <div className="b-label">
              <Link href="/s" style={{ color: "var(--muted)" }}>Stays</Link>
              &nbsp;/&nbsp; {property.city}, {property.country}
            </div>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 300, fontSize: "var(--text-h1)", lineHeight: 1, letterSpacing: "var(--ls-display)", textTransform: "uppercase", margin: "var(--s-3) 0 0" }}>
              {property.title}
            </h1>
            <div style={{ fontSize: "var(--text-body)", color: "var(--ink-2)", marginTop: "var(--s-2)" }}>
              {property.city}, {property.country} · Hosted by {property.hostName}
            </div>
          </div>
          {property.rating > 0 && (
            <div style={{ textAlign: "right" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                <span style={{ background: "var(--ink)", color: "var(--paper)", fontFamily: "var(--font-label)", fontSize: 13, fontWeight: 700, padding: "4px 8px" }}>
                  {property.rating.toFixed(1)}
                </span>
                <span style={{ fontFamily: "var(--font-label)", fontSize: 13, color: "var(--muted)" }}>
                  {property.reviewsCount} reviews
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Fotogrid 2fr/1fr/1fr, två rader à 280px */}
        <div className="b-rise-2" style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr) minmax(0,1fr)", gridTemplateRows: "280px 280px", gap: "var(--s-1)" }}>
          <span className="b-media" style={{ gridRow: "span 2", position: "relative" }}>
            {imgs[0] && <Image src={imgs[0]} alt={property.title} fill sizes="50vw" priority />}
          </span>
          <span className="b-media" style={{ position: "relative" }}>
            {imgs[1] && <Image src={imgs[1]} alt={`${property.title} photo 2`} fill sizes="25vw" />}
          </span>
          <span className="b-media" style={{ position: "relative" }}>
            {imgs[2] && <Image src={imgs[2]} alt={`${property.title} photo 3`} fill sizes="25vw" />}
          </span>
          <span className="b-media" style={{ position: "relative" }}>
            {imgs[3] && <Image src={imgs[3]} alt={`${property.title} photo 4`} fill sizes="25vw" />}
          </span>
          <div style={{ position: "relative" }}>
            <span className="b-media" style={{ position: "absolute", inset: 0 }}>
              {(imgs[4] ?? imgs[0]) && <Image src={imgs[4] ?? imgs[0]} alt={`${property.title} photo 5`} fill sizes="25vw" />}
            </span>
            <span className="b-btn" style={{ position: "absolute", right: 14, bottom: 14, padding: "10px 18px" }}>
              All {imgs.length} photos
            </span>
          </div>
        </div>

        <div className="b-detail-grid" style={{ padding: "var(--s-7) 0" }}>
          <div>
            <div className="b-label">About the stay</div>
            {paragraphs.map((t, i) => (
              <p key={i} style={{ fontSize: "var(--text-lead)", lineHeight: 1.7, margin: i === 0 ? "20px 0 0" : "var(--s-3) 0 0", maxWidth: "60ch" }}>
                {t}
              </p>
            ))}
            <p style={{ fontSize: "var(--text-lead)", lineHeight: 1.7, margin: "var(--s-3) 0 0", maxWidth: "60ch" }}>
              {property.maxGuests} guests · {property.bedrooms} {property.bedrooms === 1 ? "bedroom" : "bedrooms"} ·{" "}
              {property.beds} {property.beds === 1 ? "bed" : "beds"} · {property.baths}{" "}
              {property.baths === 1 ? "bathroom" : "bathrooms"}.
            </p>

            {property.amenities.length > 0 && (
              <div style={{ marginTop: 56 }}>
                <div className="b-label">Amenities</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 40px", marginTop: "var(--s-4)", fontSize: 18 }}>
                  {property.amenities.map((a) => (
                    <div key={a}>{a}</div>
                  ))}
                </div>
              </div>
            )}

            {property.rating > 0 && (
              <div style={{ marginTop: "var(--s-7)" }}>
                <div className="b-label">Reviews · {property.rating.toFixed(1)} out of 10</div>
                <div style={{ fontSize: "var(--text-body)", color: "var(--ink-2)", marginTop: "var(--s-3)", maxWidth: "60ch" }}>
                  {property.reviewsCount} guests have rated this stay.
                </div>
              </div>
            )}
          </div>

          <div>
            <BookingPanelDc
              propertyId={property.id}
              nightlyPriceCents={property.nightlyPriceCents}
              cleaningFeeCents={property.cleaningFeeCents}
              maxGuests={property.maxGuests}
              bookedRanges={bookedRanges}
              initial={initial}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
