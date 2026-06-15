/**
 * The canonical site origin, used for metadata, sitemap, robots, and OpenGraph.
 * Set NEXT_PUBLIC_SITE_URL in production; the fallback keeps local and preview
 * builds working.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://onesky.app").replace(/\/$/, "");
