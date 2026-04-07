"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLocale } from "@/lib/use-locale";

type ExploreBusinessItem = {
  slug: string;
  name: string;
  industry?: string | null;
  city?: string | null;
  country?: string | null;
  ratingAvg?: number | null;
  ratingCount?: number | null;
  heroTag?: string | null;
  logoUrl?: string | null;

  galleryImages?: {
  url: string;
}[];

  services?: {
  id: string;
  name: string;
  price: number;
  currency: string;
  category?: string | null;
  durationMin?: number;
}[];

  bookings?: {
    id: string;
    startsAt: string | Date;
    durationMin: number;
  }[];

  availabilityRule?: {
    timezone: string;
    daysJson: string;
    start: string;
    end: string;
    breakStart?: string | null;
    breakEnd?: string | null;
    bufferMin: number;
    slotStepMin: number;
  } | null;
};

type IndustryKey =
  | "BEAUTY_AND_CARE"
  | "WELLNESS_AND_LIFESTYLE"
  | "CREATIVE_SERVICES"
  | "HOME_AND_LOCAL"
  | "EDUCATION_AND_PROFESSIONALS";

type Dict = Record<string, any>;

function getPath(obj: any, path: string) {
  return path
    .split(".")
    .reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined), obj);
}

function interpolate(str: string, vars?: Record<string, string | number>) {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

function isIndustryKey(x: unknown): x is IndustryKey {
  return (
    typeof x === "string" &&
    x in {
      BEAUTY_AND_CARE: 1,
      WELLNESS_AND_LIFESTYLE: 1,
      CREATIVE_SERVICES: 1,
      HOME_AND_LOCAL: 1,
      EDUCATION_AND_PROFESSIONALS: 1
    }
  );
}

function toIndustryKeyOrAll(input: unknown): IndustryKey | "All" {
  const raw = String(input ?? "").trim();
  if (!raw || raw === "All") return "All";
  if (isIndustryKey(raw)) return raw;

  const legacy: Record<string, IndustryKey> = {
    "Beauty & care": "BEAUTY_AND_CARE",
    "Wellness & lifestyle": "WELLNESS_AND_LIFESTYLE",
    "Creative services": "CREATIVE_SERVICES",
    "Home & local": "HOME_AND_LOCAL",
    "Education & professionals": "EDUCATION_AND_PROFESSIONALS",
    "Beauté & soins": "BEAUTY_AND_CARE",
    "Bien-être & lifestyle": "WELLNESS_AND_LIFESTYLE",
    "Services créatifs": "CREATIVE_SERVICES",
    "Maison & local": "HOME_AND_LOCAL",
    "Éducation & professionnels": "EDUCATION_AND_PROFESSIONALS",
    "Education & professionnels": "EDUCATION_AND_PROFESSIONALS"
  };

  return legacy[raw] ?? "All";
}

function Stars({ value }: { value: number }) {
  const rounded = Math.max(0, Math.min(5, Math.round(value)));

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < rounded;
        return (
          <span
            key={i}
            className={["text-sm", filled ? "text-slate-900" : "text-slate-300"].join(" ")}
            aria-hidden
          >
            ★
          </span>
        );
      })}
      <span className="ml-2 text-sm font-semibold text-slate-900">
        {Number.isFinite(value) ? value.toFixed(1) : "0.0"}
      </span>
    </div>
  );
}


