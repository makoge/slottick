"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatMoney, type Currency } from "@/lib/services";

type BookingDTO = {
  id: string;
  startsAt: string; // ISO
  durationMin: number;
  serviceName: string;
  price: number;
  currency: Currency | string;
  customerName: string;
  business: {
    name: string;
    slug: string;
    category?: string | null;
    city?: string | null;
    country?: string | null;
    website?: string | null;
  };
};

type BusinessCard = {
  name: string;
  slug: string;
  category?: string | null;
  city?: string | null;
  country?: string | null;
  website?: string | null;
};

function prettyDateTime(iso: string) {
  const dt = new Date(iso);
  // booking uses UTC in your MVP
  const yyyy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  const hh = String(dt.getUTCHours()).padStart(2, "0");
  const min = String(dt.getUTCMinutes()).padStart(2, "0");
  return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${min}` };
}

export default function SuccessClient({
  locale,
  businessSlug
}: {
  locale: string;
  businessSlug: string;
}) {
  const sp = useSearchParams();
  const id = sp.get("id") ?? "";

  const [booking, setBooking] = useState<BookingDTO | null>(null);
  const [explore, setExplore] = useState<BusinessCard[]>([]);
  const [loading, setLoading] = useState(true);

  const backHref = `/${locale}/book/${businessSlug}`;

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setBooking(null);
      setExplore([]);

      if (!id) {
        setLoading(false);
        return;
      }

      // 1) fetch booking
      const res = await fetch(`/api/bookings/${encodeURIComponent(id)}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));

      if (cancelled) return;

      if (!res.ok || !data?.booking) {
        setLoading(false);
        return;
      }

      const b: BookingDTO = data.booking;
      setBooking(b);

      // 2) marketplace (simple): show other businesses in same city (if you have /api/businesses)
      const city = b.business?.city?.trim();
      if (city) {
        const r2 = await fetch(`/api/businesses?city=${encodeURIComponent(city)}`, {
          cache: "no-store"
        });
        const d2 = await r2.json().catch(() => ({}));

        if (!cancelled && r2.ok && Array.isArray(d2.businesses)) {
          const cards = (d2.businesses as any[])
            .map((x) => ({
              name: String(x.name ?? ""),
              slug: String(x.slug ?? ""),
              category: x.category ?? null,
              city: x.city ?? null,
              country: x.country ?? null,
              website: x.website ?? null
            }))
            .filter((x) => x.slug && x.slug !== b.business.slug)
            .slice(0, 6);

          setExplore(cards);
        }
      }

      setLoading(false);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const details = useMemo(() => {
    if (!booking) return null;
    const { date, time } = prettyDateTime(booking.startsAt);
    return { date, time };
  }, [booking]);

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <section className="rounded-3xl border border-slate-200 p-8 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-600">Slottick</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">
                Booked <span aria-hidden>✅</span>
              </h1>
              <p className="mt-2 text-slate-600">Your appointment is confirmed.</p>
            </div>

            <a className="text-sm underline text-slate-600" href={backHref}>
              Back to booking
            </a>
          </div>

          {loading ? (
            <div className="mt-6 rounded-2xl border border-slate-200 p-4 text-sm text-slate-600">
              Loading booking details…
            </div>
          ) : !booking || !details ? (
            <div className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
              We couldn’t load the booking details (missing or invalid id).
              <div className="mt-2">
                <a className="font-semibold underline" href={backHref}>
                  Go back to booking
                </a>
              </div>
            </div>
          ) : (
            <>
              {/* Booking details */}
              <div className="mt-6 rounded-2xl bg-slate-50 p-5">
                <div className="text-sm font-medium text-slate-600">Booking details</div>

                <div className="mt-3 grid gap-2 text-sm">
                  <div>
                    <span className="text-slate-600">Business:</span>{" "}
                    <span className="font-semibold">{booking.business.name}</span>
                    {booking.business.city ? (
                      <span className="text-slate-600"> • {booking.business.city}</span>
                    ) : null}
                  </div>

                  <div>
                    <span className="text-slate-600">Service:</span>{" "}
                    <span className="font-semibold">{booking.serviceName}</span>
                    <span className="text-slate-600">
                      {" "}
                      • {booking.durationMin} min •{" "}
                      {formatMoney(booking.price, booking.currency as any)}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-600">When (UTC):</span>{" "}
                    <span className="font-semibold">
                      {details.date} • {details.time}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-600">Name:</span>{" "}
                    <span className="font-semibold">{booking.customerName}</span>
                  </div>

                  <div className="pt-2">
                    <a
                      className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                      href={backHref}
                    >
                      Book another time
                    </a>
                  </div>
                </div>
              </div>

              {/* Marketplace */}
              <div className="mt-8">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">Explore more services</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Discover other businesses near you (simple MVP list by city).
                    </p>
                  </div>

                  <a
                    className="text-sm font-semibold underline"
                    href={`/${locale}/explore`}
                  >
                    Open marketplace
                  </a>
                </div>

                {explore.length === 0 ? (
                  <div className="mt-4 rounded-2xl border border-slate-200 p-4 text-sm text-slate-600">
                    No nearby businesses found yet.
                  </div>
                ) : (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {explore.map((b) => (
                      <a
                        key={b.slug}
                        href={`/${locale}/book/${b.slug}`}
                        className="rounded-2xl border border-slate-200 p-4 hover:bg-slate-50"
                      >
                        <div className="font-semibold">{b.name}</div>
                        <div className="mt-1 text-sm text-slate-600">
                          {b.category ?? "Service"}{" "}
                          {b.city ? `• ${b.city}` : ""} {b.country ? `• ${b.country}` : ""}
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
