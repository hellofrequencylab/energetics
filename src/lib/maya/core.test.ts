import { describe, expect, it } from "vitest";
import { dreamspell, gregorianToJDN, longCount, traditional } from "./core";

// §4 anchor assertions — if these pass, the calendrical core is correct.
describe("Maya calendrical core (anchors)", () => {
  it("creation anchor: 11 Aug 3114 BCE = 0.0.0.0.0, 4 Ajaw 8 Kumk'u, G9", () => {
    const j = gregorianToJDN(-3113, 8, 11);
    expect(longCount(j).toString()).toBe("0.0.0.0.0");
    const t = traditional(j);
    expect([t.tone, t.daySign, t.haab, t.lordOfNight]).toEqual([4, "Ajaw", "8 Kumk'u", 9]);
  });

  it("13.0.0.0.0 = 21 Dec 2012, 4 Ajaw 3 K'ank'in", () => {
    const j = gregorianToJDN(2012, 12, 21);
    expect(longCount(j).toString()).toBe("13.0.0.0.0");
    const t = traditional(j);
    expect([t.tone, t.daySign, t.haab]).toEqual([4, "Ajaw", "3 K'ank'in"]);
  });

  it("traditional worked example: 3 May 2009 = 2 Eb (kin 132)", () => {
    const t = traditional(gregorianToJDN(2009, 5, 3));
    expect([t.tone, t.daySign, t.position]).toEqual([2, "Eb", 132]);
  });

  it("dreamspell signatures", () => {
    expect(dreamspell(1987, 7, 26).signature).toBe("White Galactic Wizard");
    expect(dreamspell(2009, 5, 3).signature).toBe("Yellow Spectral Sun");
    expect(dreamspell(2016, 2, 8).signature).toBe("Blue Crystal Monkey");
  });

  it("dreamspell oracle is a full five-card cross", () => {
    const o = dreamspell(2009, 5, 3).oracle;
    expect(o).toBeDefined();
    expect(typeof o!.guideKin).toBe("number");
    expect(typeof o!.antipodeKin).toBe("number");
  });
});
