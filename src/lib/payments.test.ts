import { describe, it, expect } from "vitest";
import { decideSandboxOutcome, isValidCardNumber, SANDBOX_CARDS } from "./payments";

const goodCard = {
  number: SANDBOX_CARDS.SUCCESS_CARD,
  expMonth: 12,
  expYear: 2030,
  cvc: "123",
  name: "Test Gäst",
};

describe("betal-sandbox — facit", () => {
  it("4242-kortet lyckas", () => {
    expect(decideSandboxOutcome(goodCard)).toBe("succeeded");
  });

  it("nekat-kortet misslyckas", () => {
    expect(
      decideSandboxOutcome({ ...goodCard, number: SANDBOX_CARDS.DECLINE_CARD }),
    ).toBe("failed");
  });

  it("utgånget kort misslyckas", () => {
    expect(
      decideSandboxOutcome({ ...goodCard, expMonth: 1, expYear: 2020 }),
    ).toBe("failed");
  });

  it("ogiltigt kortnummer misslyckas", () => {
    expect(decideSandboxOutcome({ ...goodCard, number: "123" })).toBe("failed");
    expect(isValidCardNumber("4242 4242 4242 4242")).toBe(true);
    expect(isValidCardNumber("abcd")).toBe(false);
  });

  it("för kort cvc misslyckas", () => {
    expect(decideSandboxOutcome({ ...goodCard, cvc: "1" })).toBe("failed");
  });
});
