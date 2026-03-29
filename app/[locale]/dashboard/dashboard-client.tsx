"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/services";

import AvailabilityEditor from "./availability";
import ServicesEditor from "./services";
import BookingsPanel from "./bookings";
import SchedulePanel from "./schedule";
import DashboardHeader from "./dashboard-header";
import ShareLinkCard from "./share-link-card";
import StatsSection from "./stats-section";


import { useMessages } from "@/lib/use-messages";
import { t } from "@/lib/i18n";

type Props = {
  locale: string;
  business: {
    createdAt: string;
    name: string;
    slug: string;
    website?: string | null;
    ownerEmail: string;

    industry?: string | null;
    city?: string | null;
    country?: string | null;

    street?: string | null;
    postalCode?: string | null;

    logoUrl?: string | null;

    // ✅ new field (stored on Business)
    description?: string | null;

    subscriptionStatus?: string | null;
    trialEndsAt?: string | null;
    currentPeriodEnd?: string | null;
  };
};

type DbBooking = {
  id: string;
  startsAt: string;
  durationMin: number;
  serviceName: string;
  price: number;
  currency: string;
  customerName: string;
  customerPhone: string;
  customerCountry?: string | null;
  notes?: string | null;
  status: "CONFIRMED" | "CANCELLED";
};

type StatCardProps = {
  title: string;
  value?: string;
  sub?: string;
  tone?: "blue" | "green" | "purple";
  children?: React.ReactNode;
};

type GalleryImage = {
  id: string;
  url: string;
  sort: number;
  createdAt?: string;
};

const tones = {
  blue: "bg-blue-50 border-blue-200",
  green: "bg-emerald-50 border-emerald-200",
  purple: "bg-purple-50 border-purple-200"
};

function StatCard({ title, value, sub, tone = "blue", children }: StatCardProps) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${tones[tone]}`}>
      <div className="text-sm font-medium text-slate-600">{title}</div>
      {value && <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</div>}
      {sub && <div className="mt-1 text-sm text-slate-500">{sub}</div>}
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}

function startOfWeekMonday(d: Date) {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}
function startOfMonth(d: Date) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}
function startOfYear(d: Date) {
  const x = new Date(d);
  x.setMonth(0, 1);
  x.setHours(0, 0, 0, 0);
  return x;
}

function isValidUrlOrEmpty(v: string) {
  const x = v.trim();
  if (!x) return true;
  try {
    const withProto = /^https?:\/\//i.test(x) ? x : `https://${x}`;
    new URL(withProto);
    return true;
  } catch {
    return false;
  }
}

/* ----------------------------- Gallery Manager ----------------------------- */

