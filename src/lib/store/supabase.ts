import { randomBytes, randomUUID } from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import ws from "ws";
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
  dateRange,
  inventoryForRoomType,
  peakBookedFrom,
  type InventoryBlock,
  type InventoryBooking,
} from "../inventory";
import { addDays, isoDate, todayUTC } from "../dates";

// SupabaseStore — DataStore-kontraktet mot Balaanso (Postgres). Körs ENBART på
// servern med service role; RLS i databasen nekar alla andra vägar in.
// Atomiciteten i createBooking bor i databasens create_booking-funktion
// (radlås på rumstypen + per-natt-kontroll + insert i ett steg). Läsvägarna
// för lager hämtar rådata och räknar i SAMMA motor som MemoryStore
// (src/lib/inventory.ts) — ingen parallell tillgänglighetslogik i JS.

type Row = Record<string, unknown>;

function s(v: unknown): string {
  return typeof v === "string" ? v : String(v ?? "");
}
function n(v: unknown): number {
  return typeof v === "number" ? v : Number(v ?? 0);
}
function arr(v: unknown): string[] {
  return Array.isArray(v) ? v.map(String) : [];
}
// date-kolumner kommer som "YYYY-MM-DD", timestamptz som ISO — båda till string.
function iso(v: unknown): string {
  return s(v);
}
function day(v: unknown): string {
  return s(v).slice(0, 10);
}

function toListing(r: Row): Listing {
  return {
    id: s(r.id),
    hostId: s(r.host_id),
    hostName: s(r.host_name),
    slug: s(r.slug),
    status: s(r.status) as Listing["status"],
    title: s(r.title),
    city: s(r.city),
    country: s(r.country),
    description: s(r.description),
    nightlyPriceCents: n(r.nightly_price_cents),
    cleaningFeeCents: n(r.cleaning_fee_cents),
    currency: s(r.currency),
    maxGuests: n(r.max_guests),
    bedrooms: n(r.bedrooms),
    beds: n(r.beds),
    baths: n(r.baths),
    rating: n(r.rating),
    reviewsCount: n(r.reviews_count),
    images: arr(r.images),
    amenities: arr(r.amenities),
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  };
}

function toRoomType(r: Row): RoomType {
  return {
    id: s(r.id),
    listingId: s(r.listing_id),
    name: s(r.name),
    sizeSqm: r.size_sqm === null || r.size_sqm === undefined ? null : n(r.size_sqm),
    bedConfig: s(r.bed_config),
    maxGuests: n(r.max_guests),
    units: n(r.units),
    nightlyPriceCents: n(r.nightly_price_cents),
    images: arr(r.images),
    sortOrder: n(r.sort_order),
    archivedAt: r.archived_at ? iso(r.archived_at) : null,
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  };
}

function toBooking(r: Row): Booking {
  return {
    id: s(r.id),
    accessToken: s(r.access_token),
    listingId: s(r.listing_id),
    roomTypeId: s(r.room_type_id),
    rooms: n(r.rooms ?? 1),
    guestName: s(r.guest_name),
    guestEmail: s(r.guest_email),
    checkIn: day(r.check_in),
    checkOut: day(r.check_out),
    guests: n(r.guests),
    nights: n(r.nights),
    subtotalCents: n(r.subtotal_cents),
    cleaningFeeCents: n(r.cleaning_fee_cents),
    serviceFeeCents: n(r.service_fee_cents),
    totalCents: n(r.total_cents),
    currency: s(r.currency),
    status: s(r.status) as Booking["status"],
    paymentRef: s(r.payment_ref),
    createdAt: iso(r.created_at),
  };
}

function toBlock(r: Row): AvailabilityBlock {
  return {
    id: s(r.id),
    listingId: s(r.listing_id),
    roomTypeId: r.room_type_id ? s(r.room_type_id) : null,
    checkIn: day(r.check_in),
    checkOut: day(r.check_out),
    note: r.note ? s(r.note) : undefined,
    createdAt: iso(r.created_at),
  };
}

