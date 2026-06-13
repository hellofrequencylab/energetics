import { describe, expect, it } from "vitest";
import { CORPUS_ENTRIES, searchCorpus } from "./search";

describe("corpus search", () => {
  it("indexes every tier (signs, planets, numbers, day-signs, tones, arcana)", () => {
    const kinds = new Set(CORPUS_ENTRIES.map((e) => e.kind));
    for (const k of ["sign", "planet", "number", "daysign", "tone", "arcana"]) expect(kinds.has(k as never)).toBe(true);
    expect(CORPUS_ENTRIES.length).toBeGreaterThan(80);
  });

  it("finds a sign by label and by deep-dive text", () => {
    const byLabel = searchCorpus("scorpio");
    expect(byLabel[0].key).toBe("Scorpio");
    const byTheme = searchCorpus("transformation");
    expect(byTheme.length).toBeGreaterThan(0);
  });

  it("returns nothing for an empty query", () => {
    expect(searchCorpus("")).toHaveLength(0);
  });
});
