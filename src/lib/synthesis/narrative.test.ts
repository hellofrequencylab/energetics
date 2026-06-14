import { describe, expect, it } from "vitest";
import { intake } from "@/lib/core/birth-event";
import { computeChart } from "@/lib/compute";
import { synthesize } from "@/lib/synthesis";
import { computeSynastry } from "@/lib/synastry";
import { chartNarration, resonanceNarration, narrationKey } from "./narrative";

const einstein = intake({
  name: "Albert Einstein",
  date: "1879-03-14",
  time: "11:30",
  place: { lat: 48.4011, lng: 9.9876, tz: "Europe/Berlin" },
});
const curie = intake({
  name: "Marie Curie",
  date: "1867-11-07",
  time: "12:00",
  place: { lat: 52.2297, lng: 21.0122, tz: "Europe/Warsaw" },
});

const aChart = computeChart(einstein.event);
const bChart = computeChart(curie.event);
const synthesisA = synthesize(einstein.event.id, aChart.computations);

describe("chart narration request", () => {
  it("builds a system + prompt from the synthesis only", () => {
    const req = chartNarration(synthesisA, aChart.computations);
    expect(req.system).toContain("ONLY to narrate");
    expect(req.prompt).toContain("# Computed convergences");
    expect(req.prompt).toContain("# Computed tensions");
    // It reads structure, it does not fabricate scores.
    expect(req.system).toContain("Do not invent");
  });

  it("uses no em dashes in the system prompt (copy rule)", () => {
    const req = chartNarration(synthesisA, aChart.computations);
    expect(req.system).not.toContain("—");
  });
});

describe("resonance narration request", () => {
  const result = computeSynastry(aChart.computations, bChart.computations);

  it("frames the chosen lens and names both people", () => {
    const req = resonanceNarration({ mode: "intimate", aName: "Ada", bName: "Bo", result });
    expect(req.system).toContain("intimate");
    expect(req.prompt).toContain("Person A: Ada");
    expect(req.prompt).toContain("Person B: Bo");
    expect(req.system).not.toContain("—");
  });

  it("differs between platonic and intimate lenses", () => {
    const platonic = resonanceNarration({ mode: "platonic", aName: "Ada", bName: "Bo", result });
    const intimate = resonanceNarration({ mode: "intimate", aName: "Ada", bName: "Bo", result });
    expect(platonic.system).not.toEqual(intimate.system);
    expect(narrationKey(platonic)).not.toEqual(narrationKey(intimate));
  });
});

describe("narration cache key", () => {
  it("is deterministic for identical structure", () => {
    const a = chartNarration(synthesisA, aChart.computations);
    const b = chartNarration(synthesisA, aChart.computations);
    expect(narrationKey(a)).toEqual(narrationKey(b));
    expect(narrationKey(a)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("changes when the chart changes (so edits re-read)", () => {
    const synthesisB = synthesize(curie.event.id, bChart.computations);
    const a = chartNarration(synthesisA, aChart.computations);
    const b = chartNarration(synthesisB, bChart.computations);
    expect(narrationKey(a)).not.toEqual(narrationKey(b));
  });
});
