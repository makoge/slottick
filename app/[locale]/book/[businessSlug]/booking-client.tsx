"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AvailabilityRule,
  defaultAvailability,
  generateTimeSlots,
  canFitServiceAt,
  overlapsBreak,
  slotRangeForService
} from "@/lib/availability";
import { Currency, Service, formatMoney } from "@/lib/services";
import { useMessages } from "@/lib/use-messages";
import { t } from "@/lib/i18n";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

type DbDayBooking = { startsAt: string; durationMin: number };
type DepositType = "PERCENT" | "AMOUNT";

type DbService = {
  id: string;
  name: string;
  durationMin: number;
  price: number;
  currency: string;
  depositEnabled?: boolean;
  depositType?: DepositType;
  depositValue?: number | null;
  images?: string[];
};

type CustomerMe = {
  customer: null | {
    id: string;
    email: string;
    name?: string | null;
    phone?: string | null;
  };
};

type BusinessPublic = {
  name: string;
  slug: string;
  industry?: string | null;

  description?: string | null;

  city?: string | null;
  country?: string | null;
  street?: string | null;
  postalCode?: string | null;

  website?: string | null;
  logoUrl?: string | null;

  galleryImages: string[];
};

function toCurrency(x: unknown): Currency {
  const s = String(x ?? "EUR").toUpperCase();
  return s === "EUR" || s === "USD" || s === "FCFA" ? (s as Currency) : "EUR";
}

function hhmmFromISOInTZ(iso: string, timeZone: string) {
  const dt = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(dt);
  const h = parts.find((p) => p.type === "hour")?.value ?? "00";
  const m = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${h}:${m}`;
}

// convert business-local date+time to ISO (UTC) respecting business timezone
function startsAtISOFromBusinessLocal(date: string, time: string, timeZone: string) {
  const [y, mo, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);

  const approxUTC = new Date(Date.UTC(y, mo - 1, d, hh, mm, 0));

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).formatToParts(approxUTC);

  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";

  const asIfUTC = Date.UTC(
    Number(get("year")),
    Number(get("month")) - 1,
    Number(get("day")),
    Number(get("hour")),
    Number(get("minute")),
    Number(get("second"))
  );

  const offsetMs = asIfUTC - approxUTC.getTime();
  return new Date(approxUTC.getTime() - offsetMs).toISOString();
}

function fullAddress(b: BusinessPublic) {
  return [b.street, b.postalCode, b.city, b.country].filter(Boolean).join(", ");
}

function cleanWebsite(url?: string | null) {
  const x = (url ?? "").trim();
  if (!x) return "";
  return /^https?:\/\//i.test(x) ? x : `https://${x}`;
}

