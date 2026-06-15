import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getProfile, type Profile } from "@/lib/db/queries";

/**
 * Request-scoped session reads. Each function is wrapped in React `cache()`, so
 * within a single server render the user and profile are fetched at most once and
 * shared across the header, the section nav, and the page body. Before this, a
 * signed-in page could read the profile two or three times per render (SiteShell,
 * AppSectionNav, and the page each fetched it independently).
 */

/** The signed-in user for this request, or null. Memoized per request. */
export const currentUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
});

/** The current user's profile for this request, or null. Memoized per request. */
export const currentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  if (!supabase) return null;
  const user = await currentUser();
  if (!user) return null;
  return getProfile(supabase, user.id).catch(() => null);
});
