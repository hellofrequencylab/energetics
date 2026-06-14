import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getBirthEvent } from "@/lib/db/queries";
import { intake } from "@/lib/core/birth-event";
import { computeChart } from "@/lib/compute";
import { effectiveEnabledIds } from "@/lib/core/system-settings";
import { synthesize } from "@/lib/synthesis";
import { allMeta } from "@/lib/core/registry";
import { interpretationsFor } from "@/lib/corpus";
import { SYSTEM_BLURBS, LINEAGE_LABEL } from "@/lib/help/content";
import { SYSTEM_NOTE } from "@/lib/ethics";
import { overviewFor } from "@/lib/system-overviews";
import { SiteShell } from "@/components/site/SiteShell";
import { SystemDiagram } from "@/components/diagrams";

export const runtime = "nodejs";

/** Strip the ontology namespace ("western:fire" → "Fire") and title-case. */
function humanize(value: string): string {
  const bare = value.includes(":") ? value.split(":")[1] : value;
  return bare.charAt(0).toUpperCase() + bare.slice(1);
}

/**
 * One system, in depth, for one saved chart: the person, the system and its
 * lineage, their details within it, the system drawn in its traditional form, and
 * the crossover connections to the other systems (where they converge or hold a
 * complementary tension). All from the deterministic synthesis.
 */
