"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PlaceSearch, type SelectedPlace } from "@/components/PlaceSearch";
import { Card, CardLabel, Field, Input, Button, Divider, inputClasses } from "@/components/ui";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
function formatDate(d: string): string {
  const [y, m, day] = d.split("-").map(Number);
  if (!y || !m || !day) return d;
  return `${day} ${MONTHS[m - 1]} ${y}`;
}

/**
 * The chart's editable Profile: the person's name and their birth chart info (date,
 * time, place). Shows the values, and an Edit toggle reveals the fields. Saving
 * recomputes the chart on the next render (precision and timezone are derived
 * server-side). Opens automatically when linked with the #edit anchor.
 */
export function ChartProfile({
  id,
  initialName,
  date,
  time,
  lat,
  lng,
  tz,
}: {
  id: string;
  initialName: string;
  date: string;
  time: string | null;
  lat: number | null;
  lng: number | null;
  tz: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
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
    const body: Record<string, unknown> = { name: name.trim(), date: form.date };
    if (!form.unknownTime && form.time) body.time = form.time;
    if (!form.noPlace && form.latitude && form.longitude) {
      body.place = { lat: Number(form.latitude), lng: Number(form.longitude), ...(form.timeZone ? { tz: form.timeZone } : {}) };
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
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardLabel>Profile</CardLabel>
            <p className="mt-1 truncate text-base font-semibold text-foreground">{name.trim() || "Unnamed chart"}</p>
            <p className="mt-0.5 text-sm text-muted">
              {formatDate(form.date)}
              {form.unknownTime ? " · time unknown" : ` · ${form.time}`}
              {form.noPlace || !placeLabel ? " · place unknown" : ` · ${placeLabel}`}
            </p>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={() => setOpen((v) => !v)} className="shrink-0">
            {open ? "Close" : "Edit"}
          </Button>
        </div>

        {open && (
          <>
            <Divider className="mt-5" />
            <div className="mt-5 space-y-3">
              <Field label="Name" htmlFor="profile-name">
                <Input
                  id="profile-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setStatus("idle");
                  }}
                  placeholder="Unnamed chart"
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Birth date" htmlFor="profile-date">
                  <Input id="profile-date" type="date" value={form.date} onChange={(e) => set({ date: e.target.value })} />
                </Field>
                <Field label="Birth time" htmlFor="profile-time">
                  <Input
                    id="profile-time"
                    type="time"
                    value={form.time}
                    disabled={form.unknownTime}
                    onChange={(e) => set({ time: e.target.value })}
                  />
                </Field>
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-foreground/85">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.unknownTime} onChange={(e) => set({ unknownTime: e.target.checked })} />
                  Time unknown
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.noPlace} onChange={(e) => set({ noPlace: e.target.checked })} />
                  Place unknown
                </label>
              </div>
              <div>
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
              <details className="text-xs text-muted">
                <summary className="cursor-pointer">Enter coordinates manually</summary>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input type="number" step="any" value={form.latitude} disabled={form.noPlace} onChange={(e) => set({ latitude: e.target.value })} placeholder="Latitude" className={inputClasses} />
                  <input type="number" step="any" value={form.longitude} disabled={form.noPlace} onChange={(e) => set({ longitude: e.target.value })} placeholder="Longitude" className={inputClasses} />
                </div>
              </details>
              <div className="flex items-center gap-3 pt-1">
                <Button type="button" variant="primary" onClick={save} disabled={status === "saving"}>
                  {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : "Save profile"}
                </Button>
                {status === "saved" && <span className="text-xs text-muted">The reading updated.</span>}
                {status === "error" && <span className="text-xs text-red-300">Could not save.</span>}
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
