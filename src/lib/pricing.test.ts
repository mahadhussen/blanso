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
    expect(b.serviceFeeCents).toBe(7200); // round(60000 * 0.12)
    expect(b.totalCents).toBe(70200);
    expect(formatMoney(b.totalCents)).toBe("$702.00");
  });

  it("avrundar serviceavgiften till närmaste cent", () => {
    const b = computePricing({
      nightlyPriceCents: 999,
      cleaningFeeCents: 0,
      nights: 1,
    });
    // 999 * 0.12 = 119.88 -> 120
    expect(b.serviceFeeCents).toBe(120);
    expect(b.totalCents).toBe(1119);
  });

  it("använder standardavgiften 12 %", () => {
    expect(SERVICE_FEE_RATE).toBe(0.12);
  });

  it("räknar pris från datum (5 nätter)", () => {
    const b = priceForDates({
      nightlyPriceCents: 12000,
      cleaningFeeCents: 3000,
      checkIn: "2026-09-10",
      checkOut: "2026-09-15",
    });
    expect(b.nights).toBe(5);
    expect(b.totalCents).toBe(70200);
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
