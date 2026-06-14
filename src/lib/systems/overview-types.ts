/**
 * Per-system overview content: the in-depth, plain-language description a reader
 * sees on a system's detail page. Authored per system in
 * `src/lib/systems/<id>/overview.ts`, collected in `src/lib/system-overviews.ts`,
 * and rendered by `/account/chart/[id]/system/[systemId]`.
 *
 * Original prose only (no reproduced corpora), second person, warm, and strengths
 * aware. No em dashes anywhere (house copy rule).
 */
export interface SystemOverview {
  /** One or two sentences: what this system is and what it reads in you. */
  intro: string;
  /** How to read your result here: what the stats mean and how to approach them. */
  how: string;
  /** How this system tends to show up in daily life, relationships, and work. */
  appliesToLife: string;
  /** Lineage-honest note: where it comes from, living tradition vs reconstruction. */
  lineageNote?: string;
  /**
   * Plain one-line readings keyed by the system's native factor key, so a reader
   * sees what their specific stat means (for example sun, day-master, life-path).
   */
  stats?: Record<string, string>;
}
