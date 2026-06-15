import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Public, indexable routes. Account and admin are intentionally excluded. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const paths: { path: string; priority: number }[] = [
    { path: "/", priority: 1 },
    { path: "/welcome", priority: 0.9 },
    { path: "/about", priority: 0.7 },
    { path: "/help", priority: 0.7 },
    { path: "/glossary", priority: 0.6 },
    { path: "/synastry", priority: 0.6 },
    { path: "/privacy", priority: 0.3 },
    { path: "/terms", priority: 0.3 },
  ];
  return paths.map(({ path, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority,
  }));
}
