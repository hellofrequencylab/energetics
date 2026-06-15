import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/db/queries";
import type { NavRole } from "./nav";

/**
 * Read the viewer's nav role once (are they signed in, are they an admin), with
 * safe defaults on any error or when auth is not configured. SiteShell calls this
 * a single time and passes the result to the header and footer.
 */
export async function getNavRole(): Promise<NavRole> {
  const supabase = await createClient();
  if (!supabase) return { signedIn: false, isAdmin: false };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { signedIn: false, isAdmin: false };
  const profile = await getProfile(supabase, user.id).catch(() => null);
  return { signedIn: true, isAdmin: Boolean(profile?.is_admin) };
}
