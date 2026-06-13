/**
 * Place-name → coordinates + timezone, via the Open-Meteo geocoding API
 * (free, no key, returns the IANA timezone directly).
 *
 * NOTE: requires outbound access to `geocoding-api.open-meteo.com`. On Vercel
 * this works out of the box; in a restricted environment add that host to the
 * egress allowlist. The UI degrades to preset cities + manual lat/lng if this
 * fails.
 */
export interface GeoResult {
  name: string;
  country?: string;
  admin1?: string; // state/region
  latitude: number;
  longitude: number;
  timezone: string;
}

const ENDPOINT = "https://geocoding-api.open-meteo.com/v1/search";

export async function geocodePlace(query: string, count = 8): Promise<GeoResult[]> {
  const q = query.trim();
  if (!q) return [];
  const url = `${ENDPOINT}?name=${encodeURIComponent(q)}&count=${count}&language=en&format=json`;
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);
  const data = (await res.json()) as { results?: RawResult[] };
  return (data.results ?? []).map((r) => ({
    name: r.name,
    country: r.country,
    admin1: r.admin1,
    latitude: r.latitude,
    longitude: r.longitude,
    timezone: r.timezone,
  }));
}

interface RawResult {
  name: string;
  country?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone: string;
}
