import type { SystemOverview } from "@/lib/systems/overview-types";

/**
 * Reader-facing overview for the Celtic Tree Astrology system. Original prose,
 * second person, no em dashes. `stats` keys match the engine's native factor keys
 * in engine.ts (tree, ogham, element, polarity, year-half), so each line explains
 * the reader's own result.
 */
export const overview: SystemOverview = {
  intro:
    "Celtic tree astrology reads your birth date through a calendar of thirteen tree-months, each tied to a tree from old Irish and British woodland lore. Your birthday falls inside one tree's stretch of the year. There is no draw and no chart to cast. Your date always lands on the same tree, so the result is fixed.",
  how:
    "Your headline is the birth tree for your month, with a short keyword for what it carries. Around it you get four more reads taken from that tree's place in the calendar. The Ogham few is the Old Irish letter name paired with the tree, the mark that stood for it. The element is the classical force the tree leans on, fire, earth, air, or water. The polarity says whether the tree reaches outward and grows or draws inward and deepens, with a few sitting balanced. The year half tells you whether you were born in the waxing light half of the year or the waning dark half, which sets a broad tone. Read the tree first, then let the rest fill it in.",
  appliesToLife:
    "A birth tree tends to describe a way of growing more than a passing mood. Your tree points to how you put down roots and reach for light: whether you open new ground, hold steady through weather, tend what is already growing, or clear space for what comes next. The element and polarity say how you spend your energy, with heat or patience, by reaching out or by going deep. The year half adds whether your instinct runs toward expansion or toward consolidation. Held lightly, the set gives you a plain language for your strengths and the season you work best in.",
  lineageNote:
    "The trees and their Ogham letters are genuinely old, but the calendar that pins one tree to each stretch of the year is a twentieth-century reconstruction, not a recorded ancient practice. The elements, polarities, and keywords here are our own plain reading of each tree's nature, written in our own words. We do not reproduce any published tree-astrology text, and because this is a reconstruction it carries a modest weight in the overall picture.",
  stats: {
    tree:
      "Your birth tree, from the tree-month you were born into: the way of growing it names and the keyword it carries.",
    ogham:
      "The Ogham few for your tree: the Old Irish letter name that stood for it.",
    element:
      "The classical force your tree leans on: fire for drive, earth for steadiness, air for thought and exchange, water for feeling and depth.",
    polarity:
      "Whether your tree reaches outward and grows (active), draws inward and deepens (receptive), or sits balanced between the two.",
    "year-half":
      "Whether you were born in the waxing light half of the year, tilted toward expansion, or the waning dark half, tilted toward consolidation.",
  },
};
