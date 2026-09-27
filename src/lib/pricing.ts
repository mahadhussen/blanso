// Deterministisk prismotor. Enda källan till bokningens siffror.
// Språkmodellen räknar aldrig pris; det gör den här funktionen, och den är
// facittestad. Alla belopp i heltal cent.

import { nightsBetween } from "./dates";

// Blansos gästserviceavgift som andel av delsumman.
// 8 % enligt designfacit (design/DESIGNFACIT.md) — produktbeslut 2026-09-01.
export const SERVICE_FEE_RATE = 0.08;

export interface PriceInput {
  nightlyPriceCents: number; // per rum och natt
  cleaningFeeCents: number; // per rum och vistelse
  nights: number;
  rooms?: number; // antal rum av samma rumstyp, standard 1
  serviceFeeRate?: number;
}

export interface PriceBreakdown {
  nights: number;
  rooms: number;
  nightlyPriceCents: number;
  subtotalCents: number;
  cleaningFeeCents: number;
  serviceFeeCents: number;
  totalCents: number;
}

export function computePricing(input: PriceInput): PriceBreakdown {
  const { nightlyPriceCents, nights } = input;
  const rooms = input.rooms ?? 1;
  const serviceFeeRate = input.serviceFeeRate ?? SERVICE_FEE_RATE;

  if (!Number.isInteger(nightlyPriceCents) || nightlyPriceCents < 0) {
    throw new Error("nightlyPriceCents måste vara ett icke-negativt heltal");
  }
  if (!Number.isInteger(input.cleaningFeeCents) || input.cleaningFeeCents < 0) {
    throw new Error("cleaningFeeCents måste vara ett icke-negativt heltal");
  }
  if (!Number.isInteger(nights) || nights < 1) {
    throw new Error("nights måste vara ett heltal >= 1");
  }
  if (!Number.isInteger(rooms) || rooms < 1) {
    throw new Error("rooms måste vara ett heltal >= 1");
  }

  // Varje rum städas: städavgiften gäller per rum (beslut 2026-09-27, WORKLOG).
  const subtotalCents = nightlyPriceCents * nights * rooms;
  const cleaningFeeCents = input.cleaningFeeCents * rooms;
  const serviceFeeCents = Math.round(subtotalCents * serviceFeeRate);
  const totalCents = subtotalCents + cleaningFeeCents + serviceFeeCents;

  return {
    nights,
    rooms,
    nightlyPriceCents,
    subtotalCents,
    cleaningFeeCents,
    serviceFeeCents,
    totalCents,
  };
}

// Bekvämlighet: räkna pris direkt från datum.
export function priceForDates(params: {
  nightlyPriceCents: number;
  cleaningFeeCents: number;
  checkIn: Date | string;
  checkOut: Date | string;
  rooms?: number;
  serviceFeeRate?: number;
}): PriceBreakdown {
  const nights = nightsBetween(params.checkIn, params.checkOut);
  return computePricing({
    nightlyPriceCents: params.nightlyPriceCents,
    cleaningFeeCents: params.cleaningFeeCents,
    nights,
    rooms: params.rooms,
    serviceFeeRate: params.serviceFeeRate,
  });
}
