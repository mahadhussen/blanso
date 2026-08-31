import { LISTINGS, DEMO_BOOKED } from "./listings";

// Vy-typ som skickas till klientkomponenter. Datan kommer från den statiska
// katalogen i listings.ts — Blanso kör utan databas (delbar demo).
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

export interface SearchParams {
  destination?: string;
  guests?: number;
}

export async function searchProperties(params: SearchParams = {}): Promise<PropertyView[]> {
  const dest = params.destination?.trim().toLowerCase();
  const guests = params.guests && params.guests > 0 ? params.guests : undefined;
  return LISTINGS.filter((p) => {
    if (guests && p.maxGuests < guests) return false;
    if (dest) {
      const hay = `${p.city} ${p.country} ${p.title}`.toLowerCase();
      if (!hay.includes(dest)) return false;
    }
    return true;
  }).sort((a, b) => b.rating - a.rating || b.reviewsCount - a.reviewsCount);
}

export async function getPropertyBySlug(slug: string): Promise<PropertyView | null> {
  return LISTINGS.find((p) => p.slug === slug) ?? null;
}

export async function getPropertyById(id: string): Promise<PropertyView | null> {
  // id == slug i demoläget.
  return LISTINGS.find((p) => p.id === id || p.slug === id) ?? null;
}

export interface BookedRange {
  checkIn: string;
  checkOut: string;
  status: string;
}

export async function getBookedRanges(propertyId: string): Promise<BookedRange[]> {
  const prop = LISTINGS.find((p) => p.id === propertyId || p.slug === propertyId);
  const ranges = prop ? DEMO_BOOKED[prop.slug] ?? [] : [];
  return ranges.map((r) => ({ ...r, status: "confirmed" }));
}

export async function listCities(): Promise<{ city: string; country: string }[]> {
  const seen = new Set<string>();
  const out: { city: string; country: string }[] = [];
  for (const p of LISTINGS) {
    if (!seen.has(p.city)) {
      seen.add(p.city);
      out.push({ city: p.city, country: p.country });
    }
  }
  return out.sort((a, b) => a.city.localeCompare(b.city));
}