export default async function SystemDetailPage({
  params,
}: {
  params: Promise<{ id: string; systemId: string }>;
}) {
  const { id, systemId } = await params;

  const supabase = await createClient();
  if (!supabase) redirect("/login?next=/account");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/account/chart/${id}/system/${systemId}`);

  const row = await getBirthEvent(supabase, id).catch(() => null);
  if (!row) notFound();

  const body: Record<string, unknown> = { date: row.date };
  if (row.name) body.name = row.name;
  if (row.time) body.time = String(row.time).slice(0, 5);
  if (row.lat != null && row.lng != null) {
    body.place = { lat: row.lat, lng: row.lng, ...(row.tz ? { tz: row.tz } : {}) };
  }

  const { event } = intake(body);
  const only = await effectiveEnabledIds();
  const { computations } = computeChart(event, { only });
  const synthesis = synthesize(event.id, computations);

  const nameOf = new Map(allMeta().map((m) => [m.id, m.displayName]));
  const comp = computations.find((c) => c.meta.id === systemId);

  const back = (
    <Link href={`/account/chart/${id}`} className="text-sm text-star/60 transition hover:text-star">
      ← Back to the chart
    </Link>
  );

  if (!comp) {
    return (
      <SiteShell width="max-w-2xl">
        {back}
        <h1 className="mt-3 font-display text-2xl font-semibold">{nameOf.get(systemId) ?? "System"}</h1>
        <p className="mt-2 text-star/70">
          This system is not part of this reading right now. It may be switched off, or it may need a
          birth time or place this chart does not have.
        </p>
      </SiteShell>
    );
  }

  const meta = comp.meta;
  const factors = Object.values(comp.native.factors);
  const meanings = interpretationsFor(meta.id, comp.native);
  const overview = overviewFor(systemId);

  // Crossover: convergences this system shares with at least one other system.
  const convergences = synthesis.convergences
    .filter((cv) => cv.contributors.some((a) => a.systemId === systemId))
    .map((cv) => {
      const others = [...new Set(cv.contributors.map((a) => a.systemId))].filter((s) => s !== systemId);
      return { axis: cv.axis, value: cv.value, independentGroups: cv.independentGroups, others };
    })
    .filter((cv) => cv.others.length > 0);

  // Crossover: complementary tensions where this system holds one pole.
  const tensions = synthesis.tensions
    .map((t) => {
      const side = t.sides.findIndex((s) => s.contributors.some((a) => a.systemId === systemId));
      if (side === -1) return null;
      const other = t.sides[1 - side];
      return {
        axis: t.axis,
        mine: t.sides[side].value,
        other: other.value,
        otherSystems: [...new Set(other.contributors.map((a) => a.systemId))],
      };
    })
    .filter((t): t is NonNullable<typeof t> => t !== null);

  return (
    <SiteShell width="max-w-3xl">
      {back}

      {/* The person */}
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.3em] text-accent">{meta.displayName}</p>
      <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">{row.name || "This chart"}</h1>
      <p className="mt-2 font-mono text-xs text-muted">
        {row.date}
        {row.time ? ` · ${String(row.time).slice(0, 5)}` : " · time unknown"}
        {row.lat != null && row.lng != null ? ` · ${row.lat.toFixed(2)}, ${row.lng.toFixed(2)}` : ""} ·
        {" "}
        {row.precision}
      </p>

      {/* The system, in depth */}
      <section className="mt-6 rounded-2xl border border-border bg-surface/40 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-accent/30 bg-accent/5 px-2.5 py-0.5 text-xs text-accent">
            {LINEAGE_LABEL[meta.lineage] ?? meta.lineage}
          </span>
          <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted">
            reads from your {meta.derivedFrom}
          </span>
        </div>
        <p className="mt-3 text-[15px] leading-relaxed text-foreground/90">
          {overview?.intro ?? SYSTEM_BLURBS[meta.id] ?? "A tradition OneSky reads from your birth moment."}
        </p>
        {overview && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">How to read it</p>
              <p className="mt-1 text-sm leading-relaxed text-foreground/85">{overview.how}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">How it applies to your life</p>
              <p className="mt-1 text-sm leading-relaxed text-foreground/85">{overview.appliesToLife}</p>
            </div>
          </div>
        )}
        {(overview?.lineageNote || SYSTEM_NOTE[meta.id]) && (
          <p className="mt-4 border-t border-border/60 pt-3 text-sm text-muted">
            <span className="font-medium">Good to know: </span>
            {overview?.lineageNote ?? SYSTEM_NOTE[meta.id]}
          </p>
        )}
      </section>

      {/* The diagram */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-accent">Your chart</h2>
        <div className="rounded-2xl border border-border bg-surface/40 p-5">
          <SystemDiagram computation={comp} />
          {factors.length ? (
            <ul className="mt-1 divide-y divide-border/50">
              {factors.map((f) => {
                const stat = overview?.stats?.[f.key];
                return (
                  <li key={f.key} className="py-2">
                    <div className="flex justify-between gap-3 text-sm">
                      <span className="text-muted">{f.label}</span>
                      <span className="text-right font-medium">{f.display ?? String(f.value)}</span>
                    </div>
                    {stat && <p className="mt-0.5 text-xs leading-relaxed text-muted">{stat}</p>}
                  </li>
                );
              })}
            </ul>
          ) : meta.derivedFrom === "name" ? (
            <p className="text-sm text-muted">Add your full name to this chart to unlock this reading.</p>
          ) : (
            <p className="text-sm italic text-muted">Registered, no output yet (scaffold).</p>
          )}
        </div>
      </section>

      {/* Their details / meanings */}
      {meanings.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-accent">What it means</h2>
          <ul className="space-y-2">
            {meanings.map((m, i) => (
              <li key={i} className="rounded-lg border border-border bg-surface/40 p-3 text-sm">
                <span className="font-medium text-foreground/90">{m.label}</span>
                <span className="text-muted">: {m.text}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Crossover connections */}
      <section className="mt-8">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-accent">
          Connections to other systems
        </h2>
        <p className="mb-3 text-xs text-muted">
          Where this reading meets the others on the same theme, and where it holds the opposite pole.
        </p>

        {convergences.length === 0 && tensions.length === 0 && (
          <p className="text-sm text-muted">
            No crossover with the other systems in this reading at this precision.
          </p>
        )}

        {convergences.length > 0 && (
          <div className="space-y-2">
            {convergences.map((cv, i) => (
              <div key={i} className="rounded-lg border border-accent/30 bg-accent/5 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">
                    {humanize(cv.value)} <span className="text-xs text-muted">· {cv.axis}</span>
                  </span>
                  {cv.independentGroups >= 2 && (
                    <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[11px] font-semibold text-accent">
                      {cv.independentGroups} independent sources
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted">
                  shared with {cv.others.map((s) => nameOf.get(s) ?? s).join(" · ")}
                </p>
              </div>
            ))}
          </div>
        )}

        {tensions.length > 0 && (
          <div className="mt-3 space-y-2">
            {tensions.map((t, i) => (
              <div key={i} className="rounded-lg border border-border bg-surface/40 p-3 text-sm">
                <div className="flex items-center justify-center gap-3 text-center">
                  <span className="text-foreground">{humanize(t.mine)}</span>
                  <span className="text-accent-2">⟷</span>
                  <span className="text-foreground">{humanize(t.other)}</span>
                </div>
                <p className="mt-1 text-center text-xs text-muted">
                  {t.axis} · opposite pole in {t.otherSystems.map((s) => nameOf.get(s) ?? s).join(", ")}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </SiteShell>
  );
}
