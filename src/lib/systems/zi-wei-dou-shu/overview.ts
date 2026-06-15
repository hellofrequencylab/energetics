import type { SystemOverview } from "@/lib/systems/overview-types";

/**
 * Reader-facing overview for Zi Wei Dou Shu (Purple Star astrology). Original
 * prose, second person, no em dashes. `stats` keys match the engine's native
 * factor keys in engine.ts so each line explains the reader's own placement.
 *
 * Honest lineage note: the frame (lunar basis, palaces, bureau, polarity) is
 * computed confidently and feeds the synthesis; the star placement is shown for
 * context but is validation-pending and kept out of the cross-system reading.
 */
export const overview: SystemOverview = {
  intro:
    "Zi Wei Dou Shu, the Purple Star, is a Chinese system that lays your birth moment out as a chart of twelve palaces, each governing an area of life such as the self, wealth, career, and relationships. Stars are then placed into those palaces, led by the Purple Star itself, Zi Wei, the emperor at the center of the sky. The pattern reads as a detailed map of where your energy concentrates across a life.",
  how:
    "Start with the frame, the part we compute most confidently. Your Life Palace is the seat of the self, set by your lunar month and birth hour, and its branch carries an element and an animal that color your core nature. Your Body Palace marks how you grow and what you build toward over time. Your Five Elements Bureau names the elemental ground of the whole chart, the phase the reading is rooted in, and your chart polarity gives its yang or yin charge. The twelve palaces are then laid out in order from the Life Palace. The major stars, including Zi Wei, are placed by the classic method and shown for context, but we treat that layer as provisional, so it does not sway your cross-system reading until we can check it against a trusted calculator. Your birth hour matters here, so the more exact your time, the truer the frame.",
  appliesToLife:
    "The frame already says a lot. The element and animal of your Life Palace point to a default temperament and the kind of footing you operate from, while your Body Palace hints at where your effort tends to flow as you mature. The Five Elements Bureau is a useful anchor: it names the phase your chart leans on, which often explains the settings where you feel most at home. The twelve palaces give a vocabulary for noticing which arenas of life carry the most weight for you, from family and home to work and partnership. As we confirm the star layer, the reading will deepen, but even the frame can guide where to spend your energy and where to ask for support.",
  lineageNote:
    "Zi Wei Dou Shu is a traditional Chinese system, studied and practiced continuously and taught by many schools that differ on the finer rules, especially the exact star placements and how palace boundaries are drawn. We compute the lunar basis, the Life and Body palaces, the Five Elements Bureau, and the chart polarity confidently and use those in the wider reading. The Purple Star and the fourteen major stars are placed by the standard algorithm but are validation-pending in this environment, so we show them for context and keep them out of the cross-system synthesis until verified. The prose and interpretations here are our own.",
  stats: {
    lunar:
      "Your lunar birth date and year pillar, the lunisolar basis the whole chart is built on, with its yang or yin charge.",
    "life-palace":
      "Your Life Palace, the seat of the self, with the element and animal of its branch coloring your core nature.",
    "body-palace":
      "Your Body Palace, which speaks to how you grow and what you build toward over time, with its branch element and animal.",
    bureau:
      "Your Five Elements Bureau, the elemental ground of the whole chart: the phase your reading is rooted in.",
    "zi-wei":
      "The palace your Purple Star (Zi Wei) sits in, the emperor star at the heart of the chart (shown for context, validation-pending).",
    stars:
      "The fourteen major stars placed across your palaces (shown for context, validation-pending, and kept out of the cross-system reading for now).",
    palaces:
      "Your twelve palaces in order from the Life Palace, each governing an area of life such as wealth, career, home, and relationships.",
    polarity:
      "Your chart polarity, the yang (active) or yin (receptive) charge set by your year stem.",
  },
};
