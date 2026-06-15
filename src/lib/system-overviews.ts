/**
 * Central collector for per-system overviews. Each system authors its own
 * `src/lib/systems/<id>/overview.ts` (see `overview-types.ts`); this maps them by
 * id for the per-system detail page. Importing the overview files directly (not
 * the system barrels) keeps engines out of any client bundle that needs only the
 * prose. Every registered system now has an overview.
 */
import type { SystemOverview } from "./systems/overview-types";
import { overview as westernTropical } from "./systems/western-tropical/overview";
import { overview as vedicJyotish } from "./systems/vedic-jyotish/overview";
import { overview as hellenistic } from "./systems/hellenistic/overview";
import { overview as egyptianDecans } from "./systems/egyptian-decans/overview";
import { overview as humanDesign } from "./systems/human-design/overview";
import { overview as geneKeys } from "./systems/gene-keys/overview";
import { overview as numerologyPythagorean } from "./systems/numerology-pythagorean/overview";
import { overview as numerologyChaldean } from "./systems/numerology-chaldean/overview";
import { overview as numerologyLoShu } from "./systems/numerology-lo-shu/overview";
import { overview as kabbalahTreeOfLife } from "./systems/kabbalah-tree-of-life/overview";
import { overview as tzolkin } from "./systems/tzolkin/overview";
import { overview as dreamspell } from "./systems/dreamspell/overview";
import { overview as chineseBazi } from "./systems/chinese-bazi/overview";
import { overview as ziWeiDouShu } from "./systems/zi-wei-dou-shu/overview";
import { overview as nineStarKi } from "./systems/nine-star-ki/overview";
import { overview as mahabote } from "./systems/mahabote/overview";
import { overview as tibetanAstrology } from "./systems/tibetan-astrology/overview";
import { overview as tarotBirthCards } from "./systems/tarot-birth-cards/overview";
import { overview as norseRunes } from "./systems/norse-runes/overview";
import { overview as celticTree } from "./systems/celtic-tree/overview";
import { overview as akanDayNames } from "./systems/akan-day-names/overview";

export const SYSTEM_OVERVIEWS: Record<string, SystemOverview> = {
  "western-tropical": westernTropical,
  "vedic-jyotish": vedicJyotish,
  hellenistic,
  "egyptian-decans": egyptianDecans,
  "human-design": humanDesign,
  "gene-keys": geneKeys,
  "numerology-pythagorean": numerologyPythagorean,
  "numerology-chaldean": numerologyChaldean,
  "numerology-lo-shu": numerologyLoShu,
  "kabbalah-tree-of-life": kabbalahTreeOfLife,
  tzolkin,
  dreamspell,
  "chinese-bazi": chineseBazi,
  "zi-wei-dou-shu": ziWeiDouShu,
  "nine-star-ki": nineStarKi,
  mahabote,
  "tibetan-astrology": tibetanAstrology,
  "tarot-birth-cards": tarotBirthCards,
  "norse-runes": norseRunes,
  "celtic-tree": celticTree,
  "akan-day-names": akanDayNames,
};

export function overviewFor(id: string): SystemOverview | undefined {
  return SYSTEM_OVERVIEWS[id];
}
