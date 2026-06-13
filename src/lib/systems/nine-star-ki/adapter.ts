import type { NativeResult, Primitive, SemanticAdapter } from "@/lib/core/contracts";
import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { meta } from "./engine";

export const adapter: SemanticAdapter = {
  systemId: meta.id,
  ontologyVersion: ONTOLOGY_VERSION,
  toPrimitives(native: NativeResult): Primitive[] {
    const factor = native.factors["principal-star"];
    if (!factor) return [];
    const { element } = factor.value as { element: string };
    if (!element) return [];
    // Chinese five-element family (crosswalks to Western elements).
    return [
      {
        axis: "element",
        value: `chinese:${element}`,
        weight: 0.6,
        source: meta.id,
        derivedFrom: "date",
        native: { factorKey: "principal-star", raw: element },
      },
    ];
  },
};
