"use client";

import { useEffect, useMemo, useState } from "react";
import { formatMoney } from "@/lib/services";

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

function toLocalDateTimeParts(iso: string) {
  const dt = new Date(iso);
  const date = `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
  const time = `${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`;
  return { date, time };
}

export default function BookingsPanel({ slug }: { slug: string }) {
  const [bookings, setBookings] = useState<DbBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    const res = await fetch(`/api/owner/bookings?slug=${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    setBookings(res.ok && Array.isArray(data.bookings) ? data.bookings : []);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const sorted = useMemo(() => {
    return [...bookings]
      .filter((b) => b.status !== "CANCELLED")
      .sort((a, b) => String(a.startsAt).localeCompare(String(b.startsAt)));
  }, [bookings]);

  async function cancel(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/owner/bookings/${encodeURIComponent(id)}/cancel`, {
        method: "POST",
      });
      if (res.ok) {
        // optimistic update
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status: "CANCELLED" as const } : b))
        );
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Bookings</h2>
        <span className="text-sm text-slate-600">
          {loading ? "Loading..." : `${sorted.length} total`}
        </span>
      </div>

      {loading ? (
        <p className="mt-3 text-sm text-slate-600">Loading bookings...</p>
      ) : sorted.length === 0 ? (
        <p className="mt-3 text-sm text-slate-600">
          No bookings yet — share your link and the first one will appear here.
        </p>
      ) : (
        <div className="mt-4 grid gap-3">
          {sorted.map((b) => {
            const { date, time } = toLocalDateTimeParts(b.startsAt);
            return (
              <div key={b.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="font-semibold">
                      {date} • {time} — {b.customerName}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      {b.serviceName} • {b.durationMin} min •{" "}
                      {formatMoney(b.price, b.currency as any)}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      {b.customerPhone}
                      {b.notes ? ` • Notes: ${b.notes}` : ""}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => cancel(b.id)}
                    disabled={busyId === b.id}
                    className="w-fit rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60"
                  >
                    {busyId === b.id ? "Cancelling..." : "Cancel"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
