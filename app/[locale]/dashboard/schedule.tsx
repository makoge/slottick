"use client";

import { useEffect, useMemo, useState } from "react";
import { formatMoney } from "@/lib/services";

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
  status: "CONFIRMED" | "CANCELLED";
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
    time: `${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`
  };
}

const weekdayLabel = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function SchedulePanel() {
  const [bookings, setBookings] = useState<DbBooking[]>([]);
  const [mode, setMode] = useState<Mode>("today");

  const today = useMemo(() => todayISO(), []);
  const [selectedDate, setSelectedDate] = useState<string>(today);

  async function refresh() {
    // ✅ you must implement this GET on your backend (session-auth)
    const res = await fetch("/api/bookings?scope=owner", { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    setBookings(res.ok && Array.isArray(data.bookings) ? data.bookings : []);
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (mode === "today") setSelectedDate(today);
    if (mode === "upcoming" && selectedDate < today) setSelectedDate(today);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, today]);

  const week = useMemo(() => {
    const monday = startOfWeekMonday(new Date());
    return Array.from({ length: 7 }).map((_, i) => {
      const d = addDays(monday, i);
      return { label: weekdayLabel[i], iso: toISODateLocal(d) };
    });
  }, []);

  const filtered = useMemo(() => {
    const sorted = [...bookings]
      .filter((b) => b.status !== "CANCELLED")
      .sort((a, b) => String(a.startsAt).localeCompare(String(b.startsAt)));

    if (mode === "all") return sorted;

    if (mode === "today") {
      return sorted.filter((b) => toLocalParts(b.startsAt).date === today);
    }

    // upcoming
    return sorted.filter((b) => toLocalParts(b.startsAt).date >= today);
  }, [bookings, mode, today]);

  const dayBookings = useMemo(() => {
    return filtered.filter((b) => toLocalParts(b.startsAt).date === selectedDate);
  }, [filtered, selectedDate]);

  const countsByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of filtered) {
      const d = toLocalParts(b.startsAt).date;
      map.set(d, (map.get(d) ?? 0) + 1);
    }
    return map;
  }, [filtered]);

  const title = mode === "today" ? "Today" : mode === "upcoming" ? "Upcoming" : "All";

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Schedule</h2>
          <p className="mt-1 text-sm text-slate-600">{title} appointments • Tap a day.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: "today", label: "Today" },
              { id: "upcoming", label: "Upcoming" },
              { id: "all", label: "All" }
            ] as const
          ).map((x) => {
            const active = mode === x.id;
            return (
              <button
                key={x.id}
                type="button"
                onClick={() => setMode(x.id)}
                className={[
                  "rounded-xl border px-4 py-2 text-sm font-semibold",
                  active
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 hover:bg-slate-50"
                ].join(" ")}
              >
                {x.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
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
                "relative rounded-xl border px-3 py-2 text-sm font-semibold",
                disabled ? "opacity-40 cursor-not-allowed" : "",
                active
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 hover:bg-slate-50"
              ].join(" ")}
            >
              <div className="flex items-center gap-2">
                <span>{d.label}</span>
                <span className={active ? "text-white/80" : "text-slate-500"}>
                  {d.iso.slice(8, 10)}
                </span>
              </div>

              {count > 0 ? (
                <span
                  className={[
                    "absolute -right-1 -top-1 rounded-full px-2 py-0.5 text-xs font-bold",
                    active ? "bg-white text-slate-900" : "bg-slate-900 text-white"
                  ].join(" ")}
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        <div className="mb-2 text-sm font-semibold text-slate-900">{selectedDate}</div>

        {dayBookings.length === 0 ? (
          <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-600">
            No appointments for this day.
          </div>
        ) : (
          <div className="grid gap-3">
            {dayBookings.map((b) => {
              const { time } = toLocalParts(b.startsAt);
              return (
                <div key={b.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="font-semibold">
                        {time} • {b.customerName}
                      </div>
                      <div className="mt-1 text-sm text-slate-600">
                        {b.serviceName} • {b.durationMin} min •{" "}
                        {formatMoney(b.price, b.currency as any)}
                      </div>
                      <div className="mt-1 text-sm text-slate-600">
                        {b.customerPhone}
                        {b.notes ? ` • ${b.notes}` : ""}
                      </div>
                    </div>

                    <button
                      className="w-fit rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                      type="button"
                      onClick={() => {
                        navigator.clipboard
                          .writeText(`${b.customerName} — ${selectedDate} ${time} — ${b.serviceName}`)
                          .catch(() => {});
                      }}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
