import type { SystemOverview } from "@/lib/systems/overview-types";

/**
 * Reader-facing overview for the Gene Keys system. Original prose, second person,
 * no em dashes. `stats` keys match the engine's native factor keys in engine.ts
 * so each line explains the reader's own sphere. We do not reproduce the licensed
 * per-gate Shadow, Gift, and Siddhi corpus, only the structure of your profile.
 */
export const overview: SystemOverview = {
  intro:
    "Gene Keys reads your birth chart as a map of 64 archetypes, the same 64 gates Human Design uses, and arranges them into a contemplative profile. Each sphere in your profile sits on one gate and one line, and points at a particular part of life: how you create, how you love, and how you make your way in the world. It is built for slow reflection rather than quick labels.",
  how:
    "Your profile comes in three sequences, and they unfold in order. Start with the Activation Sequence, the four prime spheres of your Life's Work, Evolution, Radiance, and Purpose. These describe your core genius and the central challenge that grows you. Next is the Venus Sequence, which reads how you love, feel, and open the heart, ending in a tender Core that becomes a source of stability when you meet it with patience. Last is the Pearl Sequence, your gifts as they meet work and prosperity. Read each sphere by its gate and line, and notice the line numbers that repeat, since they hint at a shared keynote in how you live these gifts. Hold it all lightly, as an invitation to contemplate rather than a verdict.",
  appliesToLife:
    "Gene Keys tends to land as a slow, kind mirror. The Activation spheres often name the work that feels most like you and the recurring snag that, worked with rather than fought, becomes your growth. The Venus Sequence can make sense of patterns in your relationships, why certain hurts keep surfacing, and how tenderness toward them changes the way you connect. The Pearl Sequence speaks to vocation and ease with money and resources, pointing at the gift that opens flow when you stop forcing. Used gently over time, it is less a personality test and more a practice of noticing.",
  lineageNote:
    "Gene Keys is a modern synthesis created by Richard Rudd, growing out of Human Design and sharing its 64 gates, with roots in the I Ching. It is best held as a contemplative path to test in your own life rather than received fact. The Gene Keys name and the per-gate Shadow, Gift, and Siddhi contemplations are the author's licensed work, and we do not reproduce them. We compute only the gate and line of each sphere, the same maths Human Design uses, and the descriptions and interpretations here are our own.",
  stats: {
    lifesWork: "Your Life's Work sphere: the core creative expression you are here to bring, drawn from your personality Sun.",
    evolution: "Your Evolution sphere: the central challenge that stretches and grows you, drawn from your personality Earth.",
    radiance: "Your Radiance sphere: what restores your vitality and lights you up when you are aligned, drawn from your design Sun.",
    purpose: "Your Purpose sphere: your deeper direction and contribution, drawn from your design Earth.",
    attraction: "Your Attraction sphere: the pattern that draws relationships toward you, drawn from your design Moon.",
    iq: "Your IQ sphere: how your mind learns and solves, the intelligence of clear thinking, drawn from your design Venus.",
    eq: "Your EQ sphere: how you feel, bond, and read others, the intelligence of the heart, drawn from your personality Venus.",
    sq: "Your SQ sphere: the intuitive intelligence behind your choices and timing, drawn from your personality Mars.",
    core: "Your Core sphere: the tender wound that, met with patience, becomes a source of stability, drawn from your design Mars.",
    vocation: "Your Vocation sphere: the work that fits you and lifts your prosperity, drawn from your personality Jupiter.",
    culture: "Your Culture sphere: the wider circle and field you are here to serve, drawn from your design Jupiter.",
    brand: "Your Pearl sphere: the simple gift that opens flow when you stop trying, drawn from your design Sun.",
    activationSequence: "Your four prime spheres together, the Activation Sequence that maps your core genius and life direction.",
    venusSequence: "Your relationship spheres together, the Venus Sequence that reads how you love, feel, and open the heart.",
    pearlSequence: "Your prosperity spheres together, the Pearl Sequence that reads your gifts as they meet work and the world.",
    keynoteLine: "The line number that repeats most across your four prime spheres, a hint at how you tend to embody your gifts.",
  },
};
