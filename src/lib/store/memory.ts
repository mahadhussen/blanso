import { randomBytes, randomUUID } from "crypto";
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
import type {
  CreateBookingResult,
  DataStore,
  InventoryRow,
  RoomAvailability,
  RoomTypeChangeResult,
} from "./types";
import {
  availableForStay,
  checkRoomRequest,
  dateRange,
  inventoryForRoomType,
  peakBookedFrom,
  type InventoryBlock,
  type InventoryBooking,
} from "../inventory";
import { isoDate, nightsBetween, todayUTC } from "../dates";
import { LISTINGS, ROOM_TYPES } from "../listings";

// In-memory DataStore. Demo- och testlagret — samma kontrakt som SupabaseStore.
// Persisterar per serverprocess. globalThis-förankring så Next.js
// dev-omladdningar inte nollställer datan.

const DEMO_HOST: Host = {
  id: "host-demo",
  name: "Blanso Demo Värd",
  email: "vard@blanso.example",
  createdAt: new Date(2026, 0, 1).toISOString(),
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

interface MemoryState {
  hosts: Map<string, Host>;
  listings: Map<string, Listing>;
  roomTypes: Map<string, RoomType>;
  bookings: Map<string, Booking>;
  blocks: Map<string, AvailabilityBlock>;
}

function seedState(): MemoryState {
  const now = new Date().toISOString();
  const listings = new Map<string, Listing>();
  for (const p of LISTINGS) {
    listings.set(p.id, {
      ...p,
      hostId: DEMO_HOST.id,
      status: "published",
      createdAt: now,
      updatedAt: now,
    });
  }
  const roomTypes = new Map<string, RoomType>();
  for (const r of ROOM_TYPES) {
    roomTypes.set(r.id, { ...r, archivedAt: null, createdAt: now, updatedAt: now });
  }
  return {
    hosts: new Map([[DEMO_HOST.id, DEMO_HOST]]),
    listings,
    roomTypes,
    bookings: new Map(),
    blocks: new Map(),
  };
}

const g = globalThis as unknown as { __blansoStore?: MemoryState };

function state(): MemoryState {
  if (!g.__blansoStore) g.__blansoStore = seedState();
  return g.__blansoStore;
}

// Endast för tester: nollställ lagret.
export function __resetMemoryStore(): void {
  g.__blansoStore = seedState();
}

function byOrder(a: RoomType, b: RoomType): number {
  return a.sortOrder - b.sortOrder || (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0) || (a.id < b.id ? -1 : 1);
}

function activeRoomTypes(s: MemoryState, listingId: string): RoomType[] {
  return [...s.roomTypes.values()]
    .filter((r) => r.listingId === listingId && r.archivedAt === null)
    .sort(byOrder);
}

function inventoryBookings(s: MemoryState): InventoryBooking[] {
  return [...s.bookings.values()].map((b) => ({
    roomTypeId: b.roomTypeId,
    checkIn: b.checkIn,
    checkOut: b.checkOut,
    rooms: b.rooms,
    status: b.status,
  }));
}

function inventoryBlocks(s: MemoryState, listingId: string): InventoryBlock[] {
  return [...s.blocks.values()]
    .filter((bl) => bl.listingId === listingId)
    .map((bl) => ({ roomTypeId: bl.roomTypeId, checkIn: bl.checkIn, checkOut: bl.checkOut }));
}

// Äger hostId rumstypens boende? Returnerar typen, annars null.
function ownedRoomType(s: MemoryState, id: string, hostId: string): RoomType | null {
  const rt = s.roomTypes.get(id);
  if (!rt || rt.archivedAt !== null) return null;
  const listing = s.listings.get(rt.listingId);
  if (!listing || listing.hostId !== hostId) return null;
  return rt;
}

export class MemoryStore implements DataStore {
  async getHostById(id: string): Promise<Host | null> {
    return state().hosts.get(id) ?? null;
  }

  async listPublishedListings(): Promise<Listing[]> {
    return [...state().listings.values()]
      .filter((l) => l.status === "published")
      .sort((a, b) => b.rating - a.rating || b.reviewsCount - a.reviewsCount);
  }

  async listListingsByHost(hostId: string): Promise<Listing[]> {
    return [...state().listings.values()]
      .filter((l) => l.hostId === hostId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  async getListingBySlug(slug: string): Promise<Listing | null> {
    return [...state().listings.values()].find((l) => l.slug === slug) ?? null;
  }

  async getListingById(id: string): Promise<Listing | null> {
    return state().listings.get(id) ?? null;
  }

  async createListing(hostId: string, input: NewListing): Promise<Listing> {
    const s = state();
    const base = slugify(input.slug ?? `${input.title}-${input.city}`) || "boende";
    let slug = base;
    let n = 1;
    while ([...s.listings.values()].some((l) => l.slug === slug)) {
      slug = `${base}-${n++}`;
    }
    const now = new Date().toISOString();
    const listing: Listing = {
      ...input,
      id: `lst_${randomUUID().slice(0, 12)}`,
      hostId,
      slug,
      status: "draft",
      rating: 0,
      reviewsCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    s.listings.set(listing.id, listing);
    return listing;
  }

  async updateListing(
    id: string,
    hostId: string,
    patch: Partial<NewListing>,
  ): Promise<Listing | null> {
    const s = state();
    const cur = s.listings.get(id);
    if (!cur || cur.hostId !== hostId) return null;
    const next: Listing = {
      ...cur,
      ...patch,
      id: cur.id,
      hostId: cur.hostId,
      slug: cur.slug,
      updatedAt: new Date().toISOString(),
    };
    s.listings.set(id, next);
    return next;
  }

  async setListingStatus(
    id: string,
    hostId: string,
    status: Listing["status"],
  ): Promise<Listing | null> {
    const s = state();
    const cur = s.listings.get(id);
    if (!cur || cur.hostId !== hostId) return null;
    const next: Listing = { ...cur, status, updatedAt: new Date().toISOString() };
    s.listings.set(id, next);
    return next;
  }

  // ---- Rumstyper ----------------------------------------------------------

  async listRoomTypes(listingId: string): Promise<RoomType[]> {
    return activeRoomTypes(state(), listingId);
  }

  async listRoomTypesForListings(listingIds: string[]): Promise<RoomType[]> {
    const s = state();
    return listingIds.flatMap((id) => activeRoomTypes(s, id));
  }

  async getRoomType(id: string): Promise<RoomType | null> {
    return state().roomTypes.get(id) ?? null;
  }

  async createRoomType(listingId: string, hostId: string, input: NewRoomType): Promise<RoomType | null> {
    const s = state();
    const listing = s.listings.get(listingId);
    if (!listing || listing.hostId !== hostId) return null;
    const now = new Date().toISOString();
    const rt: RoomType = {
      ...input,
      id: `rt_${randomUUID().slice(0, 12)}`,
      listingId,
      archivedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    s.roomTypes.set(rt.id, rt);
    return rt;
  }

  async updateRoomType(id: string, hostId: string, patch: Partial<NewRoomType>): Promise<RoomTypeChangeResult> {
    const s = state();
    const cur = ownedRoomType(s, id, hostId);
    if (!cur) return { ok: false, error: "NOT_FOUND" };
    if (patch.units !== undefined && patch.units < cur.units) {
      const peak = peakBookedFrom(id, isoDate(todayUTC()), inventoryBookings(s));
      if (patch.units < peak) return { ok: false, error: "UNITS_BELOW_BOOKED", detail: peak };
    }
    const next: RoomType = {
      ...cur,
      ...patch,
      id: cur.id,
      listingId: cur.listingId,
      archivedAt: null,
      createdAt: cur.createdAt,
      updatedAt: new Date().toISOString(),
    };
    s.roomTypes.set(id, next);
    return { ok: true, roomType: next };
  }

  async deleteRoomType(id: string, hostId: string): Promise<RoomTypeChangeResult> {
    const s = state();
    const cur = ownedRoomType(s, id, hostId);
    if (!cur) return { ok: false, error: "NOT_FOUND" };
    const today = isoDate(todayUTC());
    const future = [...s.bookings.values()].filter(
      (b) => b.roomTypeId === id && b.status === "confirmed" && b.checkOut > today,
    ).length;
    if (future > 0) return { ok: false, error: "HAS_FUTURE_BOOKINGS", detail: future };
    const now = new Date().toISOString();
    const archived: RoomType = { ...cur, archivedAt: now, updatedAt: now };
    s.roomTypes.set(id, archived);
    return { ok: true, roomType: archived };
  }

  // ---- Lager ----------------------------------------------------------------

  async getRoomAvailability(listingId: string, checkIn: string, checkOut: string): Promise<RoomAvailability[]> {
    return (await this.getRoomAvailabilityForListings([listingId], checkIn, checkOut))[listingId] ?? [];
  }

  async getRoomAvailabilityForListings(
    listingIds: string[],
    checkIn: string,
    checkOut: string,
  ): Promise<Record<string, RoomAvailability[]>> {
    const s = state();
    const bookings = inventoryBookings(s);
    const out: Record<string, RoomAvailability[]> = {};
    for (const listingId of listingIds) {
      const blocks = inventoryBlocks(s, listingId);
      out[listingId] = activeRoomTypes(s, listingId).map((roomType) => ({
        roomType,
        ...availableForStay(roomType, checkIn, checkOut, bookings, blocks),
      }));
    }
    return out;
  }

  async getInventoryCalendar(listingId: string, from: string, days: number): Promise<InventoryRow[]> {
    const s = state();
    const nights = dateRange(from, days);
    const bookings = inventoryBookings(s);
    const blocks = inventoryBlocks(s, listingId);
    return activeRoomTypes(s, listingId).map((roomType) => ({
      roomType,
      days: inventoryForRoomType(roomType, nights, bookings, blocks),
    }));
  }

  // ---- Stängningar ----------------------------------------------------------

  async listAvailabilityBlocks(listingId: string): Promise<AvailabilityBlock[]> {
    return [...state().blocks.values()]
      .filter((bl) => bl.listingId === listingId)
      .sort((a, b) => (a.checkIn < b.checkIn ? -1 : a.checkIn > b.checkIn ? 1 : 0));
  }

  async addAvailabilityBlock(
    listingId: string,
    hostId: string,
    block: { checkIn: string; checkOut: string; note?: string; roomTypeId?: string | null },
  ): Promise<AvailabilityBlock | null> {
    const s = state();
    const listing = s.listings.get(listingId);
    if (!listing || listing.hostId !== hostId) return null;
    const roomTypeId = block.roomTypeId ?? null;
    if (roomTypeId !== null) {
      const rt = s.roomTypes.get(roomTypeId);
      if (!rt || rt.listingId !== listingId || rt.archivedAt !== null) return null;
    }
    const item: AvailabilityBlock = {
      id: `blk_${randomUUID().slice(0, 12)}`,
      listingId,
      roomTypeId,
      checkIn: block.checkIn,
      checkOut: block.checkOut,
      note: block.note,
      createdAt: new Date().toISOString(),
    };
    s.blocks.set(item.id, item);
    return item;
  }

  async removeAvailabilityBlock(id: string, hostId: string): Promise<boolean> {
    const s = state();
    const item = s.blocks.get(id);
    if (!item) return false;
    const listing = s.listings.get(item.listingId);
    if (!listing || listing.hostId !== hostId) return false;
    return s.blocks.delete(id);
  }

  // ---- Bokningar ------------------------------------------------------------

  async createBooking(
    input: NewBooking & { paymentRef: string },
  ): Promise<CreateBookingResult> {
    const s = state();
    // Samma ordning på kontrollerna som SQL-funktionen create_booking.
    const listing = s.listings.get(input.listingId);
    if (!listing) return { ok: false, error: "LISTING_NOT_FOUND" };
    if (listing.status !== "published") return { ok: false, error: "LISTING_NOT_PUBLISHED" };
    const rt = s.roomTypes.get(input.roomTypeId);
    if (!rt || rt.listingId !== input.listingId || rt.archivedAt !== null) {
      return { ok: false, error: "ROOM_TYPE_NOT_FOUND" };
    }
    if (!Number.isInteger(input.rooms) || input.rooms < 1) return { ok: false, error: "INVALID_ROOMS" };
    // Försvar på djupet (samma vakt som SQL): kontraktet litar inte på anroparens
    // datum, nätter eller belopp.
    const amounts = [input.subtotalCents, input.cleaningFeeCents, input.serviceFeeCents, input.totalCents];
    if (
      input.checkOut <= input.checkIn ||
      input.checkIn < isoDate(todayUTC()) ||
      !Number.isInteger(input.guests) ||
      input.guests < 1 ||
      input.nights !== nightsBetween(input.checkIn, input.checkOut) ||
      amounts.some((c) => !Number.isInteger(c) || c < 0)
    ) {
      return { ok: false, error: "INVALID_REQUEST" };
    }
    // Vakten bor i kontraktet, inte bara hos anroparen.
    if (input.guests > rt.maxGuests * input.rooms) return { ok: false, error: "TOO_MANY_GUESTS" };

    // Atomisk i denna process: lagerkoll + skrivning utan await emellan.
    const check = checkRoomRequest(
      rt,
      input.checkIn,
      input.checkOut,
      input.rooms,
      inventoryBookings(s),
      inventoryBlocks(s, input.listingId),
    );
    if (!check.ok) return { ok: false, error: check.error, available: check.available };

    const booking: Booking = {
      ...input,
      id: `bok_${randomUUID().slice(0, 12)}`,
      accessToken: randomBytes(24).toString("hex"),
      status: "confirmed",
      createdAt: new Date().toISOString(),
    };
    s.bookings.set(booking.id, booking);
    return { ok: true, booking };
  }

  async getBookingByToken(token: string): Promise<Booking | null> {
    return [...state().bookings.values()].find((b) => b.accessToken === token) ?? null;
  }

  async listBookingsByHost(
    hostId: string,
  ): Promise<(Booking & { listingTitle: string; roomTypeName: string })[]> {
    const s = state();
    const myListings = new Map(
      [...s.listings.values()].filter((l) => l.hostId === hostId).map((l) => [l.id, l]),
    );
    return [...s.bookings.values()]
      .filter((b) => myListings.has(b.listingId))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .map((b) => ({
        ...b,
        listingTitle: myListings.get(b.listingId)!.title,
        roomTypeName: s.roomTypes.get(b.roomTypeId)?.name ?? "",
      }));
  }

  async cancelBooking(id: string, hostId: string): Promise<boolean> {
    const s = state();
    const b = s.bookings.get(id);
    if (!b) return false;
    const listing = s.listings.get(b.listingId);
    if (!listing || listing.hostId !== hostId) return false;
    if (b.status === "cancelled") return true;
    s.bookings.set(id, { ...b, status: "cancelled" });
    return true;
  }
}

export const DEMO_HOST_ID = DEMO_HOST.id;
