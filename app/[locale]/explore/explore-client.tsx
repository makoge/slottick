"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLocale } from "@/lib/use-locale";

type ExploreBusinessItem = {
  slug: string;
  name: string;
  industry?: string | null; // enum key in DB (Industry)
  city?: string | null;
  country?: string | null;
  ratingAvg?: number | null;
  ratingCount?: number | null;
  heroTag?: string | null;
  logoUrl?: string | null;
};

type IndustryKey =
  | "BEAUTY_AND_CARE"
  | "WELLNESS_AND_LIFESTYLE"
  | "CREATIVE_SERVICES"
  | "HOME_AND_LOCAL"
  | "EDUCATION_AND_PROFESSIONALS";

type Dict = Record<string, any>;

function getPath(obj: any, path: string) {
  return path.split(".").reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined), obj);
}

function interpolate(str: string, vars?: Record<string, string | number>) {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

function isIndustryKey(x: unknown): x is IndustryKey {
  return typeof x === "string" && x in {
    BEAUTY_AND_CARE: 1,
    WELLNESS_AND_LIFESTYLE: 1,
    CREATIVE_SERVICES: 1,
    HOME_AND_LOCAL: 1,
    EDUCATION_AND_PROFESSIONALS: 1
  };
}

/** Accept enum key or legacy label values in URL */
function toIndustryKeyOrAll(input: unknown): IndustryKey | "All" {
  const raw = String(input ?? "").trim();
  if (!raw || raw === "All") return "All";
  if (isIndustryKey(raw)) return raw;

  // legacy labels (EN + FR) -> enum keys
  const legacy: Record<string, IndustryKey> = {
    // EN
    "Beauty & care": "BEAUTY_AND_CARE",
    "Wellness & lifestyle": "WELLNESS_AND_LIFESTYLE",
    "Creative services": "CREATIVE_SERVICES",
    "Home & local": "HOME_AND_LOCAL",
    "Education & professionals": "EDUCATION_AND_PROFESSIONALS",
    // FR
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

export default function ExploreClient({
  businesses,
  industries, // enum keys, e.g. ["BEAUTY_AND_CARE", ...]
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

  const [q, setQ] = useState(initialQ);
  const [city, setCity] = useState(initialCity || defaultCity);

  // store enum key in state + URL
  const [industry, setIndustry] = useState<IndustryKey | "All">(toIndustryKeyOrAll(initialIndustry));

  const cities = useMemo(() => {
    const set = new Set((businesses ?? []).map((b) => b.city).filter((x): x is string => !!x));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [businesses]);

  const industryOptions = useMemo(() => {
    const keys = (industries ?? []).filter(isIndustryKey) as IndustryKey[];
    const unique = Array.from(new Set(keys));
    // sort by translated label
    unique.sort((a, b) =>
      t(`explore.industries.${a}`).localeCompare(t(`explore.industries.${b}`))
    );
    return unique;
  }, [industries, dict]); // dict affects sort labels

  // keep URL in sync (q/city/industry)
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
        return name.includes(query) || ind.includes(query) || city0.includes(query) || country.includes(query);
      })
      .sort((a, b) => Number(b.ratingAvg ?? 0) - Number(a.ratingAvg ?? 0));
  }, [businesses, q, city, industry]);

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

        <section className="mt-8 rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="grid gap-1 text-sm">
              {t("explore.filters.search")}
              <input
                className="rounded-xl border border-slate-200 px-3 py-2"
                placeholder={t("explore.filters.searchPlaceholder")}
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </label>

            <label className="grid gap-1 text-sm">
              {t("explore.filters.city")}
              <select
                className="rounded-xl border border-slate-200 px-3 py-2"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              >
                <option value="">{t("explore.filters.allCities")}</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1 text-sm">
              {t("explore.filters.industry")}
              <select
                className="rounded-xl border border-slate-200 px-3 py-2"
                value={industry}
                onChange={(e) => setIndustry(toIndustryKeyOrAll(e.target.value))}
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
        </section>

        <section className="mt-8">
          <div className="mb-3 text-sm text-slate-600">
            {t("explore.results.showing", { n: filtered.length })}{" "}
            <span className="font-semibold text-slate-900" />
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 p-6 text-slate-600">
              {t("explore.results.empty")}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((b) => {
                const industryLabel = b.industry && isIndustryKey(b.industry)
                  ? t(`explore.industries.${b.industry}`)
                  : t("explore.card.industryFallback");

                return (
                  <Link
                    key={b.slug}
                    href={`/${locale}/book/${b.slug}`}
                    className="group rounded-2xl border border-slate-200 p-5 shadow-sm transition hover:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        {b.logoUrl ? (
                          <img
                            src={b.logoUrl}
                            alt={t("explore.card.logoAlt", { name: b.name })}
                            className="h-12 w-12 rounded-xl border border-slate-200 object-cover bg-white"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-sm font-semibold text-slate-400">
                            {b.name?.charAt(0)?.toUpperCase() || "S"}
                          </div>
                        )}

                        <div>
                          <div className="text-lg font-semibold">{b.name}</div>
                          <div className="mt-1 text-sm text-slate-600">
                            {industryLabel} • {b.city ?? t("explore.card.cityFallback")}
                            {b.country ? `, ${b.country}` : ""}
                          </div>
                        </div>
                      </div>

                      {b.heroTag ? (
                        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                          {b.heroTag}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div>
  {(b.ratingCount ?? 0) > 0 ? (
    <>
      <Stars value={Number(b.ratingAvg ?? 0)} />
      <div className="mt-1 text-xs text-slate-500">
        {t("explore.card.reviews", { n: Number(b.ratingCount ?? 0) })}
      </div>
    </>
  ) : (
    <div className="text-sm font-semibold text-slate-500">No reviews yet</div>
  )}
</div>

                      <span className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold group-hover:bg-slate-50">
                        {t("explore.card.book")}
                      </span>
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
