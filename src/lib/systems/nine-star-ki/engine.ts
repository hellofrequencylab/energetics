import type { BirthEvent } from "@/lib/core/birth-event";
import type { NativeResult, SystemEngine, SystemMeta } from "@/lib/core/contracts";
import { dateParts } from "@/lib/core/time";

export const meta: SystemMeta = {
  id: "nine-star-ki",
  displayName: "Nine Star Ki",
  lineage: "traditional",
  requires: { time: false, place: false },
  derivedFrom: "date",
  dependsOn: [],
  corpusVersion: "1",
};

/** The nine stars → element (Chinese Wu Xing) + common name. */
const STAR = [
  null,
  { name: "1 White", element: "water" },
  { name: "2 Black", element: "earth" },
  { name: "3 Jade", element: "wood" },
  { name: "4 Green", element: "wood" },
  { name: "5 Yellow", element: "earth" },
  { name: "6 White", element: "metal" },
  { name: "7 Red", element: "metal" },
  { name: "8 White", element: "earth" },
  { name: "9 Purple", element: "fire" },
] as const;

/**
 * Principal (Honmei) star from the birth year. Verified against known years
 * (1985 → 6, 2022 → 5, 2024 → 3). The Nine Star year begins at risshun (~Feb 4),
 * so births before then use the previous year (a conventional boundary).
 */
export const engine: SystemEngine = {
  meta,
  compute(birth: BirthEvent): NativeResult {
    const { year, month, day } = dateParts(birth);
    const y = month === 1 || (month === 2 && day <= 3) ? year - 1 : year;
    const star = (((11 - (y % 9) - 1) % 9) + 9) % 9 + 1;
    const s = STAR[star]!;

    return {
      systemId: meta.id,
      factors: {
        "principal-star": {
          key: "principal-star",
          label: "Principal Star",
          value: { star, name: s.name, element: s.element },
          display: `${s.name} ${cap(s.element)}`,
        },
      },
    };
  },
};

function cap(x: string): string {
  return x.charAt(0).toUpperCase() + x.slice(1);
}
