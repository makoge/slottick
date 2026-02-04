"use client";

import { useEffect, useMemo, useState } from "react";
import { formatMoney } from "@/lib/services";
import { useParams, useRouter } from "next/navigation";

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

  const [bookings, setBookings] = useState<DbBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/bookings?scope=owner", { cache: "no-store" });
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

    // ✅ auto-poll so bookings show without page refresh
    const t = setInterval(refresh, 15_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { upcoming, past } = useMemo(() => {
    const now = Date.now();

    const active = bookings.filter((b) => b.status !== "CANCELLED");
    const upcoming = active
      .filter((b) => b.status !== "DONE")
      .filter((b) => endsAtMs(b) >= now) // still upcoming
      .sort((a, b) => String(a.startsAt).localeCompare(String(b.startsAt)));

    const past = active
      .filter((b) => b.status === "DONE" || endsAtMs(b) < now)
      .sort((a, b) => String(b.startsAt).localeCompare(String(a.startsAt)));

    return { upcoming, past };
  }, [bookings]);

  async function cancel(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(id)}/cancel`, { method: "POST" });
      if (res.status === 401) {
        router.replace(`/${locale}/login`);
        return;
      }
      if (res.ok) {
        setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: "CANCELLED" } : b)));
      }
    } finally {
      setBusyId(null);
    }
  }

  async function done(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(id)}/done`, { method: "POST" });
      if (res.status === 401) {
        router.replace(`/${locale}/login`);
        return;
      }
      if (res.ok) {
        setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: "DONE" } : b)));
      }
    } finally {
      setBusyId(null);
    }
  }

  function BookingCard({ b }: { b: DbBooking }) {
    const { date, time } = toLocalDateTimeParts(b.startsAt);
    const busy = busyId === b.id;

    return (
      <div className="rounded-2xl border border-slate-200 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="font-semibold">
              {date} • {time} — {b.customerName}
            </div>
            <div className="mt-1 text-sm text-slate-600">
              {b.serviceName} • {b.durationMin} min • {formatMoney(b.price, b.currency as any)}
            </div>
            <div className="mt-1 text-sm text-slate-600">
              {b.customerPhone}
              {b.notes ? ` • Notes: ${b.notes}` : ""}
            </div>
          </div>

          <div className="flex w-fit gap-2">
            <button
              type="button"
              onClick={() => done(b.id)}
              disabled={busy}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60"
            >
              {busy ? "Saving..." : "Done"}
            </button>

            <button
              type="button"
              onClick={() => cancel(b.id)}
              disabled={busy}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60"
            >
              {busy ? "Cancelling..." : "Cancel"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Bookings</h2>

        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600">
            {loading ? "Loading..." : `${upcoming.length} upcoming`}
          </span>

          <button
            type="button"
            onClick={refresh}
            disabled={refreshing}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="mt-3 text-sm text-slate-600">Loading bookings...</p>
      ) : upcoming.length === 0 ? (
        <p className="mt-3 text-sm text-slate-600">
          No upcoming bookings yet.
        </p>
      ) : (
        <div className="mt-4 grid gap-3">
          {upcoming.map((b) => (
            <BookingCard key={b.id} b={b} />
          ))}
        </div>
      )}

      {/* Past */}
      {!loading && past.length > 0 ? (
        <div className="mt-8">
          <div className="text-sm font-semibold text-slate-700">Past</div>
          <div className="mt-3 grid gap-3">
            {past.slice(0, 10).map((b) => (
              <BookingCard key={b.id} b={b} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
