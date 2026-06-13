/**
 * Interpretation corpus — quick-guide tier (spec §6). Original, concise
 * keyword-level prose (the broad cross-source consensus archetypes), NEVER
 * copied write-ups. Deep-dive prose + pgvector retrieval are a later tier.
 */

/** The 12 signs (shared by Western tropical and Vedic sidereal rasis). */
export const SIGN_GUIDE: Record<string, string> = {
  Aries: "Initiating fire — bold, direct, eager to begin.",
  Taurus: "Steady earth — grounded, sensual, patient with the tangible.",
  Gemini: "Curious air — quick, communicative, many-threaded.",
  Cancer: "Protective water — feeling, nurturing, home-rooted.",
  Leo: "Radiant fire — expressive, generous, wants to be seen.",
  Virgo: "Discerning earth — precise, helpful, refines the craft.",
  Libra: "Relational air — balancing, aesthetic, seeks fairness.",
  Scorpio: "Intense water — probing, transformative, all-or-nothing.",
  Sagittarius: "Questing fire — expansive, candid, meaning-seeking.",
  Capricorn: "Building earth — disciplined, strategic, the long game.",
  Aquarius: "Inventive air — independent, systemic, future-leaning.",
  Pisces: "Boundless water — empathic, imaginative, dissolving edges.",
};

/** Planets, luminaries, nodes, and Chiron. */
export const PLANET_GUIDE: Record<string, string> = {
  sun: "Core identity and vitality — what you're here to shine.",
  moon: "Inner emotional world — needs, instincts, what soothes.",
  mercury: "Mind and voice — how you think, learn, and connect.",
  venus: "Love and value — what you're drawn to and how you relate.",
  mars: "Drive and assertion — how you act and pursue.",
  jupiter: "Growth and faith — where you expand and seek meaning.",
  saturn: "Structure and limit — where you mature through discipline.",
  uranus: "Disruption and freedom — where you break the mold.",
  neptune: "Dream and dissolution — where you transcend or idealize.",
  pluto: "Power and rebirth — where you're remade through depth.",
  northNode: "Growth direction — the unfamiliar you're moving toward.",
  southNode: "Familiar gifts — the comfort you're learning to release.",
  chiron: "The tender wound — where pain becomes healing wisdom.",
};

/** Numerology numbers (Life Path / name), incl. master numbers. */
export const NUMBER_GUIDE: Record<number, string> = {
  1: "The pioneer — independence, initiative, leadership.",
  2: "The diplomat — partnership, sensitivity, harmony.",
  3: "The communicator — expression, creativity, joy.",
  4: "The builder — structure, diligence, foundations.",
  5: "The seeker — freedom, change, experience.",
  6: "The nurturer — responsibility, care, beauty.",
  7: "The contemplative — analysis, depth, the unseen.",
  8: "The achiever — power, mastery, the material world.",
  9: "The humanitarian — compassion, completion, release.",
  11: "Master intuition — inspiration, vision, heightened sensitivity.",
  22: "Master builder — turning vast vision into form.",
  33: "Master teacher — devotion in the service of others.",
};

/** Tzolk'in day-signs (Yucatec keys). */
export const DAYSIGN_GUIDE: Record<string, string> = {
  Imix: "Primordial waters — source, nurture, the unformed.",
  "Ik'": "Wind and breath — spirit, communication, life-force.",
  "Ak'bal": "Night and dawn — dreams, mystery, the inner home.",
  "K'an": "Seed — potential, ripening, abundance.",
  Chikchan: "Serpent — instinct, vitality, awakening.",
  Kimi: "Transformer — release, ancestors, rebirth.",
  "Manik'": "Deer / hand — grounding, healing, stewardship.",
  Lamat: "Star — harmony, art, fertile abundance.",
  Muluk: "Water / offering — emotion, purification, flow.",
  Ok: "Dog — loyalty, guidance, companionship.",
  Chuwen: "Monkey — weaving, play, the artisan.",
  Eb: "Road — the path, service, the human journey.",
  Ben: "Reed — home, growth, the spine of things.",
  Ix: "Jaguar — earth-magic, shamanic power.",
  Men: "Eagle — vision, freedom, the higher mind.",
  Kib: "Owl — ancestral wisdom, forgiveness.",
  Kaban: "Earth — intellect, synchronicity, movement.",
  "Etz'nab": "Flint — truth, clarity, the cutting edge.",
  Kawak: "Storm — renewal, community, activation.",
  Ajaw: "Sun / lord — mastery, wholeness, enlightenment.",
};

/** Tzolk'in tones (galactic numbers 1–13). */
export const TONE_GUIDE: Record<number, string> = {
  1: "Unity — intention, the seed of purpose.",
  2: "Duality — polarity, relationship, challenge.",
  3: "Movement — rhythm, activation, expression.",
  4: "Stability — structure, measure, the four directions.",
  5: "Center — empowerment, command, radiance.",
  6: "Flow — response, organic balance.",
  7: "Reflection — attunement, the still point.",
  8: "Harmony — integrity, modeling, justice.",
  9: "Completion — patience, the greater pattern.",
  10: "Manifestation — the tangible, responsibility.",
  11: "Dissolution — liberation, letting go.",
  12: "Cooperation — integration, the gathering.",
  13: "Transcendence — ascension, the cosmic edge.",
};

/** Tarot Major Arcana (0–21). */
export const ARCANA_GUIDE: Record<number, string> = {
  0: "The Fool — open beginnings, trust, the leap.",
  1: "The Magician — focused will, skill, voice.",
  2: "The High Priestess — inner knowing, mystery.",
  3: "The Empress — abundant care, creativity, the senses.",
  4: "The Emperor — structure, authority, foundations.",
  5: "The Hierophant — tradition, teaching, shared meaning.",
  6: "The Lovers — union, choice, values.",
  7: "The Chariot — drive, direction, disciplined momentum.",
  8: "Strength — quiet courage, patience, the gentled heart.",
  9: "The Hermit — inner light, solitude, the search.",
  10: "Wheel of Fortune — cycles, change, turning points.",
  11: "Justice — balance, truth, accountability.",
  12: "The Hanged Man — surrender, new perspective.",
  13: "Death — endings, release, transformation.",
  14: "Temperance — alchemy, patience, the middle way.",
  15: "The Devil — shadow, attachment, the bind to face.",
  16: "The Tower — upheaval, sudden truth, breakthrough.",
  17: "The Star — hope, healing, gentle renewal.",
  18: "The Moon — dreamscape, intuition, the deep.",
  19: "The Sun — vitality, joy, clarity.",
  20: "Judgement — awakening, reckoning, rebirth.",
  21: "The World — wholeness, completion, arrival.",
};
