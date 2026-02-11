"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AvailabilityRule, Weekday, defaultAvailability } from "@/lib/availability";
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
      6: t(dict, "availability.workingDays.days.sat")
    }),
    [dict]
  );

  const detectedTZ = useMemo(() => guessTZ(), []);

  const [rule, setRule] = useState<AvailabilityRule>({
    ...defaultAvailability,
    timezone: detectedTZ
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
          const incoming: AvailabilityRule = { ...defaultAvailability, ...data.rule };
          const tz = String((incoming as any).timezone ?? "").trim();

          setRule({
            ...incoming,
            timezone: tz ? tz : detectedTZ
          });
        } else {
          setRule({ ...defaultAvailability, timezone: detectedTZ });
        }
      } catch {
        if (!cancelled) setRule({ ...defaultAvailability, timezone: detectedTZ });
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
        body: JSON.stringify({ rule: { ...rule, timezone: tz } })
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
    <section className="rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{t(dict, "availability.title")}</h2>

        <button
          type="button"
          onClick={save}
          disabled={saving || loading}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {saved
            ? t(dict, "availability.states.saved")
            : saving
              ? t(dict, "availability.states.saving")
              : t(dict, "availability.states.save")}
        </button>
      </div>

      <p className="mt-2 text-sm text-slate-600">{t(dict, "availability.lead")}</p>

      {error ? (
        <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      {loading ? (
        <div className="mt-4 rounded-xl border border-slate-200 p-4 text-sm text-slate-600">
          {t(dict, "availability.states.loading")}
        </div>
      ) : (
        <div className="mt-5 grid gap-5">
          {/* Timezone */}
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="text-sm font-medium">{t(dict, "availability.timezone.title")}</div>

            <div className="mt-3 grid gap-2">
              <label className="grid gap-1 text-sm">
                {t(dict, "availability.timezone.label")}
                <input
                  value={rule.timezone}
                  onChange={(e) => setRule((r) => ({ ...r, timezone: e.target.value }))}
                  className={[
                    "max-w-sm rounded-xl border px-3 py-2",
                    tzOk ? "border-slate-200" : "border-red-300"
                  ].join(" ")}
                />
                <span className="text-xs text-slate-500">{t(dict, "availability.timezone.hint")}</span>
              </label>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50"
                  onClick={() => setRule((r) => ({ ...r, timezone: detectedTZ }))}
                >
                  {t(dict, "availability.timezone.useDetected").replace("{tz}", detectedTZ)}
                </button>

                {!tzOk ? (
                  <span className="self-center text-sm text-red-600">
                    {t(dict, "availability.timezone.invalid")}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Working days */}
          <div>
            <div className="text-sm font-medium">{t(dict, "availability.workingDays.title")}</div>
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

          {/* Hours */}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              {t(dict, "availability.hours.start")}
              <input
                type="time"
                value={rule.start}
                onChange={(e) => setRule((r) => ({ ...r, start: e.target.value }))}
                className="rounded-xl border border-slate-200 px-3 py-2"
              />
            </label>

            <label className="grid gap-1 text-sm">
              {t(dict, "availability.hours.end")}
              <input
                type="time"
                value={rule.end}
                onChange={(e) => setRule((r) => ({ ...r, end: e.target.value }))}
                className="rounded-xl border border-slate-200 px-3 py-2"
              />
            </label>
          </div>

          {/* Break */}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              {t(dict, "availability.break.start")}
              <input
                type="time"
                value={rule.breakStart ?? ""}
                onChange={(e) => setRule((r) => ({ ...r, breakStart: e.target.value || undefined }))}
                className="rounded-xl border border-slate-200 px-3 py-2"
              />
            </label>

            <label className="grid gap-1 text-sm">
              {t(dict, "availability.break.end")}
              <input
                type="time"
                value={rule.breakEnd ?? ""}
                onChange={(e) => setRule((r) => ({ ...r, breakEnd: e.target.value || undefined }))}
                className="rounded-xl border border-slate-200 px-3 py-2"
              />
            </label>
          </div>

          {/* Slot step + buffer */}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              {t(dict, "availability.rules.slotStep")}
              <input
                type="number"
                min={5}
                step={5}
                value={rule.slotStepMin}
                onChange={(e) =>
                  setRule((r) => ({ ...r, slotStepMin: Number(e.target.value || 30) }))
                }
                className="w-full max-w-[220px] rounded-xl border border-slate-200 px-3 py-2"
              />
            </label>

            <label className="grid gap-1 text-sm">
              {t(dict, "availability.rules.buffer")}
              <input
                type="number"
                min={0}
                step={5}
                value={rule.bufferMin}
                onChange={(e) =>
                  setRule((r) => ({ ...r, bufferMin: Number(e.target.value || 0) }))
                }
                className="w-full max-w-[220px] rounded-xl border border-slate-200 px-3 py-2"
              />
            </label>
          </div>
        </div>
      )}
    </section>
  );
}
