import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { currentUser, currentProfile } from "@/lib/auth/session";
import { allMeta } from "@/lib/core/registry";
import { catalogEntry } from "@/lib/core/catalog";
import { effectiveEnabledMap, effectiveOrderMap, sortByOrder } from "@/lib/core/system-settings";
import { SiteShell } from "@/components/site/SiteShell";
import { AppSectionNav } from "@/components/site/AppSectionNav";
import { PageHeader, ButtonLink } from "@/components/ui";
import { SystemCatalog, type CatalogRow } from "@/components/admin/SystemCatalog";

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

  const user = await currentUser();
  if (!user) redirect("/login?next=/admin/systems");

  const profile = await currentProfile();
  if (!profile?.is_admin) {
    return (
      <SiteShell nav={<AppSectionNav />}>
        <PageHeader title="Not authorized" />
        <p className="text-muted">This area is for admins.</p>
        <div className="mt-6">
          <ButtonLink href="/account" variant="secondary">
            Back to your account
          </ButtonLink>
        </div>
      </SiteShell>
    );
  }

  const [enabledMap, orderMap] = await Promise.all([effectiveEnabledMap(), effectiveOrderMap()]);
  const metas = sortByOrder(allMeta(), (m) => m.id, orderMap);
  const onCount = [...enabledMap.values()].filter(Boolean).length;

  const rows: CatalogRow[] = metas.map((m) => ({
    id: m.id,
    displayName: m.displayName,
    lineage: m.lineage,
    derivedFrom: m.derivedFrom,
    inSynthesis: catalogEntry(m.id).inSynthesis,
    enabled: enabledMap.get(m.id) ?? false,
    group: catalogEntry(m.id).group,
  }));

  return (
    <SiteShell nav={<AppSectionNav />}>
      <PageHeader
        eyebrow="Admin"
        title="Systems catalog"
        description={`Switch systems on or off for everyone, and drag to set the order they appear in. ${onCount} of ${metas.length} are on. Off systems are registered and ready, they just do not run or appear until you turn them on.`}
      />

      <section>
        <p className="mb-3 text-sm text-muted">
          Drag a row by its handle, or use the up and down arrows, to reorder. Changes save as you go.
        </p>
        <SystemCatalog systems={rows} />
      </section>

      <p className="mt-10 text-xs text-muted">
        Draconic, harmonic, and evolutionary are planned as modes of the Western chart, not
        standalone systems, so they are not listed here yet.
      </p>
    </SiteShell>
  );
}
