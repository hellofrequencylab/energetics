"use client";

import { useState } from "react";
import Link from "next/link";
import type { ComputeResponse } from "@/lib/api-types";
import { interpretationsFor } from "@/lib/corpus";
import { SYSTEM_BLURBS } from "@/lib/help/content";
import type { TransitsResult } from "@/lib/transits";
import type { ComputedSystem } from "@/lib/synthesis/types";
import { EthicsPanel } from "./EthicsPanel";
import { NarrativePanel } from "./NarrativePanel";
import { ConvergenceChart } from "./ConvergenceChart";
import { SystemDiagram } from "./diagrams";

/** Strip the ontology namespace ("western:fire" → "Fire") and title-case. */
function humanizeValue(value: string): string {
  const bare = value.includes(":") ? value.split(":")[1] : value;
  return bare.charAt(0).toUpperCase() + bare.slice(1);
}

export function SynthesisView({
  data,
  intakeBody,
  chartId,
  initialReading,
}: {
  data: ComputeResponse;
  intakeBody: unknown;
  /** When set (a saved chart), each system links to its detail page. */
  chartId?: string;
  /** A reading already saved for this chart, shown at once. */
  initialReading?: { text: string; model?: string } | null;
}) {
  const { computations, unavailable, synthesis, event, name, ephemerisVersion } = data;
  const crossConfirmed = synthesis.convergences.filter((c) => c.independentGroups >= 2);
  const singleLens = synthesis.convergences.filter((c) => c.independentGroups < 2);

  return (
    <div className="space-y-12">
      <header className="border-b border-border pb-4">
        <h2 className="text-2xl font-semibold sm:text-3xl">{name?.trim() || "Chart"}</h2>
        <p className="mt-1.5 text-sm text-muted">
          {event.date}
          {event.time ? ` · ${event.time}` : " · time unknown"}
          {event.place ? ` · ${event.place.lat.toFixed(2)}, ${event.place.lng.toFixed(2)} · ${event.place.tz}` : ""} ·
          precision: {event.precision}
        </p>
      </header>

      {/* Convergence chart: the flagship interactive visual ----------------- */}
      <section>
        <h3 className="mb-1 text-base font-semibold uppercase tracking-wider text-accent">Convergence chart</h3>
        <p className="mb-4 text-sm text-muted">
          Your systems sit on the ring, colored by what they read from. Themes they agree on pull
          toward the center; tensions arc between the poles. Tap any point for details.
        </p>
        <div className="mx-auto max-w-xl rounded-2xl border border-border bg-surface/30 p-4 sm:p-6">
          <ConvergenceChart
            synthesis={synthesis}
            systems={computations.map((c) => ({
              id: c.meta.id,
              name: c.meta.displayName,
              derivedFrom: c.meta.derivedFrom,
            }))}
            selfName={name?.trim() || "You"}
          />
        </div>
      </section>

      {/* Deterministic synthesis map ----------------------------------------- */}
      <section>
        <h3 className="mb-1 text-base font-semibold uppercase tracking-wider text-accent">
          Convergences
        </h3>
        <p className="mb-4 text-sm text-muted">
          Ranked by how many <em>independent</em> source groups agree, not a blended score.
        </p>

        {crossConfirmed.length > 0 ? (
          <ul className="space-y-2">
            {crossConfirmed.map((c, i) => (
              <li key={i} className="rounded-lg border border-accent/30 bg-accent/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[15px] font-medium">
                    {humanizeValue(c.value)}{" "}
                    <span className="text-sm text-muted">· {c.axis}</span>
                  </span>
                  <span className="shrink-0 rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-semibold text-accent">
                    {c.independentGroups} independent sources
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-muted">
                  {[...new Set(c.contributors.map((a) => a.systemId))].join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No cross-source convergences at this precision.</p>
        )}

        {singleLens.length > 0 && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-muted">
              Single-lens signals ({singleLens.length}), supported by one source group
            </summary>
            <ul className="mt-2 flex flex-wrap gap-2">
              {singleLens.map((c, i) => (
                <li key={i} className="rounded border border-border bg-surface/40 px-2.5 py-1 text-sm text-muted">
                  {humanizeValue(c.value)} <span className="opacity-60">· {c.axis}</span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      {/* Tensions ------------------------------------------------------------ */}
      {synthesis.tensions.length > 0 && (
        <section>
          <h3 className="mb-1 text-base font-semibold uppercase tracking-wider text-accent-2">Tensions</h3>
          <p className="mb-4 text-sm text-muted">Declared oppositions where both poles are present: held, not averaged.</p>
          <ul className="space-y-2">
            {synthesis.tensions.map((t, i) => (
              <li key={i} className="rounded-lg border border-border bg-surface/40 p-4 text-sm">
                <div className="flex items-center justify-center gap-3 text-center">
                  <Pole value={t.sides[0].value} sources={t.sides[0].contributors.map((a) => a.systemId)} />
                  <span className="text-accent-2">⟷</span>
                  <Pole value={t.sides[1].value} sources={t.sides[1].contributors.map((a) => a.systemId)} />
                </div>
                <p className="mt-1.5 text-center text-xs uppercase tracking-wide text-muted">{t.axis}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Daily / seasonal transits ----------------------------------------- */}
      <TransitsSection intakeBody={intakeBody} />

      {/* Narrative (LLM layer over the deterministic synthesis) -------------- */}
      <NarrativePanel
        endpoint="/api/charts/narrate"
        body={intakeBody}
        title="Your reading"
        ctaLabel="Write my reading"
        autoStart
        initial={initialReading}
        idleBlurb="Prose over the synthesis above. It reads the convergences and tensions and never computes them. Once written, it stays saved on this chart until you refresh it."
      />

      {/* Per-system native output ------------------------------------------- */}
      <section>
        <h3 className="mb-1 text-base font-semibold uppercase tracking-wider text-accent">Systems</h3>
        <p className="mb-4 text-sm text-muted">
          Each tradition read on its own, drawn in its traditional form, with what it found in your chart.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {computations.map((c) => (
            <div key={c.meta.id} className="rounded-xl border border-border bg-surface/40 p-5">
              <div className="mb-1.5 flex items-baseline justify-between gap-2">
                {chartId ? (
                  <Link
                    href={`/account/chart/${chartId}/system/${c.meta.id}`}
                    className="text-lg font-semibold transition hover:text-accent"
                  >
                    {c.meta.displayName}
                  </Link>
                ) : (
                  <h4 className="text-lg font-semibold">{c.meta.displayName}</h4>
                )}
                <span className="shrink-0 text-xs uppercase tracking-wide text-muted">{c.meta.derivedFrom}</span>
              </div>
              {SYSTEM_BLURBS[c.meta.id] && (
                <p className="mb-3 text-sm leading-relaxed text-muted">{SYSTEM_BLURBS[c.meta.id]}</p>
              )}
              <SystemDiagram computation={c} />
              {chartId && (
                <Link
                  href={`/account/chart/${chartId}/system/${c.meta.id}`}
                  className="mb-3 inline-block text-sm font-medium text-accent transition hover:underline"
                >
                  View details and connections →
                </Link>
              )}
              {Object.values(c.native.factors).length ? (
                <ul className="space-y-2 border-t border-border/60 pt-3">
                  {Object.values(c.native.factors).map((f) => (
                    <li key={f.key} className="flex justify-between gap-3 text-sm">
                      <span className="text-muted">{f.label}</span>
                      <span className="text-right font-medium">{f.display ?? String(f.value)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm italic text-muted">Registered · no output yet (scaffold).</p>
              )}
              <Meanings computation={c} />
              {c.meta.lineage !== "traditional" && (
                <p className="mt-3 text-xs uppercase tracking-wide text-accent-2">{c.meta.lineage}</p>
              )}
            </div>
          ))}
        </div>

        {unavailable.length > 0 && (
          <div className="mt-4 text-sm text-muted">
            <span className="font-medium">Unavailable at this precision: </span>
            {unavailable.map((u) => `${u.meta.displayName} (${u.reason})`).join(" · ")}
          </div>
        )}
      </section>

      <details className="rounded-xl border border-border bg-surface/40 p-5">
        <summary className="cursor-pointer text-sm font-semibold uppercase tracking-wider text-accent">
          About these systems & ethics
        </summary>
        <div className="mt-4">
          <EthicsPanel
            systems={[...computations.map((c) => c.meta), ...unavailable.map((u) => u.meta)].map((m) => ({
              id: m.id,
              displayName: m.displayName,
              lineage: m.lineage,
            }))}
          />
        </div>
      </details>

      <footer className="text-xs text-muted">
        Ephemeris: {ephemerisVersion} · ontology v{synthesis.ontologyVersion}
      </footer>
    </div>
  );
}

function Pole({ value, sources }: { value: string; sources: string[] }) {
  return (
    <div className="flex-1">
      <div className="font-medium">{humanizeValue(value)}</div>
      <div className="text-xs text-muted">{[...new Set(sources)].join(", ")}</div>
    </div>
  );
}

function Meanings({ computation }: { computation: ComputedSystem }) {
  const lines = interpretationsFor(computation.meta.id, computation.native);
  if (lines.length === 0) return null;
  return (
    <details className="mt-3">
      <summary className="cursor-pointer text-sm text-muted hover:text-foreground">Meanings</summary>
      <ul className="mt-2 space-y-2">
        {lines.map((l, i) => (
          <li key={i} className="text-sm">
            <span className="font-medium text-foreground/90">{l.label}</span>
            <span className="text-muted">: {l.text}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}

function TransitsSection({ intakeBody }: { intakeBody: unknown }) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [transits, setTransits] = useState<TransitsResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setState("loading");
    setError(null);
    try {
      const res = await fetch("/api/transits", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(intakeBody),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.details || json.error || "Request failed");
      setTransits(json.transits as TransitsResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transits");
    } finally {
      setState("done");
    }
  }

  return (
    <section className="rounded-xl border border-border bg-surface/40 p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-accent">Today · Transits</h3>
        {state === "idle" && (
          <button
            onClick={load}
            className="rounded-lg border border-accent/40 px-3 py-1 text-xs font-medium text-accent transition hover:bg-accent/10"
          >
            Load current sky
          </button>
        )}
      </div>

      {state === "idle" && (
        <p className="text-sm text-muted">The current sky read against this chart: daily and seasonal movement.</p>
      )}
      {state === "loading" && <p className="text-sm text-muted">Reading the sky…</p>}
      {error && <p className="text-sm text-red-300">{error}</p>}

      {transits && (
        <div className="space-y-3">
          <p className="text-sm text-foreground/90">
            <span className="text-muted">Season:</span> Sun in {transits.season.sunSign} · Moon in{" "}
            {transits.season.moonSign} · {transits.season.moonPhase}
          </p>
          {transits.hits.length > 0 ? (
            <ul className="space-y-1">
              {transits.hits.map((h, i) => (
                <li key={i} className="flex justify-between gap-3 text-sm">
                  <span>
                    transiting <span className="text-foreground">{h.transiting}</span> {h.aspect}{" "}
                    natal <span className="text-foreground">{h.natal}</span>
                  </span>
                  <span className="text-muted">
                    {h.orb.toFixed(1)}° {h.applying ? "applying" : "separating"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No tight transits right now.</p>
          )}
          <p className="text-xs text-muted">As of {new Date(transits.date).toLocaleString()}</p>
        </div>
      )}
    </section>
  );
}