function listingPatchToRow(patch: Partial<NewListing>): Row {
  const row: Row = {};
  if (patch.hostName !== undefined) row.host_name = patch.hostName;
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.city !== undefined) row.city = patch.city;
  if (patch.country !== undefined) row.country = patch.country;
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.nightlyPriceCents !== undefined) row.nightly_price_cents = patch.nightlyPriceCents;
  if (patch.cleaningFeeCents !== undefined) row.cleaning_fee_cents = patch.cleaningFeeCents;
  if (patch.currency !== undefined) row.currency = patch.currency;
  if (patch.maxGuests !== undefined) row.max_guests = patch.maxGuests;
  if (patch.bedrooms !== undefined) row.bedrooms = patch.bedrooms;
  if (patch.beds !== undefined) row.beds = patch.beds;
  if (patch.baths !== undefined) row.baths = patch.baths;
  if (patch.images !== undefined) row.images = patch.images;
  if (patch.amenities !== undefined) row.amenities = patch.amenities;
  return row;
}

function roomTypePatchToRow(patch: Partial<NewRoomType>): Row {
  const row: Row = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.sizeSqm !== undefined) row.size_sqm = patch.sizeSqm;
  if (patch.bedConfig !== undefined) row.bed_config = patch.bedConfig;
  if (patch.maxGuests !== undefined) row.max_guests = patch.maxGuests;
  if (patch.units !== undefined) row.units = patch.units;
  if (patch.nightlyPriceCents !== undefined) row.nightly_price_cents = patch.nightlyPriceCents;
  if (patch.images !== undefined) row.images = patch.images;
  if (patch.sortOrder !== undefined) row.sort_order = patch.sortOrder;
  return row;
}

function toInventoryBooking(r: Row): InventoryBooking {
  return {
    roomTypeId: s(r.room_type_id),
    checkIn: day(r.check_in),
    checkOut: day(r.check_out),
    rooms: n(r.rooms ?? 1),
    status: s(r.status),
  };
}

function toInventoryBlock(r: Row): InventoryBlock & { listingId: string } {
  return {
    listingId: s(r.listing_id),
    roomTypeId: r.room_type_id ? s(r.room_type_id) : null,
    checkIn: day(r.check_in),
    checkOut: day(r.check_out),
  };
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// Serverside Supabase-klient. ws-transporten krävs för Node 20 (ingen nativ
// WebSocket); realtime används inte men klienten initierar den vid start.
export function createServerClient(url: string, serviceRoleKey: string): SupabaseClient {
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { transport: ws as never },
  });
}

export class SupabaseStore implements DataStore {
  private client: SupabaseClient;

  constructor(url: string, serviceRoleKey: string) {
    this.client = createServerClient(url, serviceRoleKey);
  }

  async getHostById(id: string): Promise<Host | null> {
    const { data, error } = await this.client.from("hosts").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(`getHostById: ${error.message}`);
    if (!data) return null;
    return { id: s(data.id), name: s(data.name), email: s(data.email), createdAt: iso(data.created_at) };
  }

  async listPublishedListings(): Promise<Listing[]> {
    const { data, error } = await this.client
      .from("listings")
      .select("*")
      .eq("status", "published")
      .order("rating", { ascending: false })
      .order("reviews_count", { ascending: false });
    if (error) throw new Error(`listPublishedListings: ${error.message}`);
    return (data ?? []).map(toListing);
  }

