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

function depositLabel(s: Service) {
  if (!s.depositEnabled) return null;
  const v = Number(s.depositValue || 0);
  if (!v) return null;
  return s.depositType === "AMOUNT"
    ? `Deposit required: ${formatMoney(v, s.currency)}`
    : `Deposit required: ${v}%`;
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
          `/api/availability?businessSlug=${encodeURIComponent(businessSlug)}`,
          { cache: "no-store" }
        );
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        setRule(res.ok && data?.rule ? { ...defaultAvailability, ...data.rule } : defaultAvailability);
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

  // services (✅ includes images)
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

    if (!selectedService) return setError("Select a service.");
    if (!date) return setError("Select a date.");
    if (!time) return setError("Select a time.");
    if (!fullName.trim()) return setError("Enter your full name.");
    if (!phone.trim()) return setError("Enter your phone.");

    const emailTrim = customerEmail.trim();
    if (!emailTrim) return setError("Email is required.");
    if (!isValidEmail(emailTrim)) return setError("Enter a valid email.");

    const tz = rule.timezone || "UTC";

    // conflict re-check
    const needed = slotRangeForService(time, rule, selectedService.durationMin);
    for (const b of dayBookings) {
      const blocked = new Set(slotRangeForService(hhmmFromISOInTZ(b.startsAt, tz), rule, b.durationMin));
      if (needed.some((x) => blocked.has(x))) {
        return setError("That time was just booked. Pick another slot.");
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
        setError(data.error || "Booking failed");
        return;
      }

      const id: string | undefined = data.booking?.id;
      if (!id) return setError("Booking created but missing id.");

      router.push(`/${locale}/book/${businessSlug}/success?id=${encodeURIComponent(id)}`);
    } catch {
      setError("Network error. Try again.");
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
    <main className="min-h-screen bg-white text-slate-900">
      {/* Top right language switch */}
      <div className="fixed right-4 top-4 z-40 flex gap-2">
        <a className="rounded-full bg-white/90 px-3 py-1 text-sm font-semibold shadow-sm ring-1 ring-slate-200 hover:bg-white" href={`/en/book/${businessSlug}`}>
          EN
        </a>
        <a className="rounded-full bg-white/90 px-3 py-1 text-sm font-semibold shadow-sm ring-1 ring-slate-200 hover:bg-white" href={`/fr/book/${businessSlug}`}>
          FR
        </a>
      </div>

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
              className="absolute -top-12 right-0 rounded-xl bg-white/90 px-3 py-2 text-sm font-semibold"
            >
              Close
            </button>
            <img
              src={lightboxUrl}
              alt="Photo"
              className="max-h-[92vh] max-w-[94vw] rounded-2xl bg-white object-contain"
            />
          </div>
        </div>
      ) : null}

      {/* HERO */}
      <section className="bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-6">
              <div className="flex items-start gap-4">
                {business.logoUrl ? (
                  <img
                    src={business.logoUrl}
                    alt={`${business.name} logo`}
                    className="h-14 w-14 rounded-2xl object-cover bg-white shadow-sm"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-sm font-semibold text-slate-400 shadow-sm">
                    {business.name?.charAt(0)?.toUpperCase() || "S"}
                  </div>
                )}

                <div className="min-w-0">
                  <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{business.name}</h1>
                  <p className="mt-2 text-sm text-slate-600 sm:text-base">
                    {business.industry ? String(business.industry).replace(/_/g, " ") : "Service"}
                    {addr ? ` • ${addr}` : ""}
                  </p>
                </div>
              </div>

              <div className="mt-7 space-y-5">
                {description ? (
                  <p className="max-w-2xl whitespace-pre-wrap text-slate-700">{description}</p>
                ) : (
                  <p className="max-w-2xl text-slate-500">No description added yet.</p>
                )}

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
                    {loading ? "Loading..." : `Step ${step} of 4`}
                  </span>

                  {!loadingRule ? (
                    <span className="rounded-full bg-white px-3 py-1 text-sm text-slate-600 shadow-sm ring-1 ring-slate-200">
                      Timezone: <span className="font-semibold">{rule.timezone}</span>
                    </span>
                  ) : null}

                  {website ? (
                    <a
                      href={website}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-100"
                    >
                      Visit website
                    </a>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="grid grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setLightboxUrl(heroImages[0])}
                  className="col-span-2 overflow-hidden rounded-3xl bg-white shadow-md"
                >
                  <img
                    src={heroImages[0]}
                    alt={`${business.name} main`}
                    className="h-80 w-full object-cover sm:h-96 lg:h-[420px]"
                    loading="lazy"
                  />
                </button>

                <div className="grid gap-4">
                  <button
                    type="button"
                    onClick={() => setLightboxUrl(heroImages[1])}
                    className="overflow-hidden rounded-3xl bg-white shadow-md"
                  >
                    <img
                      src={heroImages[1]}
                      alt={`${business.name} photo 2`}
                      className="h-40 w-full object-cover sm:h-44 lg:h-[200px]"
                      loading="lazy"
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => setLightboxUrl(heroImages[2])}
                    className="overflow-hidden rounded-3xl bg-white shadow-md"
                  >
                    <img
                      src={heroImages[2]}
                      alt={`${business.name} photo 3`}
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
          {!loadingCustomer ? (
            <div className="rounded-3xl bg-slate-50 p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-800">Booking options</div>
                  <div className="mt-1 text-sm text-slate-600">
                    {customer ? (
                      <>
                        Signed in as <span className="font-semibold">{customer.email}</span>
                      </>
                    ) : (
                      "You’re booking as guest."
                    )}
                  </div>
                </div>

                {!customer ? (
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <a className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800" href={createAccountHref}>
                      Create account
                    </a>
                    <a className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50" href={loginHref}>
                      Log in
                    </a>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          ) : null}

          <div className="mt-8 grid gap-8">
            {/* 1) Service */}
            <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
              <h2 className="text-lg font-semibold">Choose a service</h2>

              {loadingServices ? (
                <p className="mt-3 text-sm text-slate-600">Loading services...</p>
              ) : services.length === 0 ? (
                <p className="mt-3 text-sm text-slate-600">No services available yet.</p>
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
                          "overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 transition hover:bg-slate-50",
                          active ? "ring-slate-900" : "ring-slate-200"
                        ].join(" ")}
                      >
                        {/* ✅ service thumbnail */}
                        {thumb ? (
                          <div className="relative h-36 w-full bg-slate-100">
                            <img
                              src={thumb}
                              alt={`${s.name} photo`}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                            <div className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold">
                              {imgs.length} photo{imgs.length === 1 ? "" : "s"}
                            </div>
                          </div>
                        ) : null}

                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-semibold">{s.name}</div>
                              <div className="mt-1 text-sm text-slate-600">
                                {s.durationMin} min • {formatMoney(s.price, s.currency)}
                              </div>

                              {d ? (
                                <div className="mt-3 inline-flex w-fit rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                                  {d}
                                </div>
                              ) : null}
                            </div>

                            {active ? (
                              <span className="shrink-0 rounded-full bg-slate-900 px-2 py-1 text-xs font-semibold text-white">
                                Selected
                              </span>
                            ) : null}
                          </div>

                          {/* ✅ extra mini previews + lightbox */}
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
                                  className="overflow-hidden rounded-lg border border-slate-200"
                                  title="View photo"
                                >
                                  <img src={u} alt="" className="h-10 w-10 object-cover" loading="lazy" />
                                </button>
                              ))}
                              {imgs.length > 4 ? (
                                <span className="text-xs font-semibold text-slate-600">+{imgs.length - 4}</span>
                              ) : null}
                            </div>
                          ) : (
                            <div className="mt-3 text-xs text-slate-500">No photos yet.</div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* 2) Date */}
            <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
              <h2 className="text-lg font-semibold">Pick a date</h2>
              {!serviceId ? (
                <p className="mt-3 text-sm text-slate-600">Select a service first.</p>
              ) : (
                <div className="mt-4">
                  <label className="grid gap-1 text-sm">
                    Date
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => {
                        setDate(e.target.value);
                        setTime("");
                        setError(null);
                      }}
                      className="w-full max-w-xs rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200"
                      required
                    />
                  </label>
                </div>
              )}
            </section>

            {/* 3) Time */}
            <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
              <h2 className="text-lg font-semibold">Pick a time</h2>

              {!serviceId || !date ? (
                <p className="mt-3 text-sm text-slate-600">Select a service and date first.</p>
              ) : availableSlots.length === 0 ? (
                <p className="mt-3 text-sm text-slate-600">No available slots on this date.</p>
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
                          "rounded-xl px-4 py-3 text-center text-sm font-semibold shadow-sm ring-1 hover:bg-slate-50",
                          active ? "ring-slate-900" : "ring-slate-200"
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
            <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
              <h2 className="text-lg font-semibold">Your details</h2>

              {!selectedService || !date || !time ? (
                <p className="mt-3 text-sm text-slate-600">Finish service + date + time first.</p>
              ) : (
                <div className="mt-4 grid gap-4">
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm">
                    <div className="font-semibold">{selectedService.name}</div>
                    <div className="mt-1 text-slate-600">
                      {date} • {time} • {selectedService.durationMin} min •{" "}
                      {formatMoney(selectedService.price, selectedService.currency)}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-1 text-sm">
                      Full name
                      <input
                        className="rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your name"
                      />
                    </label>

                    <label className="grid gap-1 text-sm">
                      Phone
                      <input
                        className="rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+372..."
                      />
                    </label>
                  </div>

                  <label className="grid gap-1 text-sm">
                    Email*
                    <input
                      type="email"
                      required
                      className="rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="your@email.com"
                    />
                  </label>

                  <label className="grid gap-1 text-sm">
                    Notes (optional)
                    <textarea
                      className="min-h-[110px] rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any details..."
                    />
                  </label>

                  <button
                    type="button"
                    disabled={submitting}
                    className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                    onClick={confirmBooking}
                  >
                    {submitting ? "Confirming..." : "Confirm booking"}
                  </button>
                </div>
              )}
            </section>

            {/* MAP */}
            <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Location</h2>
                  <p className="mt-1 text-sm text-slate-600">{addr || "Address not provided."}</p>
                </div>

                {addr ? (
                  <a
                    href={mapsOpen}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl bg-white px-4 py-2 text-sm font-semibold shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
                  >
                    Open in Maps
                  </a>
                ) : null}
              </div>

              {addr ? (
                <div className="mt-4 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100">
                  <iframe
                    title={`${business.name} map`}
                    src={mapsEmbed}
                    className="h-80 w-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              ) : (
                <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  The business owner hasn’t added an address yet.
                </div>
              )}
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

