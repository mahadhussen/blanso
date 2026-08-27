import { describe, it, expect } from "vitest";
import { formatMoney, formatPriceShort } from "./money";

describe("formatMoney", () => {
  it("formaterar cent som valuta", () => {
    expect(formatMoney(70200)).toBe("$702.00");
    expect(formatMoney(7999)).toBe("$79.99");
  });
  it("vägrar icke-heltal", () => {
    expect(() => formatMoney(70.5)).toThrow();
  });
});

describe("formatPriceShort — får aldrig avvika från checkout", () => {
  it("döljer decimaler bara när beloppet är jämnt", () => {
    expect(formatPriceShort(8500)).toBe("$85");
    expect(formatPriceShort(12000)).toBe("$120");
  });
  it("visar decimaler för ojämna belopp (samma som formatMoney)", () => {
    expect(formatPriceShort(7999)).toBe("$79.99");
    expect(formatPriceShort(7999)).toBe(formatMoney(7999));
  });
});
