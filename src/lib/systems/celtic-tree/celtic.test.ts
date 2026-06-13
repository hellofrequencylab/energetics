import { describe, expect, it } from "vitest";
import { engine } from "./engine";

const tree = (date: string) =>
  (engine.compute({ id: "t", date, precision: "date" }, { ephemeris: null as never }).factors.tree.value as { tree: string }).tree;

describe("celtic tree", () => {
  it("places mid-June in Oak and Dec 31 in Birch (year wrap)", () => {
    expect(tree("1990-06-15")).toBe("Oak");
    expect(tree("2000-12-31")).toBe("Birch");
    expect(tree("2000-01-10")).toBe("Birch");
  });
});
