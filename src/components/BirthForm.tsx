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

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatDate(d: string): string {
  const [y, m, day] = d.split("-").map(Number);
  if (!y || !m || !day) return "";
  return `${day} ${MONTHS[m - 1]} ${y}`;
}

function formatTime(t: string): string {
  const [h, mm] = t.split(":").map(Number);
  if (Number.isNaN(h)) return "";
  const ap = h < 12 ? "am" : "pm";
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${String(mm).padStart(2, "0")} ${ap}`;
}

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

  // Live profile, written as they type.
  const hasTime = !form.unknownTime && !!form.time;
  const hasPlace = !form.noPlace && !!placeLabel;
  const who = form.name.trim() || "You";
  const dateStr = formatDate(form.date);
  const tier = hasPlace ? "full" : hasTime ? "timed" : "dated";
  const unlock =
    tier === "full"
      ? "Every tradition can read your full chart, ascendant and houses included."
      : tier === "timed"
        ? "Add your birthplace and we can place your houses and angles."
        : "Add your birth time and place to open up the deeper reading.";

  const sentence = [
    `${who}, born ${dateStr || "on a day you choose"}`,
    hasTime ? ` at ${formatTime(form.time)}` : "",
    hasPlace ? ` in ${placeLabel}` : "",
    ".",
  ].join("");

  return (
    <div className="space-y-10">
      <form onSubmit={onSubmit} className="rounded-2xl border border-border bg-surface/60 p-6 sm:p-7">
        <div className="grid gap-7 lg:grid-cols-2">
          {/* Left: the fields */}
          <div className="order-1 space-y-4">
            <Field label="Your full name">
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Albert Einstein"
                className={inputClass}
              />
              <p className="mt-1 text-xs text-muted">
                Optional. Your full name unlocks name numerology (the numbers in the letters of your
                name), which adds an independent voice to the reading. Your date alone still works,
                and your name is yours: nothing is saved unless you sign in and save the chart.
              </p>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Birth date">
                <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputClass} />
              </Field>
              <Field label="Birth time">
                <input
                  type="time"
                  value={form.time}
                  disabled={form.unknownTime}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  className={`${inputClass} disabled:opacity-40`}
                />
              </Field>
            </div>

            <Field label="Birthplace">
              <PlaceSearch onSelect={selectPlace} placeholder="Start typing any city in the world…" />
              {placeLabel && (
                <p className="mt-1 text-xs text-accent">
                  ✓ {placeLabel}
                  {form.timeZone ? ` · ${form.timeZone}` : ""}
                </p>
              )}
            </Field>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-foreground/80">
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

            <details className="text-sm text-foreground/70">
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
          </div>

          {/* The live profile, written as they type. On mobile it sits below the
              submit button; on desktop it is the right column. */}
          <div className="order-3 rounded-xl border border-border bg-background/50 p-5 lg:order-2">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Your profile</p>
            <p className="mt-3 text-lg leading-relaxed text-foreground">{sentence}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{unlock}</p>

            <dl className="mt-6 space-y-2.5 border-t border-border pt-5 text-sm">
              <Row label="Born" value={dateStr || "Choose a date"} />
              <Row label="Time" value={hasTime ? formatTime(form.time) : "Time unknown"} />
              <Row label="Place" value={hasPlace ? placeLabel : "Place unknown"} />
              <Row
                label="Unlocks"
                value={tier === "full" ? "Signs, degrees, houses" : tier === "timed" ? "Signs, degrees, aspects" : "Planetary signs"}
                accent
              />
            </dl>
          </div>

          {/* Submit: directly under the fields on mobile (order-2), and full width
              below both columns on desktop (order-3). */}
          <div className="order-2 lg:order-3 lg:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-accent px-4 py-3 font-semibold text-[#1a1410] [text-shadow:0_1px_0_rgba(255,255,255,0.45)] transition hover:brightness-110 disabled:opacity-50"
            >
              {loading ? "Computing…" : (submitLabel ?? "Compute chart & synthesize")}
            </button>
            <p className="mt-2 text-center text-xs text-muted">
              More precision unlocks more systems: date · date and time · date, time, and place.
            </p>
          </div>
        </div>
      </form>

      {error && <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}

      {result && <SynthesisView data={result} intakeBody={intakeBody} />}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent";

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-xs font-semibold uppercase tracking-wide text-foreground/70">{label}</span>
      {children}
    </label>
  );
}

function Row({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className={`text-right font-medium ${accent ? "text-accent" : "text-foreground"}`}>{value}</dd>
    </div>
  );
}
