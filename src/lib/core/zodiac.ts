/**
 * Shared zodiac reference + angle helpers. This is engine-agnostic vocabulary
 * used by any system that reads positions against the twelve signs.
 */

export type Element = "fire" | "earth" | "air" | "water";
export type Modality = "cardinal" | "fixed" | "mutable";
export type Polarity = "active" | "receptive";

export interface Sign {
  index: number; // 0 = Aries
  name: string;
  glyph: string;
  element: Element;
  modality: Modality;
  polarity: Polarity; // active (yang) / receptive (yin)
}

export const SIGNS: Sign[] = [
  { index: 0, name: "Aries", glyph: "♈", element: "fire", modality: "cardinal", polarity: "active" },
  { index: 1, name: "Taurus", glyph: "♉", element: "earth", modality: "fixed", polarity: "receptive" },
  { index: 2, name: "Gemini", glyph: "♊", element: "air", modality: "mutable", polarity: "active" },
  { index: 3, name: "Cancer", glyph: "♋", element: "water", modality: "cardinal", polarity: "receptive" },
  { index: 4, name: "Leo", glyph: "♌", element: "fire", modality: "fixed", polarity: "active" },
  { index: 5, name: "Virgo", glyph: "♍", element: "earth", modality: "mutable", polarity: "receptive" },
  { index: 6, name: "Libra", glyph: "♎", element: "air", modality: "cardinal", polarity: "active" },
  { index: 7, name: "Scorpio", glyph: "♏", element: "water", modality: "fixed", polarity: "receptive" },
  { index: 8, name: "Sagittarius", glyph: "♐", element: "fire", modality: "mutable", polarity: "active" },
  { index: 9, name: "Capricorn", glyph: "♑", element: "earth", modality: "cardinal", polarity: "receptive" },
  { index: 10, name: "Aquarius", glyph: "♒", element: "air", modality: "fixed", polarity: "active" },
  { index: 11, name: "Pisces", glyph: "♓", element: "water", modality: "mutable", polarity: "receptive" },
];

export function norm360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

export function angularSeparation(a: number, b: number): number {
  const diff = Math.abs(norm360(a) - norm360(b));
  return diff > 180 ? 360 - diff : diff;
}

export interface SignPosition {
  sign: Sign;
  degreesInSign: number;
  formatted: string;
}

export function toSignPosition(longitude: number): SignPosition {
  const lon = norm360(longitude);
  const index = Math.floor(lon / 30) % 12;
  const degreesInSign = lon - index * 30;
  const sign = SIGNS[index];
  return { sign, degreesInSign, formatted: `${formatDegrees(degreesInSign)} ${sign.name}` };
}

export function formatDegrees(degInSign: number): string {
  const d = Math.floor(degInSign);
  const m = Math.round((degInSign - d) * 60);
  const mm = m === 60 ? 0 : m;
  const dd = m === 60 ? d + 1 : d;
  return `${dd}°${String(mm).padStart(2, "0")}′`;
}
