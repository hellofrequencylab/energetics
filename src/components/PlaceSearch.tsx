"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { GeoResult } from "@/lib/geocode";

export interface SelectedPlace {
  label: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

/**
 * Live, worldwide birthplace search. Debounced type-ahead against /api/geocode
 * (Open-Meteo — global coverage, no key). Results appear as you type; keyboard
 * and mouse selectable. Falls back silently (caller keeps manual lat/lng) if the
 * geocoding host is unreachable.
 */
export function PlaceSearch({
  onSelect,
  placeholder = "Start typing a city…",
}: {
  onSelect: (p: SelectedPlace) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const [chosen, setChosen] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  // Debounced live query with stale-response cancellation. All state updates
  // happen inside the timeout/async callback (not synchronously in the effect).
  useEffect(() => {
    const q = query.trim();
    const controller = new AbortController();
    const id = setTimeout(async () => {
      if (q.length < 2 || chosen === q) {
        setResults([]);
        setOpen(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        const json = await res.json();
        setResults(json.results ?? []);
        setOpen(true);
        setActive(-1);
      } catch {
        /* aborted or offline — leave results as-is */
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(id);
      controller.abort();
    };
  }, [query, chosen]);

  // Close on outside click.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function choose(r: GeoResult) {
    const label = [r.name, r.admin1, r.country].filter(Boolean).join(", ");
    setQuery(label);
    setChosen(label);
    setOpen(false);
    onSelect({ label, latitude: r.latitude, longitude: r.longitude, timezone: r.timezone });
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      choose(results[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={boxRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setChosen(null);
        }}
        onFocus={() => results.length > 0 && setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        autoComplete="off"
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent"
      />
      {loading && <span className="absolute right-3 top-2.5 text-xs text-muted">…</span>}

      {open && results.length > 0 && (
        <ul id={listboxId} role="listbox" className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-surface shadow-xl">
          {results.map((r, i) => (
            <li key={`${r.latitude},${r.longitude},${i}`} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(r)}
                className={`block w-full px-3 py-2 text-left text-sm ${i === active ? "bg-surface-2" : ""}`}
              >
                <span className="text-foreground">{r.name}</span>
                <span className="text-muted">
                  {[r.admin1, r.country].filter(Boolean).length ? `, ${[r.admin1, r.country].filter(Boolean).join(", ")}` : ""}
                </span>
                <span className="ml-2 text-xs text-muted">{r.timezone}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && !loading && query.trim().length >= 2 && results.length === 0 && (
        <p className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-muted">
          No matches (or geocoding offline) — you can enter coordinates manually below.
        </p>
      )}
    </div>
  );
}
