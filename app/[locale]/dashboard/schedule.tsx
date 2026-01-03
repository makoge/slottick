"use client";

import { useEffect, useMemo, useState } from "react";
import { Booking, loadBookings } from "@/lib/bookings";
import { formatMoney } from "@/lib/services";

type Mode = "today" | "upcoming" | "all";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toISODate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function todayISO() {
  return toISODate(new Date());
}

function startOfWeekMonday(d: Date) {
  // JS: Sun=0..Sat=6. We want Monday start.
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

function cmpBooking(a: Booking, b: Booking) {
  const A = `${a.date}T${a.time}:00`;
  const B = `${b.date}T${b.time}:00`;
  return A.localeCompare(B);
}

const weekdayLabel = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function SchedulePanel({ slug }: { slug: string }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [mode, setMode] = useState<Mode>("today");

  const today = useMemo(() => todayISO(), []);
  const [selectedDate, setSelectedDate] = useState<string>(today);

  useEffect(() => {
    setBookings(loadBookings(slug));
  }, [slug]);

  // When mode changes, keep UX sane
  useEffect(() => {
    if (mode === "today") setSelectedDate(today);
    if (mode === "upcoming" && selectedDate < today) setSelectedDate(today);
  }, [mode, today]); // eslint-disable-line react-hooks/exhaustive-deps

  const week = useMemo(() => {
    const monday = startOfWeekMonday(new Date());
    return Array.from({ length: 7 }).map((_, i) => {
      const d = addDays(monday, i);
      return { label: weekdayLabel[i], iso: toISODate(d) };
    });
  }, []);

  const filtered = useMemo(() => {
    const sorted = [...bookings].sort(cmpBooking);

    if (mode === "all") return sorted;

    if (mode === "today") return sorted.filter((b) => b.date === today);

    // upcoming
    return sorted.filter((b) => b.date >= today);
  }, [bookings, mode, today]);

  const dayBookings = useMemo(() => {
    // In "all", week strip still works as a day filter (nice UX)
    return filtered.filter((b) => b.date === selectedDate).sort(cmpBooking);
  }, [filtered, selectedDate]);

  const countsByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of filtered) {
      map.set(b.date, (map.get(b.date) ?? 0) + 1);
    }
    return map;
  }, [filtered]);

  const title = useMemo(() => {
    if (mode === "today") return "Today";
    if (mode === "upcoming") return "Upcoming";
    return "All";
  }, [mode]);

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Schedule</h2>
          <p className="mt-1 text-sm text-slate-600">
            {title} appointments • Tap a day to view.
          </p>
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

      {/* Mini week strip */}
      <div className="mt-5 flex flex-wrap gap-2">
        {week.map((d) => {
          const active = d.iso === selectedDate;
          const count = countsByDate.get(d.iso) ?? 0;

          // Disable days outside filter in Upcoming mode (before today)
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
              title={d.iso}
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

      {/* Day list */}
      <div className="mt-5">
        <div className="mb-2 text-sm font-semibold text-slate-900">
          {selectedDate}
        </div>

        {dayBookings.length === 0 ? (
          <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-600">
            No appointments for this day.
          </div>
        ) : (
          <div className="grid gap-3">
            {dayBookings.map((b) => (
              <div key={b.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="font-semibold">
                      {b.time} • {b.customerName}
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
                        .writeText(
                          `${b.customerName} — ${b.date} ${b.time} — ${b.serviceName}`
                        )
                        .catch(() => {});
                    }}
                  >
                    Copy
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
