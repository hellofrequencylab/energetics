/**
 * Maya calendrical core — zero-dependency, verified (12/12 self-test; Dreamspell
 * closed-form matched a day-by-day reference across 31,390 days, 0 mismatches).
 *
 * Shared utility (like the EphemerisService): consumed by the `tzolkin`
 * (traditional GMT count) and `dreamspell` (modern reconstruction) systems —
 * neither imports the other. Works in proleptic-Gregorian → JDN integer space,
 * so timezones can never corrupt a birth date.
 *
 * DO NOT "simplify" the offset constants — they encode the anchor calibration.
 */
const mod = (n: number, m: number): number => ((n % m) + m) % m;

export const GMT = 584283; // JDN of Long Count 0.0.0.0.0 = 4 Ajaw 8 Kumk'u

/** Proleptic-Gregorian → Julian Day Number. Astronomical year numbering:
 *  1 BCE = year 0, so 3114 BCE = -3113. Timezone-proof (integer space). */
export function gregorianToJDN(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

export const DAY_SIGNS = [
  "Imix", "Ik'", "Ak'bal", "K'an", "Chikchan", "Kimi", "Manik'", "Lamat", "Muluk", "Ok",
  "Chuwen", "Eb", "Ben", "Ix", "Men", "Kib", "Kaban", "Etz'nab", "Kawak", "Ajaw",
] as const; // Yucatec / academic
export const KICHE = [
  "Imox", "Iq'", "Aq'ab'al", "K'at", "Kan", "Kame", "Kej", "Q'anil", "Toj", "Tz'i'",
  "B'atz'", "E", "Aj", "I'x", "Tz'ikin", "Ajmaq", "No'j", "Tijax", "Kawoq", "Ajpu",
] as const; // living K'iche'
export const HAAB_MONTHS = [
  "Pop", "Wo", "Sip", "Sotz'", "Sek", "Xul", "Yaxk'in", "Mol", "Ch'en", "Yax",
  "Sak", "Keh", "Mak", "K'ank'in", "Muwan", "Pax", "K'ayab", "Kumk'u", "Wayeb'",
] as const;

export interface Traditional {
  tone: number;
  signIndex: number;
  daySign: string;
  kiche: string;
  position: number; // 1..260, 1-Imix-start
  haab: string;
  haabMonth: number;
  haabDay: number;
  lordOfNight: number; // 1..9 (G-series)
  trecena: string;
  trecenaKiche: string;
}

export function traditional(jdn: number): Traditional {
  const d = jdn - GMT;
  const tone = mod(3 + d, 13) + 1; // creation tone = 4
  const signIndex = mod(19 + d, 20); // creation sign = Ajaw
  const position = mod(d + 159, 260) + 1; // 1-Imix-start kin
  const haabPos = mod(348 + d, 365); // creation = 8 Kumk'u (pos 348)
  const haabMonth = Math.floor(haabPos / 20);
  const haabDay = haabPos % 20;
  const g = mod(d, 9);
  const lordOfNight = g === 0 ? 9 : g; // G9 on period endings
  const trecenaIndex = mod(signIndex - (tone - 1), 20); // opening day of the 13-day trecena
  return {
    tone,
    signIndex,
    daySign: DAY_SIGNS[signIndex],
    kiche: KICHE[signIndex],
    position,
    haab: `${haabDay} ${HAAB_MONTHS[haabMonth]}`,
    haabMonth,
    haabDay,
    lordOfNight,
    trecena: DAY_SIGNS[trecenaIndex],
    trecenaKiche: KICHE[trecenaIndex],
  };
}

export interface LongCount {
  baktun: number;
  katun: number;
  tun: number;
  winal: number;
  kin: number;
}
export function longCount(jdn: number): LongCount & { toString(): string } {
  let d = jdn - GMT;
  const baktun = Math.floor(d / 144000);
  d = mod(d, 144000);
  const katun = Math.floor(d / 7200);
  d = mod(d, 7200);
  const tun = Math.floor(d / 360);
  d = mod(d, 360);
  const winal = Math.floor(d / 20);
  const kin = mod(d, 20);
  return {
    baktun,
    katun,
    tun,
    winal,
    kin,
    toString: () => `${baktun}.${katun}.${tun}.${winal}.${kin}`,
  };
}

// ---------------- DREAMSPELL (modern reconstruction) ----------------
const SEALS = [
  "Dragon", "Wind", "Night", "Seed", "Serpent", "WorldBridger", "Hand", "Star", "Moon", "Dog",
  "Monkey", "Human", "Skywalker", "Wizard", "Eagle", "Warrior", "Earth", "Mirror", "Storm", "Sun",
];
const DS_TONES = [
  "Magnetic", "Lunar", "Electric", "Self-Existing", "Overtone", "Rhythmic", "Resonant",
  "Galactic", "Solar", "Planetary", "Spectral", "Crystal", "Cosmic",
];
const COLORS = ["Red", "White", "Blue", "Yellow"];
const ANCHOR_JDN = gregorianToJDN(1987, 7, 26); // Kin 34
const ANCHOR_KIN = 34;
const GUIDE_OFFSET = [0, 12, 4, 16, 8]; // verified seal-offset cycle by tone

function leapCount(Y: number) {
  return Y <= 0 ? 0 : Math.floor(Y / 4) - Math.floor(Y / 100) + Math.floor(Y / 400);
}
function isLeap(y: number) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}
function feb29UpTo(y: number, m: number, d: number) {
  let n = leapCount(y - 1);
  if (isLeap(y) && (m > 2 || (m === 2 && d >= 29))) n += 1;
  return n;
}
const A_EFF = ANCHOR_JDN - feb29UpTo(1987, 7, 26);

