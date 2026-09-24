"use client";

import { useEffect, useMemo, useState } from "react";
import { formatMoney } from "@/lib/services";
import { useParams, useRouter } from "next/navigation";
import { useMessages } from "@/lib/use-messages";
import { t } from "@/lib/i18n";

type DbBooking = {
  id: string;
  startsAt: string; // ISO
  durationMin: number;
  serviceName: string;
  price: number;
  currency: string;
  customerName: string;
  customerPhone: string;
  customerCountry?: string | null;
  notes?: string | null;
  status: "CONFIRMED" | "CANCELLED" | "DONE";
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toLocalDateTimeParts(iso: string) {
  const dt = new Date(iso);
  const date = `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
  const time = `${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`;
  return { date, time };
}

function endsAtMs(b: DbBooking) {
  return new Date(b.startsAt).getTime() + b.durationMin * 60_000;
}

export default function BookingsPanel() {
  const router = useRouter();
  const params = useParams<{ locale?: string }>();
  const locale = params?.locale ?? "en";

  const messages = useMessages(locale);

  const [bookings, setBookings] = useState<DbBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/bookings?scope=owner", {
        cache: "no-store",
      });
      if (res.status === 401) {
        router.replace(`/${locale}/login`);
        return;
      }
      const data = await res.json().catch(() => ({}));
      setBookings(res.ok && Array.isArray(data.bookings) ? data.bookings : []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    refresh();
    const tmr = setInterval(refresh, 15_000);
    return () => clearInterval(tmr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { upcoming, past } = useMemo(() => {
    const now = Date.now();

    const active = bookings.filter((b) => b.status !== "CANCELLED");
    const upcoming = active
      .filter((b) => b.status !== "DONE")
      .filter((b) => endsAtMs(b) >= now)
      .sort((a, b) => String(a.startsAt).localeCompare(String(b.startsAt)));

    const past = active
      .filter((b) => b.status === "DONE" || endsAtMs(b) < now)
      .sort((a, b) => String(b.startsAt).localeCompare(String(a.startsAt)));

    return { upcoming, past };
  }, [bookings]);

  async function cancel(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/bookings/${id}/cancel?locale=${locale}`, {
        method: "POST",
      });
      if (res.status === 401) {
        router.replace(`/${locale}/login`);
        return;
      }
      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status: "CANCELLED" } : b)),
        );
      }
    } finally {
      setBusyId(null);
    }
  }

  async function done(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(
        `/api/bookings/${encodeURIComponent(id)}/done?locale=${encodeURIComponent(locale)}`,
        {
          method: "POST",
        },
      );
      if (res.status === 401) {
        router.replace(`/${locale}/login`);
        return;
      }
      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status: "DONE" } : b)),
        );
      }
    } finally {
      setBusyId(null);
    }
  }

  function BookingCard({ b }: { b: DbBooking }) {
    const { date, time } = toLocalDateTimeParts(b.startsAt);
    const busy = busyId === b.id;
    const isCompleted = b.status === "DONE";

    return (
      <div className="group rounded-2xl border border-slate-300/80 bg-white/80 p-4 shadow-2xs backdrop-blur-sm transition hover:border-slate-400 hover:bg-white sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold text-slate-900">
                {date} • {time}
              </span>
              <span className="rounded-md border border-slate-300/80 bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700">
                {b.customerName}
              </span>
              {isCompleted && (
                <span className="rounded-md border border-lime-300/80 bg-lime-100 px-2 py-0.5 font-mono text-[10px] font-bold text-lime-950">
                  Done
                </span>
              )}
            </div>

            <div className="font-mono text-xs text-slate-600">
              <span className="font-semibold text-slate-800">
                {b.serviceName}
              </span>
              {" • "}
              <span>
                {b.durationMin} {t(messages, "bookings.minutes")}
              </span>
              {" • "}
              <span className="font-bold text-slate-900">
                {formatMoney(b.price, b.currency as any)}
              </span>
            </div>

            <div className="font-mono text-xs text-slate-500">
              <span>{b.customerPhone}</span>
              {b.customerCountry && <span> • {b.customerCountry}</span>}
              {b.notes && (
                <span className="italic">
                  {" • "}
                  {t(messages, "bookings.notes")}: {b.notes}
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 pt-1 sm:pt-0">
            {!isCompleted && (
              <button
                type="button"
                onClick={() => done(b.id)}
                disabled={busy}
                className="rounded-xl border border-lime-300/80 bg-lime-100 px-3.5 py-1.5 font-mono text-xs font-bold text-lime-950 shadow-2xs transition hover:bg-lime-200 active:scale-95 disabled:opacity-50"
              >
                {busy
                  ? t(messages, "bookings.buttons.saving")
                  : t(messages, "bookings.buttons.done")}
              </button>
            )}

            <button
              type="button"
              onClick={() => cancel(b.id)}
              disabled={busy}
              className="rounded-xl border border-rose-300/80 bg-rose-50 px-3.5 py-1.5 font-mono text-xs font-semibold text-rose-700 shadow-2xs transition hover:bg-rose-100 active:scale-95 disabled:opacity-50"
            >
              {busy
                ? t(messages, "bookings.buttons.cancelling")
                : t(messages, "bookings.buttons.cancel")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const upcomingLabel = t(messages, "bookings.upcomingCount").replace(
    "{n}",
    String(upcoming.length),
  );

  return (
    <div className="space-y-6">
      {/* Top action row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-md border border-lime-300/80 bg-lime-100 font-mono text-[10px] font-bold text-lime-950">
            ✓
          </span>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
            {loading ? t(messages, "bookings.loadingShort") : upcomingLabel}
          </span>
        </div>

        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          className="inline-flex items-center justify-center rounded-xl border border-slate-300/80 bg-white/80 px-3.5 py-1.5 font-mono text-xs font-semibold text-slate-700 shadow-2xs backdrop-blur-sm transition hover:bg-white active:scale-95 disabled:opacity-50"
        >
          {refreshing
            ? t(messages, "bookings.buttons.refreshing")
            : t(messages, "bookings.buttons.refresh")}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-slate-300/80 bg-white/60 p-8 font-mono text-xs text-slate-500 animate-pulse">
          {t(messages, "bookings.loading")}
        </div>
      ) : upcoming.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300/80 bg-slate-100/50 p-6 text-center font-mono text-xs text-slate-500">
          {t(messages, "bookings.emptyUpcoming")}
        </div>
      ) : (
        <div className="space-y-3">
          {upcoming.map((b) => (
            <BookingCard key={b.id} b={b} />
          ))}
        </div>
      )}

      {!loading && past.length > 0 && (
        <div className="border-t border-slate-300/70 pt-6">
          <div className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
            {t(messages, "bookings.pastTitle")}
          </div>
          <div className="mt-3 space-y-3">
            {past.slice(0, 10).map((b) => (
              <BookingCard key={b.id} b={b} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
