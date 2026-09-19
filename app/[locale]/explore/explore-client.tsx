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
    .reduce(
      (acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined),
      obj,
    );
}

function interpolate(str: string, vars?: Record<string, string | number>) {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

function isIndustryKey(x: unknown): x is IndustryKey {
  return (
    typeof x === "string" &&
    x in
      {
        BEAUTY_AND_CARE: 1,
        WELLNESS_AND_LIFESTYLE: 1,
        CREATIVE_SERVICES: 1,
        HOME_AND_LOCAL: 1,
        EDUCATION_AND_PROFESSIONALS: 1,
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
    "Education & professionnels": "EDUCATION_AND_PROFESSIONALS",
  };

  return legacy[raw] ?? "All";
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

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

function formatSlotLabel(date: Date, now = new Date()) {
  const today = startOfLocalDay(now);
  const target = startOfLocalDay(date);

  const diffDays = Math.round(
    (target.getTime() - today.getTime()) / 86_400_000,
  );

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tomorrow";
  if (diffDays === 2) return "in2days";
  return "later";
}

function getNextSlotInfo(
  business: ExploreBusinessItem,
  opts?: { lookAheadDays?: number; fallbackDurationMin?: number },
) {
  const lookAheadDays = opts?.lookAheadDays ?? 14;
  const fallbackDurationMin = opts?.fallbackDurationMin ?? 30;

  const rule = business.availabilityRule;
  if (!rule) return null;

  const workingDays = safeParseDays(rule.daysJson);
  if (workingDays.length === 0) return null;

  const serviceDuration =
    business.services && business.services.length > 0
      ? Math.min(
          ...business.services.map((s) =>
            Math.max(1, Number(s.durationMin ?? fallbackDurationMin)),
          ),
        )
      : fallbackDurationMin;

  const stepMin = Math.max(5, Number(rule.slotStepMin ?? 30));
  const bufferMin = Math.max(0, Number(rule.bufferMin ?? 0));

  const now = new Date();

  const futureBookings = (business.bookings ?? [])
    .map((b) => {
      const start = new Date(b.startsAt);
      const end = addMinutes(
        start,
        Number(b.durationMin ?? fallbackDurationMin) + bufferMin,
      );
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

    for (
      let slot = new Date(workStart);
      slot < workEnd;
      slot = addMinutes(slot, stepMin)
    ) {
      const slotEnd = addMinutes(slot, serviceDuration + bufferMin);

      if (slot < now) continue;
      if (slotEnd > workEnd) continue;

      const insideBreak =
        breakStart && breakEnd
          ? overlaps(slot, slotEnd, breakStart, breakEnd)
          : false;
      if (insideBreak) continue;

      const hasConflict = futureBookings.some((b) =>
        overlaps(slot, slotEnd, b.start, b.end),
      );
      if (hasConflict) continue;

      return {
        startsAt: slot,
        labelKey: formatSlotLabel(slot, now),
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
  dict,
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
  const [industry, setIndustry] = useState<IndustryKey | "All">(
    initialIndustryValue,
  );

  const [draftQ, setDraftQ] = useState(initialQ);
  const [draftCity, setDraftCity] = useState(initialCity || defaultCity);
  const [draftIndustry, setDraftIndustry] = useState<IndustryKey | "All">(
    initialIndustryValue,
  );

  const cities = useMemo(() => {
    const set = new Set(
      (businesses ?? []).map((b) => b.city).filter((x): x is string => !!x),
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [businesses]);

  const industryOptions = useMemo(() => {
    const keys = (industries ?? []).filter(isIndustryKey) as IndustryKey[];
    const unique = Array.from(new Set(keys));
    unique.sort((a, b) =>
      t(`explore.industries.${a}`).localeCompare(t(`explore.industries.${b}`)),
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
    router.replace(qs ? `/${locale}/explore?${qs}` : `/${locale}/explore`, {
      scroll: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, city, industry, locale]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return (businesses ?? [])
      .filter((b) => (city ? b.city === city : true))
      .filter((b) =>
        industry === "All" ? true : String(b.industry ?? "") === industry,
      )
      .filter((b) => {
        if (!query) return true;
        const name = String(b.name ?? "").toLowerCase();
        const ind = String(b.industry ?? "").toLowerCase();
        const city0 = String(b.city ?? "").toLowerCase();
        const country = String(b.country ?? "").toLowerCase();
        const serviceNames = (b.services ?? []).map((s) =>
          String(s.name ?? "").toLowerCase(),
        );

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
          bookingCount: b.bookings?.length ?? 0,
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
            currency: s.currency,
          })),
        )
        .sort((a, b) => a.price - b.price)[0] ?? null;

    return { trending, cheapest };
  }, [insightSource, city]);

  const featuredInsight = useMemo(() => {
    if (insightData.trending && insightData.trending.bookingCount > 0) {
      return {
        eyebrow: t("explore.insights.trendingEyebrow"),
        title: t("explore.insights.trendingTitle", {
          city: insightData.trending.city || t("explore.insights.yourArea"),
        }),
        metric1Label: t("explore.insights.bookings"),
        metric1Value: String(insightData.trending.bookingCount),
        metric2Label: t("explore.insights.business"),
        metric2Value: insightData.trending.name,
        href: `/${locale}/book/${insightData.trending.slug}`,
        cta: t("explore.insights.viewBusiness"),
      };
    }

    if (insightData.cheapest) {
      return {
        eyebrow: t("explore.insights.priceEyebrow"),
        title: t("explore.insights.priceTitle", {
          city: insightData.cheapest.city || t("explore.insights.yourArea"),
        }),
        metric1Label: t("explore.insights.startingAt"),
        metric1Value: `${insightData.cheapest.price} ${insightData.cheapest.currency}`,
        metric2Label: t("explore.insights.service"),
        metric2Value: insightData.cheapest.serviceName,
        href: `/${locale}/book/${insightData.cheapest.businessSlug}`,
        cta: t("explore.insights.bookNow"),
      };
    }

    return null;
  }, [insightData, locale, dict]);

  const headingText = heading ?? t("explore.heading");
  const introText = intro ?? t("explore.intro");

  return (
    <div className="w-full pb-20">
      {/* 1. TOP HEADER & SEARCH DOCK (Full edge-to-edge breathable section) */}
      <section className="relative w-full border-b border-slate-400/30 bg-white/40 px-4 py-8 shadow-sm backdrop-blur-2xl sm:px-8 sm:py-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-lime-300/80 bg-lime-100 px-3.5 py-1 text-xs font-bold text-lime-950 shadow-xs">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-lime-900 text-[10px] text-white">
                  ✓
                </span>
                <span className="font-mono uppercase tracking-wider">
                  {t("explore.brandLine")}
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                {headingText}
              </h1>
              <p className="mt-2 text-sm text-slate-700 sm:text-base">
                {introText}
              </p>
            </div>

            <Link
              href={`/${locale}/register`}
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-2xl border border-lime-300/80 bg-lime-100 px-6 font-mono text-xs font-bold uppercase tracking-wider text-lime-950 shadow-xs transition hover:bg-lime-200 active:scale-95"
            >
              {t("explore.cta.listBusiness")}
            </Link>
          </div>

          {/* GLASS SEARCH INPUTS */}
          <div className="mt-8 rounded-3xl border border-slate-400/40 bg-white/70 p-4 shadow-lg backdrop-blur-xl sm:p-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
              {/* Query search */}
              <div className="relative flex items-center sm:col-span-5">
                <span className="pointer-events-none absolute left-3.5 text-slate-400 text-lg">
                  🔎
                </span>
                <input
                  type="text"
                  className="w-full rounded-2xl border border-slate-300/80 bg-white/90 py-3 pl-11 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:bg-white focus:outline-none"
                  placeholder={t("explore.filters.searchPlaceholder")}
                  value={draftQ}
                  onChange={(e) => setDraftQ(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") applySearch();
                  }}
                />
              </div>

              {/* City dropdown */}
              <div className="sm:col-span-3">
                <select
                  className="w-full rounded-2xl border border-slate-300/80 bg-white/90 py-3 px-3.5 text-sm font-medium text-slate-900 focus:border-slate-800 focus:bg-white focus:outline-none"
                  value={draftCity}
                  onChange={(e) => {
                    const nextC = e.target.value;
                    setDraftCity(nextC);
                    applySearch({ city: nextC });
                  }}
                >
                  <option value="">{t("explore.filters.allCities")}</option>
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Industry dropdown */}
              <div className="sm:col-span-2">
                <select
                  className="w-full rounded-2xl border border-slate-300/80 bg-white/90 py-3 px-3.5 text-sm font-medium text-slate-900 focus:border-slate-800 focus:bg-white focus:outline-none"
                  value={draftIndustry}
                  onChange={(e) => {
                    const nextI = toIndustryKeyOrAll(e.target.value);
                    setDraftIndustry(nextI);
                    applySearch({ industry: nextI });
                  }}
                >
                  <option value="All">{t("explore.filters.all")}</option>
                  {industryOptions.map((key) => (
                    <option key={key} value={key}>
                      {t(`explore.industries.${key}`)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search submit button */}
              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={() => applySearch()}
                  className="w-full h-full rounded-2xl bg-slate-900 py-3 px-4 text-xs font-mono font-bold uppercase tracking-wider text-white shadow transition hover:bg-slate-800 active:scale-95"
                >
                  {t("explore.hero.searchButton")}
                </button>
              </div>
            </div>

            {/* QUICK PILLS CAROUSEL */}
            <div className="mt-4 flex items-center gap-2 overflow-x-auto border-t border-slate-300/60 pt-3 no-scrollbar">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-500 mr-2 shrink-0">
                {t("explore.quickFilters.label")}
              </span>

              {[
                { key: "all", value: "All" as const },
                { key: "beauty", value: "BEAUTY_AND_CARE" as const },
                { key: "wellness", value: "WELLNESS_AND_LIFESTYLE" as const },
                { key: "creative", value: "CREATIVE_SERVICES" as const },
                { key: "home", value: "HOME_AND_LOCAL" as const },
                {
                  key: "education",
                  value: "EDUCATION_AND_PROFESSIONALS" as const,
                },
              ].map((chip) => {
                const active = industry === chip.value;
                return (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => {
                      const nextIndustry = toIndustryKeyOrAll(chip.value);
                      applySearch({
                        q: draftQ,
                        city: draftCity,
                        industry: nextIndustry,
                      });
                    }}
                    className={`shrink-0 rounded-xl border px-3.5 py-1.5 font-mono text-xs font-bold transition active:scale-95 ${
                      active
                        ? "border-lime-300/80 bg-lime-100 text-lime-950 shadow-xs"
                        : "border-slate-300/80 bg-white/70 text-slate-700 hover:bg-white"
                    }`}
                  >
                    {t(`explore.quickFilters.items.${chip.key}`)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 2. RESULTS GRID */}
      <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-8">
        <div className="flex items-center justify-between pb-4">
          <div className="font-mono text-xs font-bold uppercase tracking-wider text-slate-600">
            {t("explore.results.showing", { n: filtered.length })}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-slate-400/40 bg-white/60 p-12 text-center backdrop-blur-xl">
            <span className="text-4xl">🔎</span>
            <p className="mt-3 text-base font-semibold text-slate-800">
              {t("explore.results.empty")}
            </p>
            <button
              onClick={() => {
                setDraftQ("");
                setDraftCity("");
                setDraftIndustry("All");
                applySearch({ q: "", city: "", industry: "All" });
              }}
              className="mt-5 inline-flex rounded-xl border border-lime-300/80 bg-lime-100 px-4 py-2 font-mono text-xs font-bold text-lime-950 hover:bg-lime-200"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                  className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-400/40 bg-white/70 p-4 shadow-sm backdrop-blur-xl transition hover:-translate-y-1 hover:border-slate-400/80 hover:bg-white/95 hover:shadow-md"
                >
                  <div>
                    {/* Media container */}
                    <div className="relative h-56 w-full overflow-hidden rounded-2xl bg-slate-200">
                      {heroImage ? (
                        <img
                          src={heroImage}
                          alt={t("explore.card.heroAlt", { name: b.name })}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : b.logoUrl ? (
                        <div className="flex h-full w-full items-center justify-center bg-white">
                          <img
                            src={b.logoUrl}
                            alt={t("explore.card.logoAlt", { name: b.name })}
                            className="h-24 w-24 rounded-2xl object-cover shadow-sm"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
                          <span className="font-mono text-4xl font-extrabold text-slate-500">
                            {b.name?.charAt(0)?.toUpperCase() || "S"}
                          </span>
                        </div>
                      )}

                      {b.heroTag ? (
                        <div className="absolute left-3 top-3">
                          <span className="rounded-lg border border-lime-300/80 bg-lime-100/90 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-lime-950 backdrop-blur-sm shadow-xs">
                            {b.heroTag}
                          </span>
                        </div>
                      ) : null}

                      {/* Rating pill */}
                      <div className="absolute bottom-3 right-3 rounded-xl border border-slate-300/80 bg-white/90 px-2.5 py-1 font-mono text-xs font-bold text-slate-900 shadow-sm backdrop-blur-sm">
                        {(b.ratingCount ?? 0) > 0 ? (
                          <span className="flex items-center gap-1">
                            <span className="text-amber-500">★</span>
                            {Number(b.ratingAvg ?? 0).toFixed(1)} (
                            {Number(b.ratingCount ?? 0)})
                          </span>
                        ) : (
                          <span>{t("explore.card.noReviewsShort")}</span>
                        )}
                      </div>
                    </div>

                    {/* Business Details */}
                    <div className="mt-4">
                      <h3 className="truncate text-xl font-bold tracking-tight text-slate-900 group-hover:text-black">
                        {b.name}
                      </h3>

                      <p className="mt-1 flex items-center gap-1 font-mono text-xs text-slate-600">
                        <span>📍</span>
                        <span>{b.city ?? t("explore.card.cityFallback")}</span>
                        {b.country ? <span>, {b.country}</span> : null}
                      </p>

                      {/* Services preview */}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {serviceTags.length > 0 ? (
                          serviceTags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-lg border border-slate-300/70 bg-slate-100/80 px-2 py-0.5 font-mono text-[11px] font-medium text-slate-700"
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
                    </div>
                  </div>

                  {/* Card bottom / Next Slot or Starting Price */}
                  <div className="mt-5 border-t border-slate-300/70 pt-3.5 flex items-center justify-between">
                    <div>
                      {nextSlot ? (
                        <div className="flex items-center gap-1.5 text-xs text-slate-700">
                          <span className="h-2 w-2 rounded-full bg-lime-600 animate-pulse" />
                          <span>{t("explore.card.nextSlot")}:</span>
                          <span className="font-mono font-bold text-slate-900">
                            {t(
                              `explore.card.nextSlotValues.${nextSlot.labelKey}`,
                            )}
                          </span>
                        </div>
                      ) : startingPrice ? (
                        <div className="text-xs text-slate-600">
                          <span>{t("explore.card.startingAt")} </span>
                          <span className="font-mono font-bold text-slate-900">
                            {startingPrice.price} {startingPrice.currency}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-slate-600">
                          {t("explore.card.viewDetails")}
                        </span>
                      )}
                    </div>

                    <span className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-3.5 py-1.5 font-mono text-xs font-bold text-white shadow-xs transition hover:bg-slate-800">
                      {t("explore.card.viewStudio")} →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. PARTNERSHIP & INSIGHT BENTO ROW */}
      <section className="mx-auto mt-12 max-w-7xl px-4 sm:px-8">
        <div className="grid gap-6 xl:grid-cols-3">
          {/* Partnership Banner */}
          <div className="group relative overflow-hidden rounded-3xl border border-slate-400/40 bg-slate-900/95 p-6 text-white shadow-xl backdrop-blur-2xl sm:p-8 xl:col-span-2">
            <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-lime-400/15 blur-[100px] pointer-events-none" />

            <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center">
              <div className="flex-1">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-lime-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime-400" />
                  {t("explore.partnership.badge")}
                </div>

                <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                  {t("explore.partnership.title")}
                </h2>

                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  {t("explore.partnership.description")}
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link
                    href={`/${locale}/register`}
                    className="inline-flex items-center justify-center rounded-2xl border border-lime-300/80 bg-lime-100 px-5 py-2.5 font-mono text-xs font-bold text-lime-950 shadow-xs transition hover:bg-lime-200 active:scale-95"
                  >
                    {t("explore.partnership.primaryCta")}
                  </Link>

                  <Link
                    href={`/${locale}/tools`}
                    className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-slate-300 transition hover:text-white"
                  >
                    <span>{t("explore.partnership.secondaryCta")}</span>
                    <span>↗</span>
                  </Link>
                </div>
              </div>

              <div className="relative min-h-[200px] w-full flex-1 overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-800">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDVmqGopDmuMgjLzDKFoSYqarLfMFVGkBW2pQZyX4Mx67eBYZ0xpvwhw_ABexUHQVCLdnmc3S0zP3VwBDShOE65ZJXg2ks7SkiQU1obV6bALXISJ6jpiKqVFsRXgI849ohXXd9hlZrt6EM2zAO72nupkLSsEf2UbjFasuU1dr9QD9TXQHrZAoCejDqJCGCVXYeW2BmtnyLSbZSbntV7EIo6mkIDceuw7GUOC2vAMtmcavdNW_WXEm6Nm-dABH3UetNq_OQ3GNDbb_zE"
                  alt={t("explore.partnership.imageAlt")}
                  className="h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
            </div>
          </div>

          {/* Featured Insight Card */}
          {featuredInsight ? (
            <div className="flex h-full flex-col justify-between rounded-3xl border border-lime-300/80 bg-lime-100 p-6 text-slate-900 shadow-md sm:p-8">
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-lime-800">
                  {featuredInsight.eyebrow}
                </span>

                <h3 className="mt-2 text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl">
                  {featuredInsight.title}
                </h3>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between rounded-2xl border border-lime-200/80 bg-white/70 p-3.5 backdrop-blur-sm">
                    <span className="text-xs font-semibold text-slate-700">
                      {featuredInsight.metric1Label}
                    </span>
                    <span className="font-mono text-xs font-bold text-lime-950">
                      {featuredInsight.metric1Value}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-lime-200/80 bg-white/70 p-3.5 backdrop-blur-sm">
                    <span className="text-xs font-semibold text-slate-700">
                      {featuredInsight.metric2Label}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-950">
                      {featuredInsight.metric2Value}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                href={featuredInsight.href}
                className="mt-6 inline-flex items-center justify-between rounded-2xl bg-slate-900 px-5 py-3 font-mono text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-95"
              >
                <span>{featuredInsight.cta}</span>
                <span>↗</span>
              </Link>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
