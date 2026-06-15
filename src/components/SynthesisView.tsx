"use client";

import { useState, type ReactNode } from "react";
import type { ComputeResponse } from "@/lib/api-types";
import { shortName } from "@/lib/system-labels";
import type { TransitsResult } from "@/lib/transits";
import { Card, CardLabel } from "@/components/ui";
import { EthicsPanel } from "./EthicsPanel";
import { NarrativePanel } from "./NarrativePanel";
import { ConvergenceChart } from "./ConvergenceChart";
import { SystemCard, type SystemConnection } from "./SystemCard";

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
  rail,
  railAfter,
}: {
  data: ComputeResponse;
  intakeBody: unknown;
  /** When set (a saved chart), each system links to its detail page. */
  chartId?: string;
  /** A reading already saved for this chart, shown at once. */
  initialReading?: { text: string; model?: string } | null;
  /** Page-specific card at the top of the details rail (e.g. the editable profile). */
  rail?: ReactNode;
  /** Page-specific cards placed just under the at-a-glance card (e.g. notes, record). */
  railAfter?: ReactNode;
}) {
  const { computations, unavailable, synthesis, event, name, ephemerisVersion } = data;
  const crossConfirmed = synthesis.convergences.filter((c) => c.independentGroups >= 2);
  const singleLens = synthesis.convergences.filter((c) => c.independentGroups < 2);

  // A plain, deterministic takeaway: the most cross-confirmed themes and the
  // most-supported tension. Read from the structure, not computed.
  const topThemes = crossConfirmed.slice(0, 3).map((c) => humanizeValue(c.value));
  const tensionReach = (t: (typeof synthesis.tensions)[number]) =>
    new Set(t.sides.flatMap((s) => s.contributors.map((a) => a.systemId))).size;
  const centralTension = [...synthesis.tensions].sort((a, b) => tensionReach(b) - tensionReach(a))[0];
  const themeList =
    topThemes.length <= 1
      ? topThemes[0]
      : `${topThemes.slice(0, -1).join(", ")} and ${topThemes[topThemes.length - 1]}`;

  const shortOf = (id: string) =>
    shortName(id, computations.find((c) => c.meta.id === id)?.meta.displayName ?? id);
  const connectionsFor = (systemId: string): SystemConnection[] =>
    synthesis.convergences
      .filter((cv) => cv.contributors.some((a) => a.systemId === systemId))
      .map((cv) => ({
        theme: cv.value,
        groups: cv.independentGroups,
        partners: [...new Set(cv.contributors.map((a) => a.systemId))]
          .filter((id) => id !== systemId)
          .map((id) => ({ id, short: shortOf(id) })),
      }))
      .filter((c) => c.partners.length > 0)
      .sort((a, b) => b.groups - a.groups)
      .slice(0, 8)
      .map(({ theme, partners }) => ({ theme, partners }));

  const metaLine = `${event.date}${event.time ? ` · ${event.time}` : " · time unknown"}${
    event.place ? ` · ${event.place.lat.toFixed(2)}, ${event.place.lng.toFixed(2)} · ${event.place.tz}` : ""
  } · ${event.precision}`;

  return (
    <div className="space-y-8">
      {/* Identity line. The saved-chart page passes `rail` and shows the name in its
          own PageHeader, so we skip the duplicate heading there. */}
      {!rail && (
        <header className="border-b border-border pb-4">
          <h2 className="text-2xl font-semibold sm:text-3xl">{name?.trim() || "Chart"}</h2>
          <p className="mt-1.5 text-sm text-muted">{metaLine}</p>
        </header>
      )}

      {/* Convergence chart: the flagship visual, full width at the top. */}
      <section>
        <h3 className="mb-1 text-base font-semibold uppercase tracking-wider text-accent">Convergence chart</h3>
        <p className="mb-4 max-w-2xl text-sm leading-relaxed text-muted">
          Your whole reading in one picture. Each tradition sits on the ring, colored by what it reads
          from: the sky, the calendar, or your name. A theme moves toward the center when more
          independent traditions arrive at it on their own. Gold lines connect a theme to the
          traditions that found it. Dashed lines are tensions: two opposite pulls you hold at once.
        </p>
        <div className="rounded-2xl border border-border bg-surface/30 p-4 sm:p-6">
          <ConvergenceChart synthesis={synthesis} computations={computations} selfName={name?.trim() || "You"} />
        </div>
      </section>

      {/* Below the chart: page content on the left, the details rail on the right. */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-12">
          {/* Narrative (LLM layer over the deterministic synthesis). */}
          <NarrativePanel
            endpoint="/api/charts/narrate"
            body={intakeBody}
            title="Your reading"
            ctaLabel="Write my reading"
            autoStart
            initial={initialReading}
            idleBlurb="Prose over the synthesis. It reads the convergences and tensions and never computes them. Once written, it stays saved on this chart until you refresh it."
          />

          {/* Daily / seasonal transits. */}
          <TransitsSection intakeBody={intakeBody} />

          {/* Per-system dashboard. */}
          <section>
            <h3 className="mb-1 text-base font-semibold uppercase tracking-wider text-accent">Systems</h3>
            <p className="mb-4 text-sm leading-relaxed text-muted">
              Each tradition read on its own: your chart, your energy at a glance, how it applies, and
              the themes it shares with other systems.
            </p>
            <div className="space-y-5">
              {computations.map((c) => (
                <SystemCard key={c.meta.id} computation={c} chartId={chartId} connections={connectionsFor(c.meta.id)} />
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
        </div>

        {/* Details rail. */}
        <aside className="space-y-5">
          {rail}

          <Card>
            <CardLabel>At a glance</CardLabel>
            <p className="mt-2 font-mono text-xs text-muted">{metaLine}</p>
            <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
              <Stat label="Themes" value={`${synthesis.convergences.length} (${crossConfirmed.length} cross-confirmed)`} />
              <Stat label="Tensions" value={String(synthesis.tensions.length)} />
              <Stat label="Systems" value={String(computations.length)} />
            </dl>
            {topThemes.length > 0 ? (
              <p className="mt-4 border-t border-border pt-4 text-sm leading-relaxed text-foreground/90">
                <span className="font-medium text-accent">Strongest: </span>
                {themeList}.
                {centralTension &&
                  ` Central tension: ${humanizeValue(centralTension.sides[0].value)} and ${humanizeValue(
                    centralTension.sides[1].value,
                  )}.`}
              </p>
            ) : (
              <p className="mt-4 border-t border-border pt-4 text-sm text-muted">
                No cross-confirmed theme at this precision. Add your birth time and place to unlock more.
              </p>
            )}
          </Card>

          {railAfter}

          {/* Convergences: all of them, in the rail. */}
          <Card>
            <CardLabel>Convergences</CardLabel>
            {crossConfirmed.length > 0 ? (
              <ul className="mt-2 space-y-1.5">
                {crossConfirmed.map((c, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate">
                      {humanizeValue(c.value)} <span className="text-xs text-muted">· {c.axis}</span>
                    </span>
                    <span
                      className="shrink-0 rounded-full bg-accent/20 px-2 py-0.5 text-[11px] font-semibold text-accent"
                      title={`${c.independentGroups} independent sources: ${[...new Set(c.contributors.map((a) => a.systemId))].join(", ")}`}
                    >
                      {c.independentGroups}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted">No cross-source convergences at this precision.</p>
            )}
            {singleLens.length > 0 && (
              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-muted">Single-lens signals ({singleLens.length})</summary>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">
                  {singleLens.map((c) => humanizeValue(c.value)).join(" · ")}
                </p>
              </details>
            )}
          </Card>

          {/* Tensions: all of them, in the rail. */}
          {synthesis.tensions.length > 0 && (
            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide text-accent-2">Tensions</p>
              <ul className="mt-2 space-y-1.5 text-sm">
                {synthesis.tensions.map((t, i) => (
                  <li key={i} className="flex items-center justify-center gap-2 text-center">
                    <span>{humanizeValue(t.sides[0].value)}</span>
                    <span className="text-accent-2">⟷</span>
                    <span>{humanizeValue(t.sides[1].value)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card>
            <CardLabel>Jump to a system</CardLabel>
            <nav className="mt-2 flex flex-wrap gap-2" aria-label="Jump to a system">
              {computations.map((c) => (
                <a
                  key={c.meta.id}
                  href={`#system-${c.meta.id}`}
                  className="rounded-full border border-border bg-surface/40 px-2.5 py-1 text-xs text-muted transition hover:border-accent/40 hover:text-foreground"
                >
                  {shortName(c.meta.id, c.meta.displayName)}
                </a>
              ))}
            </nav>
          </Card>

          <p className="px-1 text-xs text-muted">
            Ephemeris: {ephemerisVersion} · ontology v{synthesis.ontologyVersion}
          </p>
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
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
        <p className="text-sm text-muted">
          How today&apos;s sky meets your chart: the moving energy around you right now. This is
          weather, not your core chart.
        </p>
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
                    transiting <span className="text-foreground">{h.transiting}</span> {h.aspect} natal{" "}
                    <span className="text-foreground">{h.natal}</span>
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
