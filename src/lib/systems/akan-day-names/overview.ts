import type { SystemOverview } from "@/lib/systems/overview-types";

/**
 * Reader-facing overview for the Akan Day Names system. Original prose, second
 * person, no em dashes. `stats` keys match the engine's native factor keys in
 * engine.ts (day-name, character, kra, quality, element, polarity), so each line
 * explains the reader's own result.
 */
export const overview: SystemOverview = {
  intro:
    "Akan day names come from a living West African custom. Among the Akan people of Ghana and Cote d'Ivoire, a child receives a kra din, a soul name, from the day of the week they were born on. Your birth date sets your weekday, and your weekday sets your name and the character that tradition links to it. The result is fixed: the same date always gives the same day name.",
  how:
    "Your headline is the day name itself, the customary soul name for your weekday, shown for both the customary masculine and feminine forms. Around it you get the day's settled character in brief, the kra or day spirit tradition pairs with it, and a guiding quality drawn from that character in our own words. Two more reads place it in the shared picture: a classical element for the day's temperament, fire, earth, air, or water, and a polarity for whether the day runs outgoing or settling. Read the day name and character first, then let the quality, element, and polarity color them in.",
  appliesToLife:
    "A day name tends to describe a temperament, the grain you tend to run with. Your day's character points to how you meet people and handle pressure, whether you lead and protect, keep the peace, feel deeply, move quick and clever, stand brave and grounded, venture and tend, or carry wisdom and long memory. The element and polarity say how you spend that energy, with heat or calm, by reaching out or by settling in. Held lightly, the set gives you a plain language for your strengths and the disposition you bring into a room.",
  lineageNote:
    "This is a genuine living tradition, not a reconstruction. The day names and the broad character linked to each day are widely shared Akan custom. The guiding quality, element, and polarity here are our own plain reading of that character, written in our own words, and we hold them lightly out of respect for a practice that belongs to a living culture. We do not reproduce any copyrighted source. Naming and spelling vary across Akan communities, so treat the forms shown as one common version.",
  stats: {
    "day-name":
      "Your kra din, the soul name for the weekday you were born on, in its customary masculine and feminine forms.",
    character:
      "The settled character tradition links to your birth day, in brief.",
    kra:
      "The kra or day spirit paired with your weekday, alongside the Akan name for the day.",
    quality:
      "The guiding quality drawn from your day's character: the strength it points you toward.",
    element:
      "The classical force for your day's temperament: fire for drive, earth for steadiness, air for thought and exchange, water for feeling and depth.",
    polarity:
      "Whether your day runs outgoing and active, settling and receptive, or balanced between the two.",
  },
};
