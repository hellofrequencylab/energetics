import type { NativeResult, OntologyAxis, Primitive, SystemMeta } from "@/lib/core/contracts";

/** One system's full computed output: native factors + derived primitives. */
export interface ComputedSystem {
  meta: SystemMeta;
  native: NativeResult;
  primitives: Primitive[];
}

/** Attribution back to the originating system + native factor. */
export interface Attribution {
  systemId: string;
  factorKey: string;
  raw: unknown;
}

/** A ranked agreement across systems on one (axis, value). */
export interface Convergence {
  axis: OntologyAxis;
  value: string;
  /** Primary signal: count of INDEPENDENT source groups in agreement. */
  independentGroups: number;
  /** Damped total weight — for ordering only, NEVER shown as a score. */
  weight: number;
  contributors: Attribution[];
}

/** A declared opposition both of whose poles are supported. */
export interface Tension {
  axis: OntologyAxis;
  poles: [string, string];
  sides: { value: string; contributors: Attribution[] }[];
}

export interface Synthesis {
  birthEventId: string;
  ontologyVersion: string;
  convergences: Convergence[];
  tensions: Tension[];
}

/** Internal: a crosswalk-expanded cluster of primitives on one axis. */
export interface ClusterContributor {
  primitive: Primitive;
  /** Crosswalk confidence to the cluster's representative value (1 if identical). */
  confidence: number;
}
export interface Cluster {
  axis: OntologyAxis;
  value: string; // representative value
  values: string[]; // all values merged into this cluster
  contributors: ClusterContributor[];
}
