/**
 * Central collector for per-system overviews. Each system authors its own
 * `src/lib/systems/<id>/overview.ts` (see `overview-types.ts`); this maps them by
 * id for the per-system detail page. Importing the overview files directly (not
 * the system barrels) keeps engines out of any client bundle that needs only the
 * prose. Systems without an overview yet simply fall back to their blurb.
 */
import type { SystemOverview } from "./systems/overview-types";
import { overview as westernTropical } from "./systems/western-tropical/overview";
import { overview as humanDesign } from "./systems/human-design/overview";
import { overview as numerologyPythagorean } from "./systems/numerology-pythagorean/overview";
import { overview as numerologyChaldean } from "./systems/numerology-chaldean/overview";
import { overview as tzolkin } from "./systems/tzolkin/overview";
import { overview as chineseBazi } from "./systems/chinese-bazi/overview";
import { overview as tarotBirthCards } from "./systems/tarot-birth-cards/overview";
import { overview as dreamspell } from "./systems/dreamspell/overview";

export const SYSTEM_OVERVIEWS: Record<string, SystemOverview> = {
  "western-tropical": westernTropical,
  "human-design": humanDesign,
  "numerology-pythagorean": numerologyPythagorean,
  "numerology-chaldean": numerologyChaldean,
  tzolkin,
  "chinese-bazi": chineseBazi,
  "tarot-birth-cards": tarotBirthCards,
  dreamspell,
};

export function overviewFor(id: string): SystemOverview | undefined {
  return SYSTEM_OVERVIEWS[id];
}
