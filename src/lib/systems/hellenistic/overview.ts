import type { SystemOverview } from "../overview-types";

/**
 * Reader-facing overview for the Hellenistic astrology system. Original prose,
 * second person, no em dashes. `stats` keys match the engine's native factor
 * keys in engine.ts so each line explains the reader's own chart.
 */
export const overview: SystemOverview = {
  intro:
    "Hellenistic astrology is the older Greco-Roman root of Western practice, built around a handful of clear, structural ideas: whether you were born by day or by night, which luminary leads your chart, the planet that rules your rising sign, and a set of calculated points called lots. It reads with the seven visible planets and a strong sense of order, asking which planets are working with the grain of your chart and which against it.",
  how:
    "Start with your sect, day or night, because it reorganizes the whole chart. In a day chart the Sun leads and brings the day planets forward; in a night chart the Moon leads. Your sect light is that leading luminary, and its sign, house, and triplicity lords describe the shape and arc of your life. Your chart ruler, the classical lord of your rising sign, acts as a steward for the whole nativity, so where it sits matters. The Lot of Fortune points to the body, fortune, and circumstance, and the Lot of Spirit to mind, action, and what you set out to do. The benefic and malefic of your sect tell you which planet tends to help most and which, though challenging, is more bearable for you. This system needs an exact time and place.",
  appliesToLife:
    "In daily life sect often shows in your basic orientation: day charts tend to lead with clarity and visibility, night charts with feeling and adaptation. Your chart ruler describes a thread that runs through everything, the steward of your story, so its house points to where your life keeps returning. The Lot of Fortune can mark where ease and resource gather, and the Lot of Spirit where your deliberate effort and ambition live. Knowing your benefic of sect tells you which strength to lean on, and knowing your malefic of sect names a pressure you can learn to work with rather than against. Read together, the chart is a map of structure and emphasis, not a fixed verdict.",
  lineageNote:
    "Hellenistic astrology was practiced across the Greek-speaking Mediterranean from roughly the second century before the common era through late antiquity, then largely set aside in the West before a modern revival drawing on translated source texts. We treat it as a reconstruction in spirit: a careful reading of techniques like sect, triplicity rulers, and the lots, expressed in our own words. The choice of house system, lot formulas, and time-lord schemes are working conventions, so treat your chart as a language for reflection rather than a fixed verdict.",
  stats: {
    sect: "Whether you were born by day or by night, the single fact that reorganizes the whole chart.",
    "sect-light": "The luminary that leads your chart: the Sun by day, the Moon by night.",
    "sect-light-detail": "Where your leading luminary sits, by sign and house and how angular it is, a measure of its strength.",
    "triplicity-lords": "The classical lords of your sect light's element, read for the arc and quality of your life.",
    fortune: "Your Lot of Fortune: a calculated point for body, fortune, and circumstance, shown with its ruling planet.",
    spirit: "Your Lot of Spirit: a calculated point for mind, action, and deliberate purpose, shown with its ruling planet.",
    "chart-ruler": "The classical ruler of your rising sign, a steward that speaks for the whole chart.",
    "sect-benefic": "The planet best placed to help you, given your sect: lean on its strengths.",
    "sect-malefic": "The harder planet of your sect: challenging, but more bearable for you than the other.",
    "time-lord": "The planet that opens the first season of your life in the classical time-lord sequence, set by your sect.",
  },
};
