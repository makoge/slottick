"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AvailabilityRule,
  defaultAvailability,
  generateTimeSlots,
  canFitServiceAt,
  overlapsBreak,
  slotRangeForService,
} from "@/lib/availability";
import { Currency, Service, formatMoney } from "@/lib/services";
import { useMessages } from "@/lib/use-messages";
import { t } from "@/lib/i18n";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

type DbDayBooking = {
  startsAt: string;
  durationMin: number;
  staffId?: string | null;
};
type DepositType = "PERCENT" | "AMOUNT";

type StaffMember = {
  id: string;
  name: string;
  title?: string | null;
  avatarUrl?: string | null;
};

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
  staff?: StaffMember[];
};

type CustomerMe = {
  customer: null | {
    id: string;
    email: string;
    name?: string | null;
    phone?: string | null;
  };
};

function stars(n: number) {
  return (
    "★".repeat(Math.max(0, Math.min(5, n))) + "☆".repeat(Math.max(0, 5 - n))
  );
}

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  const hours = Math.floor(ms / 3600000);
  const days = Math.floor(ms / 86400000);

  if (mins < 60) return `${Math.max(1, mins)} min ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

type BusinessPublic = {
  name: string;
  slug: string;
  industry?: string | null;
  heroTag?: string | null;
  description?: string | null;

  city?: string | null;
  country?: string | null;
  street?: string | null;
  postalCode?: string | null;

  website?: string | null;
  logoUrl?: string | null;

  galleryImages: string[];
  reviews: {
    rating: number;
    comment: string;
    createdAt: string;
    customerName: string;
  }[];
  ratingAvg?: number | null;
  ratingCount?: number | null;
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
    hour12: false,
  }).formatToParts(dt);
  const h = parts.find((p) => p.type === "hour")?.value ?? "00";
  const m = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${h}:${m}`;
}

