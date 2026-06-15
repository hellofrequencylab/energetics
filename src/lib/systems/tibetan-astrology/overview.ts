import type { SystemOverview } from "@/lib/systems/overview-types";

/**
 * Reader-facing overview for Tibetan astrology (the elemental, naktsi strand).
 * Original prose, second person, no em dashes. `stats` keys match the engine's
 * native factor keys in engine.ts so each line explains the reader's own placement.
 */
export const overview: SystemOverview = {
  intro:
    "Tibetan astrology weaves together strands from India and China into its own living practice. The everyday strand, naktsi, reads your birth year through four signatures: an animal and an element that name the year, the parkha trigram that carries your life force, and the mewa, a number from the same nine-square grid behind feng shui. Together they sketch the elemental weather you were born into.",
  how:
    "Read the four signatures as one picture. Your year animal is the temperament you share with everyone born in your year, and your year element, which holds for two years at a time, colors that animal with wood, fire, earth, metal, or water. Each year also carries a yang or yin charge, a more outward or more inward tone. Your parkha is a trigram tied to an element and a direction, read as the quality of your life force, and when its element matches your year element the two reinforce each other. Your mewa is a protective number with a color, marking an energy signature carried for the year. The Tibetan year turns at Losar in late winter, so a birthday in January or early February belongs to the previous year. Hold these as elemental tendencies, not fixed fate.",
  appliesToLife:
    "The elemental strand is used in Tibetan life to read the grain of a year and the fit between people, places, and times. Your year element points to a natural strength and to the kind of settings that feel nourishing rather than draining. Your parkha can hint at the arena where your life force most wants to move, whether that is the self, the home, relationships, work, or quieter inner ground. Knowing the yang or yin tone of your year can explain whether you tend to push outward or gather inward by default. As with the other element systems here, the five phases support and challenge each other in cycles, so your signatures offer a gentle language for why some pairings flow and others take more care.",
  lineageNote:
    "Tibetan astrology is a living tradition, taught in monastic colleges and practiced widely, with two main strands: kartsi, the star-based strand drawn from Indian astronomy, and naktsi, the elemental strand drawn from Chinese element lore. We read the elemental strand here. The true Tibetan calendar is lunar and Losar shifts each year, so we use a fixed early-February civil boundary as a deterministic, timezone-free approximation, which can place a birthday near the turn in either of two years. The trigram and number constructions follow original deterministic versions of the schematic and reproduce no copyrighted text. We offer this with respect and point you to Tibetan teachers for the living depth. The prose and interpretations here are our own.",
  stats: {
    "year-animal":
      "Your year animal with its yang or yin charge: the temperament you share with everyone born in your Tibetan year.",
    "year-element":
      "Your year element, one of wood, fire, earth, metal, or water, which holds for two years and colors your animal with its quality.",
    parkha:
      "Your parkha trigram: the quality of your life force, tied to an element and a direction, and whether it reinforces your year element.",
    mewa:
      "Your mewa, a protective number and color from the nine-square grid, marking an energy signature carried for the year.",
  },
};
