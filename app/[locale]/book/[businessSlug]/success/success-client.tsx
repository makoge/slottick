"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatMoney, type Currency } from "@/lib/services";
import { useLocale } from "@/lib/use-locale";
import { useMessages } from "@/lib/use-messages";
import { t } from "@/lib/i18n";

type StaffDTO = {
  id: string;
  name: string;
  title?: string | null;
  avatarUrl?: string | null;
};

type BookingDTO = {
  id: string;
  startsAt: string;
  endsAt?: string | null;
  durationMin: number;
  serviceName: string;
  price: number;
  currency: Currency | string;
  customerName: string;
  status: string;
  depositPaid?: boolean;
  depositAmount?: number | null;
  staff?: StaffDTO | null;
  business: {
    name: string;
    slug: string;
    category?: string | null;
    city?: string | null;
    country?: string | null;
    website?: string | null;
    logoUrl?: string | null;
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
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
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

  const statusParam = (sp.get("status") ?? "").toUpperCase();

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
          { cache: "no-store" },
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
            .slice(0, 4);

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

  const effectiveStatus = (
    booking?.status ||
    statusParam ||
    "CONFIRMED"
  ).toUpperCase();
  const isPending = effectiveStatus === "PENDING";
  const isConfirmed = effectiveStatus === "CONFIRMED";

  const startsDetails = useMemo(() => {
    if (!booking) return null;
    return formatLocalDateTime(booking.startsAt, locale);
  }, [booking, locale]);

  const endsDetails = useMemo(() => {
    if (!booking?.endsAt) return null;
    return formatLocalDateTime(booking.endsAt, locale);
  }, [booking, locale]);

  return (
    <main className="min-h-screen bg-[#FAF7F2] text-[#241F1A] font-sans selection:bg-[#EAE0D0] selection:text-[#1F1914] px-4 py-12 sm:px-6">
      {/* Top Ledger Ribbon */}
      <div className="mx-auto max-w-2xl text-center mb-8">
        <div className="font-mono text-[11px] uppercase tracking-widest text-[#7D7060]">
          ✦ OFFICIAL RESERVATION REGISTER ✦
        </div>
      </div>

      <div className="mx-auto max-w-2xl">
        {loading ? (
          <div className="rounded-2xl border border-[#DFD6C7] bg-[#F4EFE6] p-12 text-center font-mono text-xs text-[#7A6D5E] shadow-sm animate-pulse">
            {tr("bookingSuccess.states.loading")}
          </div>
        ) : !booking || !startsDetails ? (
          <div className="rounded-2xl border border-[#DFD6C7] bg-white p-8 text-center shadow-sm">
            <div className="font-mono text-xs text-rose-800">
              {tr("bookingSuccess.states.loadError")}
            </div>
            <div className="mt-4">
              <Link
                href={backHref}
                className="font-mono text-xs font-bold underline hover:text-[#000]"
              >
                {tr("bookingSuccess.actions.goBack")}
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* VINTAGE TICKET STUB */}
            <div className="relative overflow-hidden rounded-2xl border border-[#D5C9B8] bg-white shadow-[0_20px_60px_-25px_rgba(40,32,24,0.15)]">
              {/* Ticket Top Banner */}
              <div className="border-b border-[#E8DFC0] bg-[#1E1915] px-6 py-6 text-[#FAF6F0] sm:px-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#4F4439] bg-[#2A231E] px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-[#D9CDBB]">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isPending ? "bg-amber-400" : "bg-[#C29B38]"
                        }`}
                      />
                      {isPending
                        ? tr("bookingSuccess.status.pendingApproval")
                        : tr("bookingSuccess.status.confirmed")}
                    </div>

                    <h1 className="mt-3 font-serif text-3xl font-medium tracking-tight sm:text-4xl text-[#FAF6F0]">
                      {isPending
                        ? tr("bookingSuccess.pending.title")
                        : tr("bookingSuccess.confirmed.title")}
                    </h1>

                    <p className="mt-1 text-xs text-[#BFB2A2] sm:text-sm font-light">
                      {isPending
                        ? tr("bookingSuccess.pending.description")
                        : tr("bookingSuccess.confirmed.description")}
                    </p>
                  </div>

                  <Link
                    href={backHref}
                    className="shrink-0 rounded-lg border border-[#44382E] bg-[#2A221C] px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-[#DCD1BF] hover:bg-[#382E25]"
                  >
                    ← {tr("bookingSuccess.actions.backToBooking")}
                  </Link>
                </div>

                {isConfirmed && (
                  <div className="mt-5">
                    <a
                      href={`/api/bookings/${booking.id}/calendar`}
                      className="inline-flex items-center gap-2 rounded-lg border border-[#C29B38]/60 bg-[#C29B38]/10 px-3.5 py-1.5 font-mono text-xs font-semibold text-[#E7C77E] hover:bg-[#C29B38]/20 transition"
                    >
                      <span>📅</span>
                      <span>{tr("bookingSuccess.actions.addToCalendar")}</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Perforation Line Effect */}
              <div className="relative flex items-center justify-between border-y border-dashed border-[#DFD5C4] bg-[#F7F2E9] px-4 py-2">
                <div className="font-mono text-[10px] uppercase tracking-widest text-[#7C6E5E]">
                  APPOINTMENT MANIFEST ENTRY • ID: {booking.id.slice(0, 8)}
                </div>
                <div className="font-mono text-[10px] text-[#A39483]">
                  SECURE RECORD
                </div>
              </div>

              {/* Ticket Body Content */}
              <div className="p-6 sm:p-8 space-y-6 bg-white">
                <div className="grid gap-6 sm:grid-cols-2">
                  {/* Business & City */}
                  <div>
                    <span className="font-mono text-[11px] uppercase tracking-wider text-[#8A7B6B]">
                      {tr("bookingSuccess.labels.business")}
                    </span>
                    <p className="font-serif text-lg font-bold text-[#241F1A] mt-0.5">
                      {booking.business.name}
                    </p>
                    {booking.business.city && (
                      <p className="font-mono text-xs text-[#746656]">
                        {booking.business.city}
                        {booking.business.country
                          ? `, ${booking.business.country}`
                          : ""}
                      </p>
                    )}
                  </div>

                  {/* Specialist / Chair */}
                  <div>
                    <span className="font-mono text-[11px] uppercase tracking-wider text-[#8A7B6B]">
                      {tr("bookingSuccess.labels.specialist")}
                    </span>
                    <div className="mt-0.5 flex items-center gap-2">
                      {booking.staff?.name ? (
                        <>
                          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#D5C9B8] bg-[#F4EFE6] font-serif text-xs font-bold text-[#3B3127]">
                            ✂
                          </div>
                          <div>
                            <span className="font-serif font-bold text-[#241F1A] text-base">
                              {booking.staff.name}
                            </span>
                            {booking.staff.title && (
                              <span className="ml-1.5 font-mono text-[11px] text-[#7A6C5C]">
                                ({booking.staff.title})
                              </span>
                            )}
                          </div>
                        </>
                      ) : (
                        <span className="font-mono text-xs text-[#7A6C5C]">
                          House Specialist (First Available)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Service & Price */}
                  <div>
                    <span className="font-mono text-[11px] uppercase tracking-wider text-[#8A7B6B]">
                      {tr("bookingSuccess.labels.service")}
                    </span>
                    <p className="font-serif text-lg font-bold text-[#241F1A] mt-0.5">
                      {booking.serviceName}
                    </p>
                    <p className="font-mono text-xs text-[#8C6D2B] font-bold">
                      {formatMoney(booking.price, booking.currency as any)}
                      <span className="ml-2 font-normal text-[#746656]">
                        ({booking.durationMin}{" "}
                        {tr("booking.common.minutes", {
                          n: booking.durationMin,
                        })}
                        )
                      </span>
                    </p>
                    {booking.depositPaid && (
                      <div className="mt-1">
                        <span className="rounded bg-[#EFE7D8] px-2 py-0.5 font-mono text-[10px] font-bold text-[#785E22]">
                          Deposit Confirmed
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Time Window */}
                  <div>
                    <span className="font-mono text-[11px] uppercase tracking-wider text-[#8A7B6B]">
                      {tr("bookingSuccess.labels.whenYourTime")}
                    </span>
                    <p className="font-mono font-bold text-sm text-[#241F1A] mt-0.5">
                      {startsDetails.date}
                    </p>
                    <p className="font-mono text-xs text-[#6B5D4E]">
                      {startsDetails.time}
                      {endsDetails ? ` – ${endsDetails.time}` : ""}
                      {startsDetails.tz ? ` (${startsDetails.tz})` : ""}
                    </p>
                  </div>

                  {/* Patron Name */}
                  <div className="sm:col-span-2 border-t border-[#EFE8DC] pt-4">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-[#8A7B6B]">
                      {tr("bookingSuccess.labels.name")}
                    </span>
                    <p className="font-serif text-base font-bold text-[#241F1A] mt-0.5">
                      {booking.customerName}
                    </p>
                  </div>
                </div>

                {/* Return Actions */}
                <div className="pt-4 border-t border-[#EFE8DC] flex flex-wrap items-center justify-between gap-3">
                  <Link
                    href={backHref}
                    className="inline-flex items-center justify-center rounded-xl bg-[#241F1A] px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-[#FAF6F0] shadow-sm hover:bg-[#3D332B] transition active:scale-95"
                  >
                    {isPending
                      ? tr("bookingSuccess.actions.sendAnotherRequest")
                      : tr("bookingSuccess.actions.bookAnotherTime")}{" "}
                    →
                  </Link>

                  <Link
                    href={`/${locale}/explore`}
                    className="font-mono text-xs font-semibold text-[#6E604F] underline hover:text-[#241F1A]"
                  >
                    {tr("bookingSuccess.actions.openMarketplace")} ↗
                  </Link>
                </div>
              </div>
            </div>

            {/* EXPLORE LOCAL ATELIERS */}
            {explore.length > 0 && (
              <div className="rounded-2xl border border-[#DFD6C7] bg-[#F7F2E9] p-6 sm:p-8">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between border-b border-[#E6DCce] pb-4 mb-4">
                  <div>
                    <h2 className="font-serif text-xl font-medium text-[#241F1A]">
                      {tr("bookingSuccess.explore.title")}
                    </h2>
                    <p className="font-mono text-xs text-[#7A6D5E] mt-0.5">
                      {tr("bookingSuccess.explore.description")}
                    </p>
                  </div>

                  <Link
                    href={`/${locale}/explore`}
                    className="font-mono text-xs font-bold text-[#8C6D2B] underline hover:text-[#5E4717]"
                  >
                    {tr("bookingSuccess.actions.openMarketplace")} →
                  </Link>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {explore.map((b) => (
                    <Link
                      key={b.slug}
                      href={`/${locale}/book/${b.slug}`}
                      className="group rounded-xl border border-[#E3D8C8] bg-white p-4 shadow-2xs hover:border-[#8C6D2B] hover:shadow-sm transition"
                    >
                      <div className="font-serif font-bold text-base text-[#241F1A] group-hover:text-[#8C6D2B] transition">
                        {b.name}
                      </div>
                      <div className="mt-1 font-mono text-xs text-[#746554]">
                        {b.category ??
                          tr("bookingSuccess.explore.fallbackCategory")}
                        {b.city ? ` • ${b.city}` : ""}
                        {b.country ? `, ${b.country}` : ""}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
