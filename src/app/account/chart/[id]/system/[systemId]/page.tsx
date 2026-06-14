import { notFound, redirect } from "next/navigation";
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
import { AppSectionNav } from "@/components/site/AppSectionNav";
import { PageHeader, Card, CardLabel, Badge, Divider, EmptyState } from "@/components/ui";
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

  const backToChart = { href: `/account/chart/${id}`, label: "Back to the chart" };

  if (!comp) {
    return (
      <SiteShell nav={<AppSectionNav />}>
        <PageHeader title={nameOf.get(systemId) ?? "System"} back={backToChart} />
        <p className="text-muted">
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

  const metaLine = (
    <span className="font-mono text-xs">
      {row.date}
      {row.time ? ` · ${String(row.time).slice(0, 5)}` : " · time unknown"}
      {row.lat != null && row.lng != null ? ` · ${row.lat.toFixed(2)}, ${row.lng.toFixed(2)}` : ""} ·{" "}
      {row.precision}
    </span>
  );

  return (
    <SiteShell nav={<AppSectionNav />}>
      {/* The person */}
      <PageHeader
        eyebrow={meta.displayName}
        title={row.name || "This chart"}
        description={metaLine}
        back={backToChart}
      />

      {/* The system, in depth */}
      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="lineage">{LINEAGE_LABEL[meta.lineage] ?? meta.lineage}</Badge>
          <Badge variant="neutral">reads from your {meta.derivedFrom}</Badge>
        </div>
        <p className="mt-3 text-[15px] leading-relaxed text-foreground/90">
          {overview?.intro ?? SYSTEM_BLURBS[meta.id] ?? "A tradition OneSky reads from your birth moment."}
        </p>
        {overview && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <CardLabel>How to read it</CardLabel>
              <p className="mt-1 text-sm leading-relaxed text-foreground/85">{overview.how}</p>
            </div>
            <div>
              <CardLabel>How it applies to your life</CardLabel>
              <p className="mt-1 text-sm leading-relaxed text-foreground/85">{overview.appliesToLife}</p>
            </div>
          </div>
        )}
        {(overview?.lineageNote || SYSTEM_NOTE[meta.id]) && (
          <>
            <Divider className="mt-4" />
            <p className="mt-3 text-sm text-muted">
              <span className="font-medium">Good to know: </span>
              {overview?.lineageNote ?? SYSTEM_NOTE[meta.id]}
            </p>
          </>
        )}
      </Card>

      {/* The diagram */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-accent">Your chart</h2>
        <Card>
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
            <EmptyState
              className="mt-1 border-0 bg-transparent px-0 py-6"
              title="Add your full name to unlock this reading"
              description="This system reads from your name. Add your full name to this chart to see it."
            />
          ) : (
            <p className="text-sm italic text-muted">Registered, no output yet (scaffold).</p>
          )}
        </Card>
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
              <Card key={i} variant="accent">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">
                    {humanize(cv.value)} <span className="text-xs text-muted">· {cv.axis}</span>
                  </span>
                  {cv.independentGroups >= 2 && (
                    <Badge variant="accent">{cv.independentGroups} independent sources</Badge>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted">
                  shared with {cv.others.map((s) => nameOf.get(s) ?? s).join(" · ")}
                </p>
              </Card>
            ))}
          </div>
        )}

        {tensions.length > 0 && (
          <div className="mt-3 space-y-2">
            {tensions.map((t, i) => (
              <Card key={i} className="text-sm">
                <div className="flex items-center justify-center gap-3 text-center">
                  <span className="text-foreground">{humanize(t.mine)}</span>
                  <span className="text-accent-2">⟷</span>
                  <span className="text-foreground">{humanize(t.other)}</span>
                </div>
                <p className="mt-1 text-center text-xs text-muted">
                  {t.axis} · opposite pole in {t.otherSystems.map((s) => nameOf.get(s) ?? s).join(", ")}
                </p>
              </Card>
            ))}
          </div>
        )}
      </section>
    </SiteShell>
  );
}
