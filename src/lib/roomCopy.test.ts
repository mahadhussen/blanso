import { describe, expect, it } from "vitest";
import { roomsLeftMessage, scarcityLabel } from "./roomCopy";

describe("roomCopy — facit", () => {
  it("antal kvar, samma form för 1 och flera", () => {
    expect(roomsLeftMessage(1, 2, "Deluxe Double Room")).toBe(
      "Only 1 left of the Deluxe Double Room for those dates — you asked for 2.",
    );
    expect(roomsLeftMessage(2, 3, "Suite")).toBe("Only 2 left of the Suite for those dates — you asked for 3.");
    expect(roomsLeftMessage(0, 1, "Suite")).toBe("The Suite is sold out for those dates.");
  });
  it("knapphet bara vid få kvar, slutsåld vid 0, inget utan datum", () => {
    expect(scarcityLabel(null)).toBeNull();
    expect(scarcityLabel(0)).toBe("Sold out");
    expect(scarcityLabel(1)).toBe("Only 1 left");
    expect(scarcityLabel(3)).toBe("Only 3 left");
    expect(scarcityLabel(4)).toBeNull();
  });
});