function BookingGalleryManager({ locale }: { locale: string }) {
  const messages = useMessages(locale);

  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string>("");

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const res = await fetch("/api/uploads/gallery", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || t(messages, "dashboard.gallery.errors.loadFailed"));
      setImages(Array.isArray(data.images) ? data.images : []);
    } catch (e: any) {
      setErr(e?.message || t(messages, "dashboard.gallery.errors.loadFailed"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function uploadFiles(files: FileList | null) {
    if (!files || !files.length) return;
    setErr("");
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append("file", file);

        const res = await fetch("/api/uploads/gallery", {
          method: "POST",
          body: form
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || t(messages, "dashboard.gallery.errors.uploadFailed"));

        const img = data?.image;
        if (img?.id && img?.url) {
          setImages((prev) => [...prev, img]);
        }
      }
    } catch (e: any) {
      setErr(e?.message || t(messages, "dashboard.gallery.errors.uploadFailed"));
    } finally {
      setUploading(false);
    }
  }

  async function remove(id: string) {
    setErr("");
    const prev = images;
    setImages((x) => x.filter((i) => i.id !== id));
    try {
      const res = await fetch(`/api/uploads/gallery?id=${encodeURIComponent(id)}`, {
        method: "DELETE"
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || t(messages, "dashboard.gallery.errors.deleteFailed"));
      setImages(Array.isArray(data.images) ? data.images : []);
    } catch (e: any) {
      setErr(e?.message || t(messages, "dashboard.gallery.errors.deleteFailed"));
      setImages(prev);
    }
  }

  async function move(id: string, dir: -1 | 1) {
    const idx = images.findIndex((i) => i.id === id);
    if (idx < 0) return;
    const next = [...images];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;

    [next[idx], next[j]] = [next[j], next[idx]];
    setImages(next);

    try {
      const res = await fetch("/api/uploads/gallery", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: next.map((x) => x.id) })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || t(messages, "dashboard.gallery.errors.reorderFailed"));
      setImages(Array.isArray(data.images) ? data.images : next);
    } catch (e: any) {
      setErr(e?.message || t(messages, "dashboard.gallery.errors.reorderFailed"));
      load(); // authoritative reload
    }
  }

  const hero = images[0]?.url || "";
  const side1 = images[1]?.url || "";
  const side2 = images[2]?.url || "";

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">{t(messages, "dashboard.gallery.title")}</h2>
          <p className="mt-1 text-sm text-slate-500">{t(messages, "dashboard.gallery.lead")}</p>
        </div>

        <div className="flex items-center gap-2">
          <label className="inline-flex cursor-pointer items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
            {uploading ? t(messages, "dashboard.gallery.states.uploading") : t(messages, "dashboard.gallery.actions.upload")}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              className="hidden"
              onChange={(e) => uploadFiles(e.target.files)}
              disabled={uploading}
            />
          </label>

          <button
            type="button"
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
            onClick={load}
            disabled={loading || uploading}
          >
            {t(messages, "dashboard.gallery.actions.refresh")}
          </button>
        </div>
      </div>

      {err ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{err}</div>
      ) : null}

      {/* Preview */}
      <div className="mt-5 grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="aspect-[16/9] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            {hero ? (
              <img src={hero} alt={t(messages, "dashboard.gallery.preview.heroAlt")} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
                {t(messages, "dashboard.gallery.preview.heroEmpty")}
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4 lg:col-span-4">
          <div className="aspect-[16/9] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            {side1 ? (
              <img src={side1} alt={t(messages, "dashboard.gallery.preview.side1Alt")} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
                {t(messages, "dashboard.gallery.preview.side1Empty")}
              </div>
            )}
          </div>

          <div className="aspect-[16/9] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            {side2 ? (
              <img src={side2} alt={t(messages, "dashboard.gallery.preview.side2Alt")} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
                {t(messages, "dashboard.gallery.preview.side2Empty")}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="mt-6">
        <div className="text-sm font-medium text-slate-700">{t(messages, "dashboard.gallery.list.title")}</div>

        {loading ? (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            {t(messages, "dashboard.gallery.states.loading")}
          </div>
        ) : images.length === 0 ? (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            {t(messages, "dashboard.gallery.list.empty")}
          </div>
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((img, idx) => (
              <li key={img.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                <div className="aspect-[16/10] overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  <img
                    src={img.url}
                    alt={t(messages, "dashboard.gallery.list.imageAlt").replace("{n}", String(idx + 1))}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="text-xs text-slate-500">
                    {idx === 0
                      ? t(messages, "dashboard.gallery.list.hero")
                      : idx === 1
                        ? t(messages, "dashboard.gallery.list.side1")
                        : idx === 2
                          ? t(messages, "dashboard.gallery.list.side2")
                          : t(messages, "dashboard.gallery.list.imageN").replace("{n}", String(idx + 1))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
                      disabled={idx === 0 || uploading}
                      onClick={() => move(img.id, -1)}
                    >
                      {t(messages, "dashboard.gallery.actions.up")}
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
                      disabled={idx === images.length - 1 || uploading}
                      onClick={() => move(img.id, 1)}
                    >
                      {t(messages, "dashboard.gallery.actions.down")}
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                      disabled={uploading}
                      onClick={() => remove(img.id)}
                    >
                      {t(messages, "dashboard.gallery.actions.remove")}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/* -------------------------- Description Editor (NEW) ------------------------- */

function BookingDescriptionEditor({
  locale,
  initial,
  onSaved
}: {
  locale: string;
  initial: string;
  onSaved: (next: string) => void;
}) {
  const router = useRouter();
  const messages = useMessages(locale);

  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const words = useMemo(() => value.trim().split(/\s+/).filter(Boolean).length, [value]);
  useEffect(() => setValue(initial), [initial]);

  async function save() {
    setErr("");
    const trimmed = value.trim();

    if (trimmed && words > 600) {
      setErr(t(messages, "dashboard.description.errors.tooLong"));
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/owner/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: trimmed || null })
      });

      const data = await res.json().catch(() => ({}));

   if (res.status === 402 || data?.code === "TRIAL_EXPIRED") {
        router.push(`/${locale}/subscribe`);
       return;
     }

      
      if (!res.ok) throw new Error(data?.error || t(messages, "dashboard.description.errors.saveFailed"));

      const next = String(data?.business?.description ?? trimmed ?? "");
      onSaved(next);
    } catch (e: any) {
      setErr(e?.message || t(messages, "dashboard.description.errors.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">{t(messages, "dashboard.description.title")}</h2>
          <p className="mt-1 text-sm text-slate-500">{t(messages, "dashboard.description.lead")}</p>
        </div>

        <button
          type="button"
          onClick={save}
          disabled={saving || words > 600}
          className="w-fit rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {saving ? t(messages, "dashboard.description.states.saving") : t(messages, "dashboard.description.actions.save")}
        </button>
      </div>

      {err ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{err}</div>
      ) : null}

      <div className="mt-4 grid gap-2">
        <textarea
          className="min-h-[140px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-300"
          placeholder={t(messages, "dashboard.description.placeholder")}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className={words > 600 ? "font-semibold text-rose-700" : ""}>
            {t(messages, "dashboard.description.words")
              .replace("{n}", String(words))
              .replace("{max}", "600")}
          </span>
          <button type="button" className="underline" onClick={() => setValue("")}>
            {t(messages, "dashboard.description.actions.clear")}
          </button>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ Dashboard Client ----------------------------- */

export default function DashboardClient({ locale, business }: Props) {
  const router = useRouter();
  const messages = useMessages(locale);

  // local copy
  const [biz, setBiz] = useState<Props["business"]>(business);

  // ✅ local description state (separate, controlled)
  const [bookingDesc, setBookingDesc] = useState(String(business.description ?? ""));

  // profile editor
  const [editing, setEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string>("");

  const [name, setName] = useState(business.name);
  const [website, setWebsite] = useState(business.website ?? "");
  const [city, setCity] = useState(business.city ?? "");
  const [country, setCountry] = useState(business.country ?? "");
  const [street, setStreet] = useState(business.street ?? "");
  const [postalCode, setPostalCode] = useState(business.postalCode ?? "");

  // logo state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>(business.logoUrl ?? "");
  const [logoUploading, setLogoUploading] = useState(false);

  // explicit remove logo toggle
  const [removeLogo, setRemoveLogo] = useState(false);

  // bookings/stats
  const [copied, setCopied] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [bookings, setBookings] = useState<DbBooking[]>([]);

  const bookingPath = useMemo(() => `/${locale}/book/${biz.slug}`, [biz.slug, locale]);
  const bookingUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}${bookingPath}`;
  }, [bookingPath]);

  const trialDaysLeft = useMemo(() => {
  if (biz.subscriptionStatus !== "trialing" || !biz.trialEndsAt) return null;

  const msLeft = new Date(biz.trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
}, [biz.subscriptionStatus, biz.trialEndsAt]);

  async function copyLink() {
    if (!bookingUrl) return;
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      alert(t(messages, "dashboard.errors.copyFailed"));
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace(`/${locale}/login`);
  }

  async function refreshStats(signal?: AbortSignal) {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/bookings?scope=owner", { cache: "no-store", signal });
      const data = await res.json().catch(() => ({}));
      if (res.status === 402 || data?.code === "TRIAL_EXPIRED") {
      router.push(`/${locale}/subscribe`);
      return;
    }

      setBookings(res.ok && Array.isArray(data.bookings) ? data.bookings : []);
    } finally {
      setStatsLoading(false);
    }
  }

  useEffect(() => {
    const ac = new AbortController();
    refreshStats(ac.signal);
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const nowMs = now.getTime();
    const active = bookings.filter((b) => b.status !== "CANCELLED");
    const totalBookings = active.length;

    const customerKeys = new Set<string>();
    for (const b of active) {
      const key = (b.customerPhone || "").trim() || b.customerName.trim().toLowerCase();
      if (key) customerKeys.add(key);
    }
    const uniqueCustomers = customerKeys.size;

    const revenueSource = active.filter(
      (b) => b.status === "CONFIRMED" && new Date(b.startsAt).getTime() <= nowMs
    );

    const weekStart = startOfWeekMonday(now).getTime();
    const monthStart = startOfMonth(now).getTime();
    const yearStart = startOfYear(now).getTime();

    function sumForRange(minMs: number) {
      const rows = revenueSource.filter((b) => new Date(b.startsAt).getTime() >= minMs);
      const currencies = new Set(rows.map((b) => String(b.currency || "").toUpperCase()));
      const single = currencies.size === 1 ? [...currencies][0] : null;
      const sum = rows.reduce((acc, b) => acc + Number(b.price || 0), 0);

      if (rows.length === 0) return { label: "0", currency: "EUR", mixed: false };
      if (!single) return { label: t(messages, "dashboard.stats.mixed"), currency: "EUR", mixed: true };

      return { label: formatMoney(sum, single as any), currency: single, mixed: false };
    }

    const weekly = sumForRange(weekStart);
    const monthly = sumForRange(monthStart);
    const yearly = sumForRange(yearStart);

    const customerMap = new Map<string, { name: string; country: string; lastAt: number }>();
    for (const b of active) {
      const key = (b.customerPhone || "").trim() || b.customerName.trim().toLowerCase();
      if (!key) continue;

      const lastAt = new Date(b.startsAt).getTime();
      const nm = b.customerName?.trim() || t(messages, "dashboard.stats.unknown");
      const ct = (b.customerCountry ?? "").trim() || t(messages, "dashboard.stats.unknown");

      const existing = customerMap.get(key);
      if (!existing || lastAt > existing.lastAt) customerMap.set(key, { name: nm, country: ct, lastAt });
    }

    const recentCustomers = Array.from(customerMap.values())
      .sort((a, b) => b.lastAt - a.lastAt)
      .slice(0, 5)
      .map((x) => ({ name: x.name, country: x.country }));

    return {
      totalBookings,
      uniqueCustomers,
      weeklyRevenue: weekly.label,
      monthlyRevenue: monthly.label,
      yearlyRevenue: yearly.label,
      recentCustomers
    };
  }, [bookings, messages]);

  function startEdit() {
    setProfileError("");
    setEditing(true);

    setName(biz.name);
    setWebsite(biz.website ?? "");
    setCity(biz.city ?? "");
    setCountry(biz.country ?? "");
    setStreet(biz.street ?? "");
    setPostalCode(biz.postalCode ?? "");

    setLogoFile(null);
    setLogoPreview(biz.logoUrl ?? "");
    setRemoveLogo(false);
  }

  function cancelEdit() {
    setProfileError("");
    setEditing(false);
    setLogoFile(null);
    setLogoPreview(biz.logoUrl ?? "");
    setRemoveLogo(false);
  }

  async function uploadLogoIfAny(): Promise<string | undefined> {
    if (!logoFile) return undefined;

    setLogoUploading(true);
    try {
      const form = new FormData();
      form.append("file", logoFile);

      const res = await fetch("/api/uploads/logo", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data?.error || t(messages, "dashboard.profile.errors.logoUploadFailed"));
      if (!data?.url || typeof data.url !== "string") throw new Error(t(messages, "dashboard.profile.errors.logoMissingUrl"));

      return data.url;
    } finally {
      setLogoUploading(false);
    }
  }

  // ✅ profile save does NOT touch description
  async function saveProfile() {
    setProfileError("");

    const n = name.trim();
    const c = city.trim();
    const cc = country.trim().toUpperCase();

    if (!n) return setProfileError(t(messages, "dashboard.profile.errors.nameRequired"));
    if (!c) return setProfileError(t(messages, "dashboard.profile.errors.cityRequired"));
    if (!cc || cc.length < 2) return setProfileError(t(messages, "dashboard.profile.errors.countryRequired"));
    if (!isValidUrlOrEmpty(website)) return setProfileError(t(messages, "dashboard.profile.errors.websiteInvalid"));

    setSavingProfile(true);
    try {
      const uploadedLogoUrl = await uploadLogoIfAny();

      const payload: any = {
        name: n,
        website: website.trim() || null,
        city: c,
        country: cc,
        street: street.trim() || null,
        postalCode: postalCode.trim() || null
      };

      if (uploadedLogoUrl) payload.logoUrl = uploadedLogoUrl;
      if (removeLogo) payload.logoUrl = null;

      const res = await fetch("/api/owner/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));

     if (res.status === 402 || data?.code === "TRIAL_EXPIRED") {
     router.push(`/${locale}/subscribe`);
     return;
      }

      
      if (!res.ok) {
        setProfileError(data?.error || t(messages, "dashboard.profile.errors.updateFailed"));
        return;
      }

      setBiz((prev) => ({
        ...prev,
        name: data?.business?.name ?? n,
        website: data?.business?.website ?? (website.trim() || null),
        city: data?.business?.city ?? c,
        country: data?.business?.country ?? cc,
        street: data?.business?.street ?? (street.trim() || null),
        postalCode: data?.business?.postalCode ?? (postalCode.trim() || null),
        logoUrl:
          typeof data?.business?.logoUrl !== "undefined"
            ? data.business.logoUrl
            : removeLogo
              ? null
              : uploadedLogoUrl ?? prev.logoUrl
        // ✅ DO NOT update description here
      }));

      setEditing(false);
      router.refresh();
    } catch (e: any) {
      setProfileError(e?.message || t(messages, "dashboard.profile.errors.network"));
    } finally {
      setSavingProfile(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto w-full max-w-screen-2xl px-4 py-10 sm:px-6 lg:px-8">
        <DashboardHeader
  biz={biz}
  messages={messages}
  bookingPath={bookingPath}
  statsLoading={statsLoading}
  onEdit={startEdit}
  onRefresh={() => refreshStats()}
  onLogout={logout}
/>
{biz.subscriptionStatus === "trialing" && trialDaysLeft !== null && (
  <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
    <h2 className="text-sm font-semibold text-amber-900">
      Free trial
    </h2>
    <p className="mt-1 text-sm text-amber-800">
      You have {trialDaysLeft} day{trialDaysLeft === 1 ? "" : "s"} left in your free trial.
    </p>
  </section>
)}
        {/* Profile editor */}
        {editing && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold">{t(messages, "dashboard.profile.title")}</h2>
                <p className="mt-1 text-sm text-slate-500">{t(messages, "dashboard.profile.lead")}</p>
              </div>

              <button type="button" onClick={cancelEdit} className="text-sm font-semibold text-slate-600 underline">
                {t(messages, "dashboard.profile.actions.cancel")}
              </button>
            </div>

            {profileError ? (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {profileError}
              </div>
            ) : null}

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1 text-sm">
                {t(messages, "dashboard.profile.fields.name")}
                <input className="rounded-xl border border-slate-200 px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
              </label>

              <label className="grid gap-1 text-sm">
                {t(messages, "dashboard.profile.fields.website")}
                <input className="rounded-xl border border-slate-200 px-3 py-2" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder={t(messages, "dashboard.profile.placeholders.website")} />
              </label>

              <label className="grid gap-1 text-sm">
                {t(messages, "dashboard.profile.fields.city")}
                <input className="rounded-xl border border-slate-200 px-3 py-2" value={city} onChange={(e) => setCity(e.target.value)} />
              </label>

              <label className="grid gap-1 text-sm">
                {t(messages, "dashboard.profile.fields.country")}
                <input className="rounded-xl border border-slate-200 px-3 py-2" value={country} onChange={(e) => setCountry(e.target.value.toUpperCase())} placeholder={t(messages, "dashboard.profile.placeholders.country")} />
              </label>

              <label className="grid gap-1 text-sm">
                {t(messages, "dashboard.profile.fields.street")}
                <input className="rounded-xl border border-slate-200 px-3 py-2" value={street} onChange={(e) => setStreet(e.target.value)} />
              </label>

              <label className="grid gap-1 text-sm">
                {t(messages, "dashboard.profile.fields.postalCode")}
                <input className="rounded-xl border border-slate-200 px-3 py-2" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
              </label>
            </div>

            {/* Logo upload */}
            <div className="mt-5 grid gap-2">
              <label className="grid gap-1 text-sm">
                {t(messages, "dashboard.profile.fields.logo")}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setLogoFile(f);
                    setRemoveLogo(false);

                    if (!f) {
                      setLogoPreview(biz.logoUrl ?? "");
                      return;
                    }
                    setLogoPreview(URL.createObjectURL(f));
                  }}
                />
              </label>

              {logoPreview ? (
                <div className="flex items-center gap-3">
                  <img src={logoPreview} alt={t(messages, "dashboard.profile.logoPreviewAlt")} className="h-14 w-14 rounded-2xl border border-slate-200 object-cover" />
                  <button
                    type="button"
                    className="text-sm underline text-slate-600"
                    onClick={() => {
                      setLogoFile(null);
                      setLogoPreview("");
                      setRemoveLogo(true);
                    }}
                  >
                    {t(messages, "dashboard.profile.actions.removeLogo")}
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-500">{t(messages, "dashboard.profile.logoHint")}</p>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={savingProfile || logoUploading}
                onClick={saveProfile}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {logoUploading
                  ? t(messages, "dashboard.profile.states.uploadingLogo")
                  : savingProfile
                    ? t(messages, "dashboard.profile.states.saving")
                    : t(messages, "dashboard.profile.actions.saveChanges")}
              </button>
            </div>
          </section>
        )}

        <StatsSection
  messages={messages}
  statsLoading={statsLoading}
  stats={stats}
/>

<ShareLinkCard
  messages={messages}
  bookingUrl={bookingUrl}
  bookingPath={bookingPath}
  copied={copied}
  onCopy={copyLink}
/>
          
        
        {/* ✅ Booking website content */}
        <BookingGalleryManager locale={locale} />
        <BookingDescriptionEditor
          locale={locale}
          initial={bookingDesc}
          onSaved={(next) => {
            setBookingDesc(next);
            setBiz((prev) => ({ ...prev, description: next || null }));
            router.refresh();
          }}
        />

        {/* Panels */}
        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            {/*<div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-4">
                <h2 className="text-base font-semibold">{t(messages, "dashboard.panels.schedule.title")}</h2>
                <p className="mt-1 text-sm text-slate-500">{t(messages, "dashboard.panels.schedule.lead")}</p>
              </div>
              <SchedulePanel />
            </div>*/}

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-4">
                <h2 className="text-base font-semibold">{t(messages, "dashboard.panels.bookings.title")}</h2>
                <p className="mt-1 text-sm text-slate-500">{t(messages, "dashboard.panels.bookings.lead")}</p>
              </div>
              <BookingsPanel />
            </div>
          </div>

          <div className="space-y-6 lg:col-span-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-4">
                <h2 className="text-base font-semibold">{t(messages, "dashboard.panels.availability.title")}</h2>
                <p className="mt-1 text-sm text-slate-500">{t(messages, "dashboard.panels.availability.lead")}</p>
              </div>
              <AvailabilityEditor />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-4">
                <h2 className="text-base font-semibold">{t(messages, "dashboard.panels.services.title")}</h2>
                <p className="mt-1 text-sm text-slate-500">{t(messages, "dashboard.panels.services.lead")}</p>
              </div>
              <ServicesEditor />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
