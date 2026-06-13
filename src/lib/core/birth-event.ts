/**
 * BirthEvent — the single source of truth for birth data (spec §0, §4).
 *
 * `date` is ALWAYS known. `time` and `place` are optional and gate the
 * time-/place-dependent engines. `precision` is DERIVED, never user-set.
 */
import { z } from "zod";
import tzlookup from "tz-lookup";

export type Precision = "date" | "date-time" | "date-time-place";

export interface GeoPoint {
  lat: number;
  lng: number;
  tz: string; // IANA timezone id
}

export interface BirthEvent {
  id: string;
  date: string; // ISO date (YYYY-MM-DD), always known
  time?: string; // local time at place (HH:mm), gates time-dependent engines
  place?: GeoPoint;
  precision: Precision; // derived
}

/** Raw intake shape accepted at the API/form boundary (precision is derived). */
export const birthIntakeSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().max(120).optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
    time: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "time must be HH:mm")
      .optional(),
    place: z
      .object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
        tz: z.string().trim().min(1).max(64).optional(),
      })
      .optional(),
  })
  .strict();

export type BirthIntake = z.infer<typeof birthIntakeSchema>;

/** Derive precision from which fields are present. */
export function precisionOf(input: { time?: string; place?: { lat: number; lng: number } | undefined }): Precision {
  if (input.place && input.time) return "date-time-place";
  if (input.time) return "date-time";
  return "date";
}

/**
 * Validate raw intake and produce a BirthEvent with derived precision. The IANA
 * timezone is resolved from coordinates when omitted. Returns the optional name
 * separately (not part of the canonical BirthEvent).
 */
export function intake(raw: unknown): { event: BirthEvent; name?: string } {
  const data = birthIntakeSchema.parse(raw);

  let place: GeoPoint | undefined;
  if (data.place) {
    // tz lookup is deferred to here (intake), keeping engines pure of I/O.
    const tz = data.place.tz ?? lookupTimeZone(data.place.lat, data.place.lng);
    place = { lat: data.place.lat, lng: data.place.lng, tz };
  }

  const event: BirthEvent = {
    id: data.id ?? cryptoRandomId(),
    date: data.date,
    time: data.time,
    place,
    precision: precisionOf({ time: data.time, place }),
  };
  return { event, name: data.name };
}

function lookupTimeZone(lat: number, lng: number): string {
  // tz-lookup is a static dataset (no network); safe here at the intake boundary.
  return tzlookup(lat, lng);
}

function cryptoRandomId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `be_${Math.random().toString(36).slice(2)}`;
}
