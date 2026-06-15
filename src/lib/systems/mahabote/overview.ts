import type { SystemOverview } from "@/lib/systems/overview-types";

/**
 * Reader-facing overview for Mahabote (Burmese astrology). Original prose, second
 * person, no em dashes. `stats` keys match the engine's native factor keys in
 * engine.ts so each line explains the reader's own placement.
 */
export const overview: SystemOverview = {
  intro:
    "Mahabote is the folk astrology of Burma, built around the day of the week you were born. That weekday gives you a ruling planet and a mythical animal, your birth sign. From there the seven planets are seated around a figure of seven houses, each house a station of life such as the self, gain, standing, mastery, loss, support, and increase. The pattern names where your energy gathers and where it is tested.",
  how:
    "Start with your weekday sign, the steady core of the reading: your ruling planet and its animal, which most Burmese people know about themselves. Then look at the figure. Each of the seven houses holds one planet, and two readings matter most. Your ruling planet's house tells you the station your core nature operates from, and whether that footing is favorable or testing. The planet in your Binga house is your seed planet, the quality at the root of who you are. Your Adipati house is your house of mastery, a clear strength, and your Marana house is your house of testing, where energy can drain and growth is asked of you. Hold the favorable and testing labels lightly: a testing house is an invitation to grow, not a sentence.",
  appliesToLife:
    "Your weekday sign is a shared, everyday language in Burmese life, used for names, offerings, and a quick read on temperament, so it can be a warm point of connection. The figure goes deeper. Knowing which house your ruling planet sits in can explain why one arena of life, money, standing, family, or service, tends to be where your story keeps unfolding. Your mastery planet points to a strength worth leaning on and building a life around, and your testing planet points to the place where patience, support from others, and steady effort pay off most. Read it as a map of emphasis, not a fixed fate.",
  lineageNote:
    "Mahabote comes from Burmese tradition, which braids together Indian planetary lore and local custom, and it is still part of daily life in Myanmar, where the weekday sign is widely known and used. Practitioners build the figure in their own ways, and the house construction has several living variants. We compute the weekday sign straight from your civil date, which is firm, and we build the seven-house figure with an original, deterministic version of the year-remainder method, so your result is stable and never reproduces copyrighted text. Treat the figure as a respectful schematic for reflection. The prose and interpretations here are our own.",
  stats: {
    sign:
      "Your weekday sign: the ruling planet and mythical animal of the day you were born, the steady core of a Mahabote reading.",
    "ruling-house":
      "The house your ruling planet sits in: the station your core nature works from, and whether that footing is favorable or testing.",
    "binga-planet":
      "The planet in your Binga (self) house: your seed planet, the quality at the root of who you are.",
    "adipati-planet":
      "The planet in your Adipati (mastery) house: a clear strength you can lean on and build around.",
    "marana-planet":
      "The planet in your Marana (testing) house: the place where energy can drain and where patience and support pay off most.",
    figure:
      "Your full Mahabote figure: which of the seven planets sits in each of the seven houses, read together as the shape of your life.",
  },
};
