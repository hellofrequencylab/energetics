import { describe, expect, it } from "vitest";
import { engine } from "./engine";

const star = (date: string) =>
  engine.compute({ id: "t", date, precision: "date" }, { ephemeris: null as never }).factors["principal-star"]
    .value as { star: number; element: string };

describe("nine star ki (principal star)", () => {
  it("matches known years: 1985→6, 2022→5, 2024→3", () => {
    expect(star("1985-06-15").star).toBe(6);
    expect(star("2022-06-15").star).toBe(5);
    expect(star("2024-06-15").star).toBe(3);
  });
  it("uses the previous year before risshun (~Feb 4)", () => {
    expect(star("2024-01-15").star).toBe(star("2023-06-15").star);
  });
});
