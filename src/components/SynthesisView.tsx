"use client";

import { useState } from "react";
import type { ComputeResponse, NarrateResponse } from "@/lib/api-types";
import type { NarrativeResult } from "@/lib/synthesis/narrative";
import { westernToWheel } from "@/lib/wheel";
import { ChartWheel } from "./ChartWheel";
import { EthicsPanel } from "./EthicsPanel";

/** Strip the ontology namespace ("western:fire" → "Fire") and title-case. */
function humanizeValue(value: string): string {
  const bare = value.includes(":") ? value.split(":")[1] : value;
  return bare.charAt(0).toUpperCase() + bare.slice(1);
}

export function SynthesisView({ data, intakeBody }: { data: ComputeResponse; intakeBody: unknown }) {
  const { computations, unavailable, synthesis, event, name, ephemerisVersion } = data;
  const crossConfirmed = synthesis.convergences.filter((c) => c.independentGroups >= 2);
  const singleLens = synthesis.convergences.filter((c) => c.independentGroups < 2);

  const western = computations.find((c) => c.meta.id === "western-tropical");
  const wheel = western ? westernToWheel(western.native) : null;

  return (
    <div className="space-y-10">
      <header className="border-b border-border pb-4">
        <h2 className="text-2xl font-semibold">{name?.trim() || "Chart"}</h2>
        <p className="mt-1 text-sm text-muted">
          {event.date}
          {event.time ? ` · ${event.time}` : " · time unknown"}
          {event.place ? ` · ${event.place.lat.toFixed(2)}, ${event.place.lng.toFixed(2)} · ${event.place.tz}` : ""} ·
          precision: {event.precision}
        </p>
      </header>

      {/* Chart wheel (Western) ---------------------------------------------- */}
      {wheel && (
        <section className="rounded-xl border border-border bg-surface/40 p-4">
          <ChartWheel data={wheel} />
          {!wheel.cusps && (
            <p className="mt-1 text-center text-xs text-muted">
              Add a birth time + place to see houses and the Ascendant.
            </p>
          )}
        </section>
      )}

      {/* Deterministic synthesis map ----------------------------------------- */}
      <section>
        <h3 className="mb-1 text-sm font-semibold uppercase tracking-wider text-accent">
          Convergences
        </h3>
        <p className="mb-4 text-xs text-muted">
          Ranked by how many <em>independent</em> source groups agree — not a blended score.
        </p>

        {crossConfirmed.length > 0 ? (
          <ul className="space-y-2">
            {crossConfirmed.map((c, i) => (
              <li key={i} className="rounded-lg border border-accent/30 bg-accent/5 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">
                    {humanizeValue(c.value)}{" "}
                    <span className="text-xs text-muted">· {c.axis}</span>
                  </span>
                  <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[11px] font-semibold text-accent">
                    {c.independentGroups} independent sources
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">
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
            <summary className="cursor-pointer text-xs text-muted">
              Single-lens signals ({singleLens.length}) — supported by one source group
            </summary>
            <ul className="mt-2 flex flex-wrap gap-2">
              {singleLens.map((c, i) => (
                <li key={i} className="rounded border border-border bg-surface/40 px-2 py-1 text-xs text-muted">
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
          <h3 className="mb-1 text-sm font-semibold uppercase tracking-wider text-accent-2">Tensions</h3>
          <p className="mb-4 text-xs text-muted">Declared oppositions where both poles are present — held, not averaged.</p>
          <ul className="space-y-2">
            {synthesis.tensions.map((t, i) => (
              <li key={i} className="rounded-lg border border-border bg-surface/40 p-3 text-sm">
                <div className="flex items-center justify-center gap-3 text-center">
                  <Pole value={t.sides[0].value} sources={t.sides[0].contributors.map((a) => a.systemId)} />
                  <span className="text-accent-2">⟷</span>
                  <Pole value={t.sides[1].value} sources={t.sides[1].contributors.map((a) => a.systemId)} />
                </div>
                <p className="mt-1 text-center text-[11px] uppercase tracking-wide text-muted">{t.axis}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Narrative (LLM layer over the deterministic synthesis) -------------- */}
      <NarrativeSection intakeBody={intakeBody} />

      {/* Per-system native output ------------------------------------------- */}
      <section>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-accent">Systems</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {computations.map((c) => (
            <div key={c.meta.id} className="rounded-xl border border-border bg-surface/40 p-5">
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <h4 className="font-semibold">{c.meta.displayName}</h4>
                <span className="text-[10px] uppercase tracking-wide text-muted">{c.meta.derivedFrom}</span>
              </div>
              {Object.values(c.native.factors).length ? (
                <ul className="space-y-1.5">
                  {Object.values(c.native.factors).map((f) => (
                    <li key={f.key} className="flex justify-between gap-3 text-sm">
                      <span className="text-muted">{f.label}</span>
                      <span className="text-right">{f.display ?? String(f.value)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs italic text-muted">Registered · no output yet (scaffold).</p>
              )}
              {c.meta.lineage !== "traditional" && (
                <p className="mt-3 text-[10px] uppercase tracking-wide text-accent-2">{c.meta.lineage}</p>
              )}
            </div>
          ))}
        </div>

        {unavailable.length > 0 && (
          <div className="mt-4 text-xs text-muted">
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
      <div className="text-[11px] text-muted">{[...new Set(sources)].join(", ")}</div>
    </div>
  );
}

function NarrativeSection({ intakeBody }: { intakeBody: unknown }) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [narrative, setNarrative] = useState<NarrativeResult | null>(null);

  async function generate() {
    setState("loading");
    try {
      const res = await fetch("/api/charts/narrate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(intakeBody),
      });
      const json = (await res.json()) as NarrateResponse;
      setNarrative(json.narrative);
    } catch {
      setNarrative({ available: false, text: "", note: "Narrative request failed." });
    } finally {
      setState("done");
    }
  }

  return (
    <section className="rounded-xl border border-border bg-surface/60 p-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-accent-2">
          ✦ Narrative
        </h3>
        {state === "idle" && (
          <button
            onClick={generate}
            className="rounded-lg border border-accent-2/40 px-3 py-1 text-xs font-medium text-accent-2 transition hover:bg-accent-2/10"
          >
            Generate from synthesis
          </button>
        )}
      </div>

      {state === "idle" && (
        <p className="text-sm text-muted">
          Optional prose layer. Reads the deterministic convergences and tensions above — it never
          computes them.
        </p>
      )}
      {state === "loading" && <p className="text-sm text-muted">Writing…</p>}
      {state === "done" && narrative && (
        narrative.available ? (
          <article className="space-y-3 text-[15px] leading-relaxed text-foreground/90">
            {renderMarkdown(narrative.text)}
            {narrative.model && <p className="pt-2 text-xs text-muted">By {narrative.model}</p>}
          </article>
        ) : (
          <p className="text-sm text-muted">{narrative.note}</p>
        )
      )}
    </section>
  );
}

/** Minimal markdown: ## headings, - bullets, paragraphs. */
function renderMarkdown(text: string) {
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];
  let para: string[] = [];
  const flushPara = () => {
    if (para.length) {
      blocks.push(<p key={`p${blocks.length}`}>{para.join(" ")}</p>);
      para = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      blocks.push(
        <ul key={`l${blocks.length}`} className="list-disc space-y-1 pl-5">
          {list.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>,
      );
      list = [];
    }
  };
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (line.startsWith("## ")) {
      flushPara();
      flushList();
      blocks.push(
        <h4 key={`h${blocks.length}`} className="pt-2 text-sm font-semibold uppercase tracking-wider text-accent">
          {line.slice(3)}
        </h4>,
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      flushPara();
      list.push(line.slice(2));
    } else if (line === "") {
      flushPara();
      flushList();
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();
  return blocks;
}
