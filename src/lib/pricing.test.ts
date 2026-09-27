import { describe, it, expect } from "vitest";
import { computePricing, priceForDates, SERVICE_FEE_RATE } from "./pricing";
import { formatMoney } from "./money";

describe("computePricing — facit", () => {
  it("räknar delsumma, serviceavgift och total korrekt", () => {
    const b = computePricing({
      nightlyPriceCents: 12000, // $120/natt
      cleaningFeeCents: 3000, // $30
      nights: 5,
    });
    expect(b.subtotalCents).toBe(60000);
    expect(b.serviceFeeCents).toBe(4800); // round(60000 * 0.08)
    expect(b.totalCents).toBe(67800);
    expect(formatMoney(b.totalCents)).toBe("$678.00");
  });

  it("avrundar serviceavgiften till närmaste cent", () => {
    const b = computePricing({
      nightlyPriceCents: 999,
      cleaningFeeCents: 0,
      nights: 1,
    });
    // 999 * 0.08 = 79.92 -> 80
    expect(b.serviceFeeCents).toBe(80);
    expect(b.totalCents).toBe(1079);
  });

  it("använder standardavgiften 8 %", () => {
    expect(SERVICE_FEE_RATE).toBe(0.08);
  });

  it("räknar pris från datum (5 nätter)", () => {
    const b = priceForDates({
      nightlyPriceCents: 12000,
      cleaningFeeCents: 3000,
      checkIn: "2026-09-10",
      checkOut: "2026-09-15",
    });
    expect(b.nights).toBe(5);
    expect(b.totalCents).toBe(67800);
  });

  it("vägrar noll nätter och negativa belopp", () => {
    expect(() =>
      computePricing({ nightlyPriceCents: 12000, cleaningFeeCents: 0, nights: 0 }),
    ).toThrow();
    expect(() =>
      computePricing({ nightlyPriceCents: -1, cleaningFeeCents: 0, nights: 1 }),
    ).toThrow();
  });

  it("flera rum av samma typ: delsumma, städ och avgift skalar per rum (facit)", () => {
    // 2 × Deluxe à $95, 3 nätter, städ $20 per rum.
    const b = computePricing({ nightlyPriceCents: 9500, cleaningFeeCents: 2000, nights: 3, rooms: 2 });
    expect(b.rooms).toBe(2);
    expect(b.subtotalCents).toBe(57000); // 9500 × 3 × 2
    expect(b.cleaningFeeCents).toBe(4000); // 2000 × 2
    expect(b.serviceFeeCents).toBe(4560); // round(57000 × 0.08)
    expect(b.totalCents).toBe(65560);
    expect(formatMoney(b.totalCents)).toBe("$655.60");
  });

  it("rooms = 1 är standard och ger samma pris som före rumstyper", () => {
    const a = computePricing({ nightlyPriceCents: 8500, cleaningFeeCents: 2000, nights: 4 });
    const b = computePricing({ nightlyPriceCents: 8500, cleaningFeeCents: 2000, nights: 4, rooms: 1 });
    expect(a).toEqual(b);
    expect(a.totalCents).toBe(34000 + 2000 + 2720);
  });

  it("vägrar noll, negativa och brutna antal rum", () => {
    for (const rooms of [0, -1, 1.5]) {
      expect(() =>
        computePricing({ nightlyPriceCents: 9500, cleaningFeeCents: 0, nights: 1, rooms }),
      ).toThrow();
    }
  });

  it("priceForDates tar rooms", () => {
    const b = priceForDates({
      nightlyPriceCents: 14000,
      cleaningFeeCents: 0,
      checkIn: "2026-10-01",
      checkOut: "2026-10-03",
      rooms: 3,
    });
    expect(b.subtotalCents).toBe(84000);
    expect(b.totalCents).toBe(84000 + 6720);
  });
});
