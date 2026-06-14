"use client";

import { useState } from "react";
import type { ComputeResponse } from "@/lib/api-types";
import { PlaceSearch, type SelectedPlace } from "./PlaceSearch";
import { SynthesisView } from "./SynthesisView";

// Offline fallback cities (the live search needs the geocoding host reachable).
const PRESETS = [
  { label: "London, UK", lat: 51.5074, lng: -0.1278 },
  { label: "New York, USA", lat: 40.7128, lng: -74.006 },
  { label: "Mumbai, India", lat: 19.076, lng: 72.8777 },
  { label: "Tokyo, Japan", lat: 35.6762, lng: 139.6503 },
];

export function BirthForm({
  onResult,
  submitLabel,
}: {
  onResult?: (data: ComputeResponse, intakeBody: unknown) => void;
  submitLabel?: string;
} = {}) {
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
  const [placeLabel, setPlaceLabel] = useState("");

  function selectPlace(p: SelectedPlace) {
    setForm((f) => ({ ...f, latitude: String(p.latitude), longitude: String(p.longitude), timeZone: p.timezone, noPlace: false }));
    setPlaceLabel(p.label);
  }

  function applyPreset(label: string) {
    const p = PRESETS.find((x) => x.label === label);
    if (p) {
      setForm((f) => ({ ...f, latitude: String(p.lat), longitude: String(p.lng), timeZone: "", noPlace: false }));
      setPlaceLabel(label);
    }
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
      if (onResult) {
        onResult(json as ComputeResponse, body);
      } else {
        setIntakeBody(body);
        setResult(json as ComputeResponse);
      }
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

        <Field label="Birthplace" className="sm:col-span-2">
          <PlaceSearch onSelect={selectPlace} placeholder="Start typing any city in the world…" />
          {placeLabel && (
            <p className="mt-1 text-xs text-accent">
              ✓ {placeLabel}
              {form.timeZone ? ` · ${form.timeZone}` : ""}
            </p>
          )}
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

        <Field label="Or pick a preset">
          <select onChange={(e) => applyPreset(e.target.value)} className={inputClass} defaultValue="">
            <option value="" disabled>
              Offline fallback…
            </option>
            {PRESETS.map((p) => (
              <option key={p.label} value={p.label}>
                {p.label}
              </option>
            ))}
          </select>
        </Field>

        <details className="sm:col-span-2 text-sm text-muted">
          <summary className="cursor-pointer text-xs uppercase tracking-wide">Enter coordinates manually</summary>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <input
              type="number"
              step="any"
              value={form.latitude}
              disabled={form.noPlace}
              onChange={(e) => setForm({ ...form, latitude: e.target.value })}
              placeholder="Latitude"
              className={`${inputClass} disabled:opacity-40`}
            />
            <input
              type="number"
              step="any"
              value={form.longitude}
              disabled={form.noPlace}
              onChange={(e) => setForm({ ...form, longitude: e.target.value })}
              placeholder="Longitude"
              className={`${inputClass} disabled:opacity-40`}
            />
          </div>
        </details>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-accent px-4 py-2.5 font-semibold text-[#1a1410] transition hover:brightness-110 disabled:opacity-50"
          >
            {loading ? "Computing…" : (submitLabel ?? "Compute chart & synthesize")}
          </button>
          <p className="mt-2 text-center text-xs text-muted">
            More precision unlocks more systems: date · date+time · date+time+place.
          </p>
        </div>
      </form>

      {error && <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}

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