function startsAtISOFromBusinessLocal(
  date: string,
  time: string,
  timeZone: string,
) {
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
    hour12: false,
  }).formatToParts(approxUTC);

  const get = (tp: string) => parts.find((p) => p.type === tp)?.value ?? "00";

  const asIfUTC = Date.UTC(
    Number(get("year")),
    Number(get("month")) - 1,
    Number(get("day")),
    Number(get("hour")),
    Number(get("minute")),
    Number(get("second")),
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
  business,
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
  const [allStaff, setAllStaff] = useState<StaffMember[]>([]);
  const [services, setServices] = useState<
    (Service & { staff?: StaffMember[] })[]
  >([]);
  const [loadingRule, setLoadingRule] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);

  const [customer, setCustomer] = useState<CustomerMe["customer"]>(null);
  const [loadingCustomer, setLoadingCustomer] = useState(true);

  const [dayBookings, setDayBookings] = useState<DbDayBooking[]>([]);

  // Selections
  const [serviceId, setServiceId] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState<string>("ANY");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  // Customer Form
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!lightboxUrl) return;
    const onKeyDown = (e: KeyboardEvent) =>
      e.key === "Escape" && setLightboxUrl(null);
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxUrl]);

  // 1. Fetch current signed-in customer if any
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingCustomer(true);
      try {
        const res = await fetch("/api/customer/me", { cache: "no-store" });
        const data = (await res.json().catch(() => ({}))) as CustomerMe;
        if (!cancelled && data?.customer) {
          setCustomer(data.customer);
          setFullName(data.customer.name || "");
          setCustomerEmail(data.customer.email || "");
          setPhone(data.customer.phone || "");
        }
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

  // 2. Fetch Availability rule & staff roster (supports staff override)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingRule(true);
      try {
        const staffParam =
          selectedStaffId !== "ANY"
            ? `&staffId=${encodeURIComponent(selectedStaffId)}`
            : "";
        const res = await fetch(
          `/api/availability-rule?businessSlug=${encodeURIComponent(businessSlug)}${staffParam}`,
          { cache: "no-store" },
        );
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;

        if (data?.rule) {
          setRule({ ...defaultAvailability, ...data.rule });
        } else {
          setRule(defaultAvailability);
        }

        if (Array.isArray(data?.staff)) {
          setAllStaff(data.staff);
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
  }, [businessSlug, selectedStaffId]);

  // 3. Fetch services with linked staff members
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingServices(true);
      try {
        const res = await fetch(
          `/api/services?businessSlug=${encodeURIComponent(businessSlug)}`,
          {
            cache: "no-store",
          },
        );
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;

        const mapped = Array.isArray(data.services)
          ? (data.services as DbService[]).map((s) => ({
              id: String(s.id),
              name: String(s.name ?? ""),
              durationMin: Number(s.durationMin ?? 0),
              price: Number(s.price ?? 0),
              currency: toCurrency(s.currency),
              depositEnabled: Boolean(s.depositEnabled),
              depositType: (s.depositType === "AMOUNT"
                ? "AMOUNT"
                : "PERCENT") as DepositType,
              depositValue:
                s.depositEnabled && Number.isFinite(Number(s.depositValue))
                  ? Number(s.depositValue)
                  : undefined,
              images: Array.isArray(s.images)
                ? s.images.map(String).filter(Boolean)
                : [],
              staff: Array.isArray(s.staff) ? s.staff : [],
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

  // 4. Fetch booked appointments for date (filtered by selected staff member if specified)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setDayBookings([]);
      if (!date) return;

      try {
        const qs = new URLSearchParams({
          businessSlug,
          date,
          ...(selectedStaffId !== "ANY" ? { staffId: selectedStaffId } : {}),
        });
        const res = await fetch(`/api/bookings/availability?${qs.toString()}`, {
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;

        if (res.ok && Array.isArray(data.bookings)) {
          setDayBookings(
            data.bookings
              .map((b: any) => ({
                startsAt: String(b.startsAt ?? ""),
                durationMin: Number(b.durationMin ?? 0),
                staffId: b.staffId ?? null,
              }))
              .filter((b: DbDayBooking) => b.startsAt && b.durationMin > 0),
          );
        }
      } catch {}
    })();

    return () => {
      cancelled = true;
    };
  }, [businessSlug, date, selectedStaffId]);

  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId) ?? null,
    [services, serviceId],
  );

  // Specialists qualified for selected service
  const qualifiedStaff = useMemo(() => {
    if (!selectedService) return allStaff;
    if (selectedService.staff && selectedService.staff.length > 0) {
      return selectedService.staff;
    }
    return allStaff;
  }, [selectedService, allStaff]);

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
    if (!isValidEmail(emailTrim))
      return setError(tr("booking.errors.emailInvalid"));

    const tz = rule.timezone || "UTC";

    // Double-check conflicting slots
    const needed = slotRangeForService(time, rule, selectedService.durationMin);
    for (const b of dayBookings) {
      const blocked = new Set(
        slotRangeForService(
          hhmmFromISOInTZ(b.startsAt, tz),
          rule,
          b.durationMin,
        ),
      );
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
          serviceId: selectedService.id,
          serviceName: selectedService.name,
          durationMin: selectedService.durationMin,
          price: selectedService.price,
          currency: selectedService.currency,
          staffId: selectedStaffId === "ANY" ? null : selectedStaffId,
          startsAt,
          customerName: fullName.trim(),
          customerPhone: phone.trim(),
          customerEmail: emailTrim,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || tr("booking.errors.failed"));
        return;
      }

      const id: string | undefined = data.booking?.id;
      if (!id) return setError(tr("booking.errors.missingId"));

      router.push(
        `/${locale}/book/${businessSlug}/success?id=${encodeURIComponent(id)}&status=${encodeURIComponent(
          data.booking.status,
        )}`,
      );
    } catch {
      setError(tr("booking.errors.network"));
    } finally {
      setSubmitting(false);
    }
  }

  const createAccountHref = `/${locale}/customer/signup?next=${encodeURIComponent(`/${locale}/customer`)}`;
  const loginHref = `/${locale}/customer/login?next=${encodeURIComponent(`/${locale}/customer`)}`;

  const addr = fullAddress(business);
  const mapsQuery = encodeURIComponent(
    addr || `${business.city ?? ""} ${business.country ?? ""}`.trim(),
  );
  const mapsEmbed = `https://www.google.com/maps?q=${mapsQuery}&output=embed`;
  const mapsOpen = `https://www.google.com/maps?q=${mapsQuery}`;

  const website = cleanWebsite(business.website);

  const gallery = Array.isArray(business.galleryImages)
    ? business.galleryImages.filter(Boolean)
    : [];
  const heroImages = useMemo(() => {
    const imgs = [...gallery];
    if (imgs.length === 0 && business.logoUrl) imgs.push(business.logoUrl);
    while (imgs.length < 3) imgs.push(imgs[0] || "/og.png");
    return imgs.slice(0, 3);
  }, [gallery, business.logoUrl]);

  const description = (business.description ?? "").trim();
  const selectedStaffObj = qualifiedStaff.find((s) => s.id === selectedStaffId);

  return (
    <main className="min-h-screen bg-[#FBF9F5] text-[#241F1A] font-sans selection:bg-[#EAE0D0] selection:text-[#1F1914]">
      {/* Lightbox */}
      {lightboxUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6 backdrop-blur-md"
          onClick={() => setLightboxUrl(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative max-h-[92vh] max-w-[94vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxUrl(null)}
              className="absolute -top-12 right-0 font-mono text-xs uppercase tracking-widest text-[#FBF9F5] hover:underline"
            >
              [ {tr("booking.lightbox.close")} ]
            </button>
            <img
              src={lightboxUrl}
              alt={tr("booking.lightbox.photoAlt")}
              className="max-h-[92vh] max-w-[94vw] rounded-sm border border-[#4A4036] object-contain shadow-2xl"
            />
          </div>
        </div>
      ) : null}

      {/* TOP ATELIER STAMP BAR */}
      <div className="border-b border-[#E7DFD3] bg-[#F4EFE6] px-4 py-2 text-center font-mono text-[11px] uppercase tracking-widest text-[#6E6255]">
        <span>
          ✦ ESTABLISHED APPOINTMENT REGISTER ✦{" "}
          {business.city ? `${business.city} • ` : ""} {business.country ?? ""}
        </span>
      </div>

      {/* VINTAGE HERO SECTION */}
      <section className="relative border-b border-[#E2D8C9] bg-[#1E1915] text-[#FBF9F5]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            {/* Left: Vintage Typographic Identity */}
            <div className="space-y-6 lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#4F4439] bg-[#2A231E]/80 px-3.5 py-1 text-xs font-mono uppercase tracking-wider text-[#D9CDBB]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#C29B38]" />
                {business.industry
                  ? String(business.industry).replace(/_/g, " ")
                  : tr("booking.hero.industryFallback")}
              </div>

              <div>
                <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-[#FAF6F0] leading-[1.08]">
                  {business.name}
                </h1>
                {business.heroTag && (
                  <p className="mt-2 font-serif italic text-lg sm:text-xl text-[#C9BAA7]">
                    "{business.heroTag}"
                  </p>
                )}
              </div>

              {description ? (
                <p className="max-w-xl text-sm leading-relaxed text-[#BFB2A2] sm:text-base font-light">
                  {description}
                </p>
              ) : null}

              {/* Atelier Badges */}
              <div className="flex flex-wrap items-center gap-3 pt-2 font-mono text-xs text-[#E1D7C8]">
                {addr && (
                  <div className="flex items-center gap-1.5 rounded-md border border-[#3E342B] bg-[#29221C] px-3 py-1.5">
                    <span>📍</span>
                    <span>{addr}</span>
                  </div>
                )}
                {!loadingRule && rule.timezone && (
                  <div className="rounded-md border border-[#3E342B] bg-[#29221C] px-3 py-1.5">
                    {tr("booking.hero.timezoneLabel")}{" "}
                    <strong className="text-[#C29B38]">{rule.timezone}</strong>
                  </div>
                )}
                {website && (
                  <a
                    href={website}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md border border-[#C29B38]/60 bg-[#C29B38]/10 px-3 py-1.5 text-[#E7C77E] hover:bg-[#C29B38]/20 transition"
                  >
                    ↗ {tr("booking.hero.visitWebsite")}
                  </a>
                )}
              </div>
            </div>

            {/* Right: Vintage Gallery Trio with Fine Inset Borders */}
            <div className="lg:col-span-5">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 overflow-hidden rounded-sm border-2 border-[#382E25] bg-[#241D17] shadow-xl">
                  <button
                    type="button"
                    onClick={() => setLightboxUrl(heroImages[0])}
                    className="block aspect-[4/5] w-full overflow-hidden group"
                  >
                    <img
                      src={heroImages[0]}
                      alt={business.name}
                      className="h-full w-full object-cover grayscale-[20%] sepia-[15%] transition duration-500 group-hover:scale-105 group-hover:grayscale-0"
                    />
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => setLightboxUrl(heroImages[1])}
                    className="aspect-square w-full overflow-hidden rounded-sm border-2 border-[#382E25] bg-[#241D17] group"
                  >
                    <img
                      src={heroImages[1]}
                      alt="Gallery"
                      className="h-full w-full object-cover sepia-[15%] transition duration-500 group-hover:scale-105"
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => setLightboxUrl(heroImages[2])}
                    className="aspect-square w-full overflow-hidden rounded-sm border-2 border-[#382E25] bg-[#241D17] group"
                  >
                    <img
                      src={heroImages[2]}
                      alt="Gallery"
                      className="h-full w-full object-cover sepia-[15%] transition duration-500 group-hover:scale-105"
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN RESERVATION PARCHMENT */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-10">
        {/* Customer Patron Status Bar */}
        {!loadingCustomer && (
          <div className="mb-8 flex flex-col justify-between gap-4 rounded-xl border border-[#DFD6C7] bg-[#F3ECE1] p-4 text-xs sm:flex-row sm:items-center">
            <div className="font-mono text-[#584D41]">
              {customer ? (
                <span>
                  PATRON SIGNED IN:{" "}
                  <strong className="text-[#241F1A] underline">
                    {customer.email}
                  </strong>
                </span>
              ) : (
                <span>
                  BOOKING AS GUEST • CREATE A PATRON PASS TO SAVE YOUR HISTORY
                </span>
              )}
            </div>
            {!customer && (
              <div className="flex items-center gap-2">
                <a
                  href={loginHref}
                  className="rounded-lg border border-[#CEC1AF] bg-white px-3 py-1.5 font-mono font-bold text-[#3B3229] hover:bg-[#FAF7F2]"
                >
                  {tr("booking.options.login")}
                </a>
                <a
                  href={createAccountHref}
                  className="rounded-lg bg-[#2E2620] px-3 py-1.5 font-mono font-bold text-[#FAF6F0] hover:bg-[#1E1915]"
                >
                  {tr("booking.options.createAccount")}
                </a>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mb-8 rounded-lg border border-red-300 bg-red-50/90 p-4 font-mono text-xs font-semibold text-red-800">
            ✕ {error}
          </div>
        )}

        {/* STEP-BY-STEP BOOKING CARD */}
        <div className="rounded-2xl border border-[#DCD3C4] bg-white shadow-[0_20px_50px_-25px_rgba(40,32,24,0.12)]">
          {/* Header Ledger Stamp */}
          <div className="border-b border-[#EBE4D8] bg-[#F6F1E9] px-6 py-4 rounded-t-2xl flex flex-wrap items-center justify-between gap-3">
            <div className="font-serif italic text-base text-[#3C3228]">
              Appointment Ledger • Step {step} of 4
            </div>
            <div className="flex items-center gap-2 font-mono text-xs">
              <span
                className={`px-2.5 py-0.5 rounded-full ${step >= 1 ? "bg-[#29221C] text-[#FAF6F0]" : "bg-[#E3D9CC] text-[#716557]"}`}
              >
                1. Service
              </span>
              <span>→</span>
              <span
                className={`px-2.5 py-0.5 rounded-full ${step >= 2 ? "bg-[#29221C] text-[#FAF6F0]" : "bg-[#E3D9CC] text-[#716557]"}`}
              >
                2. Craftsman
              </span>
              <span>→</span>
              <span
                className={`px-2.5 py-0.5 rounded-full ${step >= 3 ? "bg-[#29221C] text-[#FAF6F0]" : "bg-[#E3D9CC] text-[#716557]"}`}
              >
                3. Date & Time
              </span>
              <span>→</span>
              <span
                className={`px-2.5 py-0.5 rounded-full ${step === 4 ? "bg-[#29221C] text-[#FAF6F0]" : "bg-[#E3D9CC] text-[#716557]"}`}
              >
                4. Confirm
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-10 space-y-12">
            {/* STEP 1: SERVICE MENU */}
            <div>
              <div className="flex items-baseline justify-between border-b border-[#ECE4D8] pb-3 mb-6">
                <div>
                  <h2 className="font-serif text-2xl text-[#221C17]">
                    I. Select Menu Offering
                  </h2>
                  <p className="font-mono text-xs text-[#7A6E5F] mt-1">
                    Select from our signature treatments and services
                  </p>
                </div>
                {selectedService && (
                  <span className="font-mono text-xs uppercase text-[#8C6D2B] bg-[#F7F1E4] px-2.5 py-1 rounded border border-[#DECFA9]">
                    ✓ Selected
                  </span>
                )}
              </div>

              {loadingServices ? (
                <div className="py-12 text-center font-mono text-xs text-[#8A7D6F] animate-pulse">
                  {tr("booking.sections.service.loading")}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {services.map((s) => {
                    const active = s.id === serviceId;
                    const d = depositLabel(s);
                    const thumb = s.images?.[0];

                    return (
                      <div
                        key={s.id}
                        onClick={() => {
                          setServiceId(s.id);
                          setSelectedStaffId("ANY");
                          setDate("");
                          setTime("");
                          setError(null);
                        }}
                        className={`group cursor-pointer rounded-xl border p-4 transition duration-200 ${
                          active
                            ? "border-[#2E251E] bg-[#F9F6F0] shadow-md ring-1 ring-[#2E251E]"
                            : "border-[#E7DECة] bg-[#FCFBF8] hover:border-[#C4B7A5] hover:bg-white"
                        }`}
                      >
                        {thumb && (
                          <div className="mb-3 aspect-[16/10] overflow-hidden rounded-lg bg-[#ECE4D8]">
                            <img
                              src={thumb}
                              alt={s.name}
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                            />
                          </div>
                        )}

                        <div className="flex items-start justify-between gap-2">
                          <div className="font-serif text-lg font-medium text-[#251E19]">
                            {s.name}
                          </div>
                          <div className="font-mono text-sm font-bold text-[#8C6D2B]">
                            {formatMoney(s.price, s.currency)}
                          </div>
                        </div>

                        <div className="mt-2 flex items-center justify-between text-xs font-mono text-[#736657]">
                          <span>
                            ⏱ {s.durationMin}{" "}
                            {tr("booking.common.minutes", { n: s.durationMin })}
                          </span>
                          {d && (
                            <span className="rounded bg-[#EFE7D8] px-1.5 py-0.5 text-[10px] text-[#785E22]">
                              {d}
                            </span>
                          )}
                        </div>

                        {s.staff && s.staff.length > 0 && (
                          <div className="mt-3 flex items-center gap-1.5 pt-2 border-t border-[#EAE2D5] font-mono text-[11px] text-[#857766]">
                            <span>With:</span>
                            <span className="font-medium text-[#42372D]">
                              {s.staff
                                .map((sm) => sm.name)
                                .slice(0, 2)
                                .join(", ")}
                              {s.staff.length > 2
                                ? ` +${s.staff.length - 2}`
                                : ""}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* STEP 2: CRAFTSMAN / SPECIALIST SELECTION */}
            {selectedService && (
              <div className="border-t border-[#EDE5DA] pt-8">
                <div className="border-b border-[#ECE4D8] pb-3 mb-6">
                  <h2 className="font-serif text-2xl text-[#221C17]">
                    II. Dedicated Craftsman / Specialist
                  </h2>
                  <p className="font-mono text-xs text-[#7A6E5F] mt-1">
                    Choose your preferred provider or select the first available
                    appointment
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {/* Any Specialist Card */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStaffId("ANY");
                      setTime("");
                    }}
                    className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition ${
                      selectedStaffId === "ANY"
                        ? "border-[#2E251E] bg-[#2E251E] text-[#FAF6F0] shadow-sm"
                        : "border-[#DFD6C7] bg-[#FCFBF8] text-[#332A22] hover:bg-white"
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-current font-serif text-sm">
                      ⚡
                    </div>
                    <div>
                      <div className="font-serif text-sm font-medium">
                        First Available
                      </div>
                      <div className="font-mono text-[10px] opacity-75">
                        Any available master
                      </div>
                    </div>
                  </button>

                  {/* Qualified Staff Members */}
                  {qualifiedStaff.map((staff) => {
                    const active = selectedStaffId === staff.id;
                    return (
                      <button
                        key={staff.id}
                        type="button"
                        onClick={() => {
                          setSelectedStaffId(staff.id);
                          setTime("");
                        }}
                        className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition ${
                          active
                            ? "border-[#2E251E] bg-[#2E251E] text-[#FAF6F0] shadow-sm"
                            : "border-[#DFD6C7] bg-[#FCFBF8] text-[#332A22] hover:bg-white"
                        }`}
                      >
                        {staff.avatarUrl ? (
                          <img
                            src={staff.avatarUrl}
                            alt={staff.name}
                            className="h-10 w-10 shrink-0 rounded-full object-cover border border-current"
                          />
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-current font-mono text-xs font-bold">
                            {staff.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="truncate font-serif text-sm font-medium">
                            {staff.name}
                          </div>
                          {staff.title && (
                            <div className="truncate font-mono text-[10px] opacity-75">
                              {staff.title}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 3: DATE & TIME LEDGER */}
            {selectedService && (
              <div className="border-t border-[#EDE5DA] pt-8">
                <div className="border-b border-[#ECE4D8] pb-3 mb-6">
                  <h2 className="font-serif text-2xl text-[#221C17]">
                    III. Date & Time Register
                  </h2>
                  <p className="font-mono text-xs text-[#7A6E5F] mt-1">
                    Calendar slots synchronized directly to real atelier hours
                  </p>
                </div>

                <div className="grid gap-8 lg:grid-cols-12">
                  {/* Date Input */}
                  <div className="lg:col-span-4">
                    <label className="block font-mono text-xs uppercase tracking-wider text-[#615446] mb-2">
                      Calendar Date
                    </label>
                    <input
                      type="date"
                      value={date}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => {
                        setDate(e.target.value);
                        setTime("");
                        setError(null);
                      }}
                      className="w-full rounded-xl border border-[#D5CABB] bg-[#FAF8F5] px-4 py-3 font-mono text-sm text-[#261F1A] focus:border-[#261F1A] focus:bg-white focus:outline-none"
                    />
                    <p className="mt-2 font-mono text-[11px] text-[#8A7C6E]">
                      Operating timezone: {rule.timezone}
                    </p>
                  </div>

                  {/* Time Slots */}
                  <div className="lg:col-span-8">
                    <label className="block font-mono text-xs uppercase tracking-wider text-[#615446] mb-2">
                      Available Openings
                    </label>

                    {!date ? (
                      <div className="rounded-xl border border-dashed border-[#DFD5C6] bg-[#FAF8F4] p-6 text-center font-mono text-xs text-[#8A7C6E]">
                        Select a calendar date to view bookable hours.
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-[#DFD5C6] bg-[#FAF8F4] p-6 text-center font-mono text-xs text-[#8A7C6E]">
                        {tr("booking.sections.time.empty")}
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5">
                        {availableSlots.map((slot) => {
                          const active = slot === time;
                          return (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => {
                                setTime(slot);
                                setError(null);
                              }}
                              className={`rounded-lg border py-2.5 text-center font-mono text-xs font-semibold transition ${
                                active
                                  ? "border-[#261F1A] bg-[#261F1A] text-[#FAF6F0] shadow-sm"
                                  : "border-[#DDD3C3] bg-[#FCFBF8] text-[#332A22] hover:border-[#736353] hover:bg-white"
                              }`}
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: PATRON MANIFEST & CONFIRMATION */}
            {selectedService && date && time && (
              <div className="border-t border-[#EDE5DA] pt-8">
                <div className="border-b border-[#ECE4D8] pb-3 mb-6">
                  <h2 className="font-serif text-2xl text-[#221C17]">
                    IV. Patron Information
                  </h2>
                  <p className="font-mono text-xs text-[#7A6E5F] mt-1">
                    Please specify the contact details for appointment updates
                    and confirmations
                  </p>
                </div>

                {/* Ticket Stub Summary */}
                <div className="mb-8 rounded-xl border border-[#DCD0BE] bg-[#F7F2E9] p-5 shadow-inner">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E3D9C9] pb-4">
                    <div>
                      <div className="font-serif text-lg font-bold text-[#2A221B]">
                        {selectedService.name}
                      </div>
                      <div className="font-mono text-xs text-[#6F6151] mt-0.5">
                        {date} • {time} ({rule.timezone}) •{" "}
                        {selectedService.durationMin} Minutes
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-xs uppercase text-[#7D6E5D]">
                        Honorarium
                      </div>
                      <div className="text-xl font-bold text-[#8C6D2B]">
                        {formatMoney(
                          selectedService.price,
                          selectedService.currency,
                        )}
                      </div>
                    </div>
                  </div>

                  {selectedStaffObj && (
                    <div className="mt-3 font-mono text-xs text-[#6E6152]">
                      Assigned Specialist:{" "}
                      <strong className="text-[#261E18]">
                        {selectedStaffObj.name}
                      </strong>
                    </div>
                  )}
                </div>

                {/* Form Fields */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="font-mono text-xs uppercase tracking-wider text-[#635547]">
                      {tr("booking.form.fullName")} *
                    </span>
                    <input
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={tr("booking.form.fullNamePlaceholder")}
                      className="mt-1.5 h-12 w-full rounded-xl border border-[#D5CABB] bg-[#FAF8F5] px-4 font-sans text-sm text-[#261F1A] focus:border-[#261F1A] focus:bg-white focus:outline-none"
                    />
                  </label>

                  <label className="block">
                    <span className="font-mono text-xs uppercase tracking-wider text-[#635547]">
                      {tr("booking.form.phone")} *
                    </span>
                    <input
                      required
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={tr("booking.form.phonePlaceholder")}
                      className="mt-1.5 h-12 w-full rounded-xl border border-[#D5CABB] bg-[#FAF8F5] px-4 font-mono text-sm text-[#261F1A] focus:border-[#261F1A] focus:bg-white focus:outline-none"
                    />
                  </label>

                  <label className="block sm:col-span-2">
                    <span className="font-mono text-xs uppercase tracking-wider text-[#635547]">
                      {tr("booking.form.emailLabel")} *
                    </span>
                    <input
                      required
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder={tr("booking.form.emailPlaceholder")}
                      className="mt-1.5 h-12 w-full rounded-xl border border-[#D5CABB] bg-[#FAF8F5] px-4 font-mono text-sm text-[#261F1A] focus:border-[#261F1A] focus:bg-white focus:outline-none"
                    />
                  </label>

                  <label className="block sm:col-span-2">
                    <span className="font-mono text-xs uppercase tracking-wider text-[#635547]">
                      {tr("booking.form.notes")}
                    </span>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={tr("booking.form.notesPlaceholder")}
                      rows={3}
                      className="mt-1.5 w-full rounded-xl border border-[#D5CABB] bg-[#FAF8F5] p-3 font-sans text-sm text-[#261F1A] focus:border-[#261F1A] focus:bg-white focus:outline-none"
                    />
                  </label>
                </div>

                <div className="mt-8">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={confirmBooking}
                    className="w-full rounded-xl bg-[#221B16] py-4 font-mono text-xs font-bold uppercase tracking-widest text-[#FAF6F0] shadow-lg transition hover:bg-[#3B3028] active:translate-y-0.5 disabled:opacity-50"
                  >
                    {submitting
                      ? tr("booking.form.confirming")
                      : `✦ ${tr("booking.form.confirm")} ✦`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MAP & ARCHIVAL REVIEWS SECTION */}
        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          {/* Location / Atelier Address */}
          <div className="rounded-2xl border border-[#DDD4C5] bg-[#F7F2E9] p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-serif text-xl text-[#261F1A]">
                  {tr("booking.location.title")}
                </h3>
                <p className="font-mono text-xs text-[#6F604F] mt-1">
                  {addr || tr("booking.location.noAddress")}
                </p>
              </div>
              {addr && (
                <a
                  href={mapsOpen}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-[#CEC1AF] bg-white px-3 py-1.5 font-mono text-xs text-[#332A22] hover:bg-[#FAF8F5]"
                >
                  {tr("booking.location.openMaps")} ↗
                </a>
              )}
            </div>

            {addr && (
              <div className="mt-5 overflow-hidden rounded-xl border border-[#DCD0BF]">
                <iframe
                  title={tr("booking.location.mapTitle", {
                    name: business.name,
                  })}
                  src={mapsEmbed}
                  className="h-72 w-full grayscale-[25%] contrast-125"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}
          </div>

          {/* Patron Reviews */}
          <div className="rounded-2xl border border-[#DDD4C5] bg-[#F7F2E9] p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-[#E7DDCE] pb-4">
              <h3 className="font-serif text-xl text-[#261F1A]">
                Patron Testimonials
              </h3>
              <span className="font-mono text-xs text-[#826628]">
                {(business.ratingCount ?? 0) > 0
                  ? `★ ${Number(business.ratingAvg ?? 0).toFixed(1)} (${business.ratingCount} Records)`
                  : "New Atelier"}
              </span>
            </div>

            <div className="mt-5 space-y-4 max-h-80 overflow-y-auto pr-1">
              {business.reviews?.length ? (
                business.reviews.map((r, i) => (
                  <div
                    key={`${r.customerName}-${i}`}
                    className="rounded-xl border border-[#E4D9CA] bg-white p-4"
                  >
                    <div className="flex items-center justify-between font-mono text-xs">
                      <span className="font-bold text-[#2A231D]">
                        {r.customerName}
                      </span>
                      <span className="text-[#8C6D2B]">{stars(r.rating)}</span>
                    </div>
                    <p className="mt-2 font-serif text-sm italic text-[#4A3F33]">
                      "{r.comment?.trim() || "Exemplary treatment."}"
                    </p>
                    <div className="mt-2 text-right font-mono text-[10px] text-[#9A8D7E]">
                      {timeAgo(r.createdAt)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-[#DDD2C2] p-8 text-center font-mono text-xs text-[#8A7C6E]">
                  No archived client reviews yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
