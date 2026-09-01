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
});
