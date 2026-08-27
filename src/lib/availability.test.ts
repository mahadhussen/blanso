import { describe, it, expect } from "vitest";
import { isAvailable, rangesOverlap } from "./availability";
import { nightsBetween } from "./dates";

const existing = [
  { checkIn: "2026-09-10", checkOut: "2026-09-15", status: "confirmed" },
];

describe("nightsBetween", () => {
  it("räknar hela nätter", () => {
    expect(nightsBetween("2026-09-10", "2026-09-15")).toBe(5);
    expect(nightsBetween("2026-09-10", "2026-09-11")).toBe(1);
  });
});

describe("isAvailable — facit", () => {
  it("krock mitt i en befintlig bokning är inte ledig", () => {
    expect(
      isAvailable({ checkIn: "2026-09-12", checkOut: "2026-09-14" }, existing),
    ).toBe(false);
  });

  it("rygg-i-rygg (checkout = ny checkin) är ledig", () => {
    expect(
      isAvailable({ checkIn: "2026-09-15", checkOut: "2026-09-18" }, existing),
    ).toBe(true);
    expect(
      isAvailable({ checkIn: "2026-09-07", checkOut: "2026-09-10" }, existing),
    ).toBe(true);
  });

  it("delvis överlapp i början eller slutet är inte ledig", () => {
    expect(
      isAvailable({ checkIn: "2026-09-14", checkOut: "2026-09-16" }, existing),
    ).toBe(false);
    expect(
      isAvailable({ checkIn: "2026-09-08", checkOut: "2026-09-11" }, existing),
    ).toBe(false);
  });

  it("avbokade bokningar blockerar inte", () => {
    const cancelled = [
      { checkIn: "2026-09-10", checkOut: "2026-09-15", status: "cancelled" },
    ];
    expect(
      isAvailable({ checkIn: "2026-09-12", checkOut: "2026-09-14" }, cancelled),
    ).toBe(true);
  });

  it("noll nätter är aldrig ledigt", () => {
    expect(
      isAvailable({ checkIn: "2026-09-12", checkOut: "2026-09-12" }, []),
    ).toBe(false);
  });

  it("rangesOverlap är symmetrisk", () => {
    const a = { checkIn: "2026-09-10", checkOut: "2026-09-15" };
    const b = { checkIn: "2026-09-14", checkOut: "2026-09-20" };
    expect(rangesOverlap(a, b)).toBe(rangesOverlap(b, a));
    expect(rangesOverlap(a, b)).toBe(true);
  });
});
