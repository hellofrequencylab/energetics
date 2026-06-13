"use client";

import { useState } from "react";
import type { SynastryResult } from "@/lib/synastry";

interface Person {
  name: string;
  date: string;
  time: string;
  unknownTime: boolean;
  latitude: string;
  longitude: string;
}

const emptyPerson = (name: string, date: string): Person => ({
  name,
  date,
  time: "12:00",
  unknownTime: false,
  latitude: "51.5074",
  longitude: "-0.1278",
});

function humanize(value: string): string {
  const bare = value.includes(":") ? value.split(":")[1] : value;
  return bare.charAt(0).toUpperCase() + bare.slice(1);
}

function toIntake(p: Person) {
  const body: Record<string, unknown> = { date: p.date };
  if (p.name.trim()) body.name = p.name.trim();
  if (!p.unknownTime && p.time) body.time = p.time;
  if (p.latitude && p.longitude) body.place = { lat: Number(p.latitude), lng: Number(p.longitude) };
  return body;
}

export function SynastryForm() {
  const [a, setA] = useState<Person>(emptyPerson("Person A", "1990-06-15"));
  const [b, setB] = useState<Person>(emptyPerson("Person B", "1988-11-02"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SynastryResult | null>(null);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={onSubmit} className="grid gap-6 sm:grid-cols-2">
        <PersonFields person={a} onChange={setA} />
        <PersonFields person={b} onChange={setB} />
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

      {result && <SynastryResults result={result} aName={a.name} bName={b.name} />}
    </div>
  );
}

function PersonFields({ person, onChange }: { person: Person; onChange: (p: Person) => void }) {
  const set = (patch: Partial<Person>) => onChange({ ...person, ...patch });
  const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent";
  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface/50 p-5">
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
      <div className="grid grid-cols-2 gap-2">
        <input type="number" step="any" className={input} value={person.latitude} onChange={(e) => set({ latitude: e.target.value })} placeholder="Latitude" />
        <input type="number" step="any" className={input} value={person.longitude} onChange={(e) => set({ longitude: e.target.value })} placeholder="Longitude" />
      </div>
    </div>
  );
}

function SynastryResults({ result, aName, bName }: { result: SynastryResult; aName: string; bName: string }) {
  return (
    <div className="space-y-8">
      <section>
        <h3 className="mb-1 text-sm font-semibold uppercase tracking-wider text-accent">Shared ground</h3>
        <p className="mb-3 text-xs text-muted">Where both charts independently emphasize the same energy.</p>
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
          <h3 className="mb-1 text-sm font-semibold uppercase tracking-wider text-accent-2">Complementary tensions</h3>
          <p className="mb-3 text-xs text-muted">Where each leans to an opposite pole — friction or balance.</p>
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
        <h3 className="mb-1 text-sm font-semibold uppercase tracking-wider text-accent">Cross-chart aspects</h3>
        <p className="mb-3 text-xs text-muted">Geometric ties between the two charts (tightest first).</p>
        {result.crossAspects.length ? (
          <ul className="space-y-1">
            {result.crossAspects.map((c, i) => (
              <li key={i} className="flex justify-between gap-3 text-sm">
                <span>
                  <span className="text-foreground">{aName.trim() || "A"} {c.a}</span> {c.aspect}{" "}
                  <span className="text-foreground">{bName.trim() || "B"} {c.b}</span>
                </span>
                <span className="text-muted">{c.orb.toFixed(1)}°</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No tight cross-aspects (add birth times for angles).</p>
        )}
      </section>
    </div>
  );
}
