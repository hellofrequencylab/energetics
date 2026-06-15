import type { SystemOverview } from "@/lib/systems/overview-types";

/**
 * Reader-facing overview for the Chinese BaZi (Four Pillars) system. Original
 * prose, second person, no em dashes. `stats` keys match the engine's native
 * factor keys in engine.ts so each line explains the reader's own placement.
 */
export const overview: SystemOverview = {
  intro:
    "BaZi, also called the Four Pillars of Destiny, reads the moment you were born as four pairs of Chinese characters. Each pillar covers your year, month, day, and hour, and each one pairs a heavenly stem above an earthly branch. Together the eight characters describe the mix of energies you were born into, the five elements of wood, fire, earth, metal, and water moving through your life.",
  how:
    "Start with your Day Master, the heavenly stem of your day pillar. It stands for you, and its element and its yin or yang quality set the tone for the whole reading. From there, look at the balance of the five elements across all eight characters, stems and branches alike. An element you carry a lot of points to a natural strength you lean on, while your weakest element, shown as your useful element, points to a quality you may seek out or grow into over time. Your day master strength tells you how well rooted you are, from a fresh start through your prime to a quieter, more receptive footing. The ten gods name the working forces around you: peers, your creative output, wealth, authority, and the support you draw on, one read off each pillar. Read the pillars in order as a rough arc, with the year and month leaning toward your early life and roots, and the day and hour leaning toward your adult self and later years. Hold it as a picture of tendencies, not a fixed script. Your hour pillar needs an exact birth time, so the more precise your time, the fuller the chart.",
  appliesToLife:
    "In daily life your Day Master shows up as your default way of meeting the world: whether you tend to push forward and initiate, or to gather, sense, and respond. The element balance often explains why some settings feel like home and others feel like effort. A chart strong in one element brings an easy, reliable strength to lean on, and a thinner element marks a place where pairing up with people who carry it, or building the habit yourself, pays off. In relationships and work it can be a gentle guide to where you give freely and where you may want to ask for support, so you can spend your energy where it flows best.",
  lineageNote:
    "BaZi comes from the Chinese lunisolar calendar tradition, which tracks both the moon and the sun and divides the solar year into seasonal terms. It is a living tradition, studied and practiced continuously for many centuries and still taught and debated by practitioners today. The branch points where one pillar gives way to the next, and the weighing of the elements, are working conventions that schools read in their own ways, so treat your chart as a language for reflection rather than a fixed verdict. The prose and interpretations here are our own.",
  stats: {
    animal:
      "Your zodiac animal, set by your year branch: a broad signature of temperament you share with everyone born in your year.",
    "day-master":
      "Your Day Master: the stem of your day pillar that stands for you, with its element and its yang (active) or yin (receptive) quality.",
    pillars:
      "Your four pillars for year, month, day, and hour, each a heavenly stem over an earthly branch, read together as the shape of your life.",
    elements:
      "Your balance of wood, fire, earth, metal, and water across all eight characters, stems and branches, showing which element you carry most and which you carry least.",
    "ten-gods":
      "The ten gods read off your year, month, day, and hour stems: how each part of the chart relates to you as peer, creative output, wealth, authority, or support.",
    strength:
      "Your day master strength, set by where your day stem sits on the twelve growth stages, from a fresh Birth through your Prime to a quieter, more receptive footing.",
    nayin:
      "The NaYin sound element of your day pillar, an older paired-stem reading that names a poetic image and the underlying phase it carries.",
    "useful-element":
      "Your useful element, the phase your chart carries least and tends to want more of: a gentle direction to lean toward rather than a fix.",
  },
};
