import { describe, it, expect } from "vitest";
import { validateStay, isPastDate, addDays, isoDate } from "./dates";

describe("validateStay — tidsgiltighet", () => {
  it("dåtid i incheckning underkänns", () => {
    const r = validateStay("2020-01-01", "2020-01-05");
    expect(r.ok).toBe(false);
  });

  it("noll nätter underkänns", () => {
    const r = validateStay("2999-01-01", "2999-01-01");
    expect(r.ok).toBe(false);
  });

  it("saknade datum underkänns", () => {
    expect(validateStay(undefined, "2999-01-05").ok).toBe(false);
    expect(validateStay("2999-01-01", undefined).ok).toBe(false);
  });

  it("framtida vistelse med minst en natt godkänns", () => {
    const inDate = isoDate(addDays(new Date(), 3));
    const outDate = isoDate(addDays(new Date(), 6));
    expect(validateStay(inDate, outDate).ok).toBe(true);
  });

  it("dagens datum är inte dåtid", () => {
    expect(isPastDate(new Date())).toBe(false);
    expect(isPastDate("2020-01-01")).toBe(true);
  });
});
