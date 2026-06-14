"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PlaceSearch, type SelectedPlace } from "@/components/PlaceSearch";
import { Card, CardLabel, Field, Input, Button, Divider, inputClasses } from "@/components/ui";

/**
 * Edit a saved chart's birth data (date, time, place). Saving recomputes the
 * chart on the next render: precision and timezone are derived server-side from
 * the new data, so the reading and synthesis update to match.
 *
 * Shown as a clearly labeled card with an Edit button (not a subtle disclosure),
 * so the edit function is easy to find. It opens automatically when linked with
 * the #edit anchor from the account roster.
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
  const [open, setOpen] = useState(false);
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

  // Open automatically when arriving via an "Edit" link (…/chart/<id>#edit).
  // Read after mount (not a lazy initializer) so the hash sync never causes a
  // hydration mismatch with the server-rendered closed state.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (typeof window !== "undefined" && window.location.hash === "#edit") setOpen(true);
  }, []);

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

  return (
    <div id="edit" className="scroll-mt-20">
    <Card>
      <div className="flex items-center justify-between gap-3">
        <div>
          <CardLabel>Birth data</CardLabel>
          <p className="mt-1 text-sm text-muted">
            {formatDate(form.date)}
            {form.unknownTime ? " · time unknown" : ` · ${form.time}`}
            {form.noPlace || !placeLabel ? " · place unknown" : ` · ${placeLabel}`}
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={() => setOpen((v) => !v)} className="shrink-0">
          {open ? "Close" : "Edit"}
        </Button>
      </div>

      {open && (
        <>
          <Divider className="mt-5" />
          <div className="mt-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Birth date" htmlFor="edit-date">
                <Input
                  id="edit-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => set({ date: e.target.value })}
                />
              </Field>
              <Field label="Birth time" htmlFor="edit-time">
                <Input
                  id="edit-time"
                  type="time"
                  value={form.time}
                  disabled={form.unknownTime}
                  onChange={(e) => set({ time: e.target.value })}
                />
              </Field>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-foreground/85">
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
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Birthplace</p>
              <div className="mt-1.5">
                <PlaceSearch onSelect={selectPlace} placeholder="Start typing any city in the world…" />
              </div>
              {placeLabel && !form.noPlace && (
                <p className="mt-1 text-xs text-accent">
                  ✓ {placeLabel}
                  {form.timeZone ? ` · ${form.timeZone}` : ""}
                </p>
              )}
            </div>

            <details className="mt-3 text-xs text-muted">
              <summary className="cursor-pointer">Enter coordinates manually</summary>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="any"
                  value={form.latitude}
                  disabled={form.noPlace}
                  onChange={(e) => set({ latitude: e.target.value })}
                  placeholder="Latitude"
                  className={inputClasses}
                />
                <input
                  type="number"
                  step="any"
                  value={form.longitude}
                  disabled={form.noPlace}
                  onChange={(e) => set({ longitude: e.target.value })}
                  placeholder="Longitude"
                  className={inputClasses}
                />
              </div>
            </details>

            <div className="mt-5 flex items-center gap-3">
              <Button type="button" variant="primary" onClick={save} disabled={status === "saving"}>
                {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : "Save birth data"}
              </Button>
              {status === "saved" && <span className="text-xs text-muted">The reading updated below.</span>}
              {status === "error" && <span className="text-xs text-red-300">Could not save. Please try again.</span>}
            </div>
          </div>
        </>
      )}
    </Card>
    </div>
  );
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatDate(d: string): string {
  const [y, m, day] = d.split("-").map(Number);
  if (!y || !m || !day) return d;
  return `${day} ${MONTHS[m - 1]} ${y}`;
}
