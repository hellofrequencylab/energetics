import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/db/queries";
import { allMeta } from "@/lib/core/registry";
import { catalogEntry } from "@/lib/core/catalog";
import { effectiveEnabledMap } from "@/lib/core/system-settings";
import { SiteShell } from "@/components/site/SiteShell";
import { SystemToggle } from "@/components/admin/SystemToggle";

export const metadata: Metadata = { title: "Systems · Admin · ONESKY" };
export const runtime = "nodejs";

/**
 * Admin: switch systems on or off for everyone. Gated by the profile is_admin
 * flag (and by row level security on writes). Most systems ship off; this is
 * where they are turned on.
 */
export default async function AdminSystemsPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/account");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/systems");

  const profile = await getProfile(supabase, user.id).catch(() => null);
  if (!profile?.is_admin) {
    return (
      <SiteShell width="max-w-3xl">
        <div className="py-10 text-center">
          <h1 className="font-display text-2xl font-semibold">Not authorized</h1>
          <p className="mt-2 text-star/70">This area is for admins.</p>
          <Link href="/account" className="mt-6 inline-block text-sm text-horizon-amber underline underline-offset-4">
            Back to your account
          </Link>
        </div>
      </SiteShell>
    );
  }

  const enabledMap = await effectiveEnabledMap();
  const metas = allMeta();
  const core = metas.filter((m) => catalogEntry(m.id).group === "core");
  const extended = metas.filter((m) => catalogEntry(m.id).group !== "core");
  const onCount = [...enabledMap.values()].filter(Boolean).length;

  const Row = (m: (typeof metas)[number]) => (
    <SystemToggle
      key={m.id}
      systemId={m.id}
      displayName={m.displayName}
      lineage={m.lineage}
      derivedFrom={m.derivedFrom}
      inSynthesis={catalogEntry(m.id).inSynthesis}
      enabled={enabledMap.get(m.id) ?? false}
    />
  );

  return (
    <SiteShell width="max-w-4xl">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-horizon-amber">Admin</p>
      <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Systems catalog</h1>
      <p className="mt-2 max-w-xl text-star/80">
        Switch systems on or off for everyone. {onCount} of {metas.length} are on. Off systems are
        registered and ready, they just do not run or appear until you turn them on.
      </p>

      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold">Core</h2>
        <p className="mt-1 text-sm text-star/60">On by default. The everyday reading.</p>
        <ul className="mt-3 grid gap-3">{core.map(Row)}</ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Extended</h2>
        <p className="mt-1 text-sm text-star/60">Off by default. Turn on what you want to offer.</p>
        <ul className="mt-3 grid gap-3">{extended.map(Row)}</ul>
      </section>

      <p className="mt-10 text-xs text-star/50">
        Draconic, harmonic, and evolutionary are planned as modes of the Western chart, not
        standalone systems, so they are not listed here yet.
      </p>
    </SiteShell>
  );
}
