import type { BirthEvent } from "@/lib/core/birth-event";
import type { NativeResult, SystemEngine, SystemMeta } from "@/lib/core/contracts";

export const meta: SystemMeta = {
  id: "numerology-chaldean",
  displayName: "Numerology (Chaldean)",
  lineage: "traditional",
  requires: { time: false, place: false },
  derivedFrom: "name",
  dependsOn: [],
  corpusVersion: "2",
};

/**
 * Chaldean letter values (1–8; 9 is never assigned — considered sacred). This is
 * the platform's only `name`-derived system, so it forms its own independence
 * group: when it agrees with an ephemeris and a date system, that's the strong
 * three-source convergence the synthesis is built to surface.
 */
const CHALDEAN: Record<string, number> = {
  A: 1, I: 1, J: 1, Q: 1, Y: 1,
  B: 2, K: 2, R: 2,
  C: 3, G: 3, L: 3, S: 3,
  D: 4, M: 4, T: 4,
  E: 5, H: 5, N: 5, X: 5,
  U: 6, V: 6, W: 6,
  O: 7, Z: 7,
  F: 8, P: 8,
};

/** Reduce to a single digit 1–9 (Chaldean uses no master numbers). */
function reduce(n: number): number {
  let v = n;
  while (v > 9) v = String(v).split("").reduce((s, d) => s + Number(d), 0);
  return v;
}

/** Vowels for the soul-urge / personality split. Y is read as a consonant here. */
const VOWELS = new Set(["A", "E", "I", "O", "U"]);

/** Letters of the name that carry a Chaldean value, in order. */
function valuedLetters(name: string): string[] {
  return name.toUpperCase().split("").filter((ch) => ch in CHALDEAN);
}

export const engine: SystemEngine = {
  meta,
  compute(birth: BirthEvent): NativeResult {
    const name = birth.name?.trim();
    if (!name) return { systemId: meta.id, factors: {} }; // needs a name

    const letters = valuedLetters(name);
    const total = letters.reduce((sum, ch) => sum + CHALDEAN[ch], 0);
    if (total === 0) return { systemId: meta.id, factors: {} };

    // Soul-urge reads the vowels; personality reads the consonants. Both use the
    // same Chaldean values as the name number, just partitioned by letter class.
    const vowelTotal = letters.reduce(
      (sum, ch) => sum + (VOWELS.has(ch) ? CHALDEAN[ch] : 0),
      0,
    );
    const consonantTotal = letters.reduce(
      (sum, ch) => sum + (!VOWELS.has(ch) ? CHALDEAN[ch] : 0),
      0,
    );

    const nameNumber = reduce(total);
    const soulUrge = reduce(vowelTotal);
    const personality = reduce(consonantTotal);

    // Cornerstone and capstone: the value of the first and last valued letter of
    // the name, a traditional read of how you approach a thing and how you finish
    // it. Both reduce to single digits.
    const cornerstone = reduce(CHALDEAN[letters[0]]);
    const capstone = reduce(CHALDEAN[letters[letters.length - 1]]);

    // Hidden passion: the single-digit value that appears most often across the
    // valued letters, an underlying drive that keeps surfacing. Ties break by the
    // lowest digit so the result is deterministic.
    const hiddenPassion = mostFrequentValue(letters);

    // Maturity-of-name (balance): the name number and the soul urge read together,
    // the steadier tone the whole name settles into.
    const balance = reduce(nameNumber + soulUrge);

    return {
      systemId: meta.id,
      factors: {
        "name-number": {
          key: "name-number",
          label: "Name Number",
          value: nameNumber,
          display: `${nameNumber} (compound ${total})`,
        },
        compound: { key: "compound", label: "Compound", value: total, display: String(total) },
        "soul-urge": {
          key: "soul-urge",
          label: "Soul Urge Number",
          value: soulUrge,
          display: `${soulUrge} (vowels ${vowelTotal})`,
        },
        personality: {
          key: "personality",
          label: "Personality Number",
          value: personality,
          display: `${personality} (consonants ${consonantTotal})`,
        },
        cornerstone: {
          key: "cornerstone",
          label: "Cornerstone",
          value: cornerstone,
          display: `${cornerstone} (${letters[0]})`,
        },
        capstone: {
          key: "capstone",
          label: "Capstone",
          value: capstone,
          display: `${capstone} (${letters[letters.length - 1]})`,
        },
        "hidden-passion": {
          key: "hidden-passion",
          label: "Hidden Passion",
          value: hiddenPassion,
          display: String(hiddenPassion),
        },
        balance: { key: "balance", label: "Balance", value: balance, display: String(balance) },
      },
    };
  },
};

/**
 * The Chaldean value 1..8 that appears most often across the name's letters. Ties
 * break by the lowest value for a stable, deterministic result. Returns 0 only if
 * there were no valued letters (caller guards against this).
 */
function mostFrequentValue(letters: string[]): number {
  const counts = new Map<number, number>();
  for (const ch of letters) {
    const v = CHALDEAN[ch];
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  let best = 0;
  let bestCount = 0;
  for (let v = 1; v <= 8; v += 1) {
    const c = counts.get(v) ?? 0;
    if (c > bestCount) {
      best = v;
      bestCount = c;
    }
  }
  return best;
}
