import { randomBytes, randomUUID } from "crypto";
import type {
  AvailabilityBlock,
  Booking,
  Host,
  Listing,
  NewBooking,
  NewListing,
} from "../domain";
import type { CreateBookingResult, DataStore } from "./types";
import { isAvailable } from "../availability";
import { LISTINGS } from "../listings";

// In-memory DataStore. Blansos lagring tills Supabase pluggas in — samma
// interface, så bytet är EN fil. Persisterar per serverprocess (demo).
// globalThis-förankring så Next.js dev-omladdningar inte nollställer datan.

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
  return {
    hosts: new Map([[DEMO_HOST.id, DEMO_HOST]]),
    listings,
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
    return this.updateListing(id, hostId, {}).then((l) => {
      if (!l) return null;
      const s = state();
      const next = { ...l, status, updatedAt: new Date().toISOString() };
      s.listings.set(id, next);
      return next;
    });
  }

  async getBlockedRanges(
    listingId: string,
  ): Promise<{ checkIn: string; checkOut: string; source: "booking" | "block" }[]> {
    const s = state();
    const fromBookings = [...s.bookings.values()]
      .filter((b) => b.listingId === listingId && b.status !== "cancelled")
      .map((b) => ({ checkIn: b.checkIn, checkOut: b.checkOut, source: "booking" as const }));
    const fromBlocks = [...s.blocks.values()]
      .filter((bl) => bl.listingId === listingId)
      .map((bl) => ({ checkIn: bl.checkIn, checkOut: bl.checkOut, source: "block" as const }));
    return [...fromBookings, ...fromBlocks];
  }

  async addAvailabilityBlock(
    listingId: string,
    hostId: string,
    block: { checkIn: string; checkOut: string; note?: string },
  ): Promise<AvailabilityBlock | null> {
    const s = state();
    const listing = s.listings.get(listingId);
    if (!listing || listing.hostId !== hostId) return null;
    const item: AvailabilityBlock = {
      id: `blk_${randomUUID().slice(0, 12)}`,
      listingId,
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

  async createBooking(
    input: NewBooking & { paymentRef: string },
  ): Promise<CreateBookingResult> {
    const s = state();
    const listing = s.listings.get(input.listingId);
    if (!listing) return { ok: false, error: "LISTING_NOT_FOUND" };
    if (listing.status !== "published") return { ok: false, error: "LISTING_NOT_PUBLISHED" };

    // Atomisk i denna process: kolla + skriv utan await emellan.
    const blocked = [
      ...[...s.bookings.values()]
        .filter((b) => b.listingId === input.listingId && b.status !== "cancelled")
        .map((b) => ({ checkIn: b.checkIn, checkOut: b.checkOut })),
      ...[...s.blocks.values()]
        .filter((bl) => bl.listingId === input.listingId)
        .map((bl) => ({ checkIn: bl.checkIn, checkOut: bl.checkOut })),
    ];
    if (!isAvailable({ checkIn: input.checkIn, checkOut: input.checkOut }, blocked)) {
      return { ok: false, error: "UNAVAILABLE" };
    }

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
  ): Promise<(Booking & { listingTitle: string })[]> {
    const s = state();
    const myListings = new Map(
      [...s.listings.values()].filter((l) => l.hostId === hostId).map((l) => [l.id, l]),
    );
    return [...s.bookings.values()]
      .filter((b) => myListings.has(b.listingId))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .map((b) => ({ ...b, listingTitle: myListings.get(b.listingId)!.title }));
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