  async listListingsByHost(hostId: string): Promise<Listing[]> {
    const { data, error } = await this.client
      .from("listings")
      .select("*")
      .eq("host_id", hostId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(`listListingsByHost: ${error.message}`);
    return (data ?? []).map(toListing);
  }

  async getListingBySlug(slug: string): Promise<Listing | null> {
    const { data, error } = await this.client.from("listings").select("*").eq("slug", slug).maybeSingle();
    if (error) throw new Error(`getListingBySlug: ${error.message}`);
    return data ? toListing(data) : null;
  }

  async getListingById(id: string): Promise<Listing | null> {
    const { data, error } = await this.client.from("listings").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(`getListingById: ${error.message}`);
    return data ? toListing(data) : null;
  }

  async createListing(hostId: string, input: NewListing): Promise<Listing> {
    const base = slugify(input.slug ?? `${input.title}-${input.city}`) || "boende";
    // Slug-krockar löses av unikindexet: försök, öka suffixet vid 23505.
    for (let attempt = 0; attempt < 20; attempt++) {
      const slug = attempt === 0 ? base : `${base}-${attempt}`;
      const { data, error } = await this.client
        .from("listings")
        .insert({
          id: `lst_${randomUUID().slice(0, 12)}`,
          host_id: hostId,
          host_name: input.hostName,
          slug,
          status: "draft",
          title: input.title,
          city: input.city,
          country: input.country,
          description: input.description,
          nightly_price_cents: input.nightlyPriceCents,
          cleaning_fee_cents: input.cleaningFeeCents,
          currency: input.currency,
          max_guests: input.maxGuests,
          bedrooms: input.bedrooms,
          beds: input.beds,
          baths: input.baths,
          images: input.images,
          amenities: input.amenities,
        })
        .select("*")
        .single();
      if (!error && data) return toListing(data);
      if (error && error.code !== "23505") throw new Error(`createListing: ${error.message}`);
    }
    throw new Error("createListing: kunde inte hitta ledig slug");
  }

  async updateListing(
    id: string,
    hostId: string,
    patch: Partial<NewListing>,
  ): Promise<Listing | null> {
    const row = listingPatchToRow(patch);
    row.updated_at = new Date().toISOString();
    const { data, error } = await this.client
      .from("listings")
      .update(row)
      .eq("id", id)
      .eq("host_id", hostId)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(`updateListing: ${error.message}`);
    return data ? toListing(data) : null;
  }

  async setListingStatus(
    id: string,
    hostId: string,
    status: Listing["status"],
  ): Promise<Listing | null> {
    const { data, error } = await this.client
      .from("listings")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("host_id", hostId)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(`setListingStatus: ${error.message}`);
    return data ? toListing(data) : null;
  }

  // ---- Rumstyper ----------------------------------------------------------

  async listRoomTypes(listingId: string): Promise<RoomType[]> {
    return this.listRoomTypesForListings([listingId]);
  }

  async listRoomTypesForListings(listingIds: string[]): Promise<RoomType[]> {
    if (listingIds.length === 0) return [];
    const { data, error } = await this.client
      .from("room_types")
      .select("*")
      .in("listing_id", listingIds)
      .is("archived_at", null)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
      .order("id", { ascending: true });
    if (error) throw new Error(`listRoomTypesForListings: ${error.message}`);
    return (data ?? []).map(toRoomType);
  }

  async getRoomType(id: string): Promise<RoomType | null> {
    const { data, error } = await this.client.from("room_types").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(`getRoomType: ${error.message}`);
    return data ? toRoomType(data) : null;
  }

  // Aktiv rumstyp vars boende ägs av hostId, annars null.
  private async ownedRoomType(id: string, hostId: string): Promise<RoomType | null> {
    const rt = await this.getRoomType(id);
    if (!rt || rt.archivedAt !== null) return null;
    const listing = await this.getListingById(rt.listingId);
    if (!listing || listing.hostId !== hostId) return null;
    return rt;
  }

  async createRoomType(listingId: string, hostId: string, input: NewRoomType): Promise<RoomType | null> {
    const listing = await this.getListingById(listingId);
    if (!listing || listing.hostId !== hostId) return null;
    const { data, error } = await this.client
      .from("room_types")
      .insert({ id: `rt_${randomUUID().slice(0, 12)}`, listing_id: listingId, ...roomTypePatchToRow(input) })
      .select("*")
      .single();
    if (error) throw new Error(`createRoomType: ${error.message}`);
    return toRoomType(data);
  }

  async updateRoomType(id: string, hostId: string, patch: Partial<NewRoomType>): Promise<RoomTypeChangeResult> {
    const cur = await this.ownedRoomType(id, hostId);
    if (!cur) return { ok: false, error: "NOT_FOUND" };
    if (patch.units !== undefined && patch.units < cur.units) {
      const today = isoDate(todayUTC());
      const { data, error } = await this.client
        .from("bookings")
        .select("room_type_id, check_in, check_out, rooms, status")
        .eq("room_type_id", id)
        .eq("status", "confirmed")
        .gt("check_out", today);
      if (error) throw new Error(`updateRoomType: ${error.message}`);
      const peak = peakBookedFrom(id, today, (data ?? []).map(toInventoryBooking));
      if (patch.units < peak) return { ok: false, error: "UNITS_BELOW_BOOKED", detail: peak };
    }
    const { data, error } = await this.client
      .from("room_types")
      .update({ ...roomTypePatchToRow(patch), updated_at: new Date().toISOString() })
      .eq("id", id)
      .is("archived_at", null)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(`updateRoomType: ${error.message}`);
    return data ? { ok: true, roomType: toRoomType(data) } : { ok: false, error: "NOT_FOUND" };
  }

  async deleteRoomType(id: string, hostId: string): Promise<RoomTypeChangeResult> {
    const cur = await this.ownedRoomType(id, hostId);
    if (!cur) return { ok: false, error: "NOT_FOUND" };
    const { count, error: countErr } = await this.client
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("room_type_id", id)
      .eq("status", "confirmed")
      .gt("check_out", isoDate(todayUTC()));
    if (countErr) throw new Error(`deleteRoomType: ${countErr.message}`);
    if ((count ?? 0) > 0) return { ok: false, error: "HAS_FUTURE_BOOKINGS", detail: count ?? 0 };
    const now = new Date().toISOString();
    const { data, error } = await this.client
      .from("room_types")
      .update({ archived_at: now, updated_at: now })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(`deleteRoomType: ${error.message}`);
    return { ok: true, roomType: toRoomType(data) };
  }

  // ---- Lager ----------------------------------------------------------------

  // Rådata för motorn: aktiva typer, bekräftade bokningar och stängningar som
  // överlappar [from, to).
  private async inventoryInputs(listingIds: string[], from: string, to: string) {
    const roomTypes = await this.listRoomTypesForListings(listingIds);
    if (roomTypes.length === 0) return { roomTypes, bookings: [], blocks: [] };
    const [bookings, blocks] = await Promise.all([
      this.client
        .from("bookings")
        .select("room_type_id, check_in, check_out, rooms, status")
        .in("room_type_id", roomTypes.map((r) => r.id))
        .eq("status", "confirmed")
        .lt("check_in", to)
        .gt("check_out", from),
      this.client
        .from("availability_blocks")
        .select("listing_id, room_type_id, check_in, check_out")
        .in("listing_id", listingIds)
        .lt("check_in", to)
        .gt("check_out", from),
    ]);
    if (bookings.error) throw new Error(`inventory: ${bookings.error.message}`);
    if (blocks.error) throw new Error(`inventory: ${blocks.error.message}`);
    return {
      roomTypes,
      bookings: (bookings.data ?? []).map(toInventoryBooking),
      blocks: (blocks.data ?? []).map(toInventoryBlock),
    };
  }

  async getRoomAvailability(listingId: string, checkIn: string, checkOut: string): Promise<RoomAvailability[]> {
    return (await this.getRoomAvailabilityForListings([listingId], checkIn, checkOut))[listingId] ?? [];
  }

  async getRoomAvailabilityForListings(
    listingIds: string[],
    checkIn: string,
    checkOut: string,
  ): Promise<Record<string, RoomAvailability[]>> {
    const out: Record<string, RoomAvailability[]> = Object.fromEntries(listingIds.map((id) => [id, []]));
    if (listingIds.length === 0) return out;
    const { roomTypes, bookings, blocks } = await this.inventoryInputs(listingIds, checkIn, checkOut);
    for (const roomType of roomTypes) {
      const mine = blocks.filter((b) => b.listingId === roomType.listingId);
      out[roomType.listingId].push({
        roomType,
        ...availableForStay(roomType, checkIn, checkOut, bookings, mine),
      });
    }
    return out;
  }

  async getInventoryCalendar(listingId: string, from: string, days: number): Promise<InventoryRow[]> {
    const to = isoDate(addDays(from, days));
    const { roomTypes, bookings, blocks } = await this.inventoryInputs([listingId], from, to);
    const nights = dateRange(from, days);
    return roomTypes.map((roomType) => ({
      roomType,
      days: inventoryForRoomType(roomType, nights, bookings, blocks),
    }));
  }

  // ---- Stängningar ----------------------------------------------------------

  async listAvailabilityBlocks(listingId: string): Promise<AvailabilityBlock[]> {
    const { data, error } = await this.client
      .from("availability_blocks")
      .select("*")
      .eq("listing_id", listingId)
      .order("check_in", { ascending: true });
    if (error) throw new Error(`listAvailabilityBlocks: ${error.message}`);
    return (data ?? []).map(toBlock);
  }

  async addAvailabilityBlock(
    listingId: string,
    hostId: string,
    block: { checkIn: string; checkOut: string; note?: string; roomTypeId?: string | null },
  ): Promise<AvailabilityBlock | null> {
    // Ägarskap kontrolleras serverside före insert, som i MemoryStore.
    const listing = await this.getListingById(listingId);
    if (!listing || listing.hostId !== hostId) return null;
    const roomTypeId = block.roomTypeId ?? null;
    if (roomTypeId !== null) {
      const rt = await this.getRoomType(roomTypeId);
      if (!rt || rt.listingId !== listingId || rt.archivedAt !== null) return null;
    }
    const { data, error } = await this.client
      .from("availability_blocks")
      .insert({
        id: `blk_${randomUUID().slice(0, 12)}`,
        listing_id: listingId,
        room_type_id: roomTypeId,
        check_in: block.checkIn,
        check_out: block.checkOut,
        note: block.note ?? null,
      })
      .select("*")
      .single();
    if (error) throw new Error(`addAvailabilityBlock: ${error.message}`);
    return data ? toBlock(data) : null;
  }

  async removeAvailabilityBlock(id: string, hostId: string): Promise<boolean> {
    const { data: blk, error: readErr } = await this.client
      .from("availability_blocks")
      .select("id, listing_id")
      .eq("id", id)
      .maybeSingle();
    if (readErr) throw new Error(`removeAvailabilityBlock: ${readErr.message}`);
    if (!blk) return false;
    const listing = await this.getListingById(s(blk.listing_id));
    if (!listing || listing.hostId !== hostId) return false;
    const { error } = await this.client.from("availability_blocks").delete().eq("id", id);
    if (error) throw new Error(`removeAvailabilityBlock: ${error.message}`);
    return true;
  }

  // ---- Bokningar ------------------------------------------------------------

  async createBooking(
    input: NewBooking & { paymentRef: string },
  ): Promise<CreateBookingResult> {
    const { data, error } = await this.client.rpc("create_booking", {
      p_id: `bok_${randomUUID().slice(0, 12)}`,
      p_access_token: randomBytes(24).toString("hex"),
      p_listing_id: input.listingId,
      p_room_type_id: input.roomTypeId,
      p_rooms: input.rooms,
      p_guest_name: input.guestName,
      p_guest_email: input.guestEmail,
      p_check_in: input.checkIn,
      p_check_out: input.checkOut,
      p_guests: input.guests,
      p_nights: input.nights,
      p_subtotal_cents: input.subtotalCents,
      p_cleaning_fee_cents: input.cleaningFeeCents,
      p_service_fee_cents: input.serviceFeeCents,
      p_total_cents: input.totalCents,
      p_currency: input.currency,
      p_payment_ref: input.paymentRef,
    });
    if (error) throw new Error(`createBooking: ${error.message}`);
    const result = data as {
      ok: boolean;
      error?: CreateBookingResult["error"];
      available?: number;
      booking?: Row;
    };
    if (!result.ok) {
      return result.available === undefined
        ? { ok: false, error: result.error }
        : { ok: false, error: result.error, available: n(result.available) };
    }
    return { ok: true, booking: toBooking(result.booking!) };
  }

  async getBookingByToken(token: string): Promise<Booking | null> {
    const { data, error } = await this.client
      .from("bookings")
      .select("*")
      .eq("access_token", token)
      .maybeSingle();
    if (error) throw new Error(`getBookingByToken: ${error.message}`);
    return data ? toBooking(data) : null;
  }

  async listBookingsByHost(
    hostId: string,
  ): Promise<(Booking & { listingTitle: string; roomTypeName: string })[]> {
    const { data, error } = await this.client
      .from("bookings")
      .select("*, listings!inner(title, host_id), room_types(name)")
      .eq("listings.host_id", hostId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(`listBookingsByHost: ${error.message}`);
    return (data ?? []).map((r) => ({
      ...toBooking(r),
      listingTitle: s((r.listings as Row)?.title),
      roomTypeName: s((r.room_types as Row | null)?.name),
    }));
  }

  async cancelBooking(id: string, hostId: string): Promise<boolean> {
    const { data: b, error: readErr } = await this.client
      .from("bookings")
      .select("id, status, listing_id")
      .eq("id", id)
      .maybeSingle();
    if (readErr) throw new Error(`cancelBooking: ${readErr.message}`);
    if (!b) return false;
    const listing = await this.getListingById(s(b.listing_id));
    if (!listing || listing.hostId !== hostId) return false;
    if (s(b.status) === "cancelled") return true;
    const { error } = await this.client
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", id);
    if (error) throw new Error(`cancelBooking: ${error.message}`);
    return true;
  }
}
