/**
 * Human Design reference data — COMPILED from standard public references (the
 * Rave Mandala gate wheel, the 36 channels, and the 9 centers' gate memberships).
 *
 * ⚠️ VALIDATION PENDING: per the system spec §2, these tables should be confirmed
 * against a trusted calculator (Jovian Archive / Genetic Matrix) before the
 * output is fully trusted. They are internally consistent (gate→center sums to
 * 64; every channel joins two distinct centers) and the wheel matches the
 * verified anchor Gate 41 = 2°00′ Aquarius. The engine emits a validation note.
 */

export type CenterId =
  | "Head" | "Ajna" | "Throat" | "G" | "Heart" | "Sacral" | "SolarPlexus" | "Spleen" | "Root";

export const CENTERS: CenterId[] = [
  "Head", "Ajna", "Throat", "G", "Heart", "Sacral", "SolarPlexus", "Spleen", "Root",
];

/** Motor centers — provide the energy that, when linked to the Throat, manifests. */
export const MOTORS: CenterId[] = ["Sacral", "Heart", "SolarPlexus", "Root"];

/**
 * The 64 gates in zodiacal order, starting at Gate 41 = 2°00′ Aquarius (302°).
 * Each gate spans 360/64 = 5.625°; each of its 6 lines spans 0.9375°.
 */
export const GATE_WHEEL = [
  41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21, 51, 42, 3, 27, 24, 2, 23,
  8, 20, 16, 35, 45, 12, 15, 52, 39, 53, 62, 56, 31, 33, 7, 4, 29, 59, 40, 64,
  47, 6, 46, 18, 48, 57, 32, 50, 28, 44, 1, 43, 14, 34, 9, 5, 26, 11, 10, 58,
  38, 54, 61, 60,
];

/** The wheel's start longitude (2°00′ Aquarius). */
export const WHEEL_START = 302;

/** Each center's gates (memberships sum to all 64 gates, no overlaps). */
export const CENTER_GATES: Record<CenterId, number[]> = {
  Head: [64, 61, 63],
  Ajna: [47, 24, 4, 17, 11, 43],
  Throat: [62, 23, 56, 35, 12, 45, 33, 8, 31, 20, 16],
  G: [7, 1, 13, 10, 25, 46, 2, 15],
  Heart: [21, 40, 26, 51],
  Sacral: [34, 5, 14, 29, 59, 9, 3, 42, 27],
  SolarPlexus: [6, 37, 22, 36, 30, 55, 49],
  Spleen: [48, 57, 44, 50, 18, 28, 32],
  Root: [53, 60, 52, 19, 39, 41, 58, 38, 54],
};

/** Gate → center (inverted from CENTER_GATES). */
export const GATE_CENTER: Record<number, CenterId> = (() => {
  const map: Record<number, CenterId> = {};
  for (const center of CENTERS) for (const gate of CENTER_GATES[center]) map[gate] = center;
  return map;
})();

/** The 36 channels (gate pairs). Each connects the two centers its gates sit in. */
export const CHANNELS: [number, number][] = [
  [1, 8], [2, 14], [3, 60], [4, 63], [5, 15], [6, 59], [7, 31], [9, 52],
  [10, 20], [10, 34], [10, 57], [11, 56], [12, 22], [13, 33], [16, 48], [17, 62],
  [18, 58], [19, 49], [20, 34], [20, 57], [21, 45], [23, 43], [24, 61], [25, 51],
  [26, 44], [27, 50], [28, 38], [29, 46], [30, 41], [32, 54], [34, 57], [35, 36],
  [37, 40], [39, 55], [42, 53], [47, 64],
];
