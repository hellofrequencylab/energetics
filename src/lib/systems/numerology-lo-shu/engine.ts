import type { BirthEvent } from "@/lib/core/birth-event";
import type { NativeResult, SystemEngine, SystemMeta } from "@/lib/core/contracts";
import { dateParts } from "@/lib/core/time";

export const meta: SystemMeta = {
  id: "numerology-lo-shu",
  displayName: "Lo Shu Grid Numerology",
  lineage: "traditional",
  requires: { time: false, place: false },
  derivedFrom: "date",
  dependsOn: [],
  corpusVersion: "1",
};

/**
 * The Lo Shu square, the classic 3x3 magic square where every row, column, and
 * diagonal sums to 15. The cells are fixed positions 1..9; we drop the digits of
 * the birth date into their matching cells and read what gathers, what repeats,
 * and what is missing. The number 0 has no cell and is simply skipped, which is
 * the standard convention.
 *
 *   4 9 2
 *   3 5 7
 *   8 1 6
 *
 * This engine is a pure function of the birth date: no time, place, clock,
 * randomness, or I/O. The "arrows" (complete and missing lines) below are our own
 * original schematic reading of which of the eight magic-square lines are filled.
 */

/** The eight lines of the magic square (3 rows, 3 columns, 2 diagonals), each a
 * triple of cell numbers. Named so the engine can report which lines are present. */
const LINES: { key: string; label: string; cells: [number, number, number] }[] = [
  { key: "row-top", label: "Top row", cells: [4, 9, 2] },
  { key: "row-middle", label: "Middle row", cells: [3, 5, 7] },
  { key: "row-bottom", label: "Bottom row", cells: [8, 1, 6] },
  { key: "col-left", label: "Left column", cells: [4, 3, 8] },
  { key: "col-middle", label: "Middle column", cells: [9, 5, 1] },
  { key: "col-right", label: "Right column", cells: [2, 7, 6] },
  { key: "diag-down", label: "Falling diagonal", cells: [4, 5, 6] },
  { key: "diag-up", label: "Rising diagonal", cells: [8, 5, 2] },
];

/** Plain-language sense of what each magic-square line speaks to. Original copy. */
const LINE_THEME: Record<string, string> = {
  "row-top": "mind and ideas",
  "row-middle": "feeling and heart",
  "row-bottom": "action and the practical",
  "col-left": "thought into plan",
  "col-middle": "will and resolve",
  "col-right": "doing and follow-through",
  "diag-down": "drive and self-direction",
  "diag-up": "care and sensitivity",
};

/** Reduce to a single digit 1..9, preserving nothing (Lo Shu has no masters). */
function reduce(n: number): number {
  let v = Math.abs(n);
  while (v > 9) v = String(v).split("").reduce((s, d) => s + Number(d), 0);
  return v;
}

export const engine: SystemEngine = {
  meta,
  compute(birth: BirthEvent): NativeResult {
    const { year, month, day } = dateParts(birth);

    // Every digit of the full birth date, in order. Zeros carry no Lo Shu cell.
    const digits = `${pad4(year)}${pad2(month)}${pad2(day)}`
      .split("")
      .map(Number)
      .filter((d) => d >= 1 && d <= 9);

    // Tally how many times each cell 1..9 is filled by the date's digits.
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
    for (const d of digits) counts[d] += 1;

    const present = (Object.keys(counts) as unknown as number[])
      .map(Number)
      .filter((n) => counts[n] > 0)
      .sort((a, b) => a - b);
    const missing = (Object.keys(counts) as unknown as number[])
      .map(Number)
      .filter((n) => counts[n] === 0)
      .sort((a, b) => a - b);
    // Repeated numbers, with their counts, ordered by number for stable output.
    const repeated = (Object.keys(counts) as unknown as number[])
      .map(Number)
      .filter((n) => counts[n] >= 2)
      .sort((a, b) => a - b)
      .map((n) => ({ number: n, count: counts[n] }));

    // The strongest single cell: the most-filled number (ties break by the lower
    // number for determinism). A natural strength the date leans on. 0 if empty.
    let strongest = 0;
    let strongestCount = 0;
    for (let n = 1; n <= 9; n += 1) {
      if (counts[n] > strongestCount) {
        strongest = n;
        strongestCount = counts[n];
      }
    }

    // Complete arrows: magic-square lines where all three cells are filled. Empty
    // arrows: lines where all three cells are missing. Both are read traditionally
    // as strengths and as gaps to grow into; the labelling here is our own.
    const completeArrows = LINES.filter((l) => l.cells.every((c) => counts[c] > 0)).map((l) => ({
      key: l.key,
      label: l.label,
      theme: LINE_THEME[l.key],
    }));
    const emptyArrows = LINES.filter((l) => l.cells.every((c) => counts[c] === 0)).map((l) => ({
      key: l.key,
      label: l.label,
      theme: LINE_THEME[l.key],
    }));

    // Driver and conductor: two single-digit summary numbers from the date itself,
    // a common companion reading to the grid. Driver from the day of the month,
    // conductor from the full date reduced (this matches the Pythagorean Life Path
    // by construction, and is reported here in the grid's own frame).
    const driver = reduce(day);
    const conductor = reduce(reduce(year) + reduce(month) + reduce(day));

    return {
      systemId: meta.id,
      factors: {
        grid: {
          key: "grid",
          label: "Lo Shu Grid",
          value: { counts },
          display: present.join(""),
        },
        present: {
          key: "present",
          label: "Numbers present",
          value: present,
          display: present.join(", "),
        },
        missing: {
          key: "missing",
          label: "Missing numbers",
          value: missing,
          display: missing.length ? missing.join(", ") : "none",
        },
        repeated: {
          key: "repeated",
          label: "Repeated numbers",
          value: repeated,
          display: repeated.length ? repeated.map((r) => `${r.number}x${r.count}`).join(", ") : "none",
        },
        strongest: {
          key: "strongest",
          label: "Strongest number",
          value: strongest,
          display: strongest ? String(strongest) : "none",
        },
        "complete-arrows": {
          key: "complete-arrows",
          label: "Complete lines",
          value: completeArrows,
          display: completeArrows.length ? completeArrows.map((a) => a.label).join(", ") : "none",
        },
        "empty-arrows": {
          key: "empty-arrows",
          label: "Empty lines",
          value: emptyArrows,
          display: emptyArrows.length ? emptyArrows.map((a) => a.label).join(", ") : "none",
        },
        driver: { key: "driver", label: "Driver", value: driver, display: String(driver) },
        conductor: { key: "conductor", label: "Conductor", value: conductor, display: String(conductor) },
      },
    };
  },
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}
function pad4(n: number): string {
  return String(n).padStart(4, "0");
}
