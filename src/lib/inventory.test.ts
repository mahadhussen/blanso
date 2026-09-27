import { describe, expect, it } from "vitest";
import {
  availableForStay,
  checkRoomRequest,
  dateRange,
  inventoryForRoomType,
  peakBookedFrom,
  stayNights,
  type InventoryBlock,
  type InventoryBooking,
} from "./inventory";
import { nightsBetween } from "./dates";

// Facit för lagermotorn. Samma fall körs mot SQL-funktionen create_booking i
// scripts/verify-room-types.sql — motorn och databasen måste säga samma sak.

const deluxe = { id: "rt-deluxe", units: 3 };
const suite = { id: "rt-suite", units: 1 };

const bk = (roomTypeId: string, checkIn: string, checkOut: string, rooms: number, status = "confirmed"): InventoryBooking => ({
  roomTypeId,
  checkIn,
  checkOut,
  rooms,
  status,
});

describe("stayNights / dateRange", () => {
  it("nätterna är [checkIn, checkOut) — utcheckningsdagen ingår inte", () => {
    expect(stayNights("2027-01-10", "2027-01-13")).toEqual(["2027-01-10", "2027-01-11", "2027-01-12"]);
    expect(stayNights("2027-01-10", "2027-01-10")).toEqual([]);
    expect(stayNights("2027-01-10", "2027-01-09")).toEqual([]);
  });
  it("över månadsskifte och skottdag", () => {
    expect(stayNights("2028-02-28", "2028-03-01")).toEqual(["2028-02-28", "2028-02-29"]);
    expect(dateRange("2027-12-30", 3)).toEqual(["2027-12-30", "2027-12-31", "2028-01-01"]);
  });
});

describe("inventoryForRoomType — per natt", () => {
  it("räknar bokade rum per natt, ignorerar avbokade och andra typer", () => {
    const bookings = [
      bk("rt-deluxe", "2027-01-10", "2027-01-12", 2),
      bk("rt-deluxe", "2027-01-11", "2027-01-13", 1),
      bk("rt-deluxe", "2027-01-10", "2027-01-13", 1, "cancelled"),
      bk("rt-suite", "2027-01-10", "2027-01-13", 1),
    ];
    const days = inventoryForRoomType(deluxe, dateRange("2027-01-10", 4), bookings, []);
    expect(days.map((d) => [d.date, d.booked, d.available])).toEqual([
      ["2027-01-10", 2, 1],
      ["2027-01-11", 3, 0],
      ["2027-01-12", 1, 2],
      ["2027-01-13", 0, 3],
    ]);
    expect(days.every((d) => d.units === 3 && !d.closed)).toBe(true);
  });

  it("stängning av hela boendet (null) och av just typen stänger; annan typ gör det inte", () => {
    const blocks: InventoryBlock[] = [
      { roomTypeId: null, checkIn: "2027-02-01", checkOut: "2027-02-02" },
      { roomTypeId: "rt-deluxe", checkIn: "2027-02-03", checkOut: "2027-02-04" },
      { roomTypeId: "rt-suite", checkIn: "2027-02-02", checkOut: "2027-02-03" },
    ];
    const days = inventoryForRoomType(deluxe, dateRange("2027-02-01", 4), [], blocks);
    expect(days.map((d) => [d.closed, d.available])).toEqual([
      [true, 0],
      [false, 3],
      [true, 0],
      [false, 3],
    ]);
  });

  it("överbokning i historiken ger aldrig negativt lediga", () => {
    const days = inventoryForRoomType(suite, ["2027-03-01"], [bk("rt-suite", "2027-03-01", "2027-03-02", 2)], []);
    expect(days[0]).toMatchObject({ booked: 2, available: 0 });
  });
});

