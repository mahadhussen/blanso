// Blansos domänmodell. En samordnad sanningskälla — vyer härleds ur den.
// Pengar alltid heltal i minsta enhet (cent). Datum alltid "YYYY-MM-DD" (UTC).

export type ListingStatus = "draft" | "published" | "unlisted";

export interface Host {
  id: string;
  name: string;
  email: string;
  createdAt: string; // ISO
}

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

export type BookingStatus = "confirmed" | "cancelled";

export interface Booking {
  id: string;
  accessToken: string; // ogenomskinlig token för gästens bekräftelselänk (IDOR-skydd)
  listingId: string;
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

// Värdens egen blockering av datum (underhåll, privat bruk) — skild från bokningar.
export interface AvailabilityBlock {
  id: string;
  listingId: string;
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
