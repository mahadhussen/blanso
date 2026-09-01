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
} from "../domain";
import type { CreateBookingResult, DataStore } from "./types";

// SupabaseStore — DataStore-kontraktet mot Balaanso (Postgres). Detta är den
// utlovade "EN filen": resten av appen är oförändrad. Körs ENBART på servern
// med service role; RLS i databasen nekar alla andra vägar in. Atomiciteten i
// createBooking bor i databasens create_booking-funktion (radlås + koll +
// insert i ett steg), inte i JS.

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

function toBooking(r: Row): Booking {
  return {
    id: s(r.id),
    accessToken: s(r.access_token),
    listingId: s(r.listing_id),
    guestName: s(r.guest_name),
    guestEmail: s(r.guest_email),
    checkIn: s(r.check_in).slice(0, 10),
    checkOut: s(r.check_out).slice(0, 10),
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

  async getBlockedRanges(
    listingId: string,
  ): Promise<{ checkIn: string; checkOut: string; source: "booking" | "block" }[]> {
    const [bookings, blocks] = await Promise.all([
      this.client
        .from("bookings")
        .select("check_in, check_out")
        .eq("listing_id", listingId)
        .eq("status", "confirmed"),
      this.client
        .from("availability_blocks")
        .select("check_in, check_out")
        .eq("listing_id", listingId),
    ]);
    if (bookings.error) throw new Error(`getBlockedRanges: ${bookings.error.message}`);
    if (blocks.error) throw new Error(`getBlockedRanges: ${blocks.error.message}`);
    return [
      ...(bookings.data ?? []).map((r) => ({
        checkIn: s(r.check_in).slice(0, 10),
        checkOut: s(r.check_out).slice(0, 10),
        source: "booking" as const,
      })),
      ...(blocks.data ?? []).map((r) => ({
        checkIn: s(r.check_in).slice(0, 10),
        checkOut: s(r.check_out).slice(0, 10),
        source: "block" as const,
      })),
    ];
  }

  async addAvailabilityBlock(
    listingId: string,
    hostId: string,
    block: { checkIn: string; checkOut: string; note?: string },
  ): Promise<AvailabilityBlock | null> {
    // Ägarskap kontrolleras serverside före insert, som i MemoryStore.
    const listing = await this.getListingById(listingId);
    if (!listing || listing.hostId !== hostId) return null;
    const { data, error } = await this.client
      .from("availability_blocks")
      .insert({
        id: `blk_${randomUUID().slice(0, 12)}`,
        listing_id: listingId,
        check_in: block.checkIn,
        check_out: block.checkOut,
        note: block.note ?? null,
      })
      .select("*")
      .single();
    if (error) throw new Error(`addAvailabilityBlock: ${error.message}`);
    if (!data) return null;
    return {
      id: s(data.id),
      listingId: s(data.listing_id),
      checkIn: s(data.check_in).slice(0, 10),
      checkOut: s(data.check_out).slice(0, 10),
      note: data.note ? s(data.note) : undefined,
      createdAt: iso(data.created_at),
    };
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

  async createBooking(
    input: NewBooking & { paymentRef: string },
  ): Promise<CreateBookingResult> {
    const { data, error } = await this.client.rpc("create_booking", {
      p_id: `bok_${randomUUID().slice(0, 12)}`,
      p_access_token: randomBytes(24).toString("hex"),
      p_listing_id: input.listingId,
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
    const result = data as { ok: boolean; error?: CreateBookingResult["error"]; booking?: Row };
    if (!result.ok) return { ok: false, error: result.error };
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
  ): Promise<(Booking & { listingTitle: string })[]> {
    const { data, error } = await this.client
      .from("bookings")
      .select("*, listings!inner(title, host_id)")
      .eq("listings.host_id", hostId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(`listBookingsByHost: ${error.message}`);
    return (data ?? []).map((r) => ({
      ...toBooking(r),
      listingTitle: s((r.listings as Row)?.title),
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
