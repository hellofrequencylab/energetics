import { describe, expect, it } from "vitest";
import { engine } from "./engine";

const sign = (date: string) =>
  engine.compute({ id: "t", date, precision: "date" }, { ephemeris: null as never }).factors.sign.value as {
    day: string;
    planet: string;
    animal: string;
  };

describe("mahabote weekday sign", () => {
  it("1990-06-15 (Friday) → Venus / Guinea Pig", () => {
    const s = sign("1990-06-15");
    expect(s.day).toBe("Friday");
    expect(s.planet).toBe("Venus");
    expect(s.animal).toBe("Guinea Pig");
  });
  it("2000-01-01 (Saturday) → Saturn / Naga", () => {
    const s = sign("2000-01-01");
    expect(s.planet).toBe("Saturn");
    expect(s.animal).toBe("Naga");
  });
});
