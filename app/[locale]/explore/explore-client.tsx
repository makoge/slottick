"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  BusinessCategory,
  BusinessDirectoryItem
} from "@/lib/business-directory";
import { useLocale } from "@/lib/use-locale";
import { useSearchParams } from "next/navigation";

function Stars({ value }: { value: number }) {
  const rounded = Math.max(0, Math.min(5, Math.round(value))); // 0..5
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < rounded;
        return (
          <span
            key={i}
            className={[
              "text-sm",
              filled ? "text-slate-900" : "text-slate-300"
            ].join(" ")}
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
  categories,
  heading = "Book trusted businesses",
  intro = "Find services near you and book instantly.",
  defaultCity = ""
}: {
  businesses: BusinessDirectoryItem[];
  categories: BusinessCategory[];
  heading?: string;
  intro?: string;
  defaultCity?: string; // "" = All cities
}) {
  const locale = useLocale("en");
  const sp = useSearchParams();

  const qParam = (sp.get("q") ?? "").trim();
  const cityParam = (sp.get("city") ?? "").trim();
  const catParam = (sp.get("category") ?? "").trim();

  const [q, setQ] = useState("");
  const [city, setCity] = useState(defaultCity);
  const [cat, setCat] = useState<BusinessCategory | "All">("All");

  // Initialize from URL once params/data are available
  useEffect(() => {
    // q
    if (qParam) setQ(qParam);

    // city: only accept if it exists in businesses (case-insensitive)
    if (cityParam) {
      const found = businesses.find(
        (b) => String(b.city || "").toLowerCase() === cityParam.toLowerCase()
      );
      if (found?.city) setCity(found.city);
    } else if (defaultCity) {
      setCity(defaultCity);
    }

    // category: allow only All or valid category
    if (catParam) {
      const isAll = catParam.toLowerCase() === "all";
      if (isAll) setCat("All");
      else if (categories.includes(catParam as any)) setCat(catParam as any);
    }
  }, [qParam, cityParam, catParam, businesses, categories, defaultCity]);

  const cities = useMemo(() => {
    const set = new Set(
      (businesses ?? []).map((b) => b.city).filter((x): x is string => !!x)
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [businesses]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return (businesses ?? [])
      .filter((b) => (city ? b.city === city : true))
      .filter((b) => (cat === "All" ? true : b.category === cat))
      .filter((b) => {
        if (!query) return true;

        const name = String(b.name ?? "").toLowerCase();
        const category = String(b.category ?? "").toLowerCase();
        const city0 = String(b.city ?? "").toLowerCase();
        const country = String(b.country ?? "").toLowerCase();

        return (
          name.includes(query) ||
          category.includes(query) ||
          city0.includes(query) ||
          country.includes(query)
        );
      })
      .sort((a, b) => (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0));
  }, [businesses, q, city, cat]);

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">
              Slottick • Services
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">{heading}</h1>
            <p className="mt-2 text-slate-600">{intro}</p>

            <p className="mt-4 max-w-3xl text-sm text-slate-600">
              Search and book popular services like barbering, hair salons, nail
              salons, lash extensions, brow studios, massage, skincare and more.
              Filter by city and category to find the best local option.
            </p>
          </div>

          <a
            href={`/${locale}/register`}
            className="w-fit rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            List your business
          </a>
        </header>

        {/* Filters */}
        <section className="mt-8 rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="grid gap-1 text-sm">
              Search
              <input
                className="rounded-xl border border-slate-200 px-3 py-2"
                placeholder="e.g. nails, barber, Tallinn..."
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
              Category
              <select
                className="rounded-xl border border-slate-200 px-3 py-2"
                value={cat}
                onChange={(e) => setCat(e.target.value as any)}
              >
                <option value="All">All</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {/* Results */}
        <section className="mt-8">
          <div className="mb-3 text-sm text-slate-600">
            Showing{" "}
            <span className="font-semibold text-slate-900">
              {filtered.length}
            </span>{" "}
            businesses
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 p-6 text-slate-600">
              No businesses found. Try another city or category.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((b) => (
                <a
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
                        <div className="h-12 w-12 rounded-xl border border-slate-200 bg-slate-100" />
                      )}

                      <div>
                        <div className="text-lg font-semibold">{b.name}</div>
                        <div className="mt-1 text-sm text-slate-600">
                          {b.category} • {b.city}, {b.country}
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
                      <Stars value={b.ratingAvg ?? 0} />
                      <div className="mt-1 text-xs text-slate-500">
                        {b.ratingCount ?? 0} reviews
                      </div>
                    </div>

                    <span className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold group-hover:bg-white">
                      Book
                    </span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
