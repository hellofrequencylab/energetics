import type { SystemOverview } from "@/lib/systems/overview-types";

/**
 * Reader-facing overview for the Dreamspell (Argüelles) system. Original prose,
 * second person, no em dashes. `stats` keys match the engine's native factor
 * keys in engine.ts (signature, kin, color, seal, tone, oracle) so each line
 * explains the reader's own placement.
 *
 * Dreamspell is a modern reconstruction and stays OUT of structural synthesis
 * (its adapter emits no primitives). This overview is shown for interest only.
 */
export const overview: SystemOverview = {
  intro:
    "Dreamspell reads your birth date as a galactic signature, a single day in a 260 day count built from 13 tones and 20 solar seals turning together. From your date it names your seal, your tone, and your kin number, the position your day holds in the cycle.",
  how:
    "Read your signature in three moves. Start with your solar seal, one of twenty archetypes that names the quality you carry, paired with a color that places you in one of four families. Then read your galactic tone, a number from 1 to 13 that sets the pitch or pacing of that seal, from the magnetic spark of one to the cosmic fullness of thirteen. Together the seal and tone give your kin, your seat in the count of 260. Last, look at the oracle, the four signatures that surround yours: a guide, an analog partner, an antipode that challenges, and a hidden occult companion. Hold it as a playful lens for reflection, not a verdict.",
  appliesToLife:
    "People who follow Dreamspell often use it as a daily rhythm rather than a fixed reading. Each day carries its own kin, so your signature becomes a way to notice the texture of a given day and how it meets your own. Your seal can read as a theme to lean into, your tone as the energy you bring to it, and the oracle as a small map of the supports and tensions around you. Many treat it as a gentle prompt for intention and creativity, a shared language with others who keep the count, more an invitation to reflect than a rule to follow.",
  lineageNote:
    "Dreamspell is a modern reconstruction. José Argüelles introduced it in 1987, drawing on Maya day-sign and number concepts but applying his own correlation that skips leap days, so its count drifts from the traditional one. This is NOT the count that living Maya communities keep, and it should not be read as the calendar of those daykeepers. OneSky shows it for interest and keeps it out of the structural synthesis, so it is never blended with or mistaken for the living tradition. The interpretations here are our own and reproduce no copyrighted source material.",
  stats: {
    signature: "Your full galactic signature, the color, tone, and solar seal of your birth day read together.",
    kin: "Your kin number from 1 to 260, the exact seat your day holds in the count.",
    color: "Your color family (red, white, blue, or yellow), one of the four currents the seals rotate through.",
    seal: "Your solar seal, one of twenty archetypes naming the core quality you carry.",
    tone: "Your galactic tone from 1 to 13, the pitch or pacing that sets how your seal expresses.",
    oracle: "The four signatures around yours: a guide, an analog partner, a challenging antipode, and a hidden occult companion.",
  },
};
