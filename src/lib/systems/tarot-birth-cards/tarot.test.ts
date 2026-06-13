import { describe, expect, it } from "vitest";
import { engine } from "./engine";

const cards = (date: string) => {
  const res = engine.compute({ id: "t", date, precision: "date" }, { ephemeris: null as never });
  return {
    personality: res.factors.personality.value as { card: string; number: number },
    soul: res.factors.soul.value as { card: string; number: number },
  };
};

describe("tarot birth cards", () => {
  it("1879-03-14 (digit sum 33 → 6) = The Lovers", () => {
    const { personality, soul } = cards("1879-03-14");
    expect(personality.number).toBe(6);
    expect(personality.card).toBe("The Lovers");
    expect(soul.number).toBe(6);
  });

  it("1990-06-15 (digit sum 31 → 4) = The Emperor", () => {
    const { personality, soul } = cards("1990-06-15");
    expect(personality.card).toBe("The Emperor");
    expect(soul.card).toBe("The Emperor");
  });
});
