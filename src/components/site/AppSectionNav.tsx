import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/db/queries";
import { SectionNav, type SectionNavItem } from "@/components/ui/SectionNav";

/**
 * The role-aware section sub-nav for the signed-in area. One nav for everyone, with
 * the Admin tab added only for admins. Pass it to SiteShell's `nav` slot on the
 * account, chart, resonance, and admin pages so signed-in navigation is uniform.
 */
export async function AppSectionNav() {
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // The signed-in section nav only shows once there is a session to navigate.
  if (!user) return null;
  const profile = await getProfile(supabase, user.id).catch(() => null);
  const isAdmin = Boolean(profile?.is_admin);

  const items: SectionNavItem[] = [
    { href: "/account", label: "Charts" },
    { href: "/synastry", label: "Resonance" },
  ];
  if (isAdmin) {
    items.push({ href: "/admin/systems", label: "Admin", activePrefix: "/admin" });
  }

  return <SectionNav items={items} />;
}
