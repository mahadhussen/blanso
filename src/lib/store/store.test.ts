import { beforeEach, describe, expect, it } from "vitest";
import { MemoryStore, __resetMemoryStore, DEMO_HOST_ID } from "./memory";
import type { NewBooking, NewRoomType } from "../domain";
import { LISTINGS, ROOM_TYPES, defaultRoomTypeId } from "../listings";

// Facittester för DataStore-KONTRAKTET. Körs mot MemoryStore; samma regler
// bevisas mot SQL-funktionen i scripts/verify-room-types.sql.

const store = new MemoryStore();

// Seedade typer med kända antal: Penthouse Loft = 1 rum, Deluxe Loft = 4 rum.
const NAIROBI = "nairobi-westlands-loft";
const PENTHOUSE = `rt-${NAIROBI}-penthouse`; // units 1, maxGuests 3
const DELUXE = `rt-${NAIROBI}-deluxe`; // units 4, maxGuests 2

function bookingInput(
  listingId: string,
  roomTypeId: string,
  checkIn: string,
  checkOut: string,
  rooms = 1,
): NewBooking & { paymentRef: string } {
  return {
    listingId,
    roomTypeId,
    rooms,
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

const newRoom = (over: Partial<NewRoomType> = {}): NewRoomType => ({
  name: "Deluxe Double Room",
  sizeSqm: 24,
  bedConfig: "1 king bed",
  maxGuests: 2,
  units: 3,
  nightlyPriceCents: 9500,
  images: [],
  sortOrder: 0,
  ...over,
});

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

describe("Seed: rumstyper", () => {
  it("varje demoboende har 2–4 rumstyper, 1–12 rum per typ; billigaste = listpriset", () => {
    for (const l of LISTINGS) {
      const types = ROOM_TYPES.filter((r) => r.listingId === l.id);
      expect(types.length).toBeGreaterThanOrEqual(2);
      expect(types.length).toBeLessThanOrEqual(4);
      expect(types.every((r) => r.units >= 1 && r.units <= 12 && Number.isInteger(r.nightlyPriceCents))).toBe(true);
      expect(Math.min(...types.map((r) => r.nightlyPriceCents))).toBe(l.nightlyPriceCents);
      // Första typen tar migrationens härledda id så seeden ersätter den.
      expect(types[0].id).toBe(defaultRoomTypeId(l.id));
    }
  });
});

describe("DataStore: rumstyper (CRUD + ägarkontroll)", () => {
  it("värden skapar, listar, uppdaterar; främmande värd nekas överallt", async () => {
    const rt = await store.createRoomType(NAIROBI, DEMO_HOST_ID, newRoom({ sortOrder: 9 }));
    expect(rt?.id).toMatch(/^rt_/);
    expect(await store.createRoomType(NAIROBI, "host-annan", newRoom())).toBeNull();
    expect(await store.createRoomType("finns-inte", DEMO_HOST_ID, newRoom())).toBeNull();

    const list = await store.listRoomTypes(NAIROBI);
    expect(list.map((r) => r.sortOrder)).toEqual([0, 1, 2, 9]);
    expect(list.at(-1)?.id).toBe(rt!.id);

    const upd = await store.updateRoomType(rt!.id, DEMO_HOST_ID, { name: "Deluxe King", units: 5 });
    expect(upd.ok && upd.roomType.name).toBe("Deluxe King");
    expect(upd.ok && upd.roomType.listingId).toBe(NAIROBI);

    expect(await store.updateRoomType(rt!.id, "host-annan", { units: 1 })).toEqual({ ok: false, error: "NOT_FOUND" });
    expect(await store.deleteRoomType(rt!.id, "host-annan")).toEqual({ ok: false, error: "NOT_FOUND" });
    expect((await store.getRoomType(rt!.id))?.units).toBe(5);
  });

  it("units kan inte sänkas under det som redan är bokat en framtida natt", async () => {
    await store.createBooking(bookingInput(NAIROBI, DELUXE, "2027-01-10", "2027-01-13", 3));
    const tooLow = await store.updateRoomType(DELUXE, DEMO_HOST_ID, { units: 2 });
    expect(tooLow).toEqual({ ok: false, error: "UNITS_BELOW_BOOKED", detail: 3 });
    const ok = await store.updateRoomType(DELUXE, DEMO_HOST_ID, { units: 3 });
    expect(ok.ok).toBe(true);
  });

  it("borttagning vägras vid framtida bokning; tillåts efter avbokning och arkiverar", async () => {
    const r = await store.createBooking(bookingInput(NAIROBI, PENTHOUSE, "2027-02-01", "2027-02-03"));
    expect(await store.deleteRoomType(PENTHOUSE, DEMO_HOST_ID)).toEqual({
      ok: false,
      error: "HAS_FUTURE_BOOKINGS",
      detail: 1,
    });
    await store.cancelBooking(r.booking!.id, DEMO_HOST_ID);
    const del = await store.deleteRoomType(PENTHOUSE, DEMO_HOST_ID);
    expect(del.ok).toBe(true);
    // Borta ur listan och ur bokningsbart lager, men kvar för historiken.
    expect((await store.listRoomTypes(NAIROBI)).some((x) => x.id === PENTHOUSE)).toBe(false);
    expect((await store.getRoomType(PENTHOUSE))?.archivedAt).not.toBeNull();
    const after = await store.createBooking(bookingInput(NAIROBI, PENTHOUSE, "2027-03-01", "2027-03-02"));
    expect(after).toEqual({ ok: false, error: "ROOM_TYPE_NOT_FOUND" });
    const hist = await store.listBookingsByHost(DEMO_HOST_ID);
    expect(hist.find((b) => b.id === r.booking!.id)?.roomTypeName).toBe("Penthouse Loft");
  });
});

describe("DataStore: bokningar per rumstyp", () => {
  it("skapar bokning med stark token; enda rummet kan inte dubbelbokas", async () => {
    const r1 = await store.createBooking(bookingInput(NAIROBI, PENTHOUSE, "2027-01-10", "2027-01-13"));
    expect(r1.ok).toBe(true);
    expect(r1.booking?.accessToken).toMatch(/^[0-9a-f]{48}$/);
    expect(r1.booking).toMatchObject({ roomTypeId: PENTHOUSE, rooms: 1 });

    const r2 = await store.createBooking(bookingInput(NAIROBI, PENTHOUSE, "2027-01-11", "2027-01-14"));
    expect(r2).toEqual({ ok: false, error: "NOT_ENOUGH_ROOMS", available: 0 });
  });

  it("rygg-i-rygg är tillåtet", async () => {
    await store.createBooking(bookingInput(NAIROBI, PENTHOUSE, "2027-02-01", "2027-02-05"));
    const r = await store.createBooking(bookingInput(NAIROBI, PENTHOUSE, "2027-02-05", "2027-02-08"));
    expect(r.ok).toBe(true);
  });

  it("sista rummet: 3 Deluxe bokade av 4 ⇒ 1 går, 2 vägras med exakt antal kvar", async () => {
    expect((await store.createBooking(bookingInput(NAIROBI, DELUXE, "2027-03-01", "2027-03-04", 3))).ok).toBe(true);
    const two = await store.createBooking(bookingInput(NAIROBI, DELUXE, "2027-03-02", "2027-03-05", 2));
    expect(two).toEqual({ ok: false, error: "NOT_ENOUGH_ROOMS", available: 1 });
    const last = await store.createBooking(bookingInput(NAIROBI, DELUXE, "2027-03-02", "2027-03-05", 1));
    expect(last.ok).toBe(true);
    const none = await store.createBooking(bookingInput(NAIROBI, DELUXE, "2027-03-03", "2027-03-04", 1));
    expect(none).toEqual({ ok: false, error: "NOT_ENOUGH_ROOMS", available: 0 });
    // Andra rumstyper på samma boende påverkas inte.
    expect((await store.createBooking(bookingInput(NAIROBI, PENTHOUSE, "2027-03-01", "2027-03-04"))).ok).toBe(true);
  });

  it("rumstyp från annat boende, okänd typ och ogiltigt antal rum vägras", async () => {
    const foreign = defaultRoomTypeId("zanzibar-stonetown-villa");
    expect(await store.createBooking(bookingInput(NAIROBI, foreign, "2027-04-01", "2027-04-02"))).toEqual({
      ok: false,
      error: "ROOM_TYPE_NOT_FOUND",
    });
    expect(await store.createBooking(bookingInput(NAIROBI, "rt_nope", "2027-04-01", "2027-04-02"))).toMatchObject({
      error: "ROOM_TYPE_NOT_FOUND",
    });
    expect(await store.createBooking(bookingInput(NAIROBI, DELUXE, "2027-04-01", "2027-04-02", 0))).toMatchObject({
      error: "INVALID_ROOMS",
    });
  });

  it("avbokning frigör rummen och kräver rätt värd", async () => {
    const r1 = await store.createBooking(bookingInput(NAIROBI, PENTHOUSE, "2027-03-10", "2027-03-13"));
    const id = r1.booking!.id;
    expect(await store.cancelBooking(id, "host-annan")).toBe(false);
    expect(await store.cancelBooking(id, DEMO_HOST_ID)).toBe(true);
    const r2 = await store.createBooking(bookingInput(NAIROBI, PENTHOUSE, "2027-03-10", "2027-03-13"));
    expect(r2.ok).toBe(true);
  });

  it("gäster > rumstypens maxGuests × rooms avvisas av kontraktet självt", async () => {
    // Deluxe Loft: 2 gäster per rum.
    const three = { ...bookingInput(NAIROBI, DELUXE, "2027-08-01", "2027-08-04", 1), guests: 3 };
    expect(await store.createBooking(three)).toEqual({ ok: false, error: "TOO_MANY_GUESTS" });
    const fourInTwo = { ...bookingInput(NAIROBI, DELUXE, "2027-08-01", "2027-08-04", 2), guests: 4 };
    expect((await store.createBooking(fourInTwo)).ok).toBe(true);
  });

  it("opublicerad listning kan inte bokas", async () => {
    await store.setListingStatus(NAIROBI, DEMO_HOST_ID, "unlisted");
    const r = await store.createBooking(bookingInput(NAIROBI, DELUXE, "2027-04-01", "2027-04-04"));
    expect(r).toEqual({ ok: false, error: "LISTING_NOT_PUBLISHED" });
  });

  it("bokning hittas via token, aldrig via id", async () => {
    const r = await store.createBooking(bookingInput(NAIROBI, DELUXE, "2027-05-01", "2027-05-04"));
    const b = r.booking!;
    expect(await store.getBookingByToken(b.accessToken)).toMatchObject({ id: b.id });
    expect(await store.getBookingByToken(b.id)).toBeNull();
  });
});

describe("DataStore: lager och värdens stängningar", () => {
  it("getRoomAvailability och kalendern räknar samma sak som motorn", async () => {
    await store.createBooking(bookingInput(NAIROBI, DELUXE, "2027-06-10", "2027-06-12", 3));
    const avail = await store.getRoomAvailability(NAIROBI, "2027-06-09", "2027-06-12");
    const byId = Object.fromEntries(avail.map((a) => [a.roomType.id, a.available]));
    expect(byId).toEqual({ [defaultRoomTypeId(NAIROBI)]: 6, [DELUXE]: 1, [PENTHOUSE]: 1 });

    const cal = await store.getInventoryCalendar(NAIROBI, "2027-06-09", 4);
    const deluxeRow = cal.find((r) => r.roomType.id === DELUXE)!;
    expect(deluxeRow.days.map((d) => [d.date, d.units, d.booked, d.available])).toEqual([
      ["2027-06-09", 4, 0, 4],
      ["2027-06-10", 4, 3, 1],
      ["2027-06-11", 4, 3, 1],
      ["2027-06-12", 4, 0, 4],
    ]);
  });

  it("stängd rumstyp stoppar bara den typen; borttagen stängning öppnar igen", async () => {
    const block = await store.addAvailabilityBlock(NAIROBI, DEMO_HOST_ID, {
      checkIn: "2027-06-10",
      checkOut: "2027-06-15",
      note: "renovering",
      roomTypeId: DELUXE,
    });
    expect(block?.roomTypeId).toBe(DELUXE);
    expect(await store.createBooking(bookingInput(NAIROBI, DELUXE, "2027-06-12", "2027-06-14"))).toMatchObject({
      ok: false,
      error: "UNAVAILABLE",
    });
    expect((await store.createBooking(bookingInput(NAIROBI, PENTHOUSE, "2027-06-12", "2027-06-14"))).ok).toBe(true);
    const cal = await store.getInventoryCalendar(NAIROBI, "2027-06-14", 2);
    expect(cal.find((r) => r.roomType.id === DELUXE)!.days.map((d) => d.closed)).toEqual([true, false]);

    expect(await store.removeAvailabilityBlock(block!.id, DEMO_HOST_ID)).toBe(true);
    expect((await store.createBooking(bookingInput(NAIROBI, DELUXE, "2027-06-12", "2027-06-14"))).ok).toBe(true);
  });

  it("stängt boende (utan rumstyp) stoppar alla typer", async () => {
    await store.addAvailabilityBlock(NAIROBI, DEMO_HOST_ID, { checkIn: "2027-07-01", checkOut: "2027-07-03" });
    for (const rt of [DELUXE, PENTHOUSE]) {
      expect(await store.createBooking(bookingInput(NAIROBI, rt, "2027-07-02", "2027-07-04"))).toMatchObject({
        error: "UNAVAILABLE",
      });
    }
    const avail = await store.getRoomAvailability(NAIROBI, "2027-07-02", "2027-07-04");
    expect(avail.every((a) => a.closed && a.available === 0)).toBe(true);
  });

  it("fel värd kan inte stänga; rumstyp från annat boende kan inte stängas här", async () => {
    expect(await store.addAvailabilityBlock(NAIROBI, "host-annan", { checkIn: "2027-07-01", checkOut: "2027-07-05" })).toBeNull();
    expect(
      await store.addAvailabilityBlock(NAIROBI, DEMO_HOST_ID, {
        checkIn: "2027-07-01",
        checkOut: "2027-07-05",
        roomTypeId: defaultRoomTypeId("zanzibar-stonetown-villa"),
      }),
    ).toBeNull();
  });
});
