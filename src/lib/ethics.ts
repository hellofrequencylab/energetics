/**
 * Lineage-honesty content (spec: Maya §6, Western §7, Human Design §7 — all
 * non-optional). Surfaced in a shared ethics panel so traditions are named,
 * living-ness acknowledged, modern reconstructions clearly marked, and nothing
 * is framed as deterministic fate.
 */
import type { Lineage } from "@/lib/core/contracts";

export const FRAMING = [
  "These are symbolic and traditional systems for self-reflection — not empirically validated, predictive sciences.",
  "Read every placement as a predisposition or energy to work with, never as fixed fate. No medical, financial, or deterministic claims.",
  "Where a system comes from a living or indigenous tradition, it is named as such and remains the property of that tradition, not ours.",
];

export const LINEAGE_NOTE: Record<Lineage, string> = {
  traditional: "Rooted in a documented historical or living tradition.",
  "modern-reconstruction":
    "A modern (mostly 20th-century) construction inspired by older motifs — not an ancestral practice. Labeled as such, never presented as ancient.",
  hybrid: "A modern synthesis drawing on older traditions.",
};

/** Per-system honesty notes for the systems that most need them. */
export const SYSTEM_NOTE: Record<string, string> = {
  tzolkin:
    "The Cholq'ij is a continuous, LIVING calendar kept by Maya daykeepers (ajq'ijab') in highland Guatemala today — not a dead artifact, and not ours.",
  dreamspell:
    "Argüelles' 1987 reconstruction uses a different, leap-day-skipping correlation. It is NOT the count Maya communities keep; shown for interest only and excluded from the structural synthesis.",
  "western-tropical":
    "Tropical signs are tied to the seasons, not today's constellations — the two have diverged ~24° through precession.",
  "vedic-jyotish": "Jyotish, a living astrological tradition of the Indian subcontinent.",
  "chinese-bazi": "BaZi (Four Pillars), from the Chinese lunisolar calendar tradition.",
  "human-design":
    "Synthesized by Ra Uru Hu in 1987 from astrology, the I Ching, the Kabbalah and the chakra system. Its founder framed it as an experiment to test in your own experience, not dogma. ('Human Design' terminology is trademarked; our interpretive prose is original.)",
  "gene-keys": "A contemplative framework derived from the same I-Ching gate work as Human Design.",
  "celtic-tree":
    "A 20th-century construction (Robert Graves' Ogham calendar), not an attested ancient Druidic practice.",
  "norse-runes": "A modern mapping of the Elder Futhark onto the calendar, not an attested historical practice.",
  "numerology-chaldean": "Name-based numerology of Babylonian/Chaldean origin.",
};
