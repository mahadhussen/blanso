import type {
  AvailabilityBlock,
  Booking,
  Host,
  Listing,
  NewBooking,
  NewListing,
} from "../domain";

// DataStore är Blansos enda dörr till lagring. Hela appen pratar med detta
// interface — aldrig direkt med en databas. I dag: in-memory (demo, noll
// kostnad). Sen: en Supabase-implementation i EN fil, utan att röra resten.

export interface CreateBookingResult {
  ok: boolean;
  booking?: Booking;
  error?: "UNAVAILABLE" | "LISTING_NOT_FOUND" | "LISTING_NOT_PUBLISHED";
}

export interface DataStore {
  // Värdar
  getHostById(id: string): Promise<Host | null>;

  // Listningar
  listPublishedListings(): Promise<Listing[]>;
  listListingsByHost(hostId: string): Promise<Listing[]>;
  getListingBySlug(slug: string): Promise<Listing | null>;
  getListingById(id: string): Promise<Listing | null>;
  createListing(hostId: string, input: NewListing): Promise<Listing>;
  updateListing(
    id: string,
    hostId: string,
    patch: Partial<NewListing>,
  ): Promise<Listing | null>;
  setListingStatus(
    id: string,
    hostId: string,
    status: Listing["status"],
  ): Promise<Listing | null>;

  // Tillgänglighet: bokningar + värdens blockeringar tillsammans.
  getBlockedRanges(
    listingId: string,
  ): Promise<{ checkIn: string; checkOut: string; source: "booking" | "block" }[]>;
  addAvailabilityBlock(
    listingId: string,
    hostId: string,
    block: { checkIn: string; checkOut: string; note?: string },
  ): Promise<AvailabilityBlock | null>;
  removeAvailabilityBlock(id: string, hostId: string): Promise<boolean>;

  // Bokningar. createBooking är ATOMISK: tillgänglighetskoll + skrivning i ett
  // steg så dubbelbokning inte kan smyga emellan.
  createBooking(input: NewBooking & { paymentRef: string }): Promise<CreateBookingResult>;
  getBookingByToken(token: string): Promise<Booking | null>;
  listBookingsByHost(hostId: string): Promise<(Booking & { listingTitle: string })[]>;
  cancelBooking(id: string, hostId: string): Promise<boolean>;
}