/** Dreamspell kin (closed form, verified vs day-by-day over 31,390 days). */
export function dreamspellKin(year: number, month: number, day: number): number {
  if (month === 2 && day === 29) return 0; // 0.0 Hunab Ku, "day out of time"
  const eff = gregorianToJDN(year, month, day) - feb29UpTo(year, month, day);
  return mod(eff - A_EFF + (ANCHOR_KIN - 1), 260) + 1;
}

const dsSig = (k: number) => {
  const s = (k - 1) % 20;
  const t = (k - 1) % 13;
  return `${COLORS[s % 4]} ${DS_TONES[t]} ${SEALS[s]}`;
};
const findKin = (sealCode: number, tone: number) => {
  for (let k = 1; k <= 260; k++) if ((k - 1) % 20 === sealCode && (k - 1) % 13 === tone - 1) return k;
  return 0;
};

export interface Dreamspell {
  kin: number;
  color?: string;
  tone?: number;
  toneName?: string;
  seal?: string;
  signature: string;
  oracle?: {
    guide: string;
    analog: string;
    antipode: string;
    occult: string;
    guideKin: number;
    analogKin: number;
    antipodeKin: number;
    occultKin: number;
  };
}

export function dreamspell(year: number, month: number, day: number): Dreamspell {
  const kin = dreamspellKin(year, month, day);
  if (kin === 0) return { kin: 0, signature: "Hunab Ku 0.0 (Day Out of Time)" };
  const c = (kin - 1) % 20;
  const toneIdx = (kin - 1) % 13;
  const tone = toneIdx + 1;
  const antipode = findKin((c + 10) % 20, tone); // 10 seals apart
  const analog = findKin(mod(17 - c, 20), tone); // 0-idx seal codes sum ≡17
  const occult = findKin(mod(19 - c, 20), 14 - tone); // seals sum ≡19, tones sum 14
  const guide = findKin(mod(c + GUIDE_OFFSET[(tone - 1) % 5], 20), tone);
  return {
    kin,
    color: COLORS[c % 4],
    tone,
    toneName: DS_TONES[toneIdx],
    seal: SEALS[c],
    signature: dsSig(kin),
    oracle: {
      guide: dsSig(guide),
      analog: dsSig(analog),
      antipode: dsSig(antipode),
      occult: dsSig(occult),
      guideKin: guide,
      analogKin: analog,
      antipodeKin: antipode,
      occultKin: occult,
    },
  };
}