describe("availableForStay / checkRoomRequest — bokningsregeln", () => {
  it("lediga för vistelsen = MINSTA lediga över nätterna", () => {
    const bookings = [bk("rt-deluxe", "2027-04-02", "2027-04-03", 2)];
    expect(availableForStay(deluxe, "2027-04-01", "2027-04-05", bookings, [])).toEqual({ available: 1, closed: false });
    expect(availableForStay(deluxe, "2027-04-03", "2027-04-05", bookings, [])).toEqual({ available: 3, closed: false });
  });

  it("rygg-i-rygg: utcheckningsdagen är ledig för nästa gäst", () => {
    const bookings = [bk("rt-suite", "2027-05-01", "2027-05-04", 1)];
    expect(checkRoomRequest(suite, "2027-05-04", "2027-05-06", 1, bookings, [])).toEqual({ ok: true });
    expect(checkRoomRequest(suite, "2027-04-28", "2027-05-01", 1, bookings, [])).toEqual({ ok: true });
    expect(checkRoomRequest(suite, "2027-05-03", "2027-05-05", 1, bookings, [])).toEqual({
      ok: false,
      error: "NOT_ENOUGH_ROOMS",
      available: 0,
    });
  });

  it("sista rummet: 2 av 3 bokade ⇒ 1 går, 2 vägras med 'bara 1 kvar'", () => {
    const bookings = [bk("rt-deluxe", "2027-06-10", "2027-06-13", 2)];
    expect(checkRoomRequest(deluxe, "2027-06-10", "2027-06-13", 1, bookings, [])).toEqual({ ok: true });
    expect(checkRoomRequest(deluxe, "2027-06-10", "2027-06-13", 2, bookings, [])).toEqual({
      ok: false,
      error: "NOT_ENOUGH_ROOMS",
      available: 1,
    });
    const full = [...bookings, bk("rt-deluxe", "2027-06-12", "2027-06-14", 1)];
    expect(checkRoomRequest(deluxe, "2027-06-10", "2027-06-13", 1, full, [])).toMatchObject({
      ok: false,
      error: "NOT_ENOUGH_ROOMS",
      available: 0,
    });
  });

  it("stängd rumstyp eller stängt boende en enda natt ⇒ UNAVAILABLE", () => {
    const typeClosed: InventoryBlock[] = [{ roomTypeId: "rt-deluxe", checkIn: "2027-07-02", checkOut: "2027-07-03" }];
    expect(checkRoomRequest(deluxe, "2027-07-01", "2027-07-04", 1, [], typeClosed)).toMatchObject({ ok: false, error: "UNAVAILABLE" });
    // Stängningen av Deluxe rör inte Suite.
    expect(checkRoomRequest(suite, "2027-07-01", "2027-07-04", 1, [], typeClosed)).toEqual({ ok: true });
    const hotelClosed: InventoryBlock[] = [{ roomTypeId: null, checkIn: "2027-07-03", checkOut: "2027-07-10" }];
    expect(checkRoomRequest(suite, "2027-07-01", "2027-07-04", 1, [], hotelClosed)).toMatchObject({ ok: false, error: "UNAVAILABLE" });
    // Rygg-i-rygg mot en stängning är öppet.
    expect(checkRoomRequest(suite, "2027-07-01", "2027-07-03", 1, [], hotelClosed)).toEqual({ ok: true });
  });

  it("ogiltigt antal rum och noll nätter vägras", () => {
    expect(checkRoomRequest(deluxe, "2027-08-01", "2027-08-02", 0, [], [])).toMatchObject({ ok: false, error: "INVALID_ROOMS" });
    expect(checkRoomRequest(deluxe, "2027-08-01", "2027-08-02", 1.5, [], [])).toMatchObject({ ok: false, error: "INVALID_ROOMS" });
    expect(availableForStay(deluxe, "2027-08-02", "2027-08-02", [], [])).toEqual({ available: 0, closed: false });
  });
});

describe("peakBookedFrom — golvet för att sänka units", () => {
  it("högsta samtidiga bokade rum en natt från ett datum, historik räknas inte", () => {
    const bookings = [
      bk("rt-deluxe", "2027-01-01", "2027-01-05", 3), // historik före golvet
      bk("rt-deluxe", "2027-02-01", "2027-02-04", 1),
      bk("rt-deluxe", "2027-02-02", "2027-02-03", 1),
      bk("rt-deluxe", "2027-02-02", "2027-02-05", 1, "cancelled"),
    ];
    expect(peakBookedFrom("rt-deluxe", "2027-01-20", bookings)).toBe(2);
    expect(peakBookedFrom("rt-deluxe", "2027-01-03", bookings)).toBe(3);
    expect(peakBookedFrom("rt-suite", "2027-01-01", bookings)).toBe(0);
  });
});

// Portade ur den gamla availability.test.ts (en bokningsbar enhet per boende)
// när motorn blev rumstypsbaserad: samma facit, uttryckt som en typ med 1 rum.
describe("ett-rums-fallet — arv från den gamla tillgänglighetsmotorn", () => {
  const one = { id: "rt-one", units: 1 };
  const existing = [bk("rt-one", "2026-09-10", "2026-09-15", 1)];
  const free = (ci: string, co: string, list = existing) => checkRoomRequest(one, ci, co, 1, list, []).ok;

  it("nightsBetween räknar hela nätter", () => {
    expect(nightsBetween("2026-09-10", "2026-09-15")).toBe(5);
    expect(nightsBetween("2026-09-10", "2026-09-11")).toBe(1);
  });
  it("krock mitt i en befintlig bokning är inte ledig", () => {
    expect(free("2026-09-12", "2026-09-14")).toBe(false);
  });
  it("rygg-i-rygg åt båda håll är ledig", () => {
    expect(free("2026-09-15", "2026-09-18")).toBe(true);
    expect(free("2026-09-07", "2026-09-10")).toBe(true);
  });
  it("delvis överlapp i början eller slutet är inte ledig", () => {
    expect(free("2026-09-14", "2026-09-16")).toBe(false);
    expect(free("2026-09-08", "2026-09-11")).toBe(false);
  });
  it("omslutande vistelse är inte ledig", () => {
    expect(free("2026-09-01", "2026-09-30")).toBe(false);
  });
  it("avbokade bokningar blockerar inte", () => {
    expect(free("2026-09-12", "2026-09-14", [bk("rt-one", "2026-09-10", "2026-09-15", 1, "cancelled")])).toBe(true);
  });
  it("noll nätter är aldrig ledigt", () => {
    expect(availableForStay(one, "2026-09-12", "2026-09-12", [], []).available).toBe(0);
  });
});
