import { describe, expect, it } from "vitest";
import { engine } from "./engine";

const rune = (date: string) =>
  (engine.compute({ id: "t", date, precision: "date" }, { ephemeris: null as never }).factors.rune.value as { rune: string }).rune;

describe("norse birth runes", () => {
  it("places dates in the right half-month, including the year wrap", () => {
    expect(rune("1990-06-15")).toBe("Othala"); // Jun 15–28
    expect(rune("2000-01-05")).toBe("Eihwaz"); // Dec 29–Jan 13 (wrap)
    expect(rune("2000-07-01")).toBe("Fehu"); // Jun 29–Jul 14
  });
});
