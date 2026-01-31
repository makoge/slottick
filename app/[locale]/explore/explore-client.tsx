"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/lib/use-locale";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type ExploreBusinessItem = {
  slug: string;
  name: string;
  industry?: string | null; // enum value from DB
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

const INDUSTRY_LABELS: Record<IndustryKey, string> = {
  BEAUTY_AND_CARE: "Beauty & care",
  WELLNESS_AND_LIFESTYLE: "Wellness & lifestyle",
  CREATIVE_SERVICES: "Creative services",
  HOME_AND_LOCAL: "Home & local",
  EDUCATION_AND_PROFESSIONALS: "Education & professionals"
};

function isIndustryKey(x: unknown): x is IndustryKey {
  return typeof x === "string" && x in INDUSTRY_LABELS;
}

function toIndustryKeyOrAll(input: unknown): IndustryKey | "All" {
  const raw = String(input ?? "").trim();
  if (!raw || raw === "All") return "All";
  if (isIndustryKey(raw)) return raw;

  // accept pretty labels too (if user shares old URLs)
  const reverse = Object.entries(INDUSTRY_LABELS).find(([, label]) => label === raw);
  return (reverse?.[0] as IndustryKey) ?? "All";
}

function industryLabel(x: string | null | undefined) {
  if (!x) return "Industry";
  return isIndustryKey(x) ? INDUSTRY_LABELS[x] : x; // fallback
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
  industries, // pass enum keys like ["BEAUTY_AND_CARE", ...]
  heading = "Book trusted businesses",
  intro = "Find services near you and book instantly.",
  defaultCity = "",
  initialQ = "",
  initialCity = "",
  initialIndustry = "All"
}: {
  businesses: ExploreBusinessItem[];
  industries: string[]; // IndustryKey[] from server, but keep as string[] to be flexible
  heading?: string;
  intro?: string;
  defaultCity?: string;
  initialQ?: string;
  initialCity?: string;
  initialIndustry?: string | "All";
}) {
  const locale = useLocale("en");
  const router = useRouter();
  const sp = useSearchParams();

  const [q, setQ] = useState(initialQ);
  const [city, setCity] = useState(initialCity || defaultCity);

  // ✅ store enum value (not label)
  const [industry, setIndustry] = useState<IndustryKey | "All">(
    toIndustryKeyOrAll(initialIndustry)
  );

  const cities = useMemo(() => {
    const set = new Set(
      (businesses ?? []).map((b) => b.city).filter((x): x is string => !!x)
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [businesses]);

  // ✅ dropdown options as enum keys, displayed as labels
  const industryOptions = useMemo(() => {
    const keys = (industries ?? []).filter(isIndustryKey) as IndustryKey[];
    const unique = Array.from(new Set(keys));
    unique.sort((a, b) => INDUSTRY_LABELS[a].localeCompare(INDUSTRY_LABELS[b]));
    return unique;
  }, [industries]);

  useEffect(() => {
    const next = new URLSearchParams(sp.toString());

    if (q.trim()) next.set("q", q.trim());
    else next.delete("q");

    if (city.trim()) next.set("city", city.trim());
    else next.delete("city");

    if (industry !== "All") next.set("industry", industry); // ✅ enum in URL
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
        return (
          name.includes(query) ||
          ind.includes(query) ||
          city0.includes(query) ||
          country.includes(query)
        );
      })
      .sort((a, b) => Number(b.ratingAvg ?? 0) - Number(a.ratingAvg ?? 0));
  }, [businesses, q, city, industry]);

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">Slottick • Explore</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">{heading}</h1>
            <p className="mt-2 text-slate-600">{intro}</p>

            <p className="mt-4 max-w-3xl text-sm text-slate-600">
              Search businesses by what you need (e.g. “massage”, “tattoo”, “manicure”) and filter by city + industry.
            </p>
          </div>

          <Link
            href={`/${locale}/register`}
            className="w-fit rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            List your business
          </Link>
        </header>

        <section className="mt-8 rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="grid gap-1 text-sm">
              Search
              <input
                className="rounded-xl border border-slate-200 px-3 py-2"
                placeholder="e.g. massage, tattoo, nails, Tallinn..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </label>

            <label className="grid gap-1 text-sm">
              City
              <select
                className="rounded-xl border border-slate-200 px-3 py-2"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              >
                <option value="">All cities</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1 text-sm">
              Industry
              <select
                className="rounded-xl border border-slate-200 px-3 py-2"
                value={industry}
                onChange={(e) => setIndustry(toIndustryKeyOrAll(e.target.value))}
              >
                <option value="All">All</option>
                {industryOptions.map((key) => (
                  <option key={key} value={key}>
                    {INDUSTRY_LABELS[key]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-3 text-sm text-slate-600">
            Showing <span className="font-semibold text-slate-900">{filtered.length}</span> businesses
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 p-6 text-slate-600">
              No businesses found. Try another city/industry or search term.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((b) => (
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
                          alt={`${b.name} logo`}
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
                          {industryLabel(b.industry)} • {b.city ?? "—"}
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
                      <Stars value={Number(b.ratingAvg ?? 0)} />
                      <div className="mt-1 text-xs text-slate-500">{Number(b.ratingCount ?? 0)} reviews</div>
                    </div>

                    <span className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold group-hover:bg-[#7bc043a5]">
                      Book
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
