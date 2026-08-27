import { db } from "./db";

// Vy-typ med parsade JSON-fält, säker att skicka till klientkomponenter.
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

type PropertyRow = {
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
  images: string;
  amenities: string;
  hostName: string;
};

function parseJsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function toPropertyView(row: PropertyRow): PropertyView {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    city: row.city,
    country: row.country,
    description: row.description,
    nightlyPriceCents: row.nightlyPriceCents,
    cleaningFeeCents: row.cleaningFeeCents,
    currency: row.currency,
    maxGuests: row.maxGuests,
    bedrooms: row.bedrooms,
    beds: row.beds,
    baths: row.baths,
    rating: row.rating,
    reviewsCount: row.reviewsCount,
    images: parseJsonArray(row.images),
    amenities: parseJsonArray(row.amenities),
    hostName: row.hostName,
  };
}

export interface SearchParams {
  destination?: string;
  guests?: number;
}

export async function searchProperties(params: SearchParams = {}): Promise<PropertyView[]> {
  const dest = params.destination?.trim();
  const rows = await db.property.findMany({
    where: {
      ...(dest
        ? {
            OR: [
              { city: { contains: dest } },
              { country: { contains: dest } },
              { title: { contains: dest } },
            ],
          }
        : {}),
      ...(params.guests && params.guests > 0 ? { maxGuests: { gte: params.guests } } : {}),
    },
    orderBy: [{ rating: "desc" }, { reviewsCount: "desc" }],
  });
  return rows.map(toPropertyView);
}

export async function getPropertyBySlug(slug: string): Promise<PropertyView | null> {
  const row = await db.property.findUnique({ where: { slug } });
  return row ? toPropertyView(row) : null;
}

export async function getPropertyById(id: string): Promise<PropertyView | null> {
  const row = await db.property.findUnique({ where: { id } });
  return row ? toPropertyView(row) : null;
}

export interface BookedRange {
  checkIn: Date;
  checkOut: Date;
  status: string;
}

// Hur länge en obetald (pending) bokning håller sina datum innan de släpps igen.
// Utan detta skulle en bokning som aldrig blev betald blockera datumen för alltid.
export const PENDING_HOLD_MS = 15 * 60 * 1000;

// Prisma-villkor för bokningar som faktiskt blockerar datum: alla bekräftade,
// plus pending som fortfarande är inom hålltiden. Delas av UI och server action.
export function activeBookingWhere(propertyId: string) {
  const cutoff = new Date(Date.now() - PENDING_HOLD_MS);
  return {
    propertyId,
    OR: [
      { status: "confirmed" },
      { status: "pending", createdAt: { gte: cutoff } },
    ],
  };
}

export async function getBookedRanges(propertyId: string): Promise<BookedRange[]> {
  const rows = await db.booking.findMany({
    where: activeBookingWhere(propertyId),
    select: { checkIn: true, checkOut: true, status: true },
  });
  return rows;
}

export async function listCities(): Promise<{ city: string; country: string }[]> {
  const rows = await db.property.findMany({
    distinct: ["city"],
    select: { city: true, country: true },
    orderBy: { city: "asc" },
  });
  return rows;
}
