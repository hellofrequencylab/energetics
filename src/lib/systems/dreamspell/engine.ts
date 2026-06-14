import type { BirthEvent } from "@/lib/core/birth-event";
import type { NativeResult, SystemEngine, SystemMeta } from "@/lib/core/contracts";
import { dateParts } from "@/lib/core/time";
import { dreamspell } from "@/lib/maya/core";

export const meta: SystemMeta = {
  id: "dreamspell",
  displayName: "Dreamspell (Argüelles)",
  lineage: "modern-reconstruction",
  requires: { time: false, place: false },
  derivedFrom: "date",
  dependsOn: [],
  corpusVersion: "1",
};

/**
 * Dreamspell — a MODERN (1987) reconstruction with a leap-day-skipping
 * correlation; NOT the calendar Maya daykeepers keep. Computed for display via
 * the verified core; its adapter emits no primitives so it is shown
 * informationally and excluded from structural synthesis (never conflated with
 * the living tradition).
 */
export const engine: SystemEngine = {
  meta,
  compute(birth: BirthEvent): NativeResult {
    const { year, month, day } = dateParts(birth);
    const ds = dreamspell(year, month, day);

    if (ds.kin === 0) {
      return {
        systemId: meta.id,
        factors: {
          signature: { key: "signature", label: "Galactic Signature", value: ds.signature, display: ds.signature },
        },
      };
    }

    return {
      systemId: meta.id,
      factors: {
        signature: { key: "signature", label: "Galactic Signature", value: ds.signature, display: ds.signature },
        kin: { key: "kin", label: "Kin", value: ds.kin, display: `Kin ${ds.kin}` },
        color: { key: "color", label: "Color Family", value: ds.color, display: ds.color },
        seal: { key: "seal", label: "Solar Seal", value: ds.seal, display: `${ds.color} ${ds.seal}` },
        tone: { key: "tone", label: "Galactic Tone", value: ds.tone, display: `${ds.tone} ${ds.toneName}` },
        oracle: {
          key: "oracle",
          label: "Fifth-Force Oracle",
          value: ds.oracle,
          display: ds.oracle
            ? `guide ${ds.oracle.guide} · analog ${ds.oracle.analog} · antipode ${ds.oracle.antipode} · occult ${ds.oracle.occult}`
            : undefined,
        },
      },
    };
  },
};
