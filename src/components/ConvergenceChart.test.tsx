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
  sys("cal", "date"),
  sys("name", "name"),
  sys("cal2", "date"),
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

describe("ConvergenceChart tension lines", () => {
  it("draws a tension between two convergence poles and the line follows the dragged dot", () => {
    const synthesis: Synthesis = {
      birthEventId: "t1",
      ontologyVersion: "1",
      convergences: [
        { axis: "polarity", value: "active", independentGroups: 2, weight: 2, contributors: [attr("sky"), attr("cal")] },
        { axis: "polarity", value: "receptive", independentGroups: 2, weight: 2, contributors: [attr("name"), attr("cal2")] },
      ],
      tensions: [
        {
          axis: "polarity",
          poles: ["active", "receptive"],
          sides: [
            { value: "active", contributors: [attr("sky"), attr("cal")] },
            { value: "receptive", contributors: [attr("name"), attr("cal2")] },
          ],
        },
      ],
    };
    const { container } = render(<ConvergenceChart synthesis={synthesis} computations={computations} selfName="Test" />);
    const svg = container.querySelector("svg") as SVGSVGElement;

    expect(dashedLines(container)).toHaveLength(1);
    const dotG = byLabelPrefix(container, "Active,")!;
    expect(dotG).toBeTruthy();
    const before = dotCenter(dotG);
    const lineBefore = dashedLines(container)[0];
    expect(Number(lineBefore.getAttribute("x1"))).toBe(before.x);

    fireEvent.pointerDown(dotG, { clientX: before.x, clientY: before.y, pointerId: 1 });
    fireEvent.pointerMove(svg, { clientX: 320, clientY: 320, pointerId: 1 });
    fireEvent.pointerUp(svg, { clientX: 320, clientY: 320, pointerId: 1 });

    const after = dotCenter(byLabelPrefix(container, "Active,")!);
    const lineAfter = dashedLines(container)[0];
    expect(after.x).not.toBe(before.x); // the dot moved
    expect(Number(lineAfter.getAttribute("x1"))).toBe(after.x); // the line endpoint moved with it
    expect(Number(lineAfter.getAttribute("y1"))).toBe(after.y);
  });

  it("draws a tension to a ghost pole and the line follows the dragged ghost", () => {
    const synthesis: Synthesis = {
      birthEventId: "t2",
      ontologyVersion: "1",
      convergences: [
        { axis: "element", value: "western:fire", independentGroups: 2, weight: 2, contributors: [attr("sky"), attr("cal")] },
      ],
      tensions: [
        {
          axis: "element",
          poles: ["western:fire", "western:water"],
          sides: [
            { value: "western:fire", contributors: [attr("sky"), attr("cal")] },
            { value: "western:water", contributors: [attr("name")] },
          ],
        },
      ],
    };
    const { container } = render(<ConvergenceChart synthesis={synthesis} computations={computations} selfName="Test" />);
    const svg = container.querySelector("svg") as SVGSVGElement;

    expect(dashedLines(container)).toHaveLength(1);
    // Water is a single-source pole, so it renders as a draggable ghost pole.
    const ghostG = byLabelPrefix(container, "Water tension pole")!;
    expect(ghostG).toBeTruthy();
    const before = dotCenter(ghostG);
    const lineBefore = dashedLines(container)[0];
    // The water end of the line (x2/y2) sits on the ghost.
    expect(Number(lineBefore.getAttribute("x2"))).toBe(before.x);

    fireEvent.pointerDown(ghostG, { clientX: before.x, clientY: before.y, pointerId: 2 });
    fireEvent.pointerMove(svg, { clientX: 300, clientY: 300, pointerId: 2 });
    fireEvent.pointerUp(svg, { clientX: 300, clientY: 300, pointerId: 2 });

    const after = dotCenter(byLabelPrefix(container, "Water tension pole")!);
    const lineAfter = dashedLines(container)[0];
    expect(after.x).not.toBe(before.x); // the ghost moved
    expect(Number(lineAfter.getAttribute("x2"))).toBe(after.x); // the line endpoint followed
    expect(Number(lineAfter.getAttribute("y2"))).toBe(after.y);
  });
});
