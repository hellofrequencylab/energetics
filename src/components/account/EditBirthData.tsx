"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PlaceSearch, type SelectedPlace } from "@/components/PlaceSearch";

/**
 * Edit a saved chart's birth data (date, time, place). Saving recomputes the
 * chart on the next render: precision and timezone are derived server-side from
 * the new data, so the reading and synthesis update to match.
 */
export function EditBirthData({
  id,
  date,
  time,
  lat,
  lng,
  tz,
}: {
  id: string;
  date: string;
  time: string | null;
  lat: number | null;
  lng: number | null;
  tz: string | null;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    date,
    time: time ? String(time).slice(0, 5) : "12:00",
    unknownTime: !time,
    latitude: lat != null ? String(lat) : "",
    longitude: lng != null ? String(lng) : "",
    timeZone: tz ?? "",
    noPlace: lat == null || lng == null,
  });
  const [placeLabel, setPlaceLabel] = useState(
    lat != null && lng != null ? `${Number(lat).toFixed(2)}, ${Number(lng).toFixed(2)}` : "",
  );
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const set = (patch: Partial<typeof form>) => {
    setForm((f) => ({ ...f, ...patch }));
    setStatus("idle");
  };

  function selectPlace(p: SelectedPlace) {
    set({ latitude: String(p.latitude), longitude: String(p.longitude), timeZone: p.timezone, noPlace: false });
    setPlaceLabel(p.label);
  }

  async function save() {
    setStatus("saving");
    const body: Record<string, unknown> = { date: form.date };
    if (!form.unknownTime && form.time) body.time = form.time;
    if (!form.noPlace && form.latitude && form.longitude) {
      body.place = {
        lat: Number(form.latitude),
        lng: Number(form.longitude),
        ...(form.timeZone ? { tz: form.timeZone } : {}),
      };
    }
    try {
      const res = await fetch(`/api/charts/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setStatus("saved");
        router.refresh();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  const input =
    "w-full rounded-lg border border-white/10 bg-background/60 px-3 py-2 text-sm text-star outline-none transition focus:border-horizon-amber";

  return (
    <details className="rounded-xl border border-white/10 bg-dusk/20 p-5">
      <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.25em] text-horizon-amber">
        Edit birth data
      </summary>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-star/70">Birth date</span>
          <input type="date" value={form.date} onChange={(e) => set({ date: e.target.value })} className={input} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-star/70">Birth time</span>
          <input
            type="time"
            value={form.time}
            disabled={form.unknownTime}
            onChange={(e) => set({ time: e.target.value })}
            className={`${input} disabled:opacity-40`}
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-star/80">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.unknownTime} onChange={(e) => set({ unknownTime: e.target.checked })} />
          Time unknown
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.noPlace} onChange={(e) => set({ noPlace: e.target.checked })} />
          Place unknown
        </label>
      </div>

      <div className="mt-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-star/70">Birthplace</span>
        <div className="mt-1.5">
          <PlaceSearch onSelect={selectPlace} placeholder="Start typing any city in the world…" />
        </div>
        {placeLabel && !form.noPlace && (
          <p className="mt-1 text-xs text-horizon-amber">
            ✓ {placeLabel}
            {form.timeZone ? ` · ${form.timeZone}` : ""}
          </p>
        )}
      </div>

      <details className="mt-3 text-xs text-star/60">
        <summary className="cursor-pointer">Enter coordinates manually</summary>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <input
            type="number"
            step="any"
            value={form.latitude}
            disabled={form.noPlace}
            onChange={(e) => set({ latitude: e.target.value })}
            placeholder="Latitude"
            className={`${input} disabled:opacity-40`}
          />
          <input
            type="number"
            step="any"
            value={form.longitude}
            disabled={form.noPlace}
            onChange={(e) => set({ longitude: e.target.value })}
            placeholder="Longitude"
            className={`${input} disabled:opacity-40`}
          />
        </div>
      </details>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={status === "saving"}
          className="rounded-lg bg-horizon-amber px-4 py-2 text-sm font-semibold text-ink transition hover:brightness-110 disabled:opacity-50"
        >
          {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : "Save birth data"}
        </button>
        {status === "saved" && <span className="text-xs text-star/60">The reading updated below.</span>}
        {status === "error" && <span className="text-xs text-red-300">Could not save. Please try again.</span>}
      </div>
    </details>
  );
}
