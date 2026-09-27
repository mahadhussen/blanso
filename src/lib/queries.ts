import { getStore } from "./store";
import type { Listing, RoomType } from "./domain";
import type { RoomAvailability } from "./store/types";
import { validateStay } from "./dates";

// Vy-typer som skickas till sidor och klientkomponenter. Härledda ur domänen —
// pris och kapacitet kommer ALLTID ur rumstyperna, aldrig ur listningens
// arvsfält (se domain.ts).

export interface PropertyView {
  id: string;
  slug: string;
  title: string;
  city: string;
  country: string;
  description: string;
  cleaningFeeCents: number;
  currency: string;
  rating: number;
  reviewsCount: number;
  images: string[];
  amenities: string[];
  hostName: string;
  // Härlett ur rumstyperna.
  fromPriceCents: number; // billigaste (bokningsbara) rumstypens nattpris
  roomTypeCount: number;
  maxGuestsPerRoom: number;
}

function toView(l: Listing, types: RoomType[], fromTypes: RoomType[] = types): PropertyView {
  return {
    id: l.id,
    slug: l.slug,
    title: l.title,
    city: l.city,
    country: l.country,
    description: l.description,
    cleaningFeeCents: l.cleaningFeeCents,
    currency: l.currency,
    rating: l.rating,
    reviewsCount: l.reviewsCount,
    images: l.images,
    amenities: l.amenities,
    hostName: l.hostName,
    // Tomma listor ger 0 (boende utan rumstyper): sidan visar då "inga rum än".
    fromPriceCents: fromTypes.length ? Math.min(...fromTypes.map((t) => t.nightlyPriceCents)) : 0,
    roomTypeCount: types.length,
    maxGuestsPerRoom: types.length ? Math.max(...types.map((t) => t.maxGuests)) : 0,
  };
}

// Giltig vistelse ur querystring, annars null (sökning utan datum).
export function stayFrom(checkIn?: string, checkOut?: string): { checkIn: string; checkOut: string } | null {
  if (!checkIn || !checkOut) return null;
  return validateStay(checkIn, checkOut).ok ? { checkIn, checkOut } : null;
}

// Ryms sällskapet i EN rumstyp (en typ per bokning, flera rum av den)?
export function fitsParty(available: number, maxGuests: number, guests: number): boolean {
  return available >= 1 && available * maxGuests >= guests;
}

export interface SearchParams {
  destination?: string;
  guests?: number;
  checkIn?: string;
  checkOut?: string;
}

// Sökning: ett boende visas om någon rumstyp har lediga rum som rymmer
// gästerna för datumen (utan datum: om typens totala antal rum rymmer dem).
// "From $X" = billigaste typ som faktiskt uppfyller det.
export async function searchProperties(params: SearchParams = {}): Promise<PropertyView[]> {
  const dest = params.destination?.trim().toLowerCase();
  const guests = params.guests && params.guests > 0 ? params.guests : 1;
  const stay = stayFrom(params.checkIn, params.checkOut);
  const store = getStore();

  const listings = (await store.listPublishedListings()).filter((p) => {
    if (!dest) return true;
    return `${p.city} ${p.country} ${p.title}`.toLowerCase().includes(dest);
  });
  const ids = listings.map((l) => l.id);
  const types = await store.listRoomTypesForListings(ids);
  const availability = stay ? await store.getRoomAvailabilityForListings(ids, stay.checkIn, stay.checkOut) : null;

  const out: PropertyView[] = [];
  for (const l of listings) {
    const mine = types.filter((t) => t.listingId === l.id);
    if (mine.length === 0) continue; // inga rum = inget att boka
    const bookable = availability
      ? (availability[l.id] ?? []).filter((a) => fitsParty(a.available, a.roomType.maxGuests, guests)).map((a) => a.roomType)
      : mine.filter((t) => fitsParty(t.units, t.maxGuests, guests));
    if (bookable.length === 0) continue;
    out.push(toView(l, mine, bookable));
  }
  return out;
}

export async function getPropertyBySlug(slug: string): Promise<PropertyView | null> {
  const store = getStore();
  const l = await store.getListingBySlug(slug);
  if (!l || l.status !== "published") return null;
  return toView(l, await store.listRoomTypes(l.id));
}

export async function getPropertyById(id: string): Promise<PropertyView | null> {
  const store = getStore();
  const l = await store.getListingById(id);
  if (!l || l.status !== "published") return null;
  return getPropertyBySlug(l.slug);
}

// En rad i gästens rumstabell.
export interface RoomOffer {
  id: string;
  name: string;
  sizeSqm: number | null;
  bedConfig: string;
  maxGuests: number;
  units: number;
  nightlyPriceCents: number;
  image: string | null;
  // Endast med giltiga datum:
  available: number | null; // null = inga datum valda
  closed: boolean;
}

export async function getRoomOffers(
  property: PropertyView,
  stay: { checkIn: string; checkOut: string } | null,
): Promise<RoomOffer[]> {
  const store = getStore();
  const rows: RoomAvailability[] = stay
    ? await store.getRoomAvailability(property.id, stay.checkIn, stay.checkOut)
    : (await store.listRoomTypes(property.id)).map((roomType) => ({ roomType, available: roomType.units, closed: false }));
  return rows.map(({ roomType: t, available, closed }, i) => ({
    id: t.id,
    name: t.name,
    sizeSqm: t.sizeSqm,
    bedConfig: t.bedConfig,
    maxGuests: t.maxGuests,
    units: t.units,
    nightlyPriceCents: t.nightlyPriceCents,
    // Egna rumsfoton först; annars boendets foton (olika per rad).
    image: t.images[0] ?? property.images[(i + 1) % Math.max(1, property.images.length)] ?? null,
    available: stay ? available : null,
    closed,
  }));
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
