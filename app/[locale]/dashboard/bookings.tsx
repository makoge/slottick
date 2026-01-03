"use client";

import { useEffect, useMemo, useState } from "react";
import { Booking, loadBookings, saveBookings } from "@/lib/bookings";
import { formatMoney } from "@/lib/services";

export default function BookingsPanel({ slug }: { slug: string }) {
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    setBookings(loadBookings(slug));
  }, [slug]);

  const sorted = useMemo(() => {
    return [...bookings].sort((a, b) => {
      const da = `${a.date}T${a.time}:00`;
      const db = `${b.date}T${b.time}:00`;
      return da.localeCompare(db);
    });
  }, [bookings]);

  function remove(id: string) {
    const next = bookings.filter((b) => b.id !== id);
    setBookings(next);
    saveBookings(slug, next);
  }

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Bookings</h2>
        <span className="text-sm text-slate-600">{sorted.length} total</span>
      </div>

      {sorted.length === 0 ? (
        <p className="mt-3 text-sm text-slate-600">
          No bookings yet — share your link and the first one will appear here.
        </p>
      ) : (
        <div className="mt-4 grid gap-3">
          {sorted.map((b) => (
            <div key={b.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="font-semibold">
                    {b.date} • {b.time} — {b.customerName}
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
                  onClick={() => remove(b.id)}
                  className="w-fit rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
