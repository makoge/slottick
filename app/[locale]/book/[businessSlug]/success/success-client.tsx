// app/[locale]/book/[slug]/success/SuccessClient.tsx (or your corresponding path)
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
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
    day: "2-digit",
  }).format(dt);

  const time = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(dt);

  const tz = Intl.DateTimeFormat(locale, { timeZoneName: "short" })
    .formatToParts(dt)
    .find((p) => p.type === "timeZoneName")?.value;

  return { date, time, tz: tz ?? "" };
}

export default function SuccessClient({
  businessSlug,
}: {
  businessSlug: string;
}) {
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
        cache: "no-store",
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
        const r2 = await fetch(
          `/api/businesses?city=${encodeURIComponent(city)}`,
          {
            cache: "no-store",
          },
        );
        const d2 = await r2.json().catch(() => ({}));

        if (!cancelled && r2.ok && Array.isArray(d2.businesses)) {
          const cards = (d2.businesses as any[])
            .map((x) => ({
              name: String(x.name ?? ""),
              slug: String(x.slug ?? ""),
              category: x.category ?? null,
              city: x.city ?? null,
              country: x.country ?? null,
              website: x.website ?? null,
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
    <div className="relative flex min-h-[calc(100vh-4rem)] w-full items-center justify-center px-4 py-12 sm:px-6">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-12 h-64 w-64 rounded-full bg-lime-200/40 blur-3xl sm:h-80 sm:w-80" />
      <div className="pointer-events-none absolute -bottom-12 h-64 w-64 rounded-full bg-slate-400/30 blur-3xl sm:h-80 sm:w-80" />

      {/* Main Glassmorphic Container */}
      <div className="relative z-10 w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-400/40 bg-white/75 p-6 shadow-xl backdrop-blur-2xl sm:p-10">
        {/* Header Ribbon */}
        <div className="flex flex-col gap-4 border-b border-slate-300/70 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-lime-300/80 bg-lime-100 px-3.5 py-1 text-xs font-bold text-lime-950 shadow-xs">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-lime-900 text-[10px] text-white">
                ✓
              </span>
              <span className="font-mono uppercase tracking-wider">
                {isPending ? "Pending Verification" : "Booking Confirmed"}
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              {isPending ? (
                <>
                  {tr("bookingSuccess.pending.title")}{" "}
                  <span className="font-normal text-amber-600">⏳</span>
                </>
              ) : (
                <>
                  {tr("bookingSuccess.confirmed.title")}{" "}
                  <span className="font-normal text-lime-700">✓</span>
                </>
              )}
            </h1>

            <p className="mt-1 text-xs text-slate-600 sm:text-sm">
              {isPending
                ? tr("bookingSuccess.pending.description")
                : tr("bookingSuccess.confirmed.description")}
            </p>

            {!loading && booking && isConfirmed && (
              <a
                href={`/api/bookings/${booking.id}/calendar`}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-lime-300/80 bg-lime-100 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-lime-950 shadow-xs transition hover:bg-lime-200 active:scale-95"
              >
                <span>📅</span>
                <span>{tr("bookingSuccess.actions.addToCalendar")}</span>
              </a>
            )}
          </div>

          <Link
            href={backHref}
            className="rounded-xl border border-slate-300/80 bg-white/80 px-3 py-1.5 font-mono text-xs font-semibold text-slate-600 shadow-2xs backdrop-blur-sm transition-all hover:bg-white hover:text-slate-950"
          >
            {tr("bookingSuccess.actions.backToBooking")}
          </Link>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="mt-6 flex items-center justify-center rounded-2xl border border-slate-300/80 bg-white/60 p-8 font-mono text-xs text-slate-600 backdrop-blur-sm">
            <span className="animate-pulse">
              {tr("bookingSuccess.states.loading")}
            </span>
          </div>
        ) : !booking || !details ? (
          <div className="mt-6 rounded-2xl border border-amber-300/80 bg-amber-50/90 p-5 font-mono text-xs text-amber-900 shadow-2xs backdrop-blur-sm">
            <div>{tr("bookingSuccess.states.loadError")}</div>
            <div className="mt-3">
              <Link
                className="font-bold underline hover:text-amber-950"
                href={backHref}
              >
                {tr("bookingSuccess.actions.goBack")}
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Appointment Overview Panel */}
            <div className="mt-6 rounded-2xl border border-slate-300/80 bg-slate-100/70 p-5 backdrop-blur-sm sm:p-6">
              <div className="border-b border-slate-200/80 pb-3 font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
                {isPending
                  ? tr("bookingSuccess.sections.requestDetails")
                  : tr("bookingSuccess.sections.bookingDetails")}
              </div>

              <div className="mt-4 grid gap-3.5 text-xs sm:grid-cols-2 sm:gap-4 sm:text-sm">
                <div>
                  <span className="font-mono text-xs font-bold uppercase text-slate-500">
                    {tr("bookingSuccess.labels.status")}
                  </span>
                  <div className="mt-0.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-xs font-bold uppercase tracking-wider ${
                        isPending
                          ? "border-amber-300/90 bg-amber-100 text-amber-950"
                          : "border-lime-300/90 bg-lime-100 text-lime-950"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isPending ? "bg-amber-600" : "bg-lime-700"
                        }`}
                      />
                      {isPending
                        ? tr("bookingSuccess.status.pendingApproval")
                        : tr("bookingSuccess.status.confirmed")}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="font-mono text-xs font-bold uppercase text-slate-500">
                    {tr("bookingSuccess.labels.business")}
                  </span>
                  <p className="mt-0.5 font-bold text-slate-900">
                    {booking.business.name}
                    {booking.business.city ? (
                      <span className="font-normal text-slate-600">
                        {" "}
                        • {booking.business.city}
                      </span>
                    ) : null}
                  </p>
                </div>

                <div>
                  <span className="font-mono text-xs font-bold uppercase text-slate-500">
                    {tr("bookingSuccess.labels.service")}
                  </span>
                  <p className="mt-0.5 font-bold text-slate-900">
                    {booking.serviceName}{" "}
                    <span className="font-mono font-medium text-slate-600">
                      •{" "}
                      {tr("booking.common.minutes", { n: booking.durationMin })}{" "}
                      • {formatMoney(booking.price, booking.currency as any)}
                    </span>
                  </p>
                </div>

                <div>
                  <span className="font-mono text-xs font-bold uppercase text-slate-500">
                    {tr("bookingSuccess.labels.whenYourTime")}
                  </span>
                  <p className="mt-0.5 font-mono font-bold text-slate-900">
                    {details.date} • {details.time}{" "}
                    {details.tz ? (
                      <span className="font-normal text-slate-600">
                        ({details.tz})
                      </span>
                    ) : (
                      ""
                    )}
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <span className="font-mono text-xs font-bold uppercase text-slate-500">
                    {tr("bookingSuccess.labels.name")}
                  </span>
                  <p className="mt-0.5 font-bold text-slate-900">
                    {booking.customerName}
                  </p>
                </div>
              </div>

              {/* Action */}
              <div className="mt-6 border-t border-slate-200/80 pt-4">
                <Link
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-white shadow-xs transition hover:bg-slate-800 active:scale-95"
                  href={backHref}
                >
                  {isPending
                    ? tr("bookingSuccess.actions.sendAnotherRequest")
                    : tr("bookingSuccess.actions.bookAnotherTime")}{" "}
                  →
                </Link>
              </div>
            </div>

            {/* Explore Nearby Studios */}
            <div className="border-t border-slate-200/80 pt-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
                    {tr("bookingSuccess.explore.title")}
                  </h2>
                  <p className="mt-1 text-xs text-slate-600">
                    {tr("bookingSuccess.explore.description")}
                  </p>
                </div>

                <Link
                  className="font-mono text-xs font-bold text-slate-700 underline underline-offset-2 hover:text-black"
                  href={`/${locale}/explore`}
                >
                  {tr("bookingSuccess.actions.openMarketplace")} →
                </Link>
              </div>

              {explore.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-300/80 bg-white/50 p-4 text-center font-mono text-xs text-slate-500">
                  {tr("bookingSuccess.explore.empty")}
                </div>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {explore.map((b) => (
                    <Link
                      key={b.slug}
                      href={`/${locale}/book/${b.slug}`}
                      className="group rounded-2xl border border-slate-300/80 bg-white/70 p-4 shadow-2xs backdrop-blur-sm transition-all hover:border-lime-300/80 hover:bg-white hover:shadow-xs"
                    >
                      <div className="font-bold text-slate-900 group-hover:text-black">
                        {b.name}
                      </div>
                      <div className="mt-1 font-mono text-xs text-slate-600">
                        {b.category ??
                          tr("bookingSuccess.explore.fallbackCategory")}
                        {b.city ? ` • ${b.city}` : ""}
                        {b.country ? ` • ${b.country}` : ""}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
