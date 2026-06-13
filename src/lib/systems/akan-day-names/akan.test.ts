import { describe, expect, it } from "vitest";
import { engine } from "./engine";

const name = (date: string) =>
  engine.compute({ id: "t", date, precision: "date" }, { ephemeris: null as never }).factors["day-name"].value as {
    day: string;
    male: string;
    female: string;
  };

describe("akan day names", () => {
  it("2000-01-01 (a Saturday) → Kwame / Ama", () => {
    const n = name("2000-01-01");
    expect(n.day).toBe("Saturday");
    expect(n.male).toBe("Kwame");
    expect(n.female).toBe("Ama");
  });

  it("1990-06-15 (a Friday) → Kofi / Afua", () => {
    const n = name("1990-06-15");
    expect(n.day).toBe("Friday");
    expect(n.male).toBe("Kofi");
  });
});
