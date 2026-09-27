// Lagermotorn. EN deterministisk källa till hur många rum som är lediga.
// Modellen är booking.com-extranätets / QloApps: rumstyp × antal fysiska rum
// (units) × natt. En natt är datumet man sover (checkIn <= natt < checkOut),
// så utcheckningsdagen är ledig igen och rygg-i-rygg går.
//
//   bokade(typ, natt)  = summan av `rooms` i bekräftade bokningar av typen som
//                        täcker natten
//   stängd(typ, natt)  = någon värdstängning täcker natten och gäller hela
//                        boendet (roomTypeId null) eller just typen
//   lediga(typ, natt)  = stängd ? 0 : max(0, units − bokade)
//   lediga(typ, vistelse) = MINSTA lediga över vistelsens nätter
//
// Memory-lagret, SupabaseStore (läsvägar) och alla vyer räknar HÄR. Den atomiska
// SQL-funktionen create_booking speglar exakt samma regel och bevisas mot samma
// facitfall (scripts/verify-room-types.sql).

import { addDays, isoDate, nightsBetween } from "./dates";

export interface InventoryRoomType {
  id: string;
  units: number;
}

export interface InventoryBooking {
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  rooms: number;
  status: string;
}

export interface InventoryBlock {
  roomTypeId: string | null;
  checkIn: string;
  checkOut: string;
}

export interface InventoryDay {
  date: string; // YYYY-MM-DD (natten)
  units: number;
  booked: number;
  closed: boolean;
  available: number;
}

// Nätterna i en vistelse: [checkIn, checkOut). Tom lista om checkOut <= checkIn.
export function stayNights(checkIn: string, checkOut: string): string[] {
  const n = nightsBetween(checkIn, checkOut);
  const out: string[] = [];
  for (let i = 0; i < n; i++) out.push(isoDate(addDays(checkIn, i)));
  return out;
}

// `days` konsekutiva datum från och med `from`.
export function dateRange(from: string, days: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < days; i++) out.push(isoDate(addDays(from, i)));
  return out;
}

function covers(range: { checkIn: string; checkOut: string }, night: string): boolean {
  // ISO-datum jämförs korrekt som strängar.
  return range.checkIn <= night && night < range.checkOut;
}

// Lagret för en rumstyp över givna nätter.
export function inventoryForRoomType(
  roomType: InventoryRoomType,
  nights: string[],
  bookings: InventoryBooking[],
  blocks: InventoryBlock[],
): InventoryDay[] {
  const mine = bookings.filter(
    (b) => b.roomTypeId === roomType.id && b.status === "confirmed",
  );
  const closures = blocks.filter((bl) => bl.roomTypeId === null || bl.roomTypeId === roomType.id);
  return nights.map((date) => {
    const booked = mine.reduce((sum, b) => (covers(b, date) ? sum + b.rooms : sum), 0);
    const closed = closures.some((bl) => covers(bl, date));
    const available = closed ? 0 : Math.max(0, roomType.units - booked);
    return { date, units: roomType.units, booked, closed, available };
  });
}

export interface StayAvailability {
  available: number; // minsta lediga över nätterna (0 om någon natt är stängd)
  closed: boolean; // någon natt i vistelsen är stängd
}

// Hur många rum av typen kan bokas för hela vistelsen?
export function availableForStay(
  roomType: InventoryRoomType,
  checkIn: string,
  checkOut: string,
  bookings: InventoryBooking[],
  blocks: InventoryBlock[],
): StayAvailability {
  const nights = stayNights(checkIn, checkOut);
  if (nights.length === 0) return { available: 0, closed: false };
  const days = inventoryForRoomType(roomType, nights, bookings, blocks);
  return {
    available: Math.min(...days.map((d) => d.available)),
    closed: days.some((d) => d.closed),
  };
}

export type RoomRequestError = "INVALID_ROOMS" | "UNAVAILABLE" | "NOT_ENOUGH_ROOMS";

// Regeln som createBooking tillämpar: stängt ⇒ UNAVAILABLE, för få lediga ⇒
// NOT_ENOUGH_ROOMS (med hur många som faktiskt finns kvar).
export function checkRoomRequest(
  roomType: InventoryRoomType,
  checkIn: string,
  checkOut: string,
  rooms: number,
  bookings: InventoryBooking[],
  blocks: InventoryBlock[],
): { ok: true } | { ok: false; error: RoomRequestError; available: number } {
  if (!Number.isInteger(rooms) || rooms < 1) {
    return { ok: false, error: "INVALID_ROOMS", available: 0 };
  }
  const stay = availableForStay(roomType, checkIn, checkOut, bookings, blocks);
  if (stay.closed) return { ok: false, error: "UNAVAILABLE", available: 0 };
  if (stay.available < rooms) {
    return { ok: false, error: "NOT_ENOUGH_ROOMS", available: stay.available };
  }
  return { ok: true };
}

// Högsta antal bokade rum en enskild natt från och med `from` — golvet för hur
// långt värden får sänka units utan att överboka befintliga gäster.
export function peakBookedFrom(
  roomTypeId: string,
  from: string,
  bookings: InventoryBooking[],
): number {
  const future = bookings.filter(
    (b) => b.roomTypeId === roomTypeId && b.status === "confirmed" && b.checkOut > from,
  );
  let peak = 0;
  for (const b of future) {
    for (const night of stayNights(b.checkIn < from ? from : b.checkIn, b.checkOut)) {
      const booked = future.reduce((s, x) => (covers(x, night) ? s + x.rooms : s), 0);
      if (booked > peak) peak = booked;
    }
  }
  return peak;
}
