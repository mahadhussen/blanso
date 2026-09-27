// Blansos domänmodell. En samordnad sanningskälla — vyer härleds ur den.
// Pengar alltid heltal i minsta enhet (cent). Datum alltid "YYYY-MM-DD" (UTC).

export type ListingStatus = "draft" | "published" | "unlisted";

export interface Host {
  id: string;
  name: string;
  email: string;
  createdAt: string; // ISO
}

// En listning är ett BOENDE (hotell, gästhus, villa). Det bokningsbara är dess
// rumstyper (RoomType) — booking.com-/QloApps-modellen: rumstyp × antal enheter
// × natt. Listningens egna pris-/kapacitetsfält (nightlyPriceCents, maxGuests,
// bedrooms, beds, baths) är arv från modellen före rumstyper: de används bara
// för att härleda en första rumstyp (backfill) och ALDRIG för pris eller
// tillgänglighet. Vyer härleder "From $X" och kapacitet ur rumstyperna.
export interface Listing {
  id: string;
  hostId: string;
  // Visningsnamn mot gäster ("Värd: Amina"). Ägandet styrs av hostId.
  hostName: string;
  slug: string;
  status: ListingStatus;
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
  createdAt: string;
  updatedAt: string;
}

// En rumstyp: "Deluxe Double Room", 24 m², 1 king bed, 2 gäster, 3 fysiska rum.
// units = antal fysiska rum av typen; lagret räknas per natt mot units.
export interface RoomType {
  id: string;
  listingId: string;
  name: string;
  sizeSqm: number | null; // null bara för härledda (backfill) typer där storlek saknas
  bedConfig: string; // "1 king bed", "2 single beds"
  maxGuests: number; // per rum
  units: number; // antal fysiska rum, >= 1
  nightlyPriceCents: number; // per rum och natt, heltal cent
  images: string[]; // tom = faller tillbaka till boendets foton
  sortOrder: number;
  archivedAt: string | null; // borttagen av värden; historiska bokningar pekar kvar hit
  createdAt: string;
  updatedAt: string;
}

export type BookingStatus = "confirmed" | "cancelled";

export interface Booking {
  id: string;
  accessToken: string; // ogenomskinlig token för gästens bekräftelselänk (IDOR-skydd)
  listingId: string;
  roomTypeId: string;
  rooms: number; // antal rum av rumstypen, >= 1
  guestName: string;
  guestEmail: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  guests: number;
  nights: number;
  subtotalCents: number;
  cleaningFeeCents: number;
  serviceFeeCents: number;
  totalCents: number;
  currency: string;
  status: BookingStatus;
  paymentRef: string;
  createdAt: string;
}

// Värdens egen stängning av datum (underhåll, privat bruk) — skild från bokningar.
// roomTypeId null = hela boendet stängt; annars bara den rumstypen.
export interface AvailabilityBlock {
  id: string;
  listingId: string;
  roomTypeId: string | null;
  checkIn: string;
  checkOut: string;
  note?: string;
  createdAt: string;
}

// Indata-former (utan systemfält).
export type NewListing = Omit<
  Listing,
  "id" | "slug" | "status" | "rating" | "reviewsCount" | "createdAt" | "updatedAt"
> & { slug?: string };

export type NewBooking = Omit<
  Booking,
  "id" | "accessToken" | "status" | "createdAt"
>;

export type NewRoomType = Omit<
  RoomType,
  "id" | "listingId" | "archivedAt" | "createdAt" | "updatedAt"
>;
