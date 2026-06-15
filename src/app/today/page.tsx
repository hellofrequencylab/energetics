import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { currentUser, currentProfile } from "@/lib/auth/session";
import {
  getBirthEvent,
  recentBirthEvents,
  listResonances,
  cacheChartComputations,
} from "@/lib/db/queries";
import { intake } from "@/lib/core/birth-event";
import { computeChart } from "@/lib/compute";
import { loadCachedChart } from "@/lib/compute-cache";
import { getEphemeris } from "@/lib/core/ephemeris";
import { effectiveEnabledIds } from "@/lib/core/system-settings";
import { computeTransits, type TransitHit } from "@/lib/transits";
import { SiteShell } from "@/components/site/SiteShell";
import { AppSectionNav } from "@/components/site/AppSectionNav";
import { PageHeader, Card, Badge, ButtonLink } from "@/components/ui";
import { getEntitlement } from "@/lib/billing/entitlement";
import { UpgradePrompt } from "@/components/billing/UpgradePrompt";

export const runtime = "nodejs";
// Today's sky is read from the current moment, so never cache this page.
export const dynamic = "force-dynamic";

// A private, signed-in page (it reads your saved charts), so keep it out of the index.
export const metadata = { title: "Today", robots: { index: false, follow: false } };

const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

/** "Mars square your Sun, 1.2 degrees, applying" (no em dashes, plain words). */
function describeTransit(h: TransitHit): string {
  const motion = h.applying ? "applying" : "separating";
  return `${h.transiting} ${h.aspect} your ${h.natal}, ${h.orb.toFixed(1)}°, ${motion}`;
}

/**
 * The daily-use home: the signed-in user's primary chart at a glance, today's
 * transits to it, and recent activity. Deterministic (no model calls): the sky
 * for the current moment read against the natal Western placements.
 */
export default async function TodayPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/login?next=/today");
  const user = await currentUser();
  if (!user) redirect("/login?next=/today");

  const profile = await currentProfile();
  const isPlus = (await getEntitlement()) === "plus";
  const [recent, resonances] = await Promise.all([
    recentBirthEvents(supabase).catch(() => []),
    listResonances(supabase).catch(() => []),
  ]);

  const primaryId = profile?.primary_chart_id ?? null;
  const primary = primaryId ? await getBirthEvent(supabase, primaryId).catch(() => null) : null;

  const today = DATE_FMT.format(new Date());

  // No primary chart yet: invite the user to pin one, and show their charts.
  if (!primary) {
    return (
      <SiteShell nav={<AppSectionNav />}>
        <PageHeader title="Today" />
        <Card>
          <p className="text-sm text-muted">{today}</p>
          <h2 className="mt-1 font-display text-2xl font-semibold">Pin your sky to see today</h2>
          <p className="mt-2 max-w-prose text-sm text-muted">
            Choose a primary chart and this page shows the day&apos;s movements read against it. Open
            a saved chart and set it as your primary, or save one first.
          </p>
          <div className="mt-4">
            <ButtonLink href="/account">Go to your charts</ButtonLink>
          </div>
        </Card>
        {recent.length > 0 && <RecentCharts recent={recent} />}
      </SiteShell>
    );
  }

  // Build the natal chart (cache-backed) and read today's sky against it.
  const body: Record<string, unknown> = { id: primary.id, date: primary.date };
  if (primary.name) body.name = primary.name;
  if (primary.time) body.time = String(primary.time).slice(0, 5);
  if (primary.lat != null && primary.lng != null) {
    body.place = { lat: primary.lat, lng: primary.lng, ...(primary.tz ? { tz: primary.tz } : {}) };
  }
  const { event } = intake(body);
  const only = await effectiveEnabledIds();
  const ephemerisVersion = getEphemeris().version;
  const cached = await loadCachedChart(supabase, event.id, event.precision, only, ephemerisVersion).catch(
    () => null,
  );
  const { computations } = cached ?? computeChart(event, { only });
  if (!cached) {
    await cacheChartComputations(supabase, event.id, ephemerisVersion, computations).catch(() => {});
  }
  const western = computations.find((c) => c.meta.id === "western-tropical");
  const transits = western ? computeTransits(western.native) : null;

  // Natal Sun / Moon / Rising at a glance, when present.
  const glance = western
    ? (["sun", "moon", "ascendant"] as const)
        .map((k) => western.native.factors[k])
        .filter((f): f is NonNullable<typeof f> => Boolean(f))
        .map((f) => ({ label: f.label, value: f.display ?? String(f.value) }))
    : [];

  return (
    <SiteShell nav={<AppSectionNav />}>
      <PageHeader
        title="Today"
        actions={<ButtonLink href={`/account/chart/${primary.id}`}>Open full chart</ButtonLink>}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <p className="text-sm text-muted">{today}</p>
          <h2 className="mt-1 font-display text-2xl font-semibold">
            {primary.name ? `${primary.name}'s sky` : "Your sky"}
          </h2>
          {transits && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge>Sun in {transits.season.sunSign}</Badge>
              <Badge>Moon in {transits.season.moonSign}</Badge>
              <Badge>{transits.season.moonPhase}</Badge>
            </div>
          )}
          {glance.length > 0 && (
            <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
              {glance.map((g) => (
                <div key={g.label}>
                  <dt className="text-xs uppercase tracking-wide text-muted">{g.label}</dt>
                  <dd className="mt-0.5 font-medium">{g.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </Card>

        <Card>
          <h2 className="font-display text-xl font-semibold">Today&apos;s movements</h2>
          <p className="mt-1 text-sm text-muted">
            How the sky right now touches your natal chart, tightest first.
          </p>
          {!isPlus ? (
            <UpgradePrompt
              className="mt-3"
              message="Following the day's sky against your chart is part of OneSky Plus. Your full chart and basic reading stay free."
            />
          ) : transits && transits.hits.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm">
              {transits.hits.slice(0, 8).map((h, i) => (
                <li key={`${h.transiting}-${h.natal}-${i}`} className="flex items-baseline gap-2">
                  <span
                    aria-hidden="true"
                    className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                      h.applying ? "bg-horizon-amber" : "bg-star/40"
                    }`}
                  />
                  <span>{describeTransit(h)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">
              No close aspects today. The season strip above still sets the tone.
            </p>
          )}
          {!primary.time && (
            <p className="mt-3 text-xs text-muted">
              Add a birth time to this chart for angles (Rising and Midheaven) in the reading.
            </p>
          )}
        </Card>
      </div>

      {recent.length > 0 && <RecentCharts recent={recent} />}

      {resonances.length > 0 && (
        <Card className="mt-6">
          <h2 className="font-display text-xl font-semibold">Your resonances</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {resonances.slice(0, 6).map((r) => (
              <li key={r.id}>
                <Link
                  href="/account"
                  className="rounded-full border border-border px-3 py-1 text-sm transition hover:border-accent"
                >
                  {r.label || (r.mode === "intimate" ? "Intimate pairing" : "Platonic pairing")}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </SiteShell>
  );
}

function RecentCharts({
  recent,
}: {
  recent: { id: string; name: string | null; date: string }[];
}) {
  return (
    <Card className="mt-6">
      <h2 className="font-display text-xl font-semibold">Recent charts</h2>
      <ul className="mt-3 divide-y divide-border">
        {recent.slice(0, 6).map((c) => (
          <li key={c.id}>
            <Link
              href={`/account/chart/${c.id}`}
              className="flex items-center justify-between py-2 text-sm transition hover:text-accent"
            >
              <span className="font-medium">{c.name || "Untitled chart"}</span>
              <span className="text-muted">{c.date}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