export default function BookingClient({
  locale,
  businessSlug,
  business
}: {
  locale: string;
  businessSlug: string;
  business: BusinessPublic;
}) {
  const router = useRouter();

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

  function depositLabel(s: Service) {
    if (!s.depositEnabled) return null;
    const v = Number(s.depositValue || 0);
    if (!v) return null;

    return s.depositType === "AMOUNT"
      ? tr("booking.deposit.amount", { amount: formatMoney(v, s.currency) })
      : tr("booking.deposit.percent", { n: v });
  }

  const [rule, setRule] = useState<AvailabilityRule>(defaultAvailability);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingRule, setLoadingRule] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);

  const [customer, setCustomer] = useState<CustomerMe["customer"]>(null);
  const [loadingCustomer, setLoadingCustomer] = useState(true);

  const [dayBookings, setDayBookings] = useState<DbDayBooking[]>([]);

  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!lightboxUrl) return;
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && setLightboxUrl(null);
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxUrl]);

  // customer/me
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingCustomer(true);
      try {
        const res = await fetch("/api/customer/me", { cache: "no-store" });
        const data = (await res.json().catch(() => ({}))) as CustomerMe;
        if (!cancelled) setCustomer(data?.customer ?? null);
      } catch {
        if (!cancelled) setCustomer(null);
      } finally {
        if (!cancelled) setLoadingCustomer(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // availability rule
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingRule(true);
      try {
        const res = await fetch(
             `/api/public/availability?businessSlug=${encodeURIComponent(businessSlug)}`,
            { cache: "no-store" }
                );
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;

        if (!res.ok) {
           console.error("Availability fetch failed", data);
           setRule(defaultAvailability);
           return;
             }

        if (data?.rule) {
          setRule({ ...defaultAvailability, ...data.rule });
            } else {
             setRule(defaultAvailability);
               }
              } catch {
        if (!cancelled) setRule(defaultAvailability);
            } finally {
        if (!cancelled) setLoadingRule(false);
               }
             })();
             return () => {
              cancelled = true;
                 };
          }, [businessSlug]);

  // services (includes images)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingServices(true);
      try {
        const res = await fetch(`/api/services?businessSlug=${encodeURIComponent(businessSlug)}`, {
          cache: "no-store"
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;

        const mapped: Service[] = Array.isArray(data.services)
          ? (data.services as DbService[]).map((s) => ({
              id: String(s.id),
              name: String(s.name ?? ""),
              durationMin: Number(s.durationMin ?? 0),
              price: Number(s.price ?? 0),
              currency: toCurrency(s.currency),
              depositEnabled: Boolean(s.depositEnabled),
              depositType: s.depositType === "AMOUNT" ? "AMOUNT" : "PERCENT",
              depositValue:
                s.depositEnabled && Number.isFinite(Number(s.depositValue))
                  ? Number(s.depositValue)
                  : undefined,
              images: Array.isArray(s.images) ? s.images.map(String).filter(Boolean) : []
            }))
          : [];

        setServices(mapped);
      } catch {
        if (!cancelled) setServices([]);
      } finally {
        if (!cancelled) setLoadingServices(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [businessSlug]);

  // booked slots for date
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setDayBookings([]);
      if (!date) return;

      try {
        const qs = new URLSearchParams({ businessSlug, date });
        const res = await fetch(`/api/bookings/availability?${qs.toString()}`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;

        if (res.ok && Array.isArray(data.bookings)) {
          setDayBookings(
            data.bookings
              .map((b: any) => ({
                startsAt: String(b.startsAt ?? ""),
                durationMin: Number(b.durationMin ?? 0)
              }))
              .filter((b: DbDayBooking) => b.startsAt && b.durationMin > 0)
          );
        }
      } catch {}
    })();

    return () => {
      cancelled = true;
    };
  }, [businessSlug, date]);

  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId) ?? null,
    [services, serviceId]
  );

  const allSlots = useMemo(() => {
    if (!date) return [];
    return generateTimeSlots(date, rule);
  }, [date, rule]);

  const bookedSet = useMemo(() => {
    const s = new Set<string>();
    const tz = rule.timezone || "UTC";
    for (const b of dayBookings) {
      const bTime = hhmmFromISOInTZ(b.startsAt, tz);
      slotRangeForService(bTime, rule, b.durationMin).forEach((x) => s.add(x));
    }
    return s;
  }, [dayBookings, rule]);

  const availableSlots = useMemo(() => {
    if (!date || !selectedService) return [];
    return allSlots.filter((tm) => {
      if (!canFitServiceAt(tm, rule, selectedService.durationMin)) return false;
      if (overlapsBreak(tm, rule, selectedService.durationMin)) return false;
      const needed = slotRangeForService(tm, rule, selectedService.durationMin);
      return needed.every((x) => !bookedSet.has(x));
    });
  }, [allSlots, bookedSet, date, rule, selectedService]);

  const step = !serviceId ? 1 : !date ? 2 : !time ? 3 : 4;
  const loading = loadingRule || loadingServices;

  async function confirmBooking() {
    if (submitting) return;
    setError(null);

    if (!selectedService) return setError(tr("booking.errors.selectService"));
    if (!date) return setError(tr("booking.errors.selectDate"));
    if (!time) return setError(tr("booking.errors.selectTime"));
    if (!fullName.trim()) return setError(tr("booking.errors.enterName"));
    if (!phone.trim()) return setError(tr("booking.errors.enterPhone"));

    const emailTrim = customerEmail.trim();
    if (!emailTrim) return setError(tr("booking.errors.emailRequired"));
    if (!isValidEmail(emailTrim)) return setError(tr("booking.errors.emailInvalid"));

    const tz = rule.timezone || "UTC";

    // conflict re-check
    const needed = slotRangeForService(time, rule, selectedService.durationMin);
    for (const b of dayBookings) {
      const blocked = new Set(slotRangeForService(hhmmFromISOInTZ(b.startsAt, tz), rule, b.durationMin));
      if (needed.some((x) => blocked.has(x))) {
        return setError(tr("booking.errors.justBooked"));
      }
    }

    setSubmitting(true);
    try {
      const startsAt = startsAtISOFromBusinessLocal(date, time, tz);

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessSlug,
          serviceName: selectedService.name,
          durationMin: selectedService.durationMin,
          price: selectedService.price,
          currency: selectedService.currency,
          startsAt,
          customerName: fullName.trim(),
          customerPhone: phone.trim(),
          customerEmail: emailTrim,
          notes: notes.trim() || null
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || tr("booking.errors.failed"));
        return;
      }

      const id: string | undefined = data.booking?.id;
      if (!id) return setError(tr("booking.errors.missingId"));

      router.push(`/${locale}/book/${businessSlug}/success?id=${encodeURIComponent(id)}`);
    } catch {
      setError(tr("booking.errors.network"));
    } finally {
      setSubmitting(false);
    }
  }

  const createAccountHref = `/${locale}/customer/signup?next=${encodeURIComponent(
    `/${locale}/book/${businessSlug}`
  )}`;
  const loginHref = `/${locale}/customer/login?next=${encodeURIComponent(
    `/${locale}/book/${businessSlug}`
  )}`;

  const addr = fullAddress(business);
  const mapsQuery = encodeURIComponent(addr || `${business.city ?? ""} ${business.country ?? ""}`.trim());
  const mapsEmbed = `https://www.google.com/maps?q=${mapsQuery}&output=embed`;
  const mapsOpen = `https://www.google.com/maps?q=${mapsQuery}`;

  const website = cleanWebsite(business.website);

  const gallery = Array.isArray(business.galleryImages) ? business.galleryImages.filter(Boolean) : [];
  const heroImages = useMemo(() => {
    const imgs = [...gallery];
    if (imgs.length === 0 && business.logoUrl) imgs.push(business.logoUrl);
    while (imgs.length < 3) imgs.push(imgs[0] || "/og.png");
    return imgs.slice(0, 3);
  }, [gallery, business.logoUrl]);

  const description = (business.description ?? "").trim();

  return (
  <main
    className="
      min-h-screen text-slate-900
      bg-[radial-gradient(1200px_circle_at_15%_-10%,rgba(236,72,153,0.18),transparent_55%),radial-gradient(900px_circle_at_90%_0%,rgba(99,102,241,0.16),transparent_50%),linear-gradient(to_bottom,#0b1220_0%,#0b1220_18%,#ffffff_45%,#ffffff_100%)]
    "
  >
    

    {/* Lightbox */}
    {lightboxUrl ? (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
        onClick={() => setLightboxUrl(null)}
        role="dialog"
        aria-modal="true"
      >
        <div className="relative max-h-[92vh] max-w-[94vw]" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setLightboxUrl(null)}
            className="absolute -top-12 right-0 rounded-xl bg-white/85 px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-white/60 backdrop-blur hover:bg-white"
          >
            {tr("booking.lightbox.close")}
          </button>
          <img
            src={lightboxUrl}
            alt={tr("booking.lightbox.photoAlt")}
            className="max-h-[92vh] max-w-[94vw] rounded-3xl bg-white object-contain shadow-2xl ring-1 ring-white/60"
          />
        </div>
      </div>
    ) : null}

   {/* HERO */}
<section className="relative w-screen left-1/2 -translate-x-1/2 overflow-hidden">
  {/* FULL BACKGROUND IMAGE */}
  <img
    src={heroImages[0]}
    alt=""
    aria-hidden="true"
    className="absolute inset-0 h-full w-full object-cover"
  />

  {/* OVERLAYS (readability + premium fade) */}
  <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/20" />
  <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-white" />

  {/* CONTENT */}
  <div className="relative w-full px-6 pt-16 pb-32 lg:px-20">
    <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
      {/* LEFT */}
      <div className="lg:col-span-6">
        {/* GLASS HEADER CARD */}
        <div className="inline-block rounded-[28px] bg-white/10 p-5 ring-1 ring-white/25 backdrop-blur-xl shadow-[0_30px_80px_-60px_rgba(0,0,0,0.9)]">
          <div className="flex items-start gap-4">
            {business.logoUrl ? (
              <div className="rounded-3xl bg-white/70 p-1 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.6)] ring-1 ring-white/60 backdrop-blur">
                <img
                  src={business.logoUrl}
                  alt={tr("booking.hero.logoAlt", { name: business.name })}
                  className="h-14 w-14 rounded-[22px] object-cover"
                />
              </div>
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/70 text-sm font-semibold text-slate-500 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.6)] ring-1 ring-white/60 backdrop-blur">
                {business.name?.charAt(0)?.toUpperCase() || "S"}
              </div>
            )}

            <div className="min-w-0">
              <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow sm:text-4xl capitalize">
                {business.name}
              </h1>

              <p className="mt-2 text-sm text-white/80 sm:text-base">
                {business.industry
                  ? String(business.industry).replace(/_/g, " ")
                  : tr("booking.hero.industryFallback")}
                {addr ? ` • ${addr}` : ""}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {!loadingRule ? (
                  <span className="rounded-full bg-white/75 px-3 py-1 text-sm text-slate-900 shadow-sm ring-1 ring-white/60 backdrop-blur">
                    {tr("booking.hero.timezoneLabel")}{" "}
                    <span className="font-semibold">{rule.timezone}</span>
                  </span>
                ) : null}

                {website ? (
                  <a
                    href={website}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-white/75 px-3 py-1 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-white/60 backdrop-blur hover:bg-white"
                  >
                    {tr("booking.hero.visitWebsite")}
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-7 space-y-5">
          {description ? (
            <p className="max-w-2xl whitespace-pre-wrap text-white/85 drop-shadow">
              {description}
            </p>
          ) : (
            <p className="max-w-2xl text-white/70">
              {tr("booking.hero.noDescription")}
            </p>
          )}
        </div>
      </div>

      {/* RIGHT */}
      <div className="lg:col-span-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 overflow-hidden rounded-[28px] bg-white/10 ring-1 ring-white/25 backdrop-blur-md shadow-[0_30px_80px_-50px_rgba(0,0,0,0.8)]">
            <button
              type="button"
              onClick={() => setLightboxUrl(heroImages[0])}
              className="block h-full w-full"
            >
              <img
                src={heroImages[0]}
                alt={tr("booking.hero.photoAlt", { name: business.name, n: 1 })}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          </div>

          <div className="grid gap-4">
            <button
              type="button"
              onClick={() => setLightboxUrl(heroImages[1])}
              className="overflow-hidden rounded-[28px] bg-white/20 shadow-[0_30px_80px_-50px_rgba(0,0,0,0.8)] ring-1 ring-white/30 backdrop-blur transition hover:-translate-y-0.5"
            >
              <img
                src={heroImages[1]}
                alt={tr("booking.hero.photoAlt", { name: business.name, n: 2 })}
                className="h-40 w-full object-cover sm:h-44 lg:h-[200px]"
                loading="lazy"
              />
            </button>

            <button
              type="button"
              onClick={() => setLightboxUrl(heroImages[2])}
              className="overflow-hidden rounded-[28px] bg-white/20 shadow-[0_30px_80px_-50px_rgba(0,0,0,0.8)] ring-1 ring-white/30 backdrop-blur transition hover:-translate-y-0.5"
            >
              <img
                src={heroImages[2]}
                alt={tr("booking.hero.photoAlt", { name: business.name, n: 3 })}
                className="h-40 w-full object-cover sm:h-44 lg:h-[200px]"
                loading="lazy"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

    {/* BODY */}
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-10">
        {/* Customer box */}
        {!loadingCustomer ? (
  <div className="rounded-[28px] bg-slate-900 p-6 shadow-[0_25px_70px_-30px_rgba(15,23,42,0.7)] ring-1 ring-slate-800 sm:p-7">
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="text-sm font-semibold tracking-wide text-white">
          {tr("booking.options.title")}
        </div>

        <div className="mt-2 text-sm text-slate-300">
          {customer ? (
            <>
              {tr("booking.options.signedInAs")}{" "}
              <span className="font-semibold text-white">
                {customer.email}
              </span>
            </>
          ) : (
            "Book faster by creating an account or login if you already have one."
          )}
        </div>
      </div>

      {!customer ? (
        <div className="flex flex-wrap gap-3 sm:justify-end">
          {/* PRIMARY BUTTON */}
          <a
            href={createAccountHref}
            className="
              rounded-2xl bg-white px-5 py-2.5 text-sm font-semibold
              text-slate-900 shadow-md
              hover:bg-slate-100 active:translate-y-[1px]
            "
          >
            {tr("booking.options.createAccount")}
          </a>

          {/* SECONDARY BUTTON */}
          <a
            href={loginHref}
            className="
              rounded-2xl border border-white/40 px-5 py-2.5
              text-sm font-semibold text-white
              hover:bg-white/10 active:translate-y-[1px]
            "
          >
            {tr("booking.options.login")}
          </a>
        </div>
      ) : null}
    </div>
  </div>
) : null}

        {error ? (
          <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
            {error}
          </div>
        ) : null}

        {/* PREMIUM BOOKING PANEL */}
        <div className="mt-8 rounded-[32px] bg-white/80 shadow-[0_30px_90px_-60px_rgba(15,23,42,0.35)] ring-1 ring-slate-100 backdrop-blur">
          {/* Sticky stepper header */}
          <div className="sticky top-0 z-20 rounded-t-[32px] bg-white/80 backdrop-blur-xl ring-1 ring-white/60">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-7">
              <div className="text-sm font-semibold tracking-wide text-slate-900">
                {tr("booking.sections.service.title")} • {tr("booking.sections.date.title")} •{" "}
                {tr("booking.sections.time.title")} • {tr("booking.sections.details.title")}
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                  {loading ? tr("common.loadingDots") : tr("booking.hero.stepPill", { step, total: 4 })}
                </span>
                {serviceId ? (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {tr("booking.sections.service.selected")}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
          </div>

          <div className="grid gap-8 p-5 sm:p-7">
            {/* 1) Service */}
            <section className="rounded-[28px] bg-white/70 p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.18)] ring-1 ring-white/60 backdrop-blur sm:p-6">
              <h2 className="text-lg font-semibold">{tr("booking.sections.service.title")}</h2>

              {loadingServices ? (
                <p className="mt-3 text-sm text-slate-600">{tr("booking.sections.service.loading")}</p>
              ) : services.length === 0 ? (
                <p className="mt-3 text-sm text-slate-600">{tr("booking.sections.service.empty")}</p>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {services.map((s) => {
                    const active = s.id === serviceId;
                    const d = depositLabel(s);
                    const imgs = Array.isArray(s.images) ? s.images.filter(Boolean) : [];
                    const thumb = imgs[0];

                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setServiceId(s.id);
                          setDate("");
                          setTime("");
                          setError(null);
                        }}
                        className={[
                          "group overflow-hidden rounded-[24px] bg-white/80 text-left ring-1 backdrop-blur transition-all duration-200",
                          active
                            ? "ring-slate-900 shadow-[0_22px_60px_-40px_rgba(15,23,42,0.35)]"
                            : "ring-slate-200 hover:-translate-y-0.5 hover:shadow-[0_22px_60px_-40px_rgba(15,23,42,0.25)]"
                        ].join(" ")}
                      >
                        {thumb ? (
                          <div className="relative h-36 w-full bg-slate-100">
                            <img
                              src={thumb}
                              alt={tr("booking.sections.service.servicePhotoAlt", { name: s.name })}
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-black/0" />
                            <div className="absolute right-2 top-2 rounded-full bg-white/85 px-2 py-1 text-xs font-semibold shadow-sm ring-1 ring-white/60 backdrop-blur">
                              {tr("booking.sections.service.photosCount", { n: imgs.length })}
                            </div>
                          </div>
                        ) : null}

                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-semibold">{s.name}</div>
                              <div className="mt-1 text-sm text-slate-600">
                                {tr("booking.common.minutes", { n: s.durationMin })} •{" "}
                                {formatMoney(s.price, s.currency)}
                              </div>

                              {d ? (
                                <div className="mt-3 inline-flex w-fit rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                                  {d}
                                </div>
                              ) : null}
                            </div>

                            {active ? (
                              <span className="shrink-0 rounded-full bg-gradient-to-r from-fuchsia-500 to-indigo-500 px-2 py-1 text-xs font-semibold text-white shadow-sm">
                                {tr("booking.sections.service.selected")}
                              </span>
                            ) : null}
                          </div>

                          {imgs.length > 0 ? (
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              {imgs.slice(0, 4).map((u) => (
                                <button
                                  key={u}
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setLightboxUrl(u);
                                  }}
                                  className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow"
                                  title={tr("booking.lightbox.viewPhoto")}
                                >
                                  <img src={u} alt="" className="h-10 w-10 object-cover" loading="lazy" />
                                </button>
                              ))}
                              {imgs.length > 4 ? (
                                <span className="text-xs font-semibold text-slate-600">
                                  +{imgs.length - 4}
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            <div className="mt-3 text-xs text-slate-500">{tr("booking.sections.service.noPhotos")}</div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* 2) Date */}
            <section className="rounded-[28px] bg-white/70 p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.18)] ring-1 ring-white/60 backdrop-blur sm:p-6">
              <h2 className="text-lg font-semibold">{tr("booking.sections.date.title")}</h2>
              {!serviceId ? (
                <p className="mt-3 text-sm text-slate-600">{tr("booking.sections.date.needService")}</p>
              ) : (
                <div className="mt-4">
                  <label className="grid gap-1 text-sm">
                    {tr("booking.sections.date.label")}
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => {
                        setDate(e.target.value);
                        setTime("");
                        setError(null);
                      }}
                      className="w-full max-w-xs rounded-2xl bg-white/90 px-3 py-2 shadow-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      required
                    />
                  </label>
                </div>
              )}
            </section>

            {/* 3) Time */}
            <section className="rounded-[28px] bg-white/70 p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.18)] ring-1 ring-white/60 backdrop-blur sm:p-6">
              <h2 className="text-lg font-semibold">{tr("booking.sections.time.title")}</h2>

              {!serviceId || !date ? (
                <p className="mt-3 text-sm text-slate-600">{tr("booking.sections.time.needServiceDate")}</p>
              ) : availableSlots.length === 0 ? (
                <p className="mt-3 text-sm text-slate-600">{tr("booking.sections.time.empty")}</p>
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {availableSlots.map((tm) => {
                    const active = tm === time;
                    return (
                      <button
                        key={tm}
                        type="button"
                        onClick={() => {
                          setTime(tm);
                          setError(null);
                        }}
                        className={[
                          "rounded-2xl px-4 py-3 text-center text-sm font-semibold transition shadow-sm ring-1",
                          active
                            ? "bg-slate-900 text-white ring-slate-900"
                            : "bg-white/90 text-slate-900 ring-slate-200 hover:-translate-y-0.5 hover:shadow-md"
                        ].join(" ")}
                      >
                        {tm}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* 4) Details */}
            <section className="rounded-[28px] bg-white/70 p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.18)] ring-1 ring-white/60 backdrop-blur sm:p-6">
              <h2 className="text-lg font-semibold">{tr("booking.sections.details.title")}</h2>

              {!selectedService || !date || !time ? (
                <p className="mt-3 text-sm text-slate-600">{tr("booking.sections.details.needAll")}</p>
              ) : (
                <div className="mt-4 grid gap-4">
                  <div className="rounded-[22px] bg-white/85 p-4 text-sm shadow-sm ring-1 ring-slate-100">
                    <div className="font-semibold">{selectedService.name}</div>
                    <div className="mt-1 text-slate-600">
                      {date} • {time} • {tr("booking.common.minutes", { n: selectedService.durationMin })} •{" "}
                      {formatMoney(selectedService.price, selectedService.currency)}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-1 text-sm">
                      {tr("booking.form.fullName")}
                      <input
                        className="rounded-2xl bg-white/90 px-3 py-2 shadow-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={tr("booking.form.fullNamePlaceholder")}
                      />
                    </label>

                    <label className="grid gap-1 text-sm">
                      {tr("booking.form.phone")}
                      <input
                        className="rounded-2xl bg-white/90 px-3 py-2 shadow-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder={tr("booking.form.phonePlaceholder")}
                      />
                    </label>
                  </div>

                  <label className="grid gap-1 text-sm">
                    {tr("booking.form.emailLabel")}
                    <input
                      type="email"
                      required
                      className="rounded-2xl bg-white/90 px-3 py-2 shadow-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder={tr("booking.form.emailPlaceholder")}
                    />
                  </label>

                  <label className="grid gap-1 text-sm">
                    {tr("booking.form.notes")}
                    <textarea
                      className="min-h-[110px] rounded-2xl bg-white/90 px-3 py-2 shadow-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={tr("booking.form.notesPlaceholder")}
                    />
                  </label>

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={confirmBooking}
                    className="
                      rounded-2xl px-5 py-3 text-sm font-semibold text-white
                      bg-gradient-to-r from-fuchsia-500 to-indigo-500
                      shadow-[0_18px_40px_-18px_rgba(99,102,241,0.7)]
                      hover:brightness-110 active:translate-y-[1px]
                      disabled:opacity-60
                    "
                  >
                    {submitting ? tr("booking.form.confirming") : tr("booking.form.confirm")}
                  </button>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* MAP + REVIEWS */}
<div className="mt-8 grid gap-6 lg:grid-cols-2">
  
  {/* MAP */}
  <div className="rounded-[32px] bg-white/80 p-5 shadow-[0_30px_90px_-60px_rgba(15,23,42,0.35)] ring-1 ring-slate-100 backdrop-blur sm:p-7">
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold">
          {tr("booking.location.title")}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {addr || tr("booking.location.noAddress")}
        </p>
      </div>

      {addr ? (
        <a
          href={mapsOpen}
          target="_blank"
          rel="noreferrer"
          className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
        >
          {tr("booking.location.openMaps")}
        </a>
      ) : null}
    </div>

    {addr ? (
      <div className="mt-4 overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-slate-100">
        <iframe
          title={tr("booking.location.mapTitle", { name: business.name })}
          src={mapsEmbed}
          className="h-80 w-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    ) : (
      <div className="mt-4 rounded-[22px] bg-slate-50 p-4 text-sm text-slate-600 ring-1 ring-slate-100">
        {tr("booking.location.ownerNoAddress")}
      </div>
    )}
  </div>

  {/* REVIEWS */}
  <div className="rounded-[32px] bg-white/80 p-6 shadow-[0_30px_90px_-60px_rgba(15,23,42,0.35)] ring-1 ring-slate-100 backdrop-blur">
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold">Customer Reviews</h2>
      <span className="text-sm text-slate-500">⭐ 4.9 (124)</span>
    </div>

    <div className="mt-6 space-y-5">
      {/* SAMPLE REVIEW CARD */}
      <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-sm">Sarah M.</div>
          <div className="text-xs text-slate-500">2 days ago</div>
        </div>
        <div className="mt-2 text-sm text-slate-700">
          Absolutely amazing service. Super professional and welcoming.
        </div>
      </div>

      <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-sm">James K.</div>
          <div className="text-xs text-slate-500">1 week ago</div>
        </div>
        <div className="mt-2 text-sm text-slate-700">
          Clean environment, great attention to detail. Highly recommend.
        </div>
      </div>

      <button className="mt-2 w-full rounded-2xl border border-slate-200 py-2 text-sm font-semibold hover:bg-slate-50">
        View all reviews
      </button>
    </div>
  </div>

</div>
      </div>
    </section>
  </main>
);
}