"use client";

import { useEffect, useMemo, useState } from "react";
import { formatMoney } from "@/lib/services";
import { useMessages } from "@/lib/use-messages";
import { t } from "@/lib/i18n";
import { useParams } from "next/navigation";

type Mode = "today" | "upcoming" | "all";

type DbBooking = {
  id: string;
  startsAt: string; // ISO
  durationMin: number;
  serviceName: string;
  price: number;
  currency: string;
  customerName: string;
  customerPhone: string;
  notes?: string | null;
  status: "CONFIRMED" | "CANCELLED" | "DONE";
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function toISODateLocal(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function todayISO() {
  return toISODateLocal(new Date());
}
function startOfWeekMonday(d: Date) {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}
function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(d.getDate() + days);
  x.setHours(0, 0, 0, 0);
  return x;
}
function toLocalParts(iso: string) {
  const dt = new Date(iso);
  return {
    date: toISODateLocal(dt),
    time: `${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`,
  };
}
function mondayISO(isoDate: string) {
  const anchor = new Date(`${isoDate}T00:00:00`);
  return toISODateLocal(startOfWeekMonday(anchor));
}

export default function SchedulePanel() {
  const params = useParams<{ locale?: string }>();
  const locale = params?.locale ?? "en";

  const messages = useMessages(locale);

  const weekdayLabel = useMemo(
    () => [
      t(messages, "schedule.weekdays.mon"),
      t(messages, "schedule.weekdays.tue"),
      t(messages, "schedule.weekdays.wed"),
      t(messages, "schedule.weekdays.thu"),
      t(messages, "schedule.weekdays.fri"),
      t(messages, "schedule.weekdays.sat"),
      t(messages, "schedule.weekdays.sun"),
    ],
    [messages],
  );

  const [bookings, setBookings] = useState<DbBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const [mode, setMode] = useState<Mode>("today");

  const today = useMemo(() => todayISO(), []);
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [weekStart, setWeekStart] = useState<string>(mondayISO(today));
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/bookings?scope=owner", {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      setBookings(res.ok && Array.isArray(data.bookings) ? data.bookings : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const tmr = setInterval(refresh, 15_000);
    return () => clearInterval(tmr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // normalize mode changes
  useEffect(() => {
    if (mode === "today") {
      setSelectedDate(today);
      setWeekStart(mondayISO(today));
      return;
    }

    if (mode === "upcoming" && selectedDate < today) {
      setSelectedDate(today);
      setWeekStart(mondayISO(today));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, today]);

  const filtered = useMemo(() => {
    const sorted = [...bookings]
      .filter((b) => b.status !== "CANCELLED")
      .sort((a, b) => String(a.startsAt).localeCompare(String(b.startsAt)));

    if (mode === "all") return sorted;

    if (mode === "today") {
      return sorted.filter((b) => toLocalParts(b.startsAt).date === today);
    }

    return sorted.filter((b) => toLocalParts(b.startsAt).date >= today);
  }, [bookings, mode, today]);

  const upcomingDates = useMemo(() => {
    const set = new Set<string>();
    for (const b of filtered) set.add(toLocalParts(b.startsAt).date);
    return [...set].sort();
  }, [filtered]);

  useEffect(() => {
    setWeekStart(mondayISO(selectedDate));
  }, [selectedDate]);

  const countsByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of filtered) {
      const d = toLocalParts(b.startsAt).date;
      map.set(d, (map.get(d) ?? 0) + 1);
    }
    return map;
  }, [filtered]);

  const week = useMemo(() => {
    const ws = new Date(`${weekStart}T00:00:00`);
    return Array.from({ length: 7 }).map((_, i) => {
      const d = addDays(ws, i);
      return { label: weekdayLabel[i], iso: toISODateLocal(d) };
    });
  }, [weekStart, weekdayLabel]);

  const dayBookings = useMemo(() => {
    return filtered.filter(
      (b) => toLocalParts(b.startsAt).date === selectedDate,
    );
  }, [filtered, selectedDate]);

  const title =
    mode === "today"
      ? t(messages, "schedule.modes.today")
      : mode === "upcoming"
        ? t(messages, "schedule.modes.upcoming")
        : t(messages, "schedule.modes.all");

  const totalUpcoming = useMemo(() => {
    if (mode !== "upcoming") return 0;
    return filtered.length;
  }, [filtered.length, mode]);

  function goWeek(deltaDays: number) {
    const ws = new Date(`${weekStart}T00:00:00`);
    const next = addDays(ws, deltaDays);
    const nextWeekStartIso = toISODateLocal(next);

    if (mode === "upcoming" && nextWeekStartIso < mondayISO(today)) return;

    setWeekStart(nextWeekStartIso);

    const nextSelected = addDays(next, 0);
    const nextIso = toISODateLocal(nextSelected);
    if (mode === "upcoming" && nextIso < today) return;
    setSelectedDate(nextIso);
  }

  function jumpToNextBookedDay() {
    const next = upcomingDates.find((d) => d > selectedDate);
    if (!next) return;
    setSelectedDate(next);
    setWeekStart(mondayISO(next));
  }

  function copyBookingText(b: DbBooking, time: string) {
    navigator.clipboard
      .writeText(
        `${b.customerName} — ${selectedDate} ${time} — ${b.serviceName}`,
      )
      .then(() => {
        setCopiedId(b.id);
        setTimeout(() => setCopiedId(null), 1200);
      })
      .catch(() => {});
  }

  return (
    <div className="space-y-6">
      {/* Top action & mode switcher row */}
      <div className="flex flex-col gap-4 border-b border-slate-300/70 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md border border-lime-300/80 bg-lime-100 font-mono text-[10px] font-bold text-lime-950">
              📅
            </span>
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
              {t(messages, "schedule.title")}
            </h3>
          </div>
          <p className="mt-1 font-mono text-xs text-slate-600 sm:text-sm">
            {t(messages, "schedule.subtitle")
              .replace("{title}", title)
              .replace("{n}", String(totalUpcoming))}
            {loading ? ` • ${t(messages, "common.loading")}` : ""}
          </p>
        </div>

        {/* Mode filter pills */}
        <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-300/80 bg-slate-100/70 p-1">
          {(
            [
              { id: "today", label: t(messages, "schedule.modes.today") },
              { id: "upcoming", label: t(messages, "schedule.modes.upcoming") },
              { id: "all", label: t(messages, "schedule.modes.all") },
            ] as const
          ).map((x) => {
            const active = mode === x.id;
            return (
              <button
                key={x.id}
                type="button"
                onClick={() => setMode(x.id)}
                className={[
                  "rounded-xl px-3.5 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition-all active:scale-95",
                  active
                    ? "border border-lime-300/90 bg-lime-100 text-lime-950 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900",
                ].join(" ")}
              >
                {x.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Week pagination bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goWeek(-7)}
            disabled={mode === "upcoming" && weekStart <= mondayISO(today)}
            className="rounded-xl border border-slate-300/80 bg-white/80 px-3 py-1.5 font-mono text-xs font-semibold text-slate-700 shadow-2xs backdrop-blur-sm transition-all hover:bg-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← {t(messages, "schedule.actions.prev")}
          </button>
          <button
            type="button"
            onClick={() => goWeek(7)}
            className="rounded-xl border border-slate-300/80 bg-white/80 px-3 py-1.5 font-mono text-xs font-semibold text-slate-700 shadow-2xs backdrop-blur-sm transition-all hover:bg-white active:scale-95"
          >
            {t(messages, "schedule.actions.next")} →
          </button>
        </div>

        {mode === "upcoming" && (
          <button
            type="button"
            onClick={jumpToNextBookedDay}
            disabled={!upcomingDates.some((d) => d > selectedDate)}
            className="rounded-xl border border-lime-300/80 bg-lime-100 px-3.5 py-1.5 font-mono text-xs font-bold text-lime-950 shadow-2xs transition-all hover:bg-lime-200 active:scale-95 disabled:cursor-not-allowed disabled:border-slate-300/80 disabled:bg-slate-100 disabled:text-slate-400"
          >
            {t(messages, "schedule.actions.nextBookedDay")} ⚡
          </button>
        )}
      </div>

      {/* Week day strip selector */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {week.map((d) => {
          const active = d.iso === selectedDate;
          const count = countsByDate.get(d.iso) ?? 0;
          const disabled = mode === "upcoming" && d.iso < today;

          return (
            <button
              key={d.iso}
              type="button"
              disabled={disabled}
              onClick={() => setSelectedDate(d.iso)}
              className={[
                "relative flex flex-col items-center justify-center rounded-2xl border p-2 sm:p-3 transition-all active:scale-95",
                disabled
                  ? "cursor-not-allowed border-slate-200 bg-slate-100/40 opacity-40"
                  : "",
                active
                  ? "border-lime-300/90 bg-lime-100 text-lime-950 shadow-xs"
                  : "border-slate-300/70 bg-white/70 text-slate-700 hover:border-slate-400 hover:bg-white",
              ].join(" ")}
            >
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider sm:text-xs">
                {d.label}
              </span>
              <span className="mt-0.5 font-mono text-xs font-extrabold sm:text-sm">
                {d.iso.slice(8, 10)}
              </span>

              {count > 0 && (
                <span
                  className={[
                    "absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 font-mono text-[9px] font-bold shadow-2xs",
                    active
                      ? "bg-slate-900 text-white"
                      : "border border-lime-300/80 bg-lime-200 text-lime-950",
                  ].join(" ")}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day timeline */}
      <div className="border-t border-slate-300/70 pt-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700">
            {selectedDate}
          </span>
          <span className="font-mono text-xs text-slate-500">
            {dayBookings.length}{" "}
            {dayBookings.length === 1 ? "booking" : "bookings"}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center rounded-2xl border border-slate-300/80 bg-white/60 p-8 font-mono text-xs text-slate-500 animate-pulse">
            {t(messages, "common.loading")}
          </div>
        ) : dayBookings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300/80 bg-slate-100/50 p-6 text-center font-mono text-xs text-slate-500">
            {t(messages, "schedule.emptyDay")}
          </div>
        ) : (
          <div className="space-y-3">
            {dayBookings.map((b) => {
              const { time } = toLocalParts(b.startsAt);
              const isCopied = copiedId === b.id;

              return (
                <div
                  key={b.id}
                  className="group rounded-2xl border border-slate-300/80 bg-white/80 p-4 shadow-2xs backdrop-blur-sm transition hover:border-slate-400 hover:bg-white sm:p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-bold text-slate-900">
                          {time}
                        </span>
                        <span className="rounded-md border border-slate-300/80 bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700">
                          {b.customerName}
                        </span>
                      </div>

                      <div className="font-mono text-xs text-slate-600">
                        <span className="font-semibold text-slate-800">
                          {b.serviceName}
                        </span>
                        {" • "}
                        <span>
                          {b.durationMin} {t(messages, "schedule.minutes")}
                        </span>
                        {" • "}
                        <span className="font-bold text-slate-900">
                          {formatMoney(b.price, b.currency as any)}
                        </span>
                      </div>

                      <div className="font-mono text-xs text-slate-500">
                        <span>{b.customerPhone}</span>
                        {b.notes && (
                          <span className="italic">
                            {" • "}
                            {b.notes}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => copyBookingText(b, time)}
                      className="inline-flex shrink-0 items-center justify-center rounded-xl border border-slate-300/80 bg-white px-3.5 py-1.5 font-mono text-xs font-semibold text-slate-700 shadow-2xs backdrop-blur-sm transition-all hover:bg-slate-50 active:scale-95"
                    >
                      {isCopied ? "✓ Copied" : t(messages, "common.copy")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
