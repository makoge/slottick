"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatMoney, type Currency } from "@/lib/services";
import { useLocale } from "@/lib/use-locale";
import { useMessages } from "@/lib/use-messages";
import { t } from "@/lib/i18n";

type BookingDTO = {
  id: string;
  startsAt: string;
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

function formatLocalDateTime(iso: string, locale: string) {
  const dt = new Date(iso);

  const date = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(dt);

  const time = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(dt);

  const tz = Intl.DateTimeFormat(locale, { timeZoneName: "short" })
    .formatToParts(dt)
    .find((p) => p.type === "timeZoneName")?.value;

  return { date, time, tz: tz ?? "" };
}

export default function SuccessClient({ businessSlug }: { businessSlug: string }) {
  const locale = useLocale("en");
  const messages = useMessages(locale);

  const tr = (key: string, vars?: Record<string, string | number>) => {
    let s = t(messages, key);
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        s = s.replaceAll(`{${k}}`, String(v));
      }
    }
    return s;
  };

  const sp = useSearchParams();
  const id = sp.get("id") ?? "";

  const status = (sp.get("status") ?? "").toUpperCase();
  const isPending = status === "PENDING";
  const isConfirmed = status === "CONFIRMED";

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

      const res = await fetch(`/api/bookings/${encodeURIComponent(id)}`, {
        cache: "no-store"
      });
      const data = await res.json().catch(() => ({}));

      if (cancelled) return;

      if (!res.ok || !data?.booking) {
        setLoading(false);
        return;
      }

      const b: BookingDTO = data.booking;
      setBooking(b);

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
    return formatLocalDateTime(booking.startsAt, locale);
  }, [booking, locale]);

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <section className="rounded-3xl border border-slate-200 p-8 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-600">Slottick</p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight">
                {isPending ? (
                  <>
                    {tr("bookingSuccess.pending.title")} <span aria-hidden>⏳</span>
                  </>
                ) : (
                  <>
                    {tr("bookingSuccess.confirmed.title")} <span aria-hidden>✅</span>
                  </>
                )}
              </h1>

              <p className="mt-2 text-slate-600">
                {isPending
                  ? tr("bookingSuccess.pending.description")
                  : tr("bookingSuccess.confirmed.description")}
              </p>

              {!loading && booking && isConfirmed && (
                <a
                  href={`/api/bookings/${booking.id}/calendar`}
                  className="mt-4 inline-flex items-center rounded-xl px-4 py-2 shadow"
                >
                  {tr("bookingSuccess.actions.addToCalendar")}
                </a>
              )}
            </div>

            <a className="text-sm underline text-slate-600" href={backHref}>
              {tr("bookingSuccess.actions.backToBooking")}
            </a>
          </div>

          {loading ? (
            <div className="mt-6 rounded-2xl border border-slate-200 p-4 text-sm text-slate-600">
              {tr("bookingSuccess.states.loading")}
            </div>
          ) : !booking || !details ? (
            <div className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
              {tr("bookingSuccess.states.loadError")}
              <div className="mt-2">
                <a className="font-semibold underline" href={backHref}>
                  {tr("bookingSuccess.actions.goBack")}
                </a>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-6 rounded-2xl bg-slate-50 p-5">
                <div className="text-sm font-medium text-slate-600">
                  {isPending
                    ? tr("bookingSuccess.sections.requestDetails")
                    : tr("bookingSuccess.sections.bookingDetails")}
                </div>

                <div className="mt-3 grid gap-2 text-sm">
                  <div>
                    <span className="text-slate-600">
                      {tr("bookingSuccess.labels.status")}:
                    </span>{" "}
                    <span
                      className={`font-semibold ${
                        isPending ? "text-amber-700" : "text-emerald-700"
                      }`}
                    >
                      {isPending
                        ? tr("bookingSuccess.status.pendingApproval")
                        : tr("bookingSuccess.status.confirmed")}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-600">
                      {tr("bookingSuccess.labels.business")}:
                    </span>{" "}
                    <span className="font-semibold">{booking.business.name}</span>
                    {booking.business.city ? (
                      <span className="text-slate-600"> • {booking.business.city}</span>
                    ) : null}
                  </div>

                  <div>
                    <span className="text-slate-600">
                      {tr("bookingSuccess.labels.service")}:
                    </span>{" "}
                    <span className="font-semibold">{booking.serviceName}</span>
                    <span className="text-slate-600">
                      {" "}
                      • {tr("booking.common.minutes", { n: booking.durationMin })} •{" "}
                      {formatMoney(booking.price, booking.currency as any)}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-600">
                      {tr("bookingSuccess.labels.whenYourTime")}:
                    </span>{" "}
                    <span className="font-semibold">
                      {details.date} • {details.time} {details.tz ? `(${details.tz})` : ""}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-600">
                      {tr("bookingSuccess.labels.name")}:
                    </span>{" "}
                    <span className="font-semibold">{booking.customerName}</span>
                  </div>

                  <div className="pt-2">
                    <a
                      className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                      href={backHref}
                    >
                      {isPending
                        ? tr("bookingSuccess.actions.sendAnotherRequest")
                        : tr("bookingSuccess.actions.bookAnotherTime")}
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {tr("bookingSuccess.explore.title")}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {tr("bookingSuccess.explore.description")}
                    </p>
                  </div>

                  <a className="text-sm font-semibold underline" href={`/${locale}/explore`}>
                    {tr("bookingSuccess.actions.openMarketplace")}
                  </a>
                </div>

                {explore.length === 0 ? (
                  <div className="mt-4 rounded-2xl border border-slate-200 p-4 text-sm text-slate-600">
                    {tr("bookingSuccess.explore.empty")}
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
                          {b.category ?? tr("bookingSuccess.explore.fallbackCategory")}
                          {b.city ? ` • ${b.city}` : ""}
                          {b.country ? ` • ${b.country}` : ""}
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
