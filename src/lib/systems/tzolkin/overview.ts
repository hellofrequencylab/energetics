import type { SystemOverview } from "@/lib/systems/overview-types";

/**
 * Reader-facing overview for the Tzolk'in (Cholq'ij) system. Original prose,
 * second person, no em dashes. `stats` keys match the engine's native factor
 * keys in engine.ts so each line explains the reader's own placement.
 *
 * Lineage note is deliberate: the count is a living calendar still kept by Maya
 * daykeepers in highland Guatemala today, not a relic and not ours to claim.
 */
export const overview: SystemOverview = {
  intro:
    "The Cholq'ij, often written Tzolk'in, is a 260-day sacred count carried by Maya communities for many centuries. It weaves twenty day signs, each a nawal or living character, with thirteen galactic tones that rise and fall like a tide. Your birth date lands on one day in that weave, and that day names a quality you were born into.",
  how:
    "Read your day in a few parts that fit together. Your day sign is the nawal, the face and instinct of the day, and it is the part most people start with. Your tone is a number from one to thirteen that sets the energy level of that sign, from the quiet first spark of one through the steady balance of the middle numbers to the wide overflow of thirteen, and its phase tells you whether your day is rising, building, or releasing. Each nawal also sits in one of the four directions, with a color and a feel: the rising red East, the clarifying white North, the transforming blue West, and the grounding yellow South. Your trecena is the thirteen-day wave your birthday belongs to, named for the sign that opens it, and it gives a broader current that your own day rides on. You can also follow the longer cycles below, the Haab' season, the Year Bearer that carries your year, the night lord, and the Long Count, as added context. Hold it as a way to listen to the character of a day, not as a fixed label on who you are.",
  appliesToLife:
    "Daykeepers read the count to know the grain of a day, and you can use it the same way. Your day sign points to a strength you carry by instinct and a way of meeting the world that feels native to you. Your tone shows the pitch you tend to work at, whether you set out fresh, hold things in balance, or pour yourself fully into a thing, and its phase suggests when to begin, when to push, and when to let go. Your direction and color place that energy on the map of the world, a quiet orientation beneath the nawal. Knowing your trecena can help you see the larger phase your nature unfolds within, which is useful when you are choosing how to start something, when to push, and when to rest. In relationships and work it offers a shared, gentle language for difference: not better or worse, just different days with different gifts.",
  lineageNote:
    "This is a living calendar, not a museum piece and not ours. Maya daykeepers, the ajq'ijab', still keep the count by hand in the highlands of Guatemala and beyond, marking ceremonies and births by the same unbroken thread. We use the traditional GMT correlation, the count most widely kept in those communities today, computed straight from your civil date so no timezone can shift it. The K'iche' names beside each day sign honor that the tradition is spoken and practiced now. We offer this with respect and as an outsider's window, and we point you toward Maya teachers for the depth that only the living lineage holds.",
  stats: {
    "day-sign":
      "Your nawal, the day sign you were born on: the instinct and character the day carries, shown in both the academic and the living K'iche' name.",
    tone:
      "Your galactic tone from one to thirteen: the energy level of your day sign, from a first spark through balance to full overflow.",
    "tone-phase":
      "Where your tone sits on the thirteen-step wave: rising (one to four) as the spark sets out, building (five to nine) as it gathers and finds balance, or releasing (ten to thirteen) as it refines and gives back.",
    direction:
      "The direction and color your nawal belongs to: the rising red East, the clarifying white North, the transforming blue West, or the grounding yellow South, a quiet orientation beneath the day sign.",
    kin: "Your place in the full 260-day round, the single day where your sign and tone meet, counted from 1 Imix.",
    haab: "The day and month of the 365-day Haab' season your birthday falls in, a farming and ceremonial calendar that turns alongside the sacred count.",
    wayeb:
      "Whether your birthday lands in Wayeb', the five nameless days that close the Haab' year, a quiet, liminal, in-between time, or in the named months outside it.",
    "year-bearer":
      "The Year Bearer (the Mam): the day sign that sat on the Haab' New Year and so carries the whole solar year you were born into, a background nawal over your year.",
    "lord-of-night": "Your Lord of the Night, one of nine night powers (G1 to G9) that cycle under each day and color its mood.",
    trecena: "The thirteen-day wave you belong to, named for the sign that opens it, giving the broader current your own day rides on.",
    "long-count": "The Long Count for your birthday, the deep day count written as five numbers, marking your place in the great span of days.",
  },
};
