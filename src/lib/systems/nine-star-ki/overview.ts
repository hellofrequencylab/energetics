import type { SystemOverview } from "@/lib/systems/overview-types";

/**
 * Reader-facing overview for Nine Star Ki. Original prose, second person, no em
 * dashes. `stats` keys match the engine's native factor keys in engine.ts so each
 * line explains the reader's own placement.
 */
export const overview: SystemOverview = {
  intro:
    "Nine Star Ki reads your birth date through a square of nine numbers, the same Lo Shu grid that sits behind feng shui and the I Ching. Each number is a star tied to one of the five elements of water, wood, fire, earth, and metal. The star of your birth year names a core temperament, and the star of your birth month adds a more private, feeling side. Together they sketch how you meet the world and how you meet yourself.",
  how:
    "Begin with your principal star, set by your birth year. It is the face you turn outward, the energy people tend to meet first, and it carries an element and a yin or yang charge. Your monthly star, set by the season you were born in, speaks to your inner life and how you handle feeling and change, so it often explains the part of you that close people see and strangers do not. Your tendency star is the number that balances your principal across the center of the grid, a quality you naturally reach toward to round yourself out. The Nine Star year and month both begin near early February at risshun, not on January first, so a birthday in January or very early February belongs to the previous year's count. Read these as energies in motion, a cycle you move through, rather than fixed labels.",
  appliesToLife:
    "Your principal star tends to describe your working style and your first move in a new room: whether you lead, connect, tend, refine, or sense your way in. Your monthly star shows up more at home and under stress, in how you process what you feel and how you ride change, which is why it matters so much in close relationships. Knowing both can ease friction, since the outer star and the inner star are often quite different, and seeing the gap helps you explain yourself to others and be patient with yourself. The five elements also relate to each other in cycles of support and challenge, so your stars can hint at which people and settings feel nourishing and which take more effort.",
  lineageNote:
    "Nine Star Ki grew from Chinese nine-palace and Lo Shu number lore and was shaped into the form many people know today through Japanese practice (Kyusei Kigaku) over the last century or so. It is a living, practiced system, and schools differ on the finer points, especially the month boundaries and the exact day risshun falls on. We use a fixed civil-date approximation of the solar terms so your reading is stable and never shifts with a timezone, which can place a birthday very close to a boundary in either of two counts. The prose and interpretations here are our own.",
  stats: {
    "principal-star":
      "Your principal (year) star: the outward temperament you lead with, with its element and its yang (active) or yin (receptive) charge.",
    "monthly-star":
      "Your monthly star, set by the season of your birth: your inner, feeling side and how you handle change, often seen only by those close to you.",
    "tendency-star":
      "Your tendency star, the number that balances your principal across the center of the grid: a quality you naturally reach toward to feel whole.",
  },
};
