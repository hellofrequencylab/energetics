import Link from "next/link";
import type { ComputedSystem } from "@/lib/synthesis/types";
import { energyCheatSheet } from "@/lib/cheatsheet";
import { SYSTEM_BLURBS, LINEAGE_LABEL } from "@/lib/help/content";
import { SYSTEM_NOTE } from "@/lib/ethics";
import { SystemDiagram } from "./diagrams";

/** A theme this system shares, and the other systems to jump to for it. */
export interface SystemConnection {
  theme: string;
  partners: { id: string; short: string }[];
}

function humanize(value: string): string {
  const bare = value.includes(":") ? value.split(":")[1] : value;
  return bare.charAt(0).toUpperCase() + bare.slice(1);
}

/**
 * One system, as a consistent dashboard card: the chart drawing on the left, the
 * energy cheat sheet on the right, how it applies and things to note underneath,
 * then a row of shared convergences that jump to the related system on the page.
 * Every system uses the same template, so the dashboard stays even and scannable.
 */
export function SystemCard({
  computation: c,
  chartId,
  connections,
}: {
  computation: ComputedSystem;
  chartId?: string;
  connections: SystemConnection[];
}) {
  const cheats = energyCheatSheet(c);
  const factors = Object.values(c.native.factors);
  const visibleFactors = factors.length > 7 ? factors.slice(0, 6) : factors;
  const hiddenFactors = factors.slice(visibleFactors.length);
  const blurb = SYSTEM_BLURBS[c.meta.id];
  const note = SYSTEM_NOTE[c.meta.id];
  const detailHref = chartId ? `/account/chart/${chartId}/system/${c.meta.id}` : null;

  return (
    <article id={`system-${c.meta.id}`} className="scroll-mt-24 rounded-2xl border border-border bg-surface/40 p-5 sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {detailHref ? (
            <Link href={detailHref} className="text-xl font-semibold transition hover:text-accent">
              {c.meta.displayName}
            </Link>
          ) : (
            <h4 className="text-xl font-semibold">{c.meta.displayName}</h4>
          )}
          {c.meta.lineage !== "traditional" && (
            <span className="rounded-full border border-accent-2/30 px-2 py-0.5 text-[11px] uppercase tracking-wide text-accent-2">
              {LINEAGE_LABEL[c.meta.lineage] ?? c.meta.lineage}
            </span>
          )}
        </div>
        <span className="text-xs uppercase tracking-wide text-muted">reads your {c.meta.derivedFrom}</span>
      </div>

      {/* Left: the chart drawing + its data. Right: energy at a glance. */}
      <div className="mt-4 grid gap-6 md:grid-cols-2">
        <div>
          <SystemDiagram computation={c} />
          {visibleFactors.length > 0 ? (
            <ul className="space-y-2 border-t border-border/60 pt-3">
              {visibleFactors.map((f) => (
                <li key={f.key} className="flex justify-between gap-3 text-sm">
                  <span className="text-muted">{f.label}</span>
                  <span className="text-right font-medium">{f.display ?? String(f.value)}</span>
                </li>
              ))}
              {hiddenFactors.length > 0 && (
                <li>
                  <details className="text-sm">
                    <summary className="cursor-pointer text-muted hover:text-foreground">
                      {hiddenFactors.length} more
                    </summary>
                    <ul className="mt-2 space-y-2">
                      {hiddenFactors.map((f) => (
                        <li key={f.key} className="flex justify-between gap-3">
                          <span className="text-muted">{f.label}</span>
                          <span className="text-right font-medium">{f.display ?? String(f.value)}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                </li>
              )}
            </ul>
          ) : (
            <p className="text-sm italic text-muted">Registered, no output yet (scaffold).</p>
          )}
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent">Energy at a glance</p>
          {cheats.length > 0 ? (
            <ul className="space-y-2.5">
              {cheats.map((l, i) => (
                <li key={i} className="text-sm leading-relaxed">
                  <span className="font-medium text-foreground/90">{l.term}</span>
                  <span className="text-muted">: {l.gist}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Plain-language meanings are on the way for this system.</p>
          )}
        </div>
      </div>

      {/* Underneath: how it applies and things to note. */}
      {(blurb || note) && (
        <div className="mt-5 border-t border-border/60 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">How it applies, and things to note</p>
          {blurb && <p className="mt-1.5 text-sm leading-relaxed text-foreground/85">{blurb}</p>}
          {note && (
            <p className="mt-2 text-sm leading-relaxed text-muted">
              <span className="font-medium">Note: </span>
              {note}
            </p>
          )}
        </div>
      )}

      {/* Underneath: shared convergences, each jumping to the related system. */}
      {connections.length > 0 && (
        <div className="mt-4 border-t border-border/60 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">
            Shared with other systems
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {connections.map((conn, i) => (
              <a
                key={i}
                href={`#system-${conn.partners[0].id}`}
                title={`${humanize(conn.theme)} also in ${conn.partners.map((p) => p.short).join(", ")}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/5 px-3 py-1 text-xs transition hover:border-accent/60 hover:bg-accent/10"
              >
                <span className="font-medium text-foreground/90">{humanize(conn.theme)}</span>
                <span className="text-muted">→ {conn.partners.map((p) => p.short).join(", ")}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {detailHref && (
        <Link href={detailHref} className="mt-4 inline-block text-sm font-medium text-accent transition hover:underline">
          Full details and connections →
        </Link>
      )}
    </article>
  );
}
