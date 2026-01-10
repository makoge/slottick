"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Metadata } from "next";
import { useLocale } from "@/lib/use-locale";

export const metadata: Metadata = {
  robots: { index: false, follow: false }
};

const CATEGORY_OPTIONS = [
  "Lash",
  "Nails",
  "Brows",
  "Hair",
  "Barber",
  "Massage",
  "Makeup",
  "Skincare",
  "Tattoo",
  "Fitness",
  "Other"
] as const;

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function RegisterClient() {
  const locale = useLocale("en"); // ✅ single source of truth
  const router = useRouter();

  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] =
    useState<(typeof CATEGORY_OPTIONS)[number]>("Lash");
  const [city, setCity] = useState("Tallinn");
  const [country, setCountry] = useState("EE");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");

  const suggestedSlug = useMemo(() => slugify(businessName), [businessName]);
  const [slug, setSlug] = useState("");
  const finalSlug = slug.trim() ? slugify(slug) : suggestedSlug;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    // validation unchanged …

    setLoading(true);
    try {
      const res = await fetch("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: businessName.trim(),
          slug: finalSlug,
          category,
          city: city.trim(),
          country: country.trim(),
          website: website.trim() || undefined,
          ownerEmail: email.trim(),
          ownerPassword: password
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) return alert(data.error || "Failed to create account.");

      router.push(`/${locale}/dashboard`);
    } catch {
      alert("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-2xl px-6 py-14">
        <section className="rounded-3xl border border-slate-200 p-8 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-600">Slotta</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">
                Create your account
              </h1>
              <p className="mt-2 text-slate-600">
                Create your business profile and get your booking link.
              </p>
            </div>

            <div className="text-right">
              <a className="text-sm underline text-slate-600" href={`/${locale}`}>
                Back
              </a>
              <div className="mt-2 text-sm text-slate-600">
                Already have an account?{" "}
                <a className="font-semibold underline" href={`/${locale}/login`}>
                  Log in
                </a>
              </div>
            </div>
          </div>

          <form onSubmit={submit} className="mt-8 grid gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1 text-sm">
                Business name
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Damino Studio"
                  required
                />
              </label>

              <label className="grid gap-1 text-sm">
                Category (service)
                <select
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1 text-sm">
                City
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Tallinn"
                  required
                />
              </label>

              <label className="grid gap-1 text-sm">
                Country (code)
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="EE"
                  required
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1 text-sm">
                Website (optional)
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://..."
                />
              </label>

              <label className="grid gap-1 text-sm">
                Email (owner)
                <input
                  type="email"
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  required
                />
              </label>
            </div>

            <div className="grid gap-1 text-sm">
              <div className="flex items-center justify-between">
                <label>Booking slug</label>
                <span className="text-xs text-slate-500">
                  Your link: /{locale}/book/{finalSlug || "your-slug"}
                </span>
              </div>
              <input
                className="rounded-xl border border-slate-200 px-3 py-2"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder={suggestedSlug || "damino-studio"}
              />
              <p className="text-xs text-slate-500">
                Leave blank to use the auto-slug from your business name.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1 text-sm">
                Password
                <input
                  type="password"
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </label>

              <label className="grid gap-1 text-sm">
                Confirm password
                <input
                  type="password"
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create account"}
            </button>

            <p className="text-xs text-slate-500">
              Next: add your services + availability and share your booking link.
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
