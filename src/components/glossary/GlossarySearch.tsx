"use client";

import { useEffect, useState } from "react";
import type { CorpusEntry } from "@/lib/corpus/search";

/** Live search over the interpretation corpus (signs, planets, numbers, and more). */
export function GlossarySearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CorpusEntry[]>([]);

  useEffect(() => {
    const q = query.trim();
    const controller = new AbortController();
    const id = setTimeout(async () => {
      if (q.length < 2) {
        setResults([]);
        return;
      }
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        const json = await res.json();
        setResults(json.results ?? []);
      } catch {
        /* aborted */
      }
    }, 200);
    return () => {
      clearTimeout(id);
      controller.abort();
    };
  }, [query]);

  return (
    <>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search meanings… (e.g. transformation, water, leadership)"
        className="w-full rounded-lg border border-border bg-surface/60 px-3 py-2.5 text-sm outline-none transition focus:border-accent"
        autoFocus
      />

      <ul className="mt-6 space-y-3">
        {results.map((e) => (
          <li key={`${e.kind}:${e.key}`} className="rounded-lg border border-border bg-surface/40 p-4">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-medium">{e.label}</span>
              <span className="text-[10px] uppercase tracking-wide text-muted">{e.kind}</span>
            </div>
            <p className="mt-1 text-sm text-foreground/90">{e.quick}</p>
            {e.deep && <p className="mt-2 text-sm text-muted">{e.deep}</p>}
          </li>
        ))}
        {query.trim().length >= 2 && results.length === 0 && (
          <li className="text-sm text-muted">No matches.</li>
        )}
      </ul>
    </>
  );
}
