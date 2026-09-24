"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AvailabilityRule,
  Weekday,
  defaultAvailability,
} from "@/lib/availability";
import { useMessages } from "@/lib/use-messages";
import { t } from "@/lib/i18n";

function toggleDay(days: Weekday[], d: Weekday) {
  return days.includes(d)
    ? (days.filter((x) => x !== d) as Weekday[])
    : ([...days, d].sort() as Weekday[]);
}

function guessTZ() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

function isValidTimeZone(tz: string) {
  try {
    Intl.DateTimeFormat("en-US", { timeZone: tz }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export default function AvailabilityEditor() {
  const router = useRouter();
  const params = useParams<{ locale?: string }>();
  const locale = params?.locale ?? "en";

  const dict = useMessages(locale);

  const dayLabels = useMemo<Record<Weekday, string>>(
    () => ({
      0: t(dict, "availability.workingDays.days.sun"),
      1: t(dict, "availability.workingDays.days.mon"),
      2: t(dict, "availability.workingDays.days.tue"),
      3: t(dict, "availability.workingDays.days.wed"),
      4: t(dict, "availability.workingDays.days.thu"),
      5: t(dict, "availability.workingDays.days.fri"),
      6: t(dict, "availability.workingDays.days.sat"),
    }),
    [dict],
  );

  const detectedTZ = useMemo(() => guessTZ(), []);

  const [rule, setRule] = useState<AvailabilityRule>({
    ...defaultAvailability,
    timezone: detectedTZ,
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/availability", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));

        if (cancelled) return;

        if (res.status === 401) {
          router.replace(`/${locale}/login`);
          return;
        }

        if (res.ok && data?.rule) {
          const incoming: AvailabilityRule = {
            ...defaultAvailability,
            ...data.rule,
          };
          const tz = String((incoming as any).timezone ?? "").trim();

          setRule({
            ...incoming,
            timezone: tz ? tz : detectedTZ,
          });
        } else {
          setRule({ ...defaultAvailability, timezone: detectedTZ });
        }
      } catch {
        if (!cancelled)
          setRule({ ...defaultAvailability, timezone: detectedTZ });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [locale, router, detectedTZ]);

  async function save() {
    if (saving) return;

    setSaving(true);
    setError(null);

    const tz = String(rule.timezone ?? "").trim() || "UTC";
    if (!isValidTimeZone(tz)) {
      setSaving(false);
      setError(t(dict, "availability.errors.invalidTimezone"));
      return;
    }

    try {
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rule: { ...rule, timezone: tz } }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        router.replace(`/${locale}/login`);
        return;
      }

      if (!res.ok) {
        setError(data?.error || t(dict, "availability.errors.saveFailed"));
        return;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 1200);
    } catch {
      setError(t(dict, "availability.errors.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  const tzOk = isValidTimeZone(String(rule.timezone ?? "").trim() || "UTC");

  return (
    <div className="space-y-6">
      {/* Top action row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md border border-lime-300/80 bg-lime-100 font-mono text-[10px] font-bold text-lime-950">
              ⏱
            </span>
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
              {t(dict, "availability.title")}
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-600 sm:text-sm">
            {t(dict, "availability.lead")}
          </p>
        </div>

        <button
          type="button"
          onClick={save}
          disabled={saving || loading}
          className="inline-flex items-center justify-center rounded-2xl border border-lime-300/80 bg-lime-100 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-lime-950 shadow-xs transition hover:bg-lime-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saved
            ? t(dict, "availability.states.saved")
            : saving
              ? t(dict, "availability.states.saving")
              : t(dict, "availability.states.save")}
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-300/80 bg-rose-50/90 p-3.5 font-mono text-xs font-bold text-rose-800 shadow-2xs">
          ✕ {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-slate-300/80 bg-white/60 p-8 font-mono text-xs text-slate-500 animate-pulse">
          {t(dict, "availability.states.loading")}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Timezone configuration card */}
          <div className="rounded-2xl border border-slate-300/80 bg-slate-100/70 p-4 sm:p-5">
            <div className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700">
              {t(dict, "availability.timezone.title")}
            </div>

            <div className="mt-3 space-y-3">
              <label className="block space-y-1.5">
                <span className="font-mono text-[11px] font-bold uppercase text-slate-600">
                  {t(dict, "availability.timezone.label")}
                </span>
                <input
                  value={rule.timezone}
                  onChange={(e) =>
                    setRule((r) => ({ ...r, timezone: e.target.value }))
                  }
                  className={[
                    "h-11 w-full max-w-sm rounded-xl border bg-white/90 px-4 font-mono text-xs font-medium text-slate-900 shadow-2xs outline-none focus:bg-white",
                    tzOk
                      ? "border-slate-300/80 focus:border-slate-800"
                      : "border-rose-400 focus:border-rose-600",
                  ].join(" ")}
                />
                <span className="block font-mono text-[10px] text-slate-500">
                  {t(dict, "availability.timezone.hint")}
                </span>
              </label>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="rounded-xl border border-slate-300/80 bg-white/80 px-3.5 py-1.5 font-mono text-xs font-semibold text-slate-700 shadow-2xs backdrop-blur-sm transition hover:bg-white active:scale-95"
                  onClick={() =>
                    setRule((r) => ({ ...r, timezone: detectedTZ }))
                  }
                >
                  {t(dict, "availability.timezone.useDetected").replace(
                    "{tz}",
                    detectedTZ,
                  )}
                </button>

                {!tzOk && (
                  <span className="font-mono text-xs font-bold text-rose-600">
                    ✕ {t(dict, "availability.timezone.invalid")}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Working days selector */}
          <div className="rounded-2xl border border-slate-300/80 bg-slate-100/70 p-4 sm:p-5">
            <div className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700">
              {t(dict, "availability.workingDays.title")}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {([0, 1, 2, 3, 4, 5, 6] as Weekday[]).map((d) => {
                const active = rule.days.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() =>
                      setRule((r) => ({ ...r, days: toggleDay(r.days, d) }))
                    }
                    className={[
                      "rounded-xl border px-3.5 py-2 font-mono text-xs font-bold transition active:scale-95",
                      active
                        ? "border-lime-300/90 bg-lime-100 text-lime-950 shadow-xs"
                        : "border-slate-300/80 bg-white/80 text-slate-700 hover:bg-white hover:text-slate-950",
                    ].join(" ")}
                  >
                    {dayLabels[d]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Daily Operating Hours */}
          <div className="rounded-2xl border border-slate-300/80 bg-slate-100/70 p-4 sm:p-5">
            <div className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700">
              Shift Hours
            </div>

            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="font-mono text-[11px] font-bold uppercase text-slate-600">
                  {t(dict, "availability.hours.start")}
                </span>
                <input
                  type="time"
                  value={rule.start}
                  onChange={(e) =>
                    setRule((r) => ({ ...r, start: e.target.value }))
                  }
                  className="h-11 w-full rounded-xl border border-slate-300/80 bg-white/90 px-3 font-mono text-sm font-semibold text-slate-900 shadow-2xs outline-none focus:border-slate-800 focus:bg-white"
                />
              </label>

              <label className="space-y-1.5">
                <span className="font-mono text-[11px] font-bold uppercase text-slate-600">
                  {t(dict, "availability.hours.end")}
                </span>
                <input
                  type="time"
                  value={rule.end}
                  onChange={(e) =>
                    setRule((r) => ({ ...r, end: e.target.value }))
                  }
                  className="h-11 w-full rounded-xl border border-slate-300/80 bg-white/90 px-3 font-mono text-sm font-semibold text-slate-900 shadow-2xs outline-none focus:border-slate-800 focus:bg-white"
                />
              </label>
            </div>
          </div>

          {/* Break Window */}
          <div className="rounded-2xl border border-slate-300/80 bg-slate-100/70 p-4 sm:p-5">
            <div className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700">
              Break Window
            </div>

            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="font-mono text-[11px] font-bold uppercase text-slate-600">
                  {t(dict, "availability.break.start")}
                </span>
                <input
                  type="time"
                  value={rule.breakStart ?? ""}
                  onChange={(e) =>
                    setRule((r) => ({
                      ...r,
                      breakStart: e.target.value || undefined,
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-slate-300/80 bg-white/90 px-3 font-mono text-sm font-semibold text-slate-900 shadow-2xs outline-none focus:border-slate-800 focus:bg-white"
                />
              </label>

              <label className="space-y-1.5">
                <span className="font-mono text-[11px] font-bold uppercase text-slate-600">
                  {t(dict, "availability.break.end")}
                </span>
                <input
                  type="time"
                  value={rule.breakEnd ?? ""}
                  onChange={(e) =>
                    setRule((r) => ({
                      ...r,
                      breakEnd: e.target.value || undefined,
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-slate-300/80 bg-white/90 px-3 font-mono text-sm font-semibold text-slate-900 shadow-2xs outline-none focus:border-slate-800 focus:bg-white"
                />
              </label>
            </div>
          </div>

          {/* Slot Interval and Buffer Duration */}
          <div className="rounded-2xl border border-slate-300/80 bg-slate-100/70 p-4 sm:p-5">
            <div className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700">
              Granularity & Buffer
            </div>

            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="font-mono text-[11px] font-bold uppercase text-slate-600">
                  {t(dict, "availability.rules.slotStep")}
                </span>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min={5}
                    step={5}
                    value={rule.slotStepMin}
                    onChange={(e) =>
                      setRule((r) => ({
                        ...r,
                        slotStepMin: Number(e.target.value || 30),
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-slate-300/80 bg-white/90 px-3.5 pr-14 font-mono text-sm font-semibold text-slate-900 shadow-2xs outline-none focus:border-slate-800 focus:bg-white"
                  />
                  <span className="pointer-events-none absolute right-3 font-mono text-xs text-slate-400">
                    min
                  </span>
                </div>
              </label>

              <label className="space-y-1.5">
                <span className="font-mono text-[11px] font-bold uppercase text-slate-600">
                  {t(dict, "availability.rules.buffer")}
                </span>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min={0}
                    step={5}
                    value={rule.bufferMin}
                    onChange={(e) =>
                      setRule((r) => ({
                        ...r,
                        bufferMin: Number(e.target.value || 0),
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-slate-300/80 bg-white/90 px-3.5 pr-14 font-mono text-sm font-semibold text-slate-900 shadow-2xs outline-none focus:border-slate-800 focus:bg-white"
                  />
                  <span className="pointer-events-none absolute right-3 font-mono text-xs text-slate-400">
                    min
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
