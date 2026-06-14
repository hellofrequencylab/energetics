"use client";

import { useState } from "react";
import type { SynastryResult } from "@/lib/synastry";
import { PlaceSearch, type SelectedPlace } from "./PlaceSearch";
import { NarrativePanel } from "./NarrativePanel";

export type ResonanceMode = "platonic" | "intimate";

/** Two interpretive lenses over the same comparison. */
const MODES: Record<
  ResonanceMode,
  {
    label: string;
    intro: string;
    shared: { h: string; blurb: string };
    tension: { h: string; blurb: string };
    aspects: { h: string; blurb: string };
    focus: string[];
  }
> = {
  platonic: {
    label: "Platonic",
    intro:
      "Read as friends, family, or collaborators: where you meet on common ground, where your differences balance, and how your minds and aims click.",
    shared: { h: "Common ground", blurb: "Where both charts independently emphasize the same energy." },
    tension: { h: "Where you balance", blurb: "Where each leans to an opposite pole, friction or complement." },
    aspects: {
      h: "How you click",
      blurb: "Ties between your charts. Mind, growth, and identity stand out for friendship.",
    },
    focus: ["mercury", "jupiter", "sun"],
  },
  intimate: {
    label: "Intimate",
    intro:
      "Read as partners: where you meet, where you stretch each other, and how attraction, feeling, and desire move between your charts.",
    shared: { h: "Where you meet", blurb: "Where both charts independently emphasize the same energy." },
    tension: { h: "Where you stretch each other", blurb: "Where each leans to an opposite pole, friction or balance." },
    aspects: {
      h: "How your charts touch",
      blurb: "Ties between your charts. Love, desire, and feeling stand out for intimacy.",
    },
    focus: ["venus", "mars", "moon"],
  },
};

export interface Person {
  name: string;
  date: string;
  time: string;
  unknownTime: boolean;
  latitude: string;
  longitude: string;
  timeZone: string;
  placeLabel: string;
}

const emptyPerson = (name: string, date: string): Person => ({
  name,
  date,
  time: "12:00",
  unknownTime: false,
  latitude: "51.5074",
  longitude: "-0.1278",
  timeZone: "",
  placeLabel: "",
});

function humanize(value: string): string {
  const bare = value.includes(":") ? value.split(":")[1] : value;
  return bare.charAt(0).toUpperCase() + bare.slice(1);
}

function toIntake(p: Person) {
  const body: Record<string, unknown> = { date: p.date };
  if (p.name.trim()) body.name = p.name.trim();
  if (!p.unknownTime && p.time) body.time = p.time;
  if (p.latitude && p.longitude) {
    body.place = { lat: Number(p.latitude), lng: Number(p.longitude), ...(p.timeZone ? { tz: p.timeZone } : {}) };
  }
  return body;
}

export interface SavedChart {
  id: string;
  name: string | null;
  date: string;
  time: string | null;
  lat: number | null;
  lng: number | null;
  tz: string | null;
}

export function fromSaved(c: SavedChart): Person {
  return {
    name: c.name ?? "",
    date: c.date,
    time: c.time ? String(c.time).slice(0, 5) : "12:00",
    unknownTime: !c.time,
    latitude: c.lat != null ? String(c.lat) : "",
    longitude: c.lng != null ? String(c.lng) : "",
    timeZone: c.tz ?? "",
    placeLabel:
      c.lat != null && c.lng != null
        ? `${Number(c.lat).toFixed(2)}, ${Number(c.lng).toFixed(2)}`
        : "",
  };
}

