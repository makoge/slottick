"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale } from "@/lib/use-locale";
import { useMessages } from "@/lib/use-messages";
import { t } from "@/lib/i18n";

type IndustryKey =
  | "BEAUTY_AND_CARE"
  | "WELLNESS_AND_LIFESTYLE(Comming Soon)"
  | "CREATIVE_SERVICES(Comming Soon)"
  | "HOME_AND_LOCAL(Comming Soon)"
  | "EDUCATION_AND_PROFESSIONALS(Comming Soon)";

const INDUSTRY_OPTIONS: { key: IndustryKey; labelKey: string }[] = [
  { key: "BEAUTY_AND_CARE", labelKey: "register.industry.beauty" },
  {
    key: "WELLNESS_AND_LIFESTYLE(Comming Soon)",
    labelKey: "register.industry.wellness",
  },
  {
    key: "CREATIVE_SERVICES(Comming Soon)",
    labelKey: "register.industry.creative",
  },
  { key: "HOME_AND_LOCAL(Comming Soon)", labelKey: "register.industry.home" },
  {
    key: "EDUCATION_AND_PROFESSIONALS(Comming Soon)",
    labelKey: "register.industry.education",
  },
];

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
  const messages = useMessages(locale);

  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState<IndustryKey>("BEAUTY_AND_CARE");

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
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(
          data.error || t(messages, "register.errors.logoUploadFailed"),
        );
      return data.url as string;
    } finally {
      setLogoUploading(false);
    }
  }

  function validate() {
    const bn = businessName.trim();
    const ct = city.trim();
    const cc = country.trim();

    if (!bn) return t(messages, "register.errors.businessNameRequired");
    if (!finalSlug) return t(messages, "register.errors.slugRequired");
    if (!ct) return t(messages, "register.errors.cityRequired");
    if (!cc || cc.length < 2)
      return t(messages, "register.errors.countryRequired");

    const em = email.trim();
    if (!em || !isValidEmail(em))
      return t(messages, "register.errors.emailInvalid");

    if (password.length < 8) return t(messages, "register.errors.passwordMin");
    if (password !== confirmPassword)
      return t(messages, "register.errors.passwordMismatch");

    if (logoFile) {
      const maxBytes = 2 * 1024 * 1024;
      if (logoFile.size > maxBytes)
        return t(messages, "register.errors.logoTooLarge");

      const allowed = new Set([
        "image/png",
        "image/jpeg",
        "image/webp",
        "image/svg+xml",
      ]);
      if (!allowed.has(logoFile.type))
        return t(messages, "register.errors.logoType");
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
      const logoUrl = await uploadLogoIfAny();

      const res = await fetch("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: businessName.trim(),
          slug: finalSlug,
          industry,
          city: city.trim(),
          country: country.trim(),
          street: street.trim(),
          postalCode: postalCode.trim() || undefined,
          website: website.trim() || undefined,
          ownerEmail: email.trim(),
          ownerPassword: password,
          logoUrl,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        return alert(data.error || t(messages, "register.errors.createFailed"));

      if (industry !== "BEAUTY_AND_CARE") {
        router.push(
          `/${locale}/coming-soon?industry=${encodeURIComponent(industry)}`,
        );
        return;
      }

      router.push(`/${locale}/dashboard`);
    } catch (e: any) {
      alert(e?.message || t(messages, "register.errors.network"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] w-full items-center justify-center px-4 py-12 sm:px-6">
      {/* Ambient background blur circles */}
      <div className="pointer-events-none absolute -top-12 h-72 w-72 rounded-full bg-lime-200/40 blur-3xl pointer-events-none" />
      <div className="pointer-events-none absolute -bottom-12 h-72 w-72 rounded-full bg-slate-400/30 blur-3xl pointer-events-none" />

      {/* Main Container Card */}
      <div className="relative z-10 w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-400/40 bg-white/75 p-6 shadow-xl backdrop-blur-2xl sm:p-10">
        {/* Header with Brand Tick */}
        <div className="flex flex-col gap-4 border-b border-slate-300/70 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-lime-300/80 bg-lime-100 font-mono text-xs font-bold text-lime-950 shadow-xs">
                ✓
              </span>
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
                {t(messages, "brand.name")} Account Onboarding
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              {t(messages, "register.title")}
            </h1>
            <p className="mt-1 text-xs text-slate-600 sm:text-sm">
              {t(messages, "register.subtitle")}
            </p>
          </div>

          <div className="flex items-center gap-3 sm:flex-col sm:items-end">
            <Link
              href={`/${locale}`}
              className="rounded-xl border border-slate-300/80 bg-white/80 px-3 py-1.5 font-mono text-xs font-semibold text-slate-600 shadow-2xs backdrop-blur-sm transition-all hover:bg-white hover:text-slate-950"
            >
              {t(messages, "register.back")}
            </Link>
            <div className="font-mono text-xs text-slate-600">
              {t(messages, "register.haveAccount")}{" "}
              <Link
                className="font-bold text-slate-900 underline underline-offset-2 hover:text-black"
                href={`/${locale}/login`}
              >
                {t(messages, "register.login")}
              </Link>
            </div>
          </div>
        </div>

        {/* Onboarding Form */}
        <form onSubmit={submit} className="mt-8 space-y-6">
          {/* Section 1: Business Profile */}
          <div className="space-y-4">
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
              1. Business Overview
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700">
                  {t(messages, "register.fields.businessName")} *
                </label>
                <input
                  className="h-11 w-full rounded-2xl border border-slate-300/80 bg-white/90 px-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:bg-white focus:outline-none"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder={t(
                    messages,
                    "register.placeholders.businessName",
                  )}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700">
                  {t(messages, "register.fields.category")}
                </label>
                <select
                  className="h-11 w-full rounded-2xl border border-slate-300/80 bg-white/90 px-4 font-mono text-xs font-semibold text-slate-900 focus:border-slate-800 focus:bg-white focus:outline-none"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value as IndustryKey)}
                >
                  {INDUSTRY_OPTIONS.map((o) => (
                    <option key={o.key} value={o.key}>
                      {t(messages, o.labelKey)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Location Details */}
          <div className="space-y-4 border-t border-slate-200/80 pt-6">
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
              2. Studio & Location
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700">
                  {t(messages, "register.fields.city")} *
                </label>
                <input
                  className="h-11 w-full rounded-2xl border border-slate-300/80 bg-white/90 px-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:bg-white focus:outline-none"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={t(messages, "register.placeholders.city")}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700">
                  {t(messages, "register.fields.country")} *
                </label>
                <input
                  className="h-11 w-full rounded-2xl border border-slate-300/80 bg-white/90 px-4 font-mono text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:bg-white focus:outline-none"
                  value={country}
                  onChange={(e) => setCountry(e.target.value.toUpperCase())}
                  placeholder="EE"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700">
                  {t(messages, "register.fields.street")}
                </label>
                <input
                  className="h-11 w-full rounded-2xl border border-slate-300/80 bg-white/90 px-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:bg-white focus:outline-none"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder={t(messages, "register.placeholders.street")}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700">
                  {t(messages, "register.fields.postalCode")}
                </label>
                <input
                  className="h-11 w-full rounded-2xl border border-slate-300/80 bg-white/90 px-4 font-mono text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:bg-white focus:outline-none"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder={t(messages, "register.placeholders.postalCode")}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Web & Contact */}
          <div className="space-y-4 border-t border-slate-200/80 pt-6">
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
              3. Web & Direct Link
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700">
                  {t(messages, "register.fields.website")}
                </label>
                <input
                  className="h-11 w-full rounded-2xl border border-slate-300/80 bg-white/90 px-4 font-mono text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:bg-white focus:outline-none"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700">
                  {t(messages, "register.fields.email")} *
                </label>
                <input
                  type="email"
                  className="h-11 w-full rounded-2xl border border-slate-300/80 bg-white/90 px-4 font-mono text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:bg-white focus:outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t(messages, "register.placeholders.email")}
                  required
                />
              </div>
            </div>

            {/* Custom URL Slug Box */}
            <div className="rounded-2xl border border-slate-300/80 bg-slate-100/70 p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <label className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700">
                  {t(messages, "register.fields.slug")}
                </label>
                <span className="font-mono text-[11px] font-semibold text-lime-950">
                  slottick.com/{locale}/book/{finalSlug || "your-slug"}
                </span>
              </div>

              <input
                className="mt-2 h-11 w-full rounded-xl border border-slate-300/80 bg-white px-4 font-mono text-sm font-medium text-slate-900 focus:border-slate-800 focus:outline-none"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder={suggestedSlug || "studio-name"}
              />
              <p className="mt-1.5 font-mono text-[11px] text-slate-500">
                {t(messages, "register.slugHint")}
              </p>
            </div>

            {/* Brand Logo Upload */}
            <div className="rounded-2xl border border-slate-300/80 bg-slate-100/70 p-4">
              <label className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700">
                {t(messages, "register.fields.logo")}
              </label>

              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="mt-2 block w-full text-xs text-slate-500 file:mr-4 file:rounded-xl file:border file:border-lime-300/80 file:bg-lime-100 file:px-4 file:py-2 file:font-mono file:text-xs file:font-bold file:text-lime-950 file:shadow-2xs hover:file:bg-lime-200"
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

              {logoPreview ? (
                <div className="mt-3 flex items-center gap-3">
                  <img
                    src={logoPreview}
                    alt={t(messages, "register.logoPreviewAlt")}
                    className="h-14 w-14 rounded-xl border border-slate-300/80 object-cover shadow-2xs"
                  />
                  <button
                    type="button"
                    className="font-mono text-xs font-semibold text-rose-600 underline hover:text-rose-800"
                    onClick={() => {
                      setLogoFile(null);
                      setLogoPreview("");
                    }}
                  >
                    {t(messages, "register.remove")}
                  </button>
                </div>
              ) : (
                <p className="mt-1 font-mono text-[11px] text-slate-500">
                  {t(messages, "register.logoHint")}
                </p>
              )}
            </div>
          </div>

          {/* Section 4: Security */}
          <div className="space-y-4 border-t border-slate-200/80 pt-6">
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
              4. Security Credentials
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700">
                  {t(messages, "register.fields.password")} *
                </label>
                <input
                  type="password"
                  className="h-11 w-full rounded-2xl border border-slate-300/80 bg-white/90 px-4 font-mono text-sm text-slate-900 focus:border-slate-800 focus:bg-white focus:outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700">
                  {t(messages, "register.fields.confirmPassword")} *
                </label>
                <input
                  type="password"
                  className="h-11 w-full rounded-2xl border border-slate-300/80 bg-white/90 px-4 font-mono text-sm text-slate-900 focus:border-slate-800 focus:bg-white focus:outline-none"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                />
              </div>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading || logoUploading}
              className="flex w-full items-center justify-center rounded-2xl border border-lime-300/80 bg-lime-100 px-6 py-4 font-mono text-sm font-bold uppercase tracking-wider text-lime-950 shadow-xs transition hover:bg-lime-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {logoUploading
                ? t(messages, "register.states.uploadingLogo")
                : loading
                  ? t(messages, "register.states.creating")
                  : t(messages, "register.states.createAccount")}
            </button>
            <p className="mt-2 text-center font-mono text-[11px] text-slate-500">
              {t(messages, "register.nextHint")}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
