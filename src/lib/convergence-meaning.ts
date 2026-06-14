/**
 * Plain-language meaning for an ontology value: what the theme is, and how it
 * tends to show up in a life. Used by the convergence chart's Quick info panel.
 * Original prose, deterministic, read-only. Keyed by axis then bare value (the
 * part after any "family:" namespace), so western:fire and chinese:fire share the
 * fire read while staying distinct values in the synthesis.
 */
import type { OntologyAxis } from "@/lib/core/contracts";

export interface ValueMeaning {
  essence: string;
  life: string;
}

const ELEMENT: Record<string, ValueMeaning> = {
  fire: { essence: "Drive, warmth, and the urge to begin", life: "When fire runs strong you initiate, inspire, and move first. In life it shows up as enthusiasm and momentum. The work is to channel the spark so it warms rather than burns out." },
  earth: { essence: "Groundedness, patience, and the tangible", life: "Earth makes you build, steady, and tend what is real. In life it shows up as reliability and follow-through. The work is to stay solid without becoming stuck." },
  air: { essence: "Mind, connection, and exchange", life: "Air has you thinking, talking, and linking ideas and people. In life it shows up as curiosity and social ease. The work is to land your ideas, not only circulate them." },
  water: { essence: "Feeling, depth, and flow", life: "Water has you sensing undercurrents and moving around obstacles. In life it shows up as empathy and intuition. The work is to feel fully without being swept away." },
  wood: { essence: "Upward growth and vision", life: "Wood has you planning, expanding, and pushing toward the light. In life it shows up as ambition and benevolence. The work is to bend without breaking." },
  metal: { essence: "Clarity, structure, and refinement", life: "Metal has you cutting to what matters and holding standards. In life it shows up as discernment and poise. The work is to stay precise without going rigid." },
};

const POLARITY: Record<string, ValueMeaning> = {
  active: { essence: "An outward, initiating current", life: "You tend to move first, push, and make things happen. In life it shows up as initiative and visible energy. It is balanced by knowing when to wait." },
  receptive: { essence: "An inward, attuning current", life: "You tend to receive, respond, and read the moment. In life it shows up as patience and sensitivity to timing. It is balanced by knowing when to move." },
  balanced: { essence: "Both push and pause", life: "You carry both currents, so your real task is timing: when to act, and when to let things come to you." },
};

const THEME: Record<string, ValueMeaning> = {
  leadership: { essence: "A pull to direct and take responsibility", life: "You set direction and carry the weight others lean on. In life it shows up as people looking to you to decide. The growth is to lead without needing to control." },
  communication: { essence: "Words, ideas, and exchange", life: "You connect through what you say and hear. In life it shows up as a knack for explaining, linking, and persuading. The growth is to listen as much as you speak." },
  sensitivity: { essence: "Fine-tuned receptivity to feeling", life: "You pick up moods and undercurrents others miss. In life it shows up as empathy and a need for gentle environments. The growth is a boundary so you are not flooded." },
  transformation: { essence: "Depth, endings, and rebirth", life: "You are changed by what you go through, and you change what you touch. In life it shows up as intensity and a refusal of the surface. The growth is to let intensity heal rather than control." },
  structure: { essence: "Order, form, and reliability", life: "You build frameworks that last. In life it shows up as dependability and a steady hand. The growth is to keep the structure serving you, not the reverse." },
  nurture: { essence: "Care, provision, and safety", life: "You tend and make others feel held. In life it shows up as the one who provides and protects. The growth is to include yourself in the care." },
  exploration: { essence: "A reach for the new and meaningful", life: "You expand horizons and chase what matters. In life it shows up as wanderlust and big questions. The growth is to root the vision in lived detail." },
  discipline: { essence: "Focus, effort, and the long game", life: "You do the work and stay the course. In life it shows up as grit and the ability to delay reward. The growth is to let rest and play count too." },
  intuition: { essence: "A direct, non-verbal knowing", life: "You sense answers before you can explain them. In life it shows up as good hunches and reading rooms. The growth is to trust it, and to check it." },
  vision: { essence: "A future-facing imagination", life: "You see what could be. In life it shows up as ideas ahead of their time. The growth is to ground the vision in a first real step." },
  service: { essence: "A pull to be useful", life: "You help through competence and care. In life it shows up as fixing, improving, and showing up. The growth is to serve from fullness, not depletion." },
  sovereignty: { essence: "Self-possession and your own authority", life: "You move under your own steam and resist being managed. In life it shows up as independence and quiet power. The growth is to stay open while standing in it." },
  devotion: { essence: "Deep commitment to chosen bonds", life: "You give yourself fully to people and values you choose. In life it shows up as loyalty and wholeheartedness. The growth is to choose where your loyalty lands." },
  analysis: { essence: "A drive to examine and refine", life: "You see the parts and the flaws. In life it shows up as precision and useful critique. The growth is to let 'good enough' be a kind of mercy." },
  play: { essence: "Spontaneity, joy, and lightness", life: "You create through delight. In life it shows up as humor and a refusal to take everything heavily. The growth is to let play carry real weight." },
};

