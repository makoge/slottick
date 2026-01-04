"use client";

import { useEffect, useState } from "react";
import {
  defaultAvailability,
  type AvailabilityRule,
  type Weekday
} from "@/lib/availability";

const dayLabels: Record<Weekday, string> = {
  0: "Sun",
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat"
};

function toggleDay(days: Weekday[], d: Weekday) {
  return days.includes(d) ? days.filter((x) => x !== d) : [...days, d].sort();
}

export default function AvailabilityEditor({ slug }: { slug: string }) {
  const [rule, setRule] = useState<AvailabilityRule>(defaultAvailability);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setError(null);
      try {
        const res = await fetch("/api/owner/availability", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;

        if (!res.ok) {
          setError(data.error || "Failed to load availability");
          return;
        }

        if (data.rule) setRule({ ...defaultAvailability, ...data.rule });
        else setRule(defaultAvailability);
      } catch {
        if (!cancelled) setError("Network error");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    if (saving) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/owner/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rule })
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Save failed");
        return;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 1200);
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Availability</h2>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {saved ? "Saved ✓" : saving ? "Saving..." : "Save"}
        </button>
      </div>

      <p className="mt-2 text-sm text-slate-600">
        Set your working days and hours. This controls what clients can book.
      </p>

      {error ? (
        <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-5 grid gap-5">
        <div>
          <div className="text-sm font-medium">Working days</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {([0, 1, 2, 3, 4, 5, 6] as Weekday[]).map((d) => {
              const active = rule.days.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setRule((r) => ({ ...r, days: toggleDay(r.days, d) }))}
                  className={[
                    "rounded-xl border px-3 py-2 text-sm font-semibold",
                    active
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 hover:bg-slate-50"
                  ].join(" ")}
                >
                  {dayLabels[d]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            Start time
            <input
              type="time"
              value={rule.start}
              onChange={(e) => setRule((r) => ({ ...r, start: e.target.value }))}
              className="rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>

          <label className="grid gap-1 text-sm">
            End time
            <input
              type="time"
              value={rule.end}
              onChange={(e) => setRule((r) => ({ ...r, end: e.target.value }))}
              className="rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            Break start (optional)
            <input
              type="time"
              value={rule.breakStart ?? ""}
              onChange={(e) =>
                setRule((r) => ({ ...r, breakStart: e.target.value || undefined }))
              }
              className="rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>

          <label className="grid gap-1 text-sm">
            Break end (optional)
            <input
              type="time"
              value={rule.breakEnd ?? ""}
              onChange={(e) =>
                setRule((r) => ({ ...r, breakEnd: e.target.value || undefined }))
              }
              className="rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            Slot step (minutes)
            <input
              type="number"
              min={5}
              step={5}
              value={rule.slotStepMin}
              onChange={(e) =>
                setRule((r) => ({ ...r, slotStepMin: Number(e.target.value || 30) }))
              }
              className="rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>

          <label className="grid gap-1 text-sm">
            Buffer between bookings (minutes)
            <input
              type="number"
              min={0}
              step={5}
              value={rule.bufferMin}
              onChange={(e) =>
                setRule((r) => ({ ...r, bufferMin: Number(e.target.value || 0) }))
              }
              className="rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>
        </div>
      </div>
    </section>
  );
}
