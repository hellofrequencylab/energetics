import type { SystemOverview } from "../overview-types";

/**
 * Reader-facing overview for the Vedic Jyotish (sidereal, Lahiri) system.
 * Original prose, second person, no em dashes. `stats` keys match the engine's
 * native factor keys in engine.ts so each line explains the reader's own chart.
 */
export const overview: SystemOverview = {
  intro:
    "Vedic Jyotish reads the sky at your birth against the fixed stars rather than the seasons, using the sidereal zodiac with the Lahiri offset. It places the nine grahas (the seven classical planets plus the lunar nodes Rahu and Ketu) across twelve signs and twelve houses counted from your rising sign, and it reads the Moon with special care: its sign, its lunar mansion, and the planetary period that period opens.",
  how:
    "Begin with your Moon, not your Sun. Jyotish treats the Moon-sign and its nakshatra (the lunar mansion it sits in) as the heart of the chart, the lens for your mind and your felt life. From there, read your Lagna (the rising sign) as the frame of the whole chart, and place each graha in its house to see which life areas it colors. Your birth dasha lord names the planetary season your life opens in, and your atmakaraka (the planet at the highest degree) points to a soul level theme. The navamsa, a ninth-harmonic chart, adds an inner reading of strength and partnership. This system needs an exact time and place, since the houses and the rising sign turn quickly through the day.",
  appliesToLife:
    "In daily life your Moon-sign and its nakshatra often describe your instinctive responses, what settles you and what unsettles you, more faithfully than your Sun. The grahas in their houses point to where energy concentrates: a strong tenth house leans toward vocation and standing, a busy seventh toward partnership. Your dasha lord can frame long chapters of life, a reminder that timing matters and that different strengths come forward in different seasons. Rahu shows where you reach and hunger for more, and Ketu where you already carry depth and can let go. Read together, the chart is a map of tendencies and timing, not a fixed fate.",
  lineageNote:
    "Jyotish is a living tradition from the Indian subcontinent, practiced and taught continuously for many centuries. It uses a sidereal zodiac tied to the stars, so a planet's sign here often differs from its tropical sign by around 24 degrees. We use the Lahiri ayanamsa, one widely used convention among several, and whole-sign houses. The choice of ayanamsa, house system, and dasha scheme are working conventions that schools read in their own ways, so treat your chart as a language for reflection rather than a fixed verdict. The prose and interpretations here are our own.",
  stats: {
    lagna: "Your Lagna (rising sign): the frame of the whole chart and the first house your other placements are counted from.",
    sun: "Surya, your Sun: your core vitality and sense of self, read as one voice among the grahas rather than the lead.",
    moon: "Chandra, your Moon: the heart of a Jyotish chart, your mind, moods, and instinctive responses.",
    mercury: "Budha, your Mercury: how you think, learn, speak, and reason.",
    venus: "Shukra, your Venus: how you love, enjoy, and value things and people.",
    mars: "Mangala, your Mars: your drive, courage, and how you assert yourself.",
    jupiter: "Guru, your Jupiter: where you grow, find wisdom, and meet good fortune and guidance.",
    saturn: "Shani, your Saturn: where you meet limits, responsibility, and the slow rewards of patience.",
    rahu: "Rahu, the north lunar node: where you reach, hunger, and chase new experience.",
    ketu: "Ketu, the south lunar node: where you already carry depth and can release and turn inward.",
    janma: "Your Janma Nakshatra: the lunar mansion your Moon occupies, a fine grained read of your inner nature.",
    "janma-rasi": "Your Janma Rasi: the sign your Moon sits in, the chart a Jyotishi reads first.",
    "dasha-lord": "Your birth dasha lord: the planet whose long season your life opens in, set by your Moon's nakshatra.",
    atmakaraka: "Your atmakaraka: the planet at the highest degree, a soul level significator of what you are here to grow.",
    tatva: "Your element balance across the nine grahas, showing which element your chart leans toward overall.",
  },
};
