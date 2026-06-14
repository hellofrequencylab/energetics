import type { SystemOverview } from "@/lib/systems/overview-types";

/**
 * Reader-facing overview for the Tarot Birth Cards system. Original prose, second
 * person, no em dashes. `stats` keys match the engine's native factor keys in
 * engine.ts (personality, soul, and the conditional teacher), so each line
 * explains the reader's own card.
 */
export const overview: SystemOverview = {
  intro:
    "Tarot birth cards turn your birth date into a small set of Major Arcana, the 22 named cards that carry the big themes of a life. There is no shuffle and no draw here. Your date is added up and reduced by a fixed rule, and the numbers that fall out point to specific cards, so the same date always gives the same result.",
  how:
    "You get two cards that work as a pair. Your Personality card comes from the larger sum and describes the energy you show on the outside, the way you tend to meet the world and the lessons that play out in plain view. Your Soul card comes from reducing that sum to a single digit, and it names a quieter, longer theme you carry underneath. When both cards are the same number, that theme is doubled: the outer and inner readings line up, which tends to make the pattern stronger and harder to look away from. Some dates also surface a Teacher card, the higher octave of your Soul number. It points to the more demanding face of the same lesson, the version that asks more of you. Read your cards as themes to reflect on, not fixed labels, and start with the Soul card since it sits at the root.",
  appliesToLife:
    "These themes tend to show up as the through-lines of a life rather than day-to-day detail. Your Personality card often matches the role people expect you to play and the situations you keep finding yourself in, at work and out in the open. Your Soul card speaks more to what quietly motivates you, the thing you return to when no one is watching. A doubled card can feel like a single clear calling, while a Teacher card flags where growth tends to come the hard way, through the same lesson at a steeper grade. Held lightly, the pair gives you a simple language for naming your strengths and the edge you are still learning to work with.",
  lineageNote:
    "This is a modern method laid over the traditional Major Arcana. The 22 cards are old and widely shared, but matching them to your birth date by reducing the digits is a twentieth-century numerology technique, not an ancient one, and it leans on the same date math as Pythagorean numerology, so the two are not independent reads. Every interpretation here is written in our own words. We do not reproduce the text, art, or booklet of any published tarot deck.",
  stats: {
    personality:
      "Your outer card, from the full date: the energy you show the world and the lessons that play out in the open.",
    soul:
      "Your inner card, the single-digit root: a quieter, long-running theme that motivates you underneath.",
    teacher:
      "The higher octave of your Soul number: where the same lesson shows up in its more demanding form.",
  },
};