export function SynastryForm({
  savedCharts = [],
  initialA,
  initialB,
  initialMode = "platonic",
}: {
  savedCharts?: SavedChart[];
  initialA?: Person;
  initialB?: Person;
  initialMode?: ResonanceMode;
}) {
  const [a, setA] = useState<Person>(initialA ?? emptyPerson("Person A", "1990-06-15"));
  const [b, setB] = useState<Person>(initialB ?? emptyPerson("Person B", "1988-11-02"));
  const [mode, setMode] = useState<ResonanceMode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SynastryResult | null>(null);
  // Bumped on each successful compare so the reading panel resets for new charts.
  const [runId, setRunId] = useState(0);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/synastry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ a: toIntake(a), b: toIntake(b) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.details || json.error || "Request failed");
      setResult(json.synastry as SynastryResult);
      setRunId((n) => n + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="inline-flex rounded-full border border-border bg-surface/50 p-1">
          {(["platonic", "intimate"] as ResonanceMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                mode === m ? "bg-accent text-[#1a1410]" : "text-muted hover:text-foreground"
              }`}
            >
              {MODES[m].label}
            </button>
          ))}
        </div>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted">{MODES[mode].intro}</p>
      </div>

      <form onSubmit={onSubmit} className="grid gap-6 sm:grid-cols-2">
        <PersonFields person={a} onChange={setA} savedCharts={savedCharts} />
        <PersonFields person={b} onChange={setB} savedCharts={savedCharts} />
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-accent px-4 py-2.5 font-semibold text-[#1a1410] transition hover:brightness-110 disabled:opacity-50"
          >
            {loading ? "Comparing…" : "Compare charts"}
          </button>
        </div>
      </form>

      {error && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>
      )}

      {result && (
        <>
          <SynastryResults result={result} aName={a.name} bName={b.name} mode={mode} />
          <NarrativePanel
            key={`${runId}-${mode}`}
            endpoint="/api/synastry/narrate"
            body={{ a: toIntake(a), b: toIntake(b), mode }}
            title={mode === "intimate" ? "Your resonance reading" : "Your connection reading"}
            ctaLabel="Write the reading"
            autoStart
            idleBlurb="Optional prose over the comparison above. It reads the shared emphases, complementary tensions, and cross-aspects through this lens, and never computes them. It streams in live and is saved."
          />
        </>
      )}
    </div>
  );
}

function PersonFields({
  person,
  onChange,
  savedCharts,
}: {
  person: Person;
  onChange: (p: Person) => void;
  savedCharts: SavedChart[];
}) {
  const set = (patch: Partial<Person>) => onChange({ ...person, ...patch });
  const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent";
  const onPlace = (p: SelectedPlace) =>
    set({ latitude: String(p.latitude), longitude: String(p.longitude), timeZone: p.timezone, placeLabel: p.label });
  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface/50 p-5">
      {savedCharts.length > 0 && (
        <select
          className={`${input} text-accent`}
          defaultValue=""
          onChange={(e) => {
            const c = savedCharts.find((x) => x.id === e.target.value);
            if (c) onChange(fromSaved(c));
            e.target.value = "";
          }}
          aria-label="Use one of your saved charts"
        >
          <option value="" disabled>
            Use a saved chart…
          </option>
          {savedCharts.map((c) => (
            <option key={c.id} value={c.id}>
              {(c.name || "Unnamed chart") + " · " + c.date}
            </option>
          ))}
        </select>
      )}
      <input className={input} value={person.name} onChange={(e) => set({ name: e.target.value })} placeholder="Name" />
      <div className="grid grid-cols-2 gap-2">
        <input type="date" className={input} value={person.date} onChange={(e) => set({ date: e.target.value })} />
        <input
          type="time"
          className={`${input} disabled:opacity-40`}
          value={person.time}
          disabled={person.unknownTime}
          onChange={(e) => set({ time: e.target.value })}
        />
      </div>
      <label className="flex items-center gap-2 text-xs text-muted">
        <input type="checkbox" checked={person.unknownTime} onChange={(e) => set({ unknownTime: e.target.checked })} />
        Time unknown
      </label>
      <PlaceSearch onSelect={onPlace} placeholder="Start typing any city in the world…" />
      {person.placeLabel && <p className="text-xs text-accent">✓ {person.placeLabel}</p>}
      <details className="text-xs text-muted">
        <summary className="cursor-pointer">Coordinates</summary>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <input type="number" step="any" className={input} value={person.latitude} onChange={(e) => set({ latitude: e.target.value })} placeholder="Latitude" />
          <input type="number" step="any" className={input} value={person.longitude} onChange={(e) => set({ longitude: e.target.value })} placeholder="Longitude" />
        </div>
      </details>
    </div>
  );
}

function SynastryResults({
  result,
  aName,
  bName,
  mode,
}: {
  result: SynastryResult;
  aName: string;
  bName: string;
  mode: ResonanceMode;
}) {
  const cfg = MODES[mode];
  const focus = cfg.focus;
  const isFocus = (c: { a: string; b: string }) =>
    focus.includes(c.a.toLowerCase()) || focus.includes(c.b.toLowerCase());
  // Lead with the aspects that matter most for this lens.
  const aspects = [...result.crossAspects].sort((x, y) => Number(isFocus(y)) - Number(isFocus(x)));

  return (
    <div className="space-y-8">
      <section>
        <h3 className="mb-1 text-sm font-semibold uppercase tracking-wider text-accent">{cfg.shared.h}</h3>
        <p className="mb-3 text-xs text-muted">{cfg.shared.blurb}</p>
        {result.sharedEmphases.length ? (
          <ul className="flex flex-wrap gap-2">
            {result.sharedEmphases.map((s, i) => (
              <li key={i} className="rounded-lg border border-accent/30 bg-accent/5 px-3 py-1.5 text-sm">
                {humanize(s.value)} <span className="text-xs text-muted">· {s.axis}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No strongly shared emphases.</p>
        )}
      </section>

      {result.complementaryTensions.length > 0 && (
        <section>
          <h3 className="mb-1 text-sm font-semibold uppercase tracking-wider text-accent-2">{cfg.tension.h}</h3>
          <p className="mb-3 text-xs text-muted">{cfg.tension.blurb}</p>
          <ul className="space-y-2">
            {result.complementaryTensions.map((t, i) => (
              <li key={i} className="flex items-center justify-center gap-3 rounded-lg border border-border bg-surface/40 p-3 text-sm">
                <span>{aName.trim() || "A"}: <span className="text-foreground">{humanize(t.aValue)}</span></span>
                <span className="text-accent-2">⟷</span>
                <span>{bName.trim() || "B"}: <span className="text-foreground">{humanize(t.bValue)}</span></span>
                <span className="text-[11px] uppercase text-muted">{t.axis}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h3 className="mb-1 text-sm font-semibold uppercase tracking-wider text-accent">{cfg.aspects.h}</h3>
        <p className="mb-3 text-xs text-muted">{cfg.aspects.blurb}</p>
        {aspects.length ? (
          <ul className="space-y-1">
            {aspects.map((c, i) => {
              const lead = isFocus(c);
              return (
                <li
                  key={i}
                  className={`flex justify-between gap-3 rounded-md px-2 py-1 text-sm ${lead ? "bg-accent/5" : ""}`}
                >
                  <span>
                    {lead && <span className="mr-1 text-accent">•</span>}
                    <span className="text-foreground">{aName.trim() || "A"} {humanize(c.a)}</span> {c.aspect}{" "}
                    <span className="text-foreground">{bName.trim() || "B"} {humanize(c.b)}</span>
                  </span>
                  <span className="text-muted">{c.orb.toFixed(1)}°</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted">No tight cross-aspects (add birth times for angles).</p>
        )}
      </section>
    </div>
  );
}
