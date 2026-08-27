// Deterministisk prismotor. Enda källan till bokningens siffror.
// Språkmodellen räknar aldrig pris; det gör den här funktionen, och den är
// facittestad. Alla belopp i heltal cent.

import { nightsBetween } from "./dates";

// Blansos gästserviceavgift som andel av delsumman.
export const SERVICE_FEE_RATE = 0.12;

export interface PriceInput {
  nightlyPriceCents: number;
  cleaningFeeCents: number;
  nights: number;
  serviceFeeRate?: number;
}

export interface PriceBreakdown {
  nights: number;
  nightlyPriceCents: number;
  subtotalCents: number;
  cleaningFeeCents: number;
  serviceFeeCents: number;
  totalCents: number;
}

export function computePricing(input: PriceInput): PriceBreakdown {
  const { nightlyPriceCents, cleaningFeeCents, nights } = input;
  const serviceFeeRate = input.serviceFeeRate ?? SERVICE_FEE_RATE;

  if (!Number.isInteger(nightlyPriceCents) || nightlyPriceCents < 0) {
    throw new Error("nightlyPriceCents måste vara ett icke-negativt heltal");
  }
  if (!Number.isInteger(cleaningFeeCents) || cleaningFeeCents < 0) {
    throw new Error("cleaningFeeCents måste vara ett icke-negativt heltal");
  }
  if (!Number.isInteger(nights) || nights < 1) {
    throw new Error("nights måste vara ett heltal >= 1");
  }

  const subtotalCents = nightlyPriceCents * nights;
  const serviceFeeCents = Math.round(subtotalCents * serviceFeeRate);
  const totalCents = subtotalCents + cleaningFeeCents + serviceFeeCents;

  return {
    nights,
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
  serviceFeeRate?: number;
}): PriceBreakdown {
  const nights = nightsBetween(params.checkIn, params.checkOut);
  return computePricing({
    nightlyPriceCents: params.nightlyPriceCents,
    cleaningFeeCents: params.cleaningFeeCents,
    nights,
    serviceFeeRate: params.serviceFeeRate,
  });
}
