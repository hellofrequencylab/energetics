import { describe, expect, it } from "vitest";
import { getEphemeris } from "@/lib/core/ephemeris";
import { engine } from "./engine";
import type { DecanResult } from "./engine";

const decan = (date: string) =>
  engine.compute({ id: "t", date, precision: "date" }, { ephemeris: getEphemeris() }).factors.decan.value as DecanResult;

describe("egyptian decans", () => {
  it("Sun at ~5° Aries → Aries decan 1, ruled by Mars (Chaldean face)", () => {
    const d = decan("2000-03-25");
    expect(d.sign).toBe("Aries");
    expect(d.decanInSign).toBe(1);
    expect(d.ruler).toBe("Mars");
  });

  it("Sun at ~25° Aries → Aries decan 3, ruled by Venus", () => {
    const d = decan("2000-04-15");
    expect(d.sign).toBe("Aries");
    expect(d.decanInSign).toBe(3);
    expect(d.ruler).toBe("Venus");
  });
});
