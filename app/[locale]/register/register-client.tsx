"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/use-locale";

const CATEGORY_OPTIONS = [
  "Beauty & care",
  "Wellness & lifestyle",
  "Creative services",
  "Home & local",
  "Education & professionals"
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

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export default function RegisterClient() {
  const locale = useLocale("en");
  const router = useRouter();

  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] =
    useState<(typeof CATEGORY_OPTIONS)[number]>("Beauty & care");

  const [city, setCity] = useState("Tallinn");
  const [country, setCountry] = useState("EE");


  const [street, setStreet] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");

  const suggestedSlug = useMemo(() => slugify(businessName), [businessName]);
  const [slug, setSlug] = useState("");
  const finalSlug = slug.trim() ? slugify(slug) : suggestedSlug;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // ✅ logo upload (optional)
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);

  async function uploadLogoIfAny(): Promise<string | undefined> {
    if (!logoFile) return undefined;

    setLogoUploading(true);
    try {
      const form = new FormData();
      form.append("file", logoFile);

      const res = await fetch("/api/uploads/logo", {
        method: "POST",
        body: form
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Logo upload failed.");

      return data.url as string;
    } finally {
      setLogoUploading(false);
    }
  }

  function validate() {
    const bn = businessName.trim();
    const ct = city.trim();
    const cc = country.trim();
    const st = street.trim();

    if (!bn) return "Business name is required.";
    if (!finalSlug) return "Booking slug is required.";
    if (!ct) return "City is required.";
    if (!cc || cc.length < 2) return "Country code is required (e.g. EE).";
    

    const em = email.trim();
    if (!em || !isValidEmail(em)) return "Please enter a valid email.";

    if (password.length < 8) return "Password must be at least 8 characters.";
    if (password !== confirmPassword) return "Passwords do not match.";

    // optional logo checks
    if (logoFile) {
      const maxBytes = 2 * 1024 * 1024; // 2MB
      if (logoFile.size > maxBytes) return "Logo too large (max 2MB).";

      const allowed = new Set([
        "image/png",
        "image/jpeg",
        "image/webp",
        "image/svg+xml"
      ]);
      if (!allowed.has(logoFile.type)) return "Unsupported logo file type.";
    }

    return null;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || logoUploading) return;

    const err = validate();
    if (err) return alert(err);

    setLoading(true);
    try {
      // 1) upload logo (if any)
      const logoUrl = await uploadLogoIfAny();

      // 2) create business
      const res = await fetch("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: businessName.trim(),
          slug: finalSlug,
          category,
          city: city.trim(),
          country: country.trim(),
          street: street.trim(),
          postalCode: postalCode.trim() || undefined, // ✅ optional
          website: website.trim() || undefined,
          ownerEmail: email.trim(),
          ownerPassword: password,
          logoUrl // ✅ optional
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) return alert(data.error || "Failed to create account.");

      // ✅ redirect based on category readiness
      if (category !== "Beauty & care") {
        router.push(
          `/${locale}/coming-soon?category=${encodeURIComponent(category)}`
        );
        return;
      }

      router.push(`/${locale}/dashboard`);
    } catch (e: any) {
      alert(e?.message || "Network error. Try again.");
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
              <p className="text-sm font-medium text-slate-600">Slottick</p>
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
                Category
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
                  onChange={(e) => setCountry(e.target.value.toUpperCase())}
                  placeholder="EE"
                  required
                />
              </label>
            </div>

            {/* ✅ new fields after city & country */}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1 text-sm">
                Street (optional)
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="e.g. Pärnu mnt 10"
                  
                />
              </label>

              <label className="grid gap-1 text-sm">
                Postal code (optional)
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="e.g. 10145"
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

            {/* ✅ Logo upload (optional) */}
            <div className="grid gap-2">
              <label className="grid gap-1 text-sm">
                Logo (optional)
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setLogoFile(f);

                    if (!f) {
                      setLogoPreview("");
                      return;
                    }

                    const url = URL.createObjectURL(f);
                    setLogoPreview(url);
                  }}
                />
              </label>

              {logoPreview ? (
                <div className="flex items-center gap-3">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="h-14 w-14 rounded-2xl border border-slate-200 object-cover"
                  />
                  <button
                    type="button"
                    className="text-sm underline text-slate-600"
                    onClick={() => {
                      setLogoFile(null);
                      setLogoPreview("");
                    }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  Shows on Explore after listing. Best: square, ≤ 2MB.
                </p>
              )}
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
              disabled={loading || logoUploading}
              className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {logoUploading
                ? "Uploading logo..."
                : loading
                  ? "Creating..."
                  : "Create account"}
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
