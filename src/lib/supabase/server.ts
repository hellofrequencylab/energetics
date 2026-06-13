import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Supabase client for Server Components, Route Handlers, and Server Actions.
 * Reads/writes the auth session via Next's cookie store so RLS policies see the
 * signed-in user. Returns null if Supabase env vars are not configured, so the
 * app runs (chart computation works) before Supabase is wired up.
 */
export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // `setAll` from a Server Component is a no-op (read-only cookies);
          // middleware/route handlers refresh the session instead.
        }
      },
    },
  });
}

/** The signed-in user, or null when not authenticated / not configured. */
export async function getUser() {
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
