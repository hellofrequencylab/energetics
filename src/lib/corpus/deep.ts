/**
 * Deep-dive corpus tier — original, longer-form prose for the most-used factors.
 * Authored here (consensus archetypes in our own words); never copied from any
 * source. Searched via lib/corpus/search.ts; pgvector embeddings are the
 * production retrieval upgrade.
 */

export const SIGN_DEEP: Record<string, string> = {
  Aries:
    "Aries meets life head-on: a cardinal fire that wants to start, to test itself, to be first. Its growth is patience — finishing what its courage so eagerly begins.",
  Taurus:
    "Taurus builds slowly and keeps what it values — comfort, beauty, the steady pleasures of body and earth. Its work is to hold without clutching, to value without fearing loss.",
  Gemini:
    "Gemini is the mind in motion: curious, verbal, delighted by connections and contradictions alike. Its lesson is depth — letting some threads be followed all the way down.",
  Cancer:
    "Cancer feels first and protects what it loves, carrying home wherever it goes. Its path is to nurture others without disappearing behind the shell.",
  Leo:
    "Leo shines by being fully, generously itself, warming a room simply by entering it. Its maturing is to lead from the heart rather than for the applause.",
  Virgo:
    "Virgo refines — noticing the flaw, improving the system, serving through competence. Its freedom arrives when 'good enough' becomes a kind of mercy.",
  Libra:
    "Libra weighs, relates, and seeks the fair and beautiful balance between people. Its growth is choosing — holding a center even when it disappoints someone.",
  Scorpio:
    "Scorpio goes to the depths others avoid — power, intimacy, loss, rebirth — and is changed there. Its work is trust: letting intensity heal rather than control.",
  Sagittarius:
    "Sagittarius reaches for the horizon: meaning, freedom, the larger truth. Its lesson is to root the vision in lived detail, not just the next adventure.",
  Capricorn:
    "Capricorn climbs with patience and strategy, building structures that outlast the climb. Its softening is to remember the mountain is not the meaning.",
  Aquarius:
    "Aquarius thinks in systems and futures, loyal to the whole more than the crowd. Its path is to let the warm individual matter as much as the principle.",
  Pisces:
    "Pisces dissolves the line between self and everything, feeling the ocean others only dip into. Its work is to stay whole while staying open.",
};

export const PLANET_DEEP: Record<string, string> = {
  sun: "The Sun is the spine of the chart — your essential purpose and the vitality restored when you live it. Its placement is where you're meant to shine on purpose.",
  moon: "The Moon is your inner weather and earliest needs — what soothes you, what you reach for instinctively, how you care and want to be cared for.",
  mercury: "Mercury is how you think, speak, and stitch ideas together — your learning style and the texture of your everyday mind.",
  venus: "Venus is your sense of value and pleasure — what you find beautiful, how you love, and what makes relationship and resources feel right.",
  mars: "Mars is your drive and edge — how you assert, desire, compete, and act when you want something.",
  jupiter: "Jupiter is where you expand and trust life — meaning, generosity, luck, and the risk of too much of a good thing.",
  saturn: "Saturn is where you meet limits and earn mastery — the area that asks for patience, discipline, and the slow authority of doing the work.",
  uranus: "Uranus is your wiring for freedom and disruption — where you break form, surprise people, and insist on your own truth.",
  neptune: "Neptune is where boundaries thin — imagination, compassion, spirituality, and the fog of idealization to see through.",
  pluto: "Pluto is where you're remade through depth — power, obsession, loss, and the buried strength that surfaces in crisis.",
  northNode: "The North Node points at unfamiliar growth — the direction that stretches you toward who you're becoming.",
  southNode: "The South Node is the well-worn gift — talents easy to lean on, quietly meant to be shared and released.",
  chiron: "Chiron marks the tender, recurring wound that, once tended, becomes your particular gift for healing it in others.",
};
