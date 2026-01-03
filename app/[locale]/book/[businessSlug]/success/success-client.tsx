"use client";

import { useEffect, useMemo, useState } from "react";
import { Booking, loadBookings } from "@/lib/bookings";
import { formatMoney } from "@/lib/services";

export default function SuccessClient({
  locale,
  businessSlug,
  bookingId
}: {
  locale: string;
  businessSlug: string;
  bookingId: string;
}) {
  const [booking, setBooking] = useState<Booking | null>(null);

  useEffect(() => {
    const all = loadBookings(businessSlug);
    const found = all.find((b) => b.id === bookingId);
    setBooking(found ?? null);
  }, [businessSlug, bookingId]);

  const confirmationText = useMemo(() => {
    if (!booking) return "";
    return [
      `✅ Appointment confirmed`,
      `Business: ${booking.businessSlug}`,
      `Service: ${booking.serviceName}`,
      `When: ${booking.date} at ${booking.time}`,
      `Price: ${formatMoney(booking.price, booking.currency as any)}`,
      `Name: ${booking.customerName}`,
      `Phone: ${booking.customerPhone}`
    ].join("\n");
  }, [booking]);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied!");
    } catch {
      alert("Copy failed.");
    }
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-2xl px-6 py-14">
        <section className="rounded-3xl border border-slate-200 p-8 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight">Booked ✅</h1>
          <p className="mt-2 text-slate-600">Your appointment is confirmed.</p>

          {!booking ? (
            <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
              We couldn’t find this booking (maybe the link is missing the id).
              <div className="mt-3">
                <a className="underline" href={`/${locale}/book/${businessSlug}`}>
                  Go back to booking
                </a>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-6 rounded-2xl bg-slate-50 p-5">
                <div className="text-sm font-medium text-slate-600">Summary</div>
                <div className="mt-2 text-lg font-semibold">{booking.serviceName}</div>
                <div className="mt-1 text-sm text-slate-700">
                  {booking.date} • {booking.time} • {booking.durationMin} min •{" "}
                  {formatMoney(booking.price, booking.currency as any)}
                </div>
                <div className="mt-3 text-sm text-slate-700">
                  {booking.customerName} • {booking.customerPhone}
                </div>
                {booking.notes ? (
                  <div className="mt-2 text-sm text-slate-600">Notes: {booking.notes}</div>
                ) : null}
              </div>

              {/* Email placeholder */}
              <div className="mt-6 rounded-2xl border border-slate-200 p-5">
                <div className="font-semibold">Confirmation message</div>
                <p className="mt-2 text-sm text-slate-600">
                  Email/SMS is coming next. For now, you can copy a confirmation message.
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => copy(confirmationText)}
                    className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Copy confirmation
                  </button>
                  <button
                    type="button"
                    onClick={() => copy(`${window.location.origin}/${locale}/book/${businessSlug}`)}
                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold hover:bg-slate-50"
                  >
                    Copy booking link
                  </button>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold hover:bg-slate-50"
                  href={`/${locale}/book/${businessSlug}`}
                >
                  Book another time
                </a>

                {/* ✅ Review link (added here) */}
                <a
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold hover:bg-slate-50"
                  href={`/${locale}/book/${businessSlug}/review?bookingId=${encodeURIComponent(
                    bookingId
                  )}`}
                >
                  Leave a review
                </a>

                <a
                  className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                  href={`/${locale}/dashboard`}
                >
                  Owner dashboard
                </a>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
