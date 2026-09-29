import type {
  AvailabilityBlock,
  Booking,
  Host,
  Listing,
  NewBooking,
  NewListing,
  NewRoomType,
  RoomType,
} from "../domain";
import type { InventoryDay } from "../inventory";

// DataStore är Blansos enda dörr till lagring. Hela appen pratar med detta
// interface — aldrig direkt med en databas. MemoryStore (demo, tester) och
// SupabaseStore (drift) implementerar samma kontrakt.

export type CreateBookingError =
  | "UNAVAILABLE" // någon natt är stängd (hela boendet eller rumstypen)
  | "NOT_ENOUGH_ROOMS" // färre lediga rum än begärt någon natt; se `available`
  | "ROOM_TYPE_NOT_FOUND" // saknas, tillhör annat boende eller är borttagen
  | "INVALID_ROOMS" // rooms < 1 eller inte heltal
  | "INVALID_REQUEST" // datum i fel ordning/förflutet, guests < 1, nätter eller belopp som inte stämmer
  | "LISTING_NOT_FOUND"
  | "LISTING_NOT_PUBLISHED"
  | "TOO_MANY_GUESTS"; // guests > rumstypens maxGuests × rooms

export interface CreateBookingResult {
  ok: boolean;
  booking?: Booking;
  error?: CreateBookingError;
  available?: number; // vid NOT_ENOUGH_ROOMS: hur många som faktiskt finns kvar
}

export type RoomTypeChangeResult =
  | { ok: true; roomType: RoomType }
  | {
      ok: false;
      error: "NOT_FOUND" | "UNITS_BELOW_BOOKED" | "HAS_FUTURE_BOOKINGS";
      // UNITS_BELOW_BOOKED: högsta antal bokade rum en framtida natt.
      // HAS_FUTURE_BOOKINGS: antal framtida bekräftade bokningar.
      detail?: number;
    };

// En rumstyp med dess lediga antal för en efterfrågad vistelse.
export interface RoomAvailability {
  roomType: RoomType;
  available: number; // minsta lediga över nätterna
  closed: boolean; // någon natt stängd av värden
}

// Värdens lagerkalender: en rad per rumstyp, en cell per datum.
export interface InventoryRow {
  roomType: RoomType;
  days: InventoryDay[];
}

export interface DataStore {
  // Värdar
  getHostById(id: string): Promise<Host | null>;

  // Listningar (boenden)
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

  // Rumstyper. Läsning är publik (aktiva typer, sorterade på sortOrder);
  // skrivning kräver att hostId äger boendet — annars null / NOT_FOUND.
  listRoomTypes(listingId: string): Promise<RoomType[]>;
  listRoomTypesForListings(listingIds: string[]): Promise<RoomType[]>;
  // Hittar även borttagna typer, så historiska bokningar kan visa sitt rum.
  getRoomType(id: string): Promise<RoomType | null>;
  createRoomType(listingId: string, hostId: string, input: NewRoomType): Promise<RoomType | null>;
  // Vägrar sänka units under det som redan är bokat en framtida natt.
  updateRoomType(id: string, hostId: string, patch: Partial<NewRoomType>): Promise<RoomTypeChangeResult>;
  // Vägrar om typen har framtida bekräftade bokningar. Arkiverar (mjuk
  // borttagning) så historiska bokningar behåller sin rumstyp.
  deleteRoomType(id: string, hostId: string): Promise<RoomTypeChangeResult>;

  // Lager — räknas av den deterministiska motorn i src/lib/inventory.ts.
  getRoomAvailability(listingId: string, checkIn: string, checkOut: string): Promise<RoomAvailability[]>;
  getRoomAvailabilityForListings(
    listingIds: string[],
    checkIn: string,
    checkOut: string,
  ): Promise<Record<string, RoomAvailability[]>>;
  getInventoryCalendar(listingId: string, from: string, days: number): Promise<InventoryRow[]>;

  // Värdens stängningar. roomTypeId null/utelämnad = hela boendet.
  listAvailabilityBlocks(listingId: string): Promise<AvailabilityBlock[]>;
  addAvailabilityBlock(
    listingId: string,
    hostId: string,
    block: { checkIn: string; checkOut: string; note?: string; roomTypeId?: string | null },
  ): Promise<AvailabilityBlock | null>;
  removeAvailabilityBlock(id: string, hostId: string): Promise<boolean>;

  // Bokningar. createBooking är ATOMISK: lagerkoll per natt + skrivning i ett
  // steg så överbokning inte kan smyga emellan.
  createBooking(input: NewBooking & { paymentRef: string }): Promise<CreateBookingResult>;
  getBookingByToken(token: string): Promise<Booking | null>;
  listBookingsByHost(
    hostId: string,
  ): Promise<(Booking & { listingTitle: string; roomTypeName: string })[]>;
  cancelBooking(id: string, hostId: string): Promise<boolean>;
}
