/**
 * Short, compact labels for systems, used wherever space is tight (the
 * convergence chart ring, dashboard chips, navigation). Falls back to the first
 * word of the display name so a new system always renders something sensible.
 */
export const SHORT_NAME: Record<string, string> = {
  "western-tropical": "Western",
  "vedic-jyotish": "Vedic",
  "chinese-bazi": "BaZi",
  "human-design": "Human Design",
  "numerology-pythagorean": "Numerology",
  "numerology-chaldean": "Name number",
  tzolkin: "Tzolk'in",
  dreamspell: "Dreamspell",
  "tarot-birth-cards": "Tarot",
  hellenistic: "Hellenistic",
  "zi-wei-dou-shu": "Zi Wei",
  "gene-keys": "Gene Keys",
  "nine-star-ki": "Nine Star Ki",
  mahabote: "Mahabote",
  "celtic-tree": "Celtic tree",
  "akan-day-names": "Akan",
  "norse-runes": "Runes",
  "egyptian-decans": "Decans",
};

export const shortName = (id: string, name: string): string => SHORT_NAME[id] ?? name.split(" ")[0];
