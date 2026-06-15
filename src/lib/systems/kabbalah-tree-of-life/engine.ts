import type { BirthEvent } from "@/lib/core/birth-event";
import type { NativeResult, SystemEngine, SystemMeta } from "@/lib/core/contracts";

export const meta: SystemMeta = {
  id: "kabbalah-tree-of-life",
  displayName: "Kabbalah · Tree of Life",
  lineage: "traditional",
  requires: { time: false, place: false },
  derivedFrom: "name",
  dependsOn: [],
  corpusVersion: "1",
};

/**
 * Gematria of the name placed on the Tree of Life. This is a pure function of the
 * name: no time, place, clock, randomness, or I/O.
 *
 * Gematria assigns each Hebrew letter a number. To read a Latin-script name we
 * transliterate each letter to its nearest Hebrew counterpart and use that
 * letter's standard value. The transliteration choices below are our own
 * original schematic (several Latin letters share a Hebrew home), so this is a
 * reconstruction, labelled as such, not a reproduction of any copyrighted table.
 *
 * The 22 Hebrew letters and their classical values:
 *   Aleph 1, Bet 2, Gimel 3, Dalet 4, He 5, Vav 6, Zayin 7, Chet 8, Tet 9,
 *   Yod 10, Kaf 20, Lamed 30, Mem 40, Nun 50, Samekh 60, Ayin 70, Pe 80,
 *   Tsadi 90, Qof 100, Resh 200, Shin 300, Tav 400.
 */
const LETTER_VALUE: Record<string, number> = {
  A: 1, // Aleph
  B: 2, // Bet
  V: 6, // Vav (also serves W below)
  W: 6, // Vav
  G: 3, // Gimel
  C: 3, // Gimel (hard c) — schematic choice
  D: 4, // Dalet
  E: 5, // He
  H: 5, // He
  F: 80, // Pe (f shares Pe)
  P: 80, // Pe
  Z: 7, // Zayin
  T: 9, // Tet
  I: 10, // Yod
  J: 10, // Yod
  Y: 10, // Yod
  K: 20, // Kaf
  Q: 100, // Qof
  L: 30, // Lamed
  M: 40, // Mem
  N: 50, // Nun
  S: 60, // Samekh
  X: 60, // Samekh (schematic choice)
  O: 70, // Ayin
  U: 70, // Ayin (also serves the vowel; schematic choice)
  R: 200, // Resh
};

/** The ten Sephirot of the Tree of Life, in descending order 1..10. */
const SEPHIROT: { num: number; key: string; name: string; pillar: Pillar }[] = [
  { num: 1, key: "keter", name: "Keter", pillar: "middle" },
  { num: 2, key: "chokmah", name: "Chokmah", pillar: "right" },
  { num: 3, key: "binah", name: "Binah", pillar: "left" },
  { num: 4, key: "chesed", name: "Chesed", pillar: "right" },
  { num: 5, key: "gevurah", name: "Gevurah", pillar: "left" },
  { num: 6, key: "tiferet", name: "Tiferet", pillar: "middle" },
  { num: 7, key: "netzach", name: "Netzach", pillar: "right" },
  { num: 8, key: "hod", name: "Hod", pillar: "left" },
  { num: 9, key: "yesod", name: "Yesod", pillar: "middle" },
  { num: 10, key: "malkuth", name: "Malkuth", pillar: "middle" },
];

type Pillar = "left" | "right" | "middle";

/** Plain-language pillar names, our own copy. */
const PILLAR_LABEL: Record<Pillar, string> = {
  left: "Pillar of Form",
  right: "Pillar of Force",
  middle: "Pillar of Balance",
};

/** The four Worlds of the Kabbalistic cosmos, from densest to most refined. */
const WORLDS: { key: string; name: string; gloss: string }[] = [
  { key: "assiah", name: "Assiah", gloss: "the world of action and the body" },
  { key: "yetzirah", name: "Yetzirah", gloss: "the world of feeling and formation" },
  { key: "beriah", name: "Beriah", gloss: "the world of thought and creation" },
  { key: "atziluth", name: "Atziluth", gloss: "the world of spirit and emanation" },
];

/** Reduce to a single digit 1..9 (used only for the companion root number). */
function reduceDigit(n: number): number {
  let v = Math.abs(n);
  while (v > 9) v = String(v).split("").reduce((s, d) => s + Number(d), 0);
  return v;
}

export const engine: SystemEngine = {
  meta,
  compute(birth: BirthEvent): NativeResult {
    const name = birth.name?.trim();
    if (!name) return { systemId: meta.id, factors: {} }; // needs a name

    const letters = name.toUpperCase().split("").filter((ch) => ch in LETTER_VALUE);
    const gematria = letters.reduce((sum, ch) => sum + LETTER_VALUE[ch], 0);
    if (gematria === 0) return { systemId: meta.id, factors: {} };

    // Sephirah: fold the gematria onto the ten spheres. We map to 1..10 (Keter to
    // Malkuth) by gematria mod 10, with 0 reading as Malkuth (10), the sphere of
    // the manifest world. This is our own placement rule.
    const sephNum = gematria % 10 === 0 ? 10 : gematria % 10;
    const sephirah = SEPHIROT.find((s) => s.num === sephNum) ?? SEPHIROT[9];

    // Path: one of the 22 connecting paths, keyed by the 22 Hebrew letters. We
    // index by gematria mod 22 (1..22), a stable fold onto the lettered paths.
    const pathNum = (gematria % 22) + 1;

    // World: one of the four worlds, by gematria mod 4. A coarse fold that places
    // the name in one of the four planes of being.
    const world = WORLDS[gematria % 4];

    // Root number: the gematria reduced to a single digit, a numerology-friendly
    // companion that lets the Tree converge with the numerology systems.
    const root = reduceDigit(gematria);

    return {
      systemId: meta.id,
      factors: {
        gematria: {
          key: "gematria",
          label: "Gematria",
          value: gematria,
          display: String(gematria),
        },
        sephirah: {
          key: "sephirah",
          label: "Sephirah",
          value: { num: sephirah.num, key: sephirah.key, name: sephirah.name, pillar: sephirah.pillar },
          display: `${sephirah.name} (${sephirah.num})`,
        },
        pillar: {
          key: "pillar",
          label: "Pillar",
          value: { key: sephirah.pillar, name: PILLAR_LABEL[sephirah.pillar] },
          display: PILLAR_LABEL[sephirah.pillar],
        },
        path: {
          key: "path",
          label: "Path",
          value: { num: pathNum },
          display: `Path ${pathNum} of 22`,
        },
        world: {
          key: "world",
          label: "World",
          value: { key: world.key, name: world.name, gloss: world.gloss },
          display: world.name,
        },
        root: { key: "root", label: "Root Number", value: root, display: String(root) },
      },
    };
  },
};
