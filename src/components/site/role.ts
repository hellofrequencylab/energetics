import { currentUser, currentProfile } from "@/lib/auth/session";
import type { NavRole } from "./nav";

/**
 * Read the viewer's nav role (are they signed in, are they an admin), with safe
 * defaults on any error or when auth is not configured. Backed by the per-request
 * session cache, so the header, footer, and section nav share a single auth read.
 */
export async function getNavRole(): Promise<NavRole> {
  const user = await currentUser();
  if (!user) return { signedIn: false, isAdmin: false };
  const profile = await currentProfile();
  return { signedIn: true, isAdmin: Boolean(profile?.is_admin) };
}
