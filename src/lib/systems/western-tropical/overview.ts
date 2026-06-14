import type { SystemOverview } from "@/lib/systems/overview-types";

/**
 * Reader-facing overview for the Western (Tropical) system. Original prose,
 * second person, no em dashes. `stats` keys match the engine's native factor
 * keys in engine.ts so each line explains the reader's own placement.
 */
export const overview: SystemOverview = {
  intro:
    "Western tropical astrology reads the sky at the moment and place you were born. It places the Sun, Moon, and planets across twelve signs and, when you give a birth time and location, across twelve houses, then notes the angles those bodies make to each other. The result is a portrait of your temperament, your needs, and the patterns of energy you tend to live out.",
  how:
    "Read your chart in three layers. Signs describe the flavor of each placement, the style in which a planet expresses itself. Houses describe the area of life where that energy lands, from your sense of self to your work and your relationships. Aspects describe how your placements talk to each other: easy flows, charged tensions, and the close pairings that color everything. Start with your Sun, Moon, and Ascendant, then read the rest as supporting voices. Some readings need only your date, and more detail unlocks as you add an exact time and place.",
  appliesToLife:
    "In daily life these placements show up as your habits of attention and reaction. Your Sun points to what you are growing toward and what gives you a sense of purpose. Your Moon shows what soothes you and how you process feeling. The Ascendant shapes your first impression and how you meet a new room. In relationships, Venus and Mars describe how you give affection and how you pursue what you want. At work, Mercury shapes how you think and communicate, while Saturn shows where you build discipline and lasting structure. Read together, they name the strengths you can lean on and the places where growth asks for patience.",
  lineageNote:
    "The tropical zodiac is tied to the seasons rather than the fixed stars: 0 degrees Aries marks the spring equinox in the northern hemisphere, not a constellation. This is a living tradition, practiced and reinterpreted continuously from Hellenistic roots through medieval, Renaissance, and modern hands. Houses, orbs, and the use of the outer planets are working conventions that practitioners still debate, so treat your chart as a language for reflection, not a fixed verdict.",
  stats: {
    sun: "Your core identity and what gives you a sense of purpose.",
    moon: "Your emotional nature, what you need to feel safe, and how you process feeling.",
    ascendant: "Your rising sign: the style in which you meet the world and make a first impression.",
    midheaven: "The top of your chart: your public direction, reputation, and calling in the world.",
    mercury: "How you think, learn, and communicate.",
    venus: "How you love, what you find beautiful, and how you relate and value things.",
    mars: "How you act, assert yourself, and pursue what you want.",
    jupiter: "Where you grow, take risks, and find meaning and opportunity.",
    saturn: "Where you meet limits, build discipline, and earn lasting structure.",
    uranus: "Where you break patterns and seek freedom and change (shared across your generation).",
    neptune: "Where you dream, dissolve boundaries, and reach for the ideal (shared across your generation).",
    pluto: "Where you face deep change, power, and renewal (shared across your generation).",
    northNode: "The growing edge your chart points toward, the direction of development.",
    chiron: "The tender place where you carry a wound and can learn to heal and help others.",
    elements: "Your balance of fire, earth, air, and water across the planets, showing your overall temperament.",
    modalities: "Your balance of cardinal, fixed, and mutable energy: how you start, sustain, and adapt.",
    aspects: "The angles between your planets, showing which energies flow together and which create tension.",
    "lunar-phase": "The Moon's phase at your birth, a note on how your inner and outer drives relate.",
    houses: "The twelve life areas your planets fall into, from self and home to relationship and vocation.",
  },
};
