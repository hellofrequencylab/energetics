import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for Client Components (browser). Returns null when env vars
 * are absent so UI can render a "not configured" state instead of crashing.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createBrowserClient(url, key);
}