const CENTER: Record<string, ValueMeaning> = {
  head: { essence: "Mental pressure and inspiration", life: "The urge to make sense of things and ask questions. It drives your curiosity and the problems you choose to chew on." },
  ajna: { essence: "How you process concepts", life: "Your way of thinking things through and holding ideas. It shapes how you form and defend a view." },
  throat: { essence: "Expression and manifestation", life: "How you speak and bring things into the world. It governs whether ideas stay inside or become action." },
  g: { essence: "Identity, love, and direction", life: "Your sense of who you are and where you are headed. It steers your direction and the people you feel at home with." },
  heart: { essence: "Willpower and worth", life: "Drive, ego, and what you commit to. It governs the promises you make and the proving you do." },
  sacral: { essence: "Life-force and work energy", life: "What you have the energy to sustain. It governs the work and relationships that genuinely light you up." },
  "solar-plexus": { essence: "Emotional waves", life: "Your feelings move in cycles, and clarity comes over time. It asks you to ride the wave before deciding." },
  spleen: { essence: "Instinct and well-being", life: "In-the-moment intuition and a sense of safety. It is the quiet voice that keeps you well." },
  root: { essence: "Pressure and drive", life: "The adrenalized push to get things done. It fuels your momentum and, unmanaged, your stress." },
};

const DOMAIN: Record<string, ValueMeaning> = {
  self: { essence: "Identity and how you show up", life: "This colors your whole approach to life and the first impression you make." },
  resources: { essence: "Money, values, and security", life: "Where you build stability and what you treat as worth having." },
  communication: { essence: "Learning and daily exchange", life: "How you think, speak, and move through everyday connections." },
  home: { essence: "Roots, family, and belonging", life: "Where you come from and what makes you feel safe and held." },
  creativity: { essence: "Play, romance, and expression", life: "How you create, flirt, and let yourself be seen for joy." },
  "service-health": { essence: "Work, habits, and the body", life: "The daily routines and care that keep you functioning well." },
  relationship: { essence: "Partnership and the one-to-one", life: "How you meet another as an equal, and what you seek in a partner." },
  transformation: { essence: "Intimacy, shared resources, and change", life: "Where you merge deeply with others and are remade by it." },
  philosophy: { essence: "Meaning, travel, and the big picture", life: "What you believe and how far you reach for understanding." },
  vocation: { essence: "Career and public role", life: "How you are known in the world and what you are building toward." },
  community: { essence: "Friends, networks, and the future", life: "The people you build with and the future you aim at together." },
  spirituality: { essence: "The unseen, rest, and dissolution", life: "Where the boundaries of self soften, in rest, art, or the sacred." },
};

const BY_AXIS: Partial<Record<OntologyAxis, Record<string, ValueMeaning>>> = {
  element: ELEMENT,
  polarity: POLARITY,
  theme: THEME,
  center: CENTER,
  domain: DOMAIN,
};

/** The meaning of an (axis, value), or null if we do not have prose for it yet. */
export function convergenceMeaning(axis: OntologyAxis, value: string): ValueMeaning | null {
  const bare = value.includes(":") ? value.split(":")[1] : value;
  return BY_AXIS[axis]?.[bare] ?? null;
}
