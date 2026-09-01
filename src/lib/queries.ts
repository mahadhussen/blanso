import { getStore } from "./store";
import type { Listing } from "./domain";

// Vy-typ som skickas till klientkomponenter. Härledd ur domänens Listing —
// utan värd-/systemfält som klienten inte ska ha.
export interface PropertyView {
  id: string;
  slug: string;
  title: string;
  city: string;
  country: string;
  description: string;
  nightlyPriceCents: number;
  cleaningFeeCents: number;
  currency: string;
  maxGuests: number;
  bedrooms: number;
  beds: number;
  baths: number;
  rating: number;
  reviewsCount: number;
  images: string[];
  amenities: string[];
  hostName: string;
}

function toView(l: Listing): PropertyView {
  return {
    id: l.id,
    slug: l.slug,
    title: l.title,
    city: l.city,
    country: l.country,
    description: l.description,
    nightlyPriceCents: l.nightlyPriceCents,
    cleaningFeeCents: l.cleaningFeeCents,
    currency: l.currency,
    maxGuests: l.maxGuests,
    bedrooms: l.bedrooms,
    beds: l.beds,
    baths: l.baths,
    rating: l.rating,
    reviewsCount: l.reviewsCount,
    images: l.images,
    amenities: l.amenities,
    hostName: l.hostName,
  };
}

export interface SearchParams {
  destination?: string;
  guests?: number;
}

export async function searchProperties(params: SearchParams = {}): Promise<PropertyView[]> {
  const dest = params.destination?.trim().toLowerCase();
  const guests = params.guests && params.guests > 0 ? params.guests : undefined;
  const all = await getStore().listPublishedListings();
  return all
    .filter((p) => {
      if (guests && p.maxGuests < guests) return false;
      if (dest) {
        const hay = `${p.city} ${p.country} ${p.title}`.toLowerCase();
        if (!hay.includes(dest)) return false;
      }
      return true;
    })
    .map(toView);
}

export async function getPropertyBySlug(slug: string): Promise<PropertyView | null> {
  const l = await getStore().getListingBySlug(slug);
  return l && l.status === "published" ? toView(l) : null;
}

export async function getPropertyById(id: string): Promise<PropertyView | null> {
  const l = await getStore().getListingById(id);
  return l && l.status === "published" ? toView(l) : null;
}

export interface BookedRange {
  checkIn: string;
  checkOut: string;
  status: string;
}

export async function getBookedRanges(propertyId: string): Promise<BookedRange[]> {
  const ranges = await getStore().getBlockedRanges(propertyId);
  return ranges.map((r) => ({ checkIn: r.checkIn, checkOut: r.checkOut, status: "confirmed" }));
}

export async function listCities(): Promise<{ city: string; country: string }[]> {
  const all = await getStore().listPublishedListings();
  const seen = new Set<string>();
  const out: { city: string; country: string }[] = [];
  for (const p of all) {
    if (!seen.has(p.city)) {
      seen.add(p.city);
      out.push({ city: p.city, country: p.country });
    }
  }
  return out.sort((a, b) => a.city.localeCompare(b.city));
}
