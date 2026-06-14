import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { DB_SCHEMA } from "./schema";

/**
 * Service-role Supabase client for trusted server-side writes that must bypass
 * row level security. Used ONLY for the narrative cache: writing model output we
 * just generated, keyed by a content hash. Returns null when the URL or service
 * key is absent, so the cache degrades to "always regenerate" rather than break.
 *
 * The service key is server-only. Never import this from a client component, and
 * never expose the key through a NEXT_PUBLIC_ variable.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  return createSupabaseClient(url, key, {
    db: { schema: DB_SCHEMA },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
