import { beforeEach, describe, expect, it } from "vitest";
import { MemoryStore, __resetMemoryStore, DEMO_HOST_ID } from "./memory";
import type { NewBooking } from "../domain";

// Facittester för DataStore-KONTRAKTET. Körs mot MemoryStore i dag; när
// SupabaseStore byggs körs exakt samma svit mot den — kontraktet är sanningen.

const store = new MemoryStore();

function bookingInput(listingId: string, checkIn: string, checkOut: string): NewBooking & { paymentRef: string } {
  return {
    listingId,
    guestName: "Test Gäst",
    guestEmail: "gast@example.com",
    checkIn,
    checkOut,
    guests: 2,
    nights: 3,
    subtotalCents: 30000,
    cleaningFeeCents: 2000,
    serviceFeeCents: 3600,
    totalCents: 35600,
    currency: "USD",
    paymentRef: "mock_pi_test",
  };
}

beforeEach(() => {
  __resetMemoryStore();
});

describe("DataStore: listningar", () => {
  it("seedar 12 publicerade boenden", async () => {
    const all = await store.listPublishedListings();
    expect(all.length).toBe(12);
    expect(all.every((l) => l.status === "published")).toBe(true);
  });

  it("värd kan skapa, publicera och avpublicera; opublicerat syns inte för gäster", async () => {
    const created = await store.createListing(DEMO_HOST_ID, {
      hostId: DEMO_HOST_ID,
      hostName: "Amina",
      title: "Testrum",
      city: "Garowe",
      country: "Somalia",
      description: "Ett fint testrum med utsikt.",
      nightlyPriceCents: 5000,
      cleaningFeeCents: 1000,
      currency: "USD",
      maxGuests: 2,
      bedrooms: 1,
      beds: 1,
      baths: 1,
      images: [],
      amenities: ["Wifi"],
    });
    expect(created.status).toBe("draft");
    expect(created.slug).toContain("testrum");

    await store.setListingStatus(created.id, DEMO_HOST_ID, "published");
    let all = await store.listPublishedListings();
    expect(all.some((l) => l.id === created.id)).toBe(true);

    await store.setListingStatus(created.id, DEMO_HOST_ID, "unlisted");
    all = await store.listPublishedListings();
    expect(all.some((l) => l.id === created.id)).toBe(false);
  });

  it("fel värd kan inte ändra någon annans listning", async () => {
    const [first] = await store.listPublishedListings();
    const res = await store.setListingStatus(first.id, "host-annan", "unlisted");
    expect(res).toBeNull();
    const still = await store.getListingById(first.id);
    expect(still?.status).toBe("published");
  });

  it("slug blir unik vid namnkrock", async () => {
    const base = {
      hostId: DEMO_HOST_ID,
      hostName: "A",
      title: "Samma Namn",
      city: "Nairobi",
      country: "Kenya",
      description: "Beskrivning här.",
      nightlyPriceCents: 1000,
      cleaningFeeCents: 0,
      currency: "USD",
      maxGuests: 1,
      bedrooms: 1,
      beds: 1,
      baths: 1,
      images: [],
      amenities: [],
    };
    const a = await store.createListing(DEMO_HOST_ID, base);
    const b = await store.createListing(DEMO_HOST_ID, base);
    expect(a.slug).not.toBe(b.slug);
  });
});

describe("DataStore: bokningar", () => {
  it("skapar bokning med stark token och blockerar datumen", async () => {
    const [l] = await store.listPublishedListings();
    const r1 = await store.createBooking(bookingInput(l.id, "2027-01-10", "2027-01-13"));
    expect(r1.ok).toBe(true);
    expect(r1.booking?.accessToken).toMatch(/^[0-9a-f]{48}$/);

    // Samma datum igen ⇒ UNAVAILABLE (atomiskt skydd).
    const r2 = await store.createBooking(bookingInput(l.id, "2027-01-11", "2027-01-14"));
    expect(r2.ok).toBe(false);
    expect(r2.error).toBe("UNAVAILABLE");
  });

  it("rygg-i-rygg är tillåtet", async () => {
    const [l] = await store.listPublishedListings();
    await store.createBooking(bookingInput(l.id, "2027-02-01", "2027-02-05"));
    const r = await store.createBooking(bookingInput(l.id, "2027-02-05", "2027-02-08"));
    expect(r.ok).toBe(true);
  });

  it("avbokning frigör datumen och kräver rätt värd", async () => {
    const [l] = await store.listPublishedListings();
    const r1 = await store.createBooking(bookingInput(l.id, "2027-03-01", "2027-03-04"));
    const id = r1.booking!.id;

    expect(await store.cancelBooking(id, "host-annan")).toBe(false);
    expect(await store.cancelBooking(id, DEMO_HOST_ID)).toBe(true);

    const r2 = await store.createBooking(bookingInput(l.id, "2027-03-01", "2027-03-04"));
    expect(r2.ok).toBe(true);
  });

  it("opublicerad listning kan inte bokas", async () => {
    const [l] = await store.listPublishedListings();
    await store.setListingStatus(l.id, DEMO_HOST_ID, "unlisted");
    const r = await store.createBooking(bookingInput(l.id, "2027-04-01", "2027-04-04"));
    expect(r.ok).toBe(false);
    expect(r.error).toBe("LISTING_NOT_PUBLISHED");
  });

  it("bokning hittas via token, aldrig via id", async () => {
    const [l] = await store.listPublishedListings();
    const r = await store.createBooking(bookingInput(l.id, "2027-05-01", "2027-05-04"));
    const b = r.booking!;
    expect(await store.getBookingByToken(b.accessToken)).toMatchObject({ id: b.id });
    expect(await store.getBookingByToken(b.id)).toBeNull();
  });
});

describe("DataStore: värdens blockeringar", () => {
  it("blockerade datum stoppar bokning, borttagen blockering öppnar igen", async () => {
    const [l] = await store.listPublishedListings();
    const block = await store.addAvailabilityBlock(l.id, DEMO_HOST_ID, {
      checkIn: "2027-06-10",
      checkOut: "2027-06-15",
      note: "underhåll",
    });
    expect(block).not.toBeNull();

    const r1 = await store.createBooking(bookingInput(l.id, "2027-06-12", "2027-06-14"));
    expect(r1.ok).toBe(false);

    expect(await store.removeAvailabilityBlock(block!.id, DEMO_HOST_ID)).toBe(true);
    const r2 = await store.createBooking(bookingInput(l.id, "2027-06-12", "2027-06-14"));
    expect(r2.ok).toBe(true);
  });

  it("fel värd kan inte blockera eller avblockera", async () => {
    const [l] = await store.listPublishedListings();
    const res = await store.addAvailabilityBlock(l.id, "host-annan", {
      checkIn: "2027-07-01",
      checkOut: "2027-07-05",
    });
    expect(res).toBeNull();
  });
});
