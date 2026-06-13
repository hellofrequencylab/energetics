import { DateTime } from "luxon";
import type { BirthEvent } from "./birth-event";

/**
 * Convert a BirthEvent's local civil date/time (in its place's IANA timezone)
 * to a UTC instant in milliseconds — the input the EphemerisService consumes.
 *
 * Requires both `time` and `place` (i.e. date-time-place precision). Ephemeris-
 * derived engines only call this when their requirements are satisfied; the
 * registry's `enginesFor(precision)` gate enforces that upstream.
 */
export function toUtcInstant(event: BirthEvent): number {
  if (!event.time || !event.place) {
    throw new Error("toUtcInstant requires date-time-place precision (time + place).");
  }
  const [year, month, day] = event.date.split("-").map(Number);
  const [hour, minute] = event.time.split(":").map(Number);

  const local = DateTime.fromObject(
    { year, month, day, hour, minute },
    { zone: event.place.tz },
  );
  if (!local.isValid) {
    throw new Error(`Invalid birth datetime: ${local.invalidReason}`);
  }
  return local.toMillis();
}

/** Civil date parts (year/month/day) — for date-derived systems. */
export function dateParts(event: BirthEvent): { year: number; month: number; day: number } {
  const [year, month, day] = event.date.split("-").map(Number);
  return { year, month, day };
}

/** Local civil time parts, defaulting to noon when the time is unknown. */
export function timeParts(event: BirthEvent): { hour: number; minute: number } {
  if (!event.time) return { hour: 12, minute: 0 };
  const [hour, minute] = event.time.split(":").map(Number);
  return { hour, minute };
}

/** Gregorian UTC → Julian Day (Swiss Ephemeris `swe_julday` convention). */
export function gregorianToJulianDay(year: number, month: number, day: number, hoursUt: number): number {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524.5 + hoursUt / 24;
}

/** UTC instant (ms) → Julian Day in UT. */
export function utcInstantToJulianDay(utcInstant: number): number {
  const utc = DateTime.fromMillis(utcInstant, { zone: "utc" });
  return gregorianToJulianDay(utc.year, utc.month, utc.day, utc.hour + utc.minute / 60 + utc.second / 3600);
}
