"use client";

import { useState } from "react";
import type { ComputeResponse } from "@/lib/api-types";
import type { GeoResult } from "@/lib/geocode";
import { SynthesisView } from "./SynthesisView";

const PRESETS = [
  { label: "London, UK", lat: 51.5074, lng: -0.1278 },
  { label: "New York, USA", lat: 40.7128, lng: -74.006 },
  { label: "Los Angeles, USA", lat: 34.0522, lng: -118.2437 },
  { label: "Mumbai, India", lat: 19.076, lng: 72.8777 },
  { label: "Tokyo, Japan", lat: 35.6762, lng: 139.6503 },
  { label: "Sydney, Australia", lat: -33.8688, lng: 151.2093 },
];

export function BirthForm() {
  const [form, setForm] = useState({
    name: "",
    date: "1879-03-14",
    time: "11:30",
    unknownTime: false,
    latitude: "48.4011",
    longitude: "9.9876",
    timeZone: "",
    noPlace: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ComputeResponse | null>(null);
  const [intakeBody, setIntakeBody] = useState<unknown>(null);

  // Place search (geocoding)
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeResults, setPlaceResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [placeLabel, setPlaceLabel] = useState("");

  function applyPreset(label: string) {
    const p = PRESETS.find((x) => x.label === label);
    if (p) {
      setForm((f) => ({ ...f, latitude: String(p.lat), longitude: String(p.lng), timeZone: "", noPlace: false }));
      setPlaceLabel(label);
    }
  }

  async function searchPlace() {
    if (!placeQuery.trim()) return;
    setSearching(true);
    setPlaceResults([]);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(placeQuery)}`);
      const json = await res.json();
      setPlaceResults(json.results ?? []);
    } catch {
      setPlaceResults([]);
    } finally {
      setSearching(false);
    }
  }

  function selectPlace(r: GeoResult) {
    setForm((f) => ({
      ...f,
      latitude: String(r.latitude),
      longitude: String(r.longitude),
      timeZone: r.timezone,
      noPlace: false,
    }));
    setPlaceLabel([r.name, r.admin1, r.country].filter(Boolean).join(", "));
    setPlaceResults([]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setResult(null);

    const body: Record<string, unknown> = { date: form.date };
    if (form.name.trim()) body.name = form.name.trim();
    if (!form.unknownTime && form.time) body.time = form.time;
    if (!form.noPlace && form.latitude && form.longitude) {
      body.place = {
        lat: Number(form.latitude),
        lng: Number(form.longitude),
        ...(form.timeZone ? { tz: form.timeZone } : {}),
      };
    }

    try {
      const res = await fetch("/api/charts/compute", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.details || json.error || "Request failed");
      setIntakeBody(body);
      setResult(json as ComputeResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-10">
      <form onSubmit={onSubmit} className="grid gap-4 rounded-xl border border-border bg-surface/50 p-6 sm:grid-cols-2">
        <Field label="Name (optional)" className="sm:col-span-2">
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Albert Einstein"
            className={inputClass}
          />
        </Field>

        <Field label="Birth date">
          <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputClass} />
        </Field>

        <Field label="Birth time (local)">
          <input
            type="time"
            value={form.time}
            disabled={form.unknownTime}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
            className={`${inputClass} disabled:opacity-40`}
          />
        </Field>

        <Field label="Search birthplace" className="sm:col-span-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={placeQuery}
              onChange={(e) => setPlaceQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  searchPlace();
                }
              }}
              placeholder="e.g. Ulm, Germany"
              className={inputClass}
            />
            <button
              type="button"
              onClick={searchPlace}
              disabled={searching}
              className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm text-muted transition hover:text-foreground disabled:opacity-50"
            >
              {searching ? "…" : "Search"}
            </button>
          </div>
          {placeResults.length > 0 && (
            <ul className="mt-1 max-h-44 overflow-auto rounded-lg border border-border bg-surface">
              {placeResults.map((r, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => selectPlace(r)}
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-surface-2"
                  >
                    {[r.name, r.admin1, r.country].filter(Boolean).join(", ")}
                    <span className="ml-2 text-xs text-muted">{r.timezone}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {placeLabel && <p className="mt-1 text-xs text-accent">Selected: {placeLabel}</p>}
        </Field>

        <Field label="Birthplace preset">
          <select onChange={(e) => applyPreset(e.target.value)} className={inputClass} defaultValue="">
            <option value="" disabled>
              Or choose a city…
            </option>
            {PRESETS.map((p) => (
              <option key={p.label} value={p.label}>
                {p.label}
              </option>
            ))}
          </select>
        </Field>

        <div className="flex flex-col justify-end gap-2 text-sm text-muted">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.unknownTime} onChange={(e) => setForm({ ...form, unknownTime: e.target.checked })} />
            Time unknown
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.noPlace} onChange={(e) => setForm({ ...form, noPlace: e.target.checked })} />
            Place unknown
          </label>
        </div>

        <Field label="Latitude">
          <input
            type="number"
            step="any"
            value={form.latitude}
            disabled={form.noPlace}
            onChange={(e) => setForm({ ...form, latitude: e.target.value })}
            className={`${inputClass} disabled:opacity-40`}
          />
        </Field>

        <Field label="Longitude">
          <input
            type="number"
            step="any"
            value={form.longitude}
            disabled={form.noPlace}
            onChange={(e) => setForm({ ...form, longitude: e.target.value })}
            className={`${inputClass} disabled:opacity-40`}
          />
        </Field>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-accent px-4 py-2.5 font-semibold text-[#1a1410] transition hover:brightness-110 disabled:opacity-50"
          >
            {loading ? "Computing…" : "Compute chart & synthesize"}
          </button>
          <p className="mt-2 text-center text-xs text-muted">
            More precision unlocks more systems: date · date+time · date+time+place.
          </p>
        </div>
      </form>

      {error && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>
      )}

      {result && <SynthesisView data={result} intakeBody={intakeBody} />}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent";

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
      {children}
    </label>
  );
}