function safeParseDays(daysJson?: string | null): number[] {
  try {
    const parsed = JSON.parse(daysJson ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((x) => Number(x))
      .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
  } catch {
    return [];
  }
}

function parseHHMM(value?: string | null) {
  if (!value || !value.includes(":")) return null;
  const [h, m] = value.split(":").map(Number);
  if (!Number.isInteger(h) || !Number.isInteger(m)) return null;
  return { h, m };
}

function setTimeOnDate(base: Date, hhmm?: string | null) {
  const parsed = parseHHMM(hhmm);
  if (!parsed) return null;
  const d = new Date(base);
  d.setHours(parsed.h, parsed.m, 0, 0);
  return d;
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

function startOfLocalDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

function formatSlotLabel(date: Date, now = new Date()) {
  const today = startOfLocalDay(now);
  const tomorrow = addMinutes(today, 24 * 60);
  const target = startOfLocalDay(date);

  const diffDays = Math.round((target.getTime() - today.getTime()) / 86_400_000);

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tomorrow";
  if (diffDays === 2) return "in2days";
  return "later";
}

function getNextSlotInfo(
  business: ExploreBusinessItem,
  opts?: { lookAheadDays?: number; fallbackDurationMin?: number }
) {
  const lookAheadDays = opts?.lookAheadDays ?? 14;
  const fallbackDurationMin = opts?.fallbackDurationMin ?? 30;

  const rule = business.availabilityRule;
  if (!rule) return null;

  const workingDays = safeParseDays(rule.daysJson);
  if (workingDays.length === 0) return null;

  const serviceDuration =
    business.services && business.services.length > 0
      ? Math.min(...business.services.map((s) => Math.max(1, Number(s.durationMin ?? fallbackDurationMin))))
      : fallbackDurationMin;

  const stepMin = Math.max(5, Number(rule.slotStepMin ?? 30));
  const bufferMin = Math.max(0, Number(rule.bufferMin ?? 0));

  const now = new Date();

  const futureBookings = (business.bookings ?? [])
    .map((b) => {
      const start = new Date(b.startsAt);
      const end = addMinutes(start, Number(b.durationMin ?? fallbackDurationMin) + bufferMin);
      return { start, end };
    })
    .filter((b) => Number.isFinite(b.start.getTime()))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  for (let offset = 0; offset < lookAheadDays; offset++) {
    const day = startOfLocalDay(addMinutes(now, offset * 24 * 60));
    const weekday = day.getDay();
    if (!workingDays.includes(weekday)) continue;

    const workStart = setTimeOnDate(day, rule.start);
    const workEnd = setTimeOnDate(day, rule.end);
    if (!workStart || !workEnd || workStart >= workEnd) continue;

    const breakStart = setTimeOnDate(day, rule.breakStart);
    const breakEnd = setTimeOnDate(day, rule.breakEnd);

    for (let slot = new Date(workStart); slot < workEnd; slot = addMinutes(slot, stepMin)) {
      const slotEnd = addMinutes(slot, serviceDuration + bufferMin);

      if (slot < now) continue;
      if (slotEnd > workEnd) continue;

      const insideBreak =
        breakStart && breakEnd ? overlaps(slot, slotEnd, breakStart, breakEnd) : false;
      if (insideBreak) continue;

      const hasConflict = futureBookings.some((b) => overlaps(slot, slotEnd, b.start, b.end));
      if (hasConflict) continue;

      return {
        startsAt: slot,
        labelKey: formatSlotLabel(slot, now)
      };
    }
  }

  return null;
}

export default function ExploreClient({
  businesses,
  industries,
  heading,
  intro,
  defaultCity = "",
  initialQ = "",
  initialCity = "",
  initialIndustry = "All",
  dict
}: {
  businesses: ExploreBusinessItem[];
  industries: string[];
  heading?: string;
  intro?: string;
  defaultCity?: string;
  initialQ?: string;
  initialCity?: string;
  initialIndustry?: string | "All";
  dict: Dict;
}) {
  const locale = useLocale("en");
  const router = useRouter();
  const sp = useSearchParams();

  const t = (key: string, vars?: Record<string, string | number>) => {
    const raw = getPath(dict, key);
    if (typeof raw === "string") return interpolate(raw, vars);
    return key;
  };

  const initialIndustryValue = toIndustryKeyOrAll(initialIndustry);

  const [q, setQ] = useState(initialQ);
  const [city, setCity] = useState(initialCity || defaultCity);
  const [industry, setIndustry] = useState<IndustryKey | "All">(initialIndustryValue);

  const [draftQ, setDraftQ] = useState(initialQ);
  const [draftCity, setDraftCity] = useState(initialCity || defaultCity);
  const [draftIndustry, setDraftIndustry] = useState<IndustryKey | "All">(initialIndustryValue);

  const cities = useMemo(() => {
    const set = new Set((businesses ?? []).map((b) => b.city).filter((x): x is string => !!x));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [businesses]);

  const industryOptions = useMemo(() => {
    const keys = (industries ?? []).filter(isIndustryKey) as IndustryKey[];
    const unique = Array.from(new Set(keys));
    unique.sort((a, b) =>
      t(`explore.industries.${a}`).localeCompare(t(`explore.industries.${b}`))
    );
    return unique;
  }, [industries, dict]);

  function applySearch(next?: {
    q?: string;
    city?: string;
    industry?: IndustryKey | "All";
  }) {
    const nextQ = next?.q ?? draftQ;
    const nextCity = next?.city ?? draftCity;
    const nextIndustry = next?.industry ?? draftIndustry;

    setQ(nextQ.trim());
    setCity(nextCity);
    setIndustry(nextIndustry);
    setDraftQ(nextQ);
    setDraftCity(nextCity);
    setDraftIndustry(nextIndustry);
  }

  useEffect(() => {
    const next = new URLSearchParams(sp.toString());

    if (q.trim()) next.set("q", q.trim());
    else next.delete("q");

    if (city.trim()) next.set("city", city.trim());
    else next.delete("city");

    if (industry !== "All") next.set("industry", industry);
    else next.delete("industry");

    const qs = next.toString();
    router.replace(qs ? `/${locale}/explore?${qs}` : `/${locale}/explore`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, city, industry, locale]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return (businesses ?? [])
      .filter((b) => (city ? b.city === city : true))
      .filter((b) => (industry === "All" ? true : String(b.industry ?? "") === industry))
      .filter((b) => {
        if (!query) return true;
        const name = String(b.name ?? "").toLowerCase();
        const ind = String(b.industry ?? "").toLowerCase();
        const city0 = String(b.city ?? "").toLowerCase();
        const country = String(b.country ?? "").toLowerCase();
        const serviceNames = (b.services ?? []).map((s) => String(s.name ?? "").toLowerCase());

        return (
          name.includes(query) ||
          ind.includes(query) ||
          city0.includes(query) ||
          country.includes(query) ||
          serviceNames.some((x) => x.includes(query))
        );
      })
      .sort((a, b) => Number(b.ratingAvg ?? 0) - Number(a.ratingAvg ?? 0));
  }, [businesses, q, city, industry]);

  const insightSource = filtered.length > 0 ? filtered : businesses;

  const insightData = useMemo(() => {
    const inCity = city
      ? insightSource.filter((b) => String(b.city ?? "") === city)
      : insightSource;

    const source = inCity.length > 0 ? inCity : insightSource;

    const trending =
      [...source]
        .map((b) => ({
          slug: b.slug,
          name: b.name,
          city: b.city,
          bookingCount: b.bookings?.length ?? 0
        }))
        .sort((a, b) => b.bookingCount - a.bookingCount)[0] ?? null;

    const cheapest =
      source
        .flatMap((b) =>
          (b.services ?? []).map((s) => ({
            businessSlug: b.slug,
            businessName: b.name,
            city: b.city,
            serviceName: s.name,
            price: s.price,
            currency: s.currency
          }))
        )
        .sort((a, b) => a.price - b.price)[0] ?? null;

    return { trending, cheapest };
  }, [insightSource, city]);

  const featuredInsight = useMemo(() => {
    if (insightData.trending && insightData.trending.bookingCount > 0) {
      return {
        eyebrow: t("explore.insights.trendingEyebrow"),
        title: t("explore.insights.trendingTitle", {
          city: insightData.trending.city || t("explore.insights.yourArea")
        }),
        metric1Label: t("explore.insights.bookings"),
        metric1Value: String(insightData.trending.bookingCount),
        metric2Label: t("explore.insights.business"),
        metric2Value: insightData.trending.name,
        href: `/${locale}/book/${insightData.trending.slug}`,
        cta: t("explore.insights.viewBusiness")
      };
    }

    if (insightData.cheapest) {
      return {
        eyebrow: t("explore.insights.priceEyebrow"),
        title: t("explore.insights.priceTitle", {
          city: insightData.cheapest.city || t("explore.insights.yourArea")
        }),
        metric1Label: t("explore.insights.startingAt"),
        metric1Value: `${insightData.cheapest.price} ${insightData.cheapest.currency}`,
        metric2Label: t("explore.insights.service"),
        metric2Value: insightData.cheapest.serviceName,
        href: `/${locale}/book/${insightData.cheapest.businessSlug}`,
        cta: t("explore.insights.bookNow")
      };
    }

    return null;
  }, [insightData, locale, dict]);

  const headingText = heading ?? t("explore.heading");
  const introText = intro ?? t("explore.intro");

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">{t("explore.brandLine")}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">{headingText}</h1>
            <p className="mt-2 text-slate-600">{introText}</p>
            <p className="mt-4 max-w-3xl text-sm text-slate-600">{t("explore.help")}</p>
          </div>

          <Link
            href={`/${locale}/register`}
            className="w-fit rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            {t("explore.cta.listBusiness")}
          </Link>
        </header>

        <section className="mt-8 overflow-hidden rounded-[2rem] bg-[#071633] text-white shadow-sm">
          <div className="relative px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-14">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-y-0 right-0 w-full bg-[radial-gradient(circle_at_85%_30%,rgba(163,230,53,0.14),transparent_32%),radial-gradient(circle_at_72%_58%,rgba(163,230,53,0.10),transparent_26%),linear-gradient(135deg,#071633_0%,#08142d_48%,#0d1e3f_100%)]" />
            </div>

            <div className="relative z-10 max-w-4xl">
              <h2 className="max-w-3xl text-4xl font-extrabold leading-[0.95] tracking-tight sm:text-5xl lg:text-6xl">
                {t("explore.hero.titleStart")}{" "}
                <span className="bg-gradient-to-r from-lime-300 via-lime-200 to-green-400 bg-clip-text text-transparent">
                  {t("explore.hero.titleAccent")}
                </span>
              </h2>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                {t("explore.hero.description")}
              </p>

              <div className="mt-8 flex flex-col gap-3 lg:flex-row">
                <div className="flex flex-1 items-center rounded-2xl bg-white px-4 py-3 shadow-lg ring-1 ring-black/5">
                  <span className="mr-3 text-lg text-slate-400" aria-hidden>
                    🔎
                  </span>
                  <input
                    className="w-full border-none bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
                    placeholder={t("explore.filters.searchPlaceholder")}
                    value={draftQ}
                    onChange={(e) => setDraftQ(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") applySearch();
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => applySearch()}
                  className="rounded-2xl bg-gradient-to-r from-lime-400 to-green-500 px-6 py-4 text-sm font-bold text-slate-950 shadow-lg transition hover:brightness-105 active:scale-[0.98] sm:px-8"
                >
                  {t("explore.hero.searchButton")}
                </button>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <label className="grid gap-2 text-sm">
                  <span className="font-medium text-slate-200">{t("explore.filters.city")}</span>
                  <select
                    className="rounded-2xl border border-white/10 bg-white px-4 py-3 text-slate-900 outline-none"
                    value={draftCity}
                    onChange={(e) => setDraftCity(e.target.value)}
                  >
                    <option value="">{t("explore.filters.allCities")}</option>
                    {cities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 text-sm">
                  <span className="font-medium text-slate-200">
                    {t("explore.filters.industry")}
                  </span>
                  <select
                    className="rounded-2xl border border-white/10 bg-white px-4 py-3 text-slate-900 outline-none"
                    value={draftIndustry}
                    onChange={(e) => setDraftIndustry(toIndustryKeyOrAll(e.target.value))}
                  >
                    <option value="All">{t("explore.filters.all")}</option>
                    {industryOptions.map((key) => (
                      <option key={key} value={key}>
                        {t(`explore.industries.${key}`)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="mr-1 text-sm font-semibold text-slate-600">
              {t("explore.quickFilters.label")}
            </span>

            {[
              { key: "all", value: "All" as const },
              { key: "beauty", value: "BEAUTY_AND_CARE" as const },
              { key: "wellness", value: "WELLNESS_AND_LIFESTYLE" as const },
              { key: "creative", value: "CREATIVE_SERVICES" as const },
              { key: "home", value: "HOME_AND_LOCAL" as const },
              { key: "education", value: "EDUCATION_AND_PROFESSIONALS" as const }
            ].map((chip) => {
              const active = industry === chip.value;

              return (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => {
                    const nextIndustry = toIndustryKeyOrAll(chip.value);
                    applySearch({ q: draftQ, city: draftCity, industry: nextIndustry });
                  }}
                  className={[
                    "rounded-full px-4 py-2 text-xs font-semibold transition sm:px-5",
                    active
                      ? "bg-slate-900 text-white shadow-md"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  ].join(" ")}
                >
                  {t(`explore.quickFilters.items.${chip.key}`)}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-8 grid gap-5 xl:grid-cols-3">
          <div className="group relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-[#0b1b3d] to-slate-800 p-6 text-white sm:p-8 xl:col-span-2">
            <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-lime-300/10 blur-[100px] transition-all duration-700 group-hover:bg-lime-300/20" />

            <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center">
              <div className="flex-1">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/90">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-lime-300" />
                  {t("explore.partnership.badge")}
                </div>

                <h2 className="max-w-xl text-2xl font-bold tracking-tight sm:text-3xl">
                  {t("explore.partnership.title")}
                </h2>

                <p className="mt-4 max-w-md text-sm leading-7 text-slate-300 sm:text-base">
                  {t("explore.partnership.description")}
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link
                    href={`/${locale}/register`}
                    className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {t("explore.partnership.primaryCta")}
                  </Link>

                  <Link
                    href={`/${locale}/tools`}
                    className="inline-flex items-center gap-2 text-sm font-bold text-white transition hover:translate-x-1"
                  >
                    {t("explore.partnership.secondaryCta")}
                    <span aria-hidden>↗</span>
                  </Link>
                </div>
              </div>

              <div className="relative z-10 min-h-[240px] w-full flex-1">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDVmqGopDmuMgjLzDKFoSYqarLfMFVGkBW2pQZyX4Mx67eBYZ0xpvwhw_ABexUHQVCLdnmc3S0zP3VwBDShOE65ZJXg2ks7SkiQU1obV6bALXISJ6jpiKqVFsRXgI849ohXXd9hlZrt6EM2zAO72nupkLSsEf2UbjFasuU1dr9QD9TXQHrZAoCejDqJCGCVXYeW2BmtnyLSbZSbntV7EIo6mkIDceuw7GUOC2vAMtmcavdNW_WXEm6Nm-dABH3UetNq_OQ3GNDbb_zE"
                  alt={t("explore.partnership.imageAlt")}
                  className="h-full min-h-[240px] w-full rounded-[1.5rem] object-cover shadow-2xl transition-transform duration-500 group-hover:scale-[1.01] group-hover:rotate-0 lg:rotate-2"
                  loading="lazy"
                />
              </div>
            </div>
          </div>

          {featuredInsight ? (
            <div className="flex h-full flex-col justify-between rounded-[2rem] bg-lime-100 p-6 text-slate-900 sm:p-8">
              <div>
                <span className="mb-4 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-700/70">
                  {featuredInsight.eyebrow}
                </span>

                <h3 className="mb-6 text-2xl font-black leading-tight tracking-tight">
                  {featuredInsight.title}
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-2xl bg-white/60 p-3 backdrop-blur-sm">
                    <span className="text-xs font-bold text-slate-700">
                      {featuredInsight.metric1Label}
                    </span>
                    <span className="text-xs font-black text-green-700">
                      {featuredInsight.metric1Value}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl bg-white/60 p-3 backdrop-blur-sm">
                    <span className="text-xs font-bold text-slate-700">
                      {featuredInsight.metric2Label}
                    </span>
                    <span className="text-xs font-black text-slate-900">
                      {featuredInsight.metric2Value}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                href={featuredInsight.href}
                className="mt-8 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-900 transition hover:translate-x-1"
              >
                {featuredInsight.cta}
                <span aria-hidden>↗</span>
              </Link>
            </div>
          ) : null}
        </section>

        <section className="mt-8">
  <div className="mb-4 text-sm text-slate-600">
    {t("explore.results.showing", { n: filtered.length })}
  </div>

  {filtered.length === 0 ? (
    <div className="rounded-2xl border border-slate-200 p-6 text-slate-600">
      {t("explore.results.empty")}
    </div>
  ) : (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {filtered.map((b) => {
        const heroImage = b.galleryImages?.[0]?.url || null;

        const serviceTags = (b.services ?? [])
          .map((s) => s.name)
          .filter(Boolean)
          .slice(0, 3);

        const startingPrice =
          (b.services ?? []).length > 0
            ? [...(b.services ?? [])].sort((a, z) => a.price - z.price)[0]
            : null;

        const nextSlot = getNextSlotInfo(b);

        return (
          <Link
            key={b.slug}
            href={`/${locale}/book/${b.slug}`}
            className="group overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-900/10"
          >
            <div className="relative h-64 overflow-hidden bg-slate-100">
              {heroImage ? (
                <img
                  src={heroImage}
                  alt={t("explore.card.heroAlt", { name: b.name })}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  loading="lazy"
                />
              ) : b.logoUrl ? (
                <div className="flex h-full w-full items-center justify-center bg-white">
                  <img
                    src={b.logoUrl}
                    alt={t("explore.card.logoAlt", { name: b.name })}
                    className="h-28 w-28 rounded-3xl object-cover shadow-lg"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 via-slate-200 to-slate-100">
                  <span className="text-5xl font-bold text-slate-400">
                    {b.name?.charAt(0)?.toUpperCase() || "S"}
                  </span>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-slate-950/10 to-transparent" />

              {b.heroTag ? (
                <div className="absolute left-4 top-4">
                  <span className="rounded-full bg-lime-100/95 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-900 shadow-sm">
                    {b.heroTag}
                  </span>
                </div>
              ) : null}

              <div className="absolute bottom-4 right-4 rounded-xl bg-white/90 px-3 py-1 text-xs font-bold text-slate-900 shadow-sm backdrop-blur">
                {(b.ratingCount ?? 0) > 0 ? (
                  <span className="flex items-center gap-1">
                    <span className="text-amber-500">★</span>
                    {Number(b.ratingAvg ?? 0).toFixed(1)} ({Number(b.ratingCount ?? 0)})
                  </span>
                ) : (
                  <span>{t("explore.card.noReviewsShort")}</span>
                )}
              </div>
            </div>

            <div className="p-6">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-2xl font-bold tracking-tight text-slate-900">
                    {b.name}
                  </h3>

                  <p className="mt-2 flex items-center gap-1 text-sm text-slate-600">
                    <span aria-hidden>📍</span>
                    {b.city ?? t("explore.card.cityFallback")}
                    {b.country ? `, ${b.country}` : ""}
                  </p>
                </div>

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors group-hover:bg-slate-900 group-hover:text-white">
                  →
                </div>
              </div>

              <div className="mb-6 flex min-h-[2.5rem] flex-wrap gap-2">
                {serviceTags.length > 0 ? (
                  serviceTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-700"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500">
                    {t("explore.card.noServices")}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 pt-5">
                <span className="text-sm text-slate-600">
                  {nextSlot ? (
                    <>
                      {t("explore.card.nextSlot")}{" "}
                      <span className="font-bold text-slate-900">
                        {t(`explore.card.nextSlotValues.${nextSlot.labelKey}`)}
                      </span>
                    </>
                  ) : startingPrice ? (
                    <>
                      {t("explore.card.startingAt")}{" "}
                      <span className="font-bold text-slate-900">
                        {startingPrice.price} {startingPrice.currency}
                      </span>
                    </>
                  ) : (
                    <>
                      {t("explore.card.viewDetails")}{" "}
                      <span className="font-bold text-slate-900">{b.name}</span>
                    </>
                  )}
                </span>

                <span className="flex items-center gap-1 text-sm font-bold text-green-700 transition-transform group-hover:translate-x-1">
                  {t("explore.card.viewStudio")}
                  <span aria-hidden>→</span>
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  )}
</section>
      </div>
    </main>
  );
}