"use client";

import { useMemo, useState } from "react";
import type { BusinessCategory, BusinessDirectoryItem } from "@/lib/business-directory";

function Stars({ value }: { value: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const total = 5;

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }).map((_, i) => {
        const idx = i + 1;
        const filled = idx <= full;
        const isHalf = !filled && half && idx === full + 1;

        return (
          <span
            key={i}
            className={[
              "text-sm",
              filled ? "text-slate-900" : "text-slate-300"
            ].join(" ")}
            aria-hidden
          >
            {isHalf ? "★" : "★"}
          </span>
        );
      })}
      <span className="ml-2 text-sm font-semibold text-slate-900">{value.toFixed(1)}</span>
    </div>
  );
}

export default function ExploreClient({
  locale,
  businesses,
  categories
}: {
  locale: string;
  businesses: BusinessDirectoryItem[];
  categories: BusinessCategory[];
}) {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("Tallinn");
  const [cat, setCat] = useState<BusinessCategory | "All">("All");

  const cities = useMemo(() => {
    const set = new Set(businesses.map((b) => b.city));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [businesses]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return businesses
      .filter((b) => (city ? b.city === city : true))
      .filter((b) => (cat === "All" ? true : b.category === cat))
      .filter((b) => {
        if (!query) return true;
        return (
          b.name.toLowerCase().includes(query) ||
          b.category.toLowerCase().includes(query) ||
          b.city.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => b.ratingAvg - a.ratingAvg);
  }, [businesses, q, city, cat]);

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">Slottick • Services</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Book trusted businesses
            </h1>
            <p className="mt-2 text-slate-600">
              Find services near you and book instantly.
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
                placeholder="e.g. lashes, nails, Tallinn..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </label>

            <label className="grid gap-1 text-sm">
              Near you (city)
              <select
                className="rounded-xl border border-slate-200 px-3 py-2"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              >
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
            Showing <span className="font-semibold text-slate-900">{filtered.length}</span> businesses
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
                    <div>
                      <div className="text-lg font-semibold">{b.name}</div>
                      <div className="mt-1 text-sm text-slate-600">
                        {b.category} • {b.city}, {b.country}
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
                      <Stars value={b.ratingAvg} />
                      <div className="mt-1 text-xs text-slate-500">
                        {b.ratingCount} reviews
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
