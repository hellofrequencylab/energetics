// @vitest-environment happy-dom
import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { ConvergenceChart } from "./ConvergenceChart";
import type { ComputedSystem, Synthesis } from "@/lib/synthesis/types";
import type { SystemMeta } from "@/lib/core/contracts";

function meta(id: string, derivedFrom: SystemMeta["derivedFrom"]): SystemMeta {
  return {
    id,
    displayName: id,
    lineage: "living" as SystemMeta["lineage"],
    requires: { time: false, place: false },
    derivedFrom,
    dependsOn: [],
    corpusVersion: "1",
  };
}
function sys(id: string, derivedFrom: SystemMeta["derivedFrom"]): ComputedSystem {
  return { meta: meta(id, derivedFrom), native: { systemId: id, factors: {} }, primitives: [] };
}
const attr = (systemId: string) => ({ systemId, factorKey: "f", raw: null });

const computations: ComputedSystem[] = [
  sys("sky", "ephemeris"),
  sys("hd", "ephemeris"),
  sys("cal", "date"),
  sys("tz", "date"),
  sys("name", "name"),
];

beforeAll(() => {
  // happy-dom needs these for the pointer-capture drag plumbing and toSvg().
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 640, height: 640, right: 640, bottom: 640, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
});
afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

function dashedLines(container: HTMLElement): SVGLineElement[] {
  return Array.from(container.querySelectorAll("line[stroke-dasharray]")) as SVGLineElement[];
}
function byLabelPrefix(container: HTMLElement, prefix: string): SVGGElement | undefined {
  return Array.from(container.querySelectorAll("[aria-label]")).find((el) =>
    (el.getAttribute("aria-label") ?? "").startsWith(prefix),
  ) as SVGGElement | undefined;
}
function dotCenter(g: SVGGElement): { x: number; y: number } {
  const c = g.querySelector("circle:nth-of-type(2)") as SVGCircleElement;
  return { x: Number(c.getAttribute("cx")), y: Number(c.getAttribute("cy")) };
}
function len(l: SVGLineElement): number {
  return Math.hypot(
    Number(l.getAttribute("x2")) - Number(l.getAttribute("x1")),
    Number(l.getAttribute("y2")) - Number(l.getAttribute("y1")),
  );
}

// All five oppositions: convergence-to-convergence, convergence-to-single-source,
// and (the case that used to look broken) two single-source-to-single-source
// tensions whose poles share systems.
const synthesis: Synthesis = {
  birthEventId: "t1",
  ontologyVersion: "1",
  convergences: [
    { axis: "polarity", value: "active", independentGroups: 2, weight: 2, contributors: [attr("sky"), attr("cal")] },
    { axis: "polarity", value: "receptive", independentGroups: 2, weight: 2, contributors: [attr("name"), attr("cal")] },
    { axis: "theme", value: "structure", independentGroups: 2, weight: 2, contributors: [attr("sky"), attr("name")] },
    { axis: "element", value: "western:fire", independentGroups: 2, weight: 2, contributors: [attr("sky"), attr("cal")] },
    // The single-source poles still appear as convergences with one group.
    { axis: "element", value: "western:water", independentGroups: 1, weight: 1, contributors: [attr("name")] },
    { axis: "element", value: "western:air", independentGroups: 1, weight: 1, contributors: [attr("sky")] },
    { axis: "element", value: "western:earth", independentGroups: 1, weight: 1, contributors: [attr("sky")] },
    { axis: "theme", value: "play", independentGroups: 1, weight: 1, contributors: [attr("cal")] },
    { axis: "theme", value: "discipline", independentGroups: 1, weight: 1, contributors: [attr("hd")] },
    { axis: "theme", value: "exploration", independentGroups: 1, weight: 1, contributors: [attr("hd")] },
  ],
  tensions: [
    { axis: "polarity", poles: ["active", "receptive"], sides: [{ value: "active", contributors: [attr("sky"), attr("cal")] }, { value: "receptive", contributors: [attr("name"), attr("cal")] }] },
    { axis: "element", poles: ["western:fire", "western:water"], sides: [{ value: "western:fire", contributors: [attr("sky"), attr("cal")] }, { value: "western:water", contributors: [attr("name")] }] },
    { axis: "element", poles: ["western:air", "western:earth"], sides: [{ value: "western:air", contributors: [attr("sky")] }, { value: "western:earth", contributors: [attr("sky")] }] },
    { axis: "theme", poles: ["structure", "play"], sides: [{ value: "structure", contributors: [attr("sky"), attr("name")] }, { value: "play", contributors: [attr("cal")] }] },
    { axis: "theme", poles: ["discipline", "exploration"], sides: [{ value: "discipline", contributors: [attr("hd")] }, { value: "exploration", contributors: [attr("hd")] }] },
  ],
};

describe("ConvergenceChart tension lines", () => {
  it("draws every tension as a clear, separated line (incl. single-source pairs)", () => {
    const { container } = render(<ConvergenceChart synthesis={synthesis} computations={computations} selfName="Test" />);
    const lines = dashedLines(container);
    expect(lines).toHaveLength(synthesis.tensions.length);
    for (const l of lines) expect(len(l)).toBeGreaterThan(40); // none is a degenerate stray
  });

  it("a single-source tension pole is a real, draggable theme node and its line follows", () => {
    const { container } = render(<ConvergenceChart synthesis={synthesis} computations={computations} selfName="Test" />);
    const svg = container.querySelector("svg") as SVGSVGElement;
    const air = byLabelPrefix(container, "Air,")!; // "Air, tension pole · 1 source. Drag to move, ..."
    expect(air).toBeTruthy();
    const before = dotCenter(air);

    fireEvent.pointerDown(air, { clientX: before.x, clientY: before.y, pointerId: 1 });
    fireEvent.pointerMove(svg, { clientX: 330, clientY: 330, pointerId: 1 });
    fireEvent.pointerUp(svg, { clientX: 330, clientY: 330, pointerId: 1 });

    const after = dotCenter(byLabelPrefix(container, "Air,")!);
    expect(after.x).not.toBe(before.x); // the pole moved
    const followed = dashedLines(container).some(
      (l) =>
        (Number(l.getAttribute("x1")) === after.x && Number(l.getAttribute("y1")) === after.y) ||
        (Number(l.getAttribute("x2")) === after.x && Number(l.getAttribute("y2")) === after.y),
    );
    expect(followed).toBe(true); // the air↔earth line followed the pole
  });

  it("a convergence node is draggable and its tension line follows", () => {
    const { container } = render(<ConvergenceChart synthesis={synthesis} computations={computations} selfName="Test" />);
    const svg = container.querySelector("svg") as SVGSVGElement;
    const dotG = byLabelPrefix(container, "Active,")!;
    const before = dotCenter(dotG);
    fireEvent.pointerDown(dotG, { clientX: before.x, clientY: before.y, pointerId: 2 });
    fireEvent.pointerMove(svg, { clientX: 320, clientY: 320, pointerId: 2 });
    fireEvent.pointerUp(svg, { clientX: 320, clientY: 320, pointerId: 2 });
    const after = dotCenter(byLabelPrefix(container, "Active,")!);
    expect(after.x).not.toBe(before.x);
    const followed = dashedLines(container).some(
      (l) => Number(l.getAttribute("x1")) === after.x && Number(l.getAttribute("y1")) === after.y,
    );
    expect(followed).toBe(true);
  });
});
