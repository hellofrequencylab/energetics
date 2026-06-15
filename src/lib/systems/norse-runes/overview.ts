import type { SystemOverview } from "@/lib/systems/overview-types";

/**
 * Reader-facing overview for the Norse Birth Runes system. Original prose, second
 * person, no em dashes. `stats` keys match the engine's native factor keys in
 * engine.ts (rune, aett, element, polarity), so each line explains the reader's
 * own result.
 */
export const overview: SystemOverview = {
  intro:
    "Norse birth runes read your birth date through the Elder Futhark, the oldest runic alphabet, laid out as a calendar of half-month stretches. Each stretch belongs to one rune, and your birthday falls inside one of them. There is no casting and no draw here. Your date always points to the same rune, so the result is fixed.",
  how:
    "Your headline is the birth rune for your half-month, with a short keyword that names what it carries. Around it you get three more reads, all taken from where that rune sits in the row of twenty-four. The aett is the family of eight your rune belongs to, which sets a broad tone: making and growth, trial and turning, or order and bond. The element is the classical force the rune leans on, fire, earth, air, or water. The polarity says whether the rune drives outward and starts things or holds and gathers, with a few runes sitting balanced between the two. Read the rune first, then let the aett, element, and polarity color it in.",
  appliesToLife:
    "A birth rune tends to describe a working style more than a mood. Your rune points to the kind of move you make most naturally, whether that is opening a path, standing firm, tending what grows, or carrying something through. The aett widens that into the part of life where the pattern tends to play out, and the element and polarity tell you how you spend your energy: with heat or steadiness, by reaching out or by drawing in. Held lightly, the set gives you a plain vocabulary for your strengths and for the gear you reach for under pressure.",
  lineageNote:
    "The runes themselves are genuinely old, but the half-month calendar that pins each one to a date is a modern reconstruction, not a recorded historical practice. The aett groupings are traditional. The elements, polarities, and keywords here are our own plain reading of each rune's meaning, written in our own words. We do not reproduce any published runic text, and because this is a reconstruction it carries a modest weight in the overall picture.",
  stats: {
    rune:
      "Your birth rune, from the half-month you were born into: the core move it names and the keyword it carries.",
    aett:
      "The family of eight your rune belongs to and its seat within it: Freyr's aett for making and growth, Hagal's aett for trial and turning, Tyr's aett for order and bond.",
    element:
      "The classical force your rune leans on: fire for drive, earth for steadiness, air for thought and exchange, water for feeling and depth.",
    polarity:
      "Whether your rune drives outward and starts things (active), holds and gathers (receptive), or sits balanced between the two.",
  },
};
