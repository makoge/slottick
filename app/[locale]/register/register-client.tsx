"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  { key: "WELLNESS_AND_LIFESTYLE(Comming Soon)", labelKey: "register.industry.wellness" },
  { key: "CREATIVE_SERVICES(Comming Soon)", labelKey: "register.industry.creative" },
  { key: "HOME_AND_LOCAL(Comming Soon)", labelKey: "register.industry.home" },
  { key: "EDUCATION_AND_PROFESSIONALS(Comming Soon)", labelKey: "register.industry.education" }
  
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
  const messages = useMessages(locale); // ✅ pass locale so it loads correct json

  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState<IndustryKey>("BEAUTY_AND_CARE"); // ✅ stable key

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

      const res = await fetch("/api/uploads/logo", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t(messages, "register.errors.logoUploadFailed"));
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
    if (!cc || cc.length < 2) return t(messages, "register.errors.countryRequired");

    const em = email.trim();
    if (!em || !isValidEmail(em)) return t(messages, "register.errors.emailInvalid");

    if (password.length < 8) return t(messages, "register.errors.passwordMin");
    if (password !== confirmPassword) return t(messages, "register.errors.passwordMismatch");

    if (logoFile) {
      const maxBytes = 2 * 1024 * 1024;
      if (logoFile.size > maxBytes) return t(messages, "register.errors.logoTooLarge");

      const allowed = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);
      if (!allowed.has(logoFile.type)) return t(messages, "register.errors.logoType");
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
          industry, // ✅ stable enum key now
          city: city.trim(),
          country: country.trim(),
          street: street.trim(),
          postalCode: postalCode.trim() || undefined,
          website: website.trim() || undefined,
          ownerEmail: email.trim(),
          ownerPassword: password,
          logoUrl
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) return alert(data.error || t(messages, "register.errors.createFailed"));

      if (industry !== "BEAUTY_AND_CARE") {
        router.push(`/${locale}/coming-soon?industry=${encodeURIComponent(industry)}`);
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
    <main className="min-h-screen bg-white/10 text-slate-900">
      <div className="mx-auto max-w-2xl px-6 py-14">
        <section className="rounded-3xl border border-slate-200 p-8 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-600">{t(messages, "brand.name")}</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">{t(messages, "register.title")}</h1>
              <p className="mt-2 text-slate-600">{t(messages, "register.subtitle")}</p>
            </div>

            <div className="text-right">
              <a className="text-sm underline text-slate-600" href={`/${locale}`}>
                {t(messages, "register.back")}
              </a>
              <div className="mt-2 text-sm text-slate-600">
                {t(messages, "register.haveAccount")}{" "}
                <a className="font-semibold underline" href={`/${locale}/login`}>
                  {t(messages, "register.login")}
                </a>
              </div>
            </div>
          </div>

          <form onSubmit={submit} className="mt-8 grid gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1 text-sm">
                {t(messages, "register.fields.businessName")}
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder={t(messages, "register.placeholders.businessName")}
                  required
                />
              </label>

              <label className="grid gap-1 text-sm">
                {t(messages, "register.fields.category")}
                <select
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value as IndustryKey)}
                >
                  {INDUSTRY_OPTIONS.map((o) => (
                    <option key={o.key} value={o.key}>
                      {t(messages, o.labelKey)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1 text-sm">
                {t(messages, "register.fields.city")}
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={t(messages, "register.placeholders.city")}
                  required
                />
              </label>

              <label className="grid gap-1 text-sm">
                {t(messages, "register.fields.country")}
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  value={country}
                  onChange={(e) => setCountry(e.target.value.toUpperCase())}
                  placeholder="EE"
                  required
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1 text-sm">
                {t(messages, "register.fields.street")}
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder={t(messages, "register.placeholders.street")}
                />
              </label>

              <label className="grid gap-1 text-sm">
                {t(messages, "register.fields.postalCode")}
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder={t(messages, "register.placeholders.postalCode")}
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1 text-sm">
                {t(messages, "register.fields.website")}
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://..."
                />
              </label>

              <label className="grid gap-1 text-sm">
                {t(messages, "register.fields.email")}
                <input
                  type="email"
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t(messages, "register.placeholders.email")}
                  required
                />
              </label>
            </div>

            <div className="grid gap-2">
              <label className="grid gap-1 text-sm">
                {t(messages, "register.fields.logo")}
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
                    alt={t(messages, "register.logoPreviewAlt")}
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
                    {t(messages, "register.remove")}
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-500">{t(messages, "register.logoHint")}</p>
              )}
            </div>

            <div className="grid gap-1 text-sm">
              <div className="flex items-center justify-between">
                <label>{t(messages, "register.fields.slug")}</label>
                <span className="text-xs text-slate-500">
                  {t(messages, "register.yourLink")} /{locale}/book/{finalSlug || "your-slug"}
                </span>
              </div>
              <input
                className="rounded-xl border border-slate-200 px-3 py-2"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder={suggestedSlug || "damino-studio"}
              />
              <p className="text-xs text-slate-500">{t(messages, "register.slugHint")}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1 text-sm">
                {t(messages, "register.fields.password")}
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
                {t(messages, "register.fields.confirmPassword")}
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
                ? t(messages, "register.states.uploadingLogo")
                : loading
                  ? t(messages, "register.states.creating")
                  : t(messages, "register.states.createAccount")}
            </button>

            <p className="text-xs text-slate-500">{t(messages, "register.nextHint")}</p>
          </form>
        </section>
      </div>
    </main>
  );
}
