"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/services";

import AvailabilityEditor from "./availability";
import ServicesEditor from "./services";
import BookingsPanel from "./bookings";
import SchedulePanel from "./schedule";


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

export default function DashboardClient({ locale, business }: Props) {
  const router = useRouter();

  // local copy
  const [biz, setBiz] = useState<Props["business"]>(business);

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

  // ✅ explicit remove logo toggle (optional)
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

  async function copyLink() {
    if (!bookingUrl) return;
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      alert("Copy failed — please copy manually.");
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
      if (!single) return { label: "Mixed", currency: "EUR", mixed: true };

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
      const name = b.customerName?.trim() || "Unknown";
      const country = (b.customerCountry ?? "").trim() || "Unknown";

      const existing = customerMap.get(key);
      if (!existing || lastAt > existing.lastAt) customerMap.set(key, { name, country, lastAt });
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
  }, [bookings]);

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

      if (!res.ok) {
        throw new Error(data?.error || `Logo upload failed (${res.status})`);
      }

      if (!data?.url || typeof data.url !== "string") {
        throw new Error("Logo upload failed (missing url).");
      }

      return data.url;
    } finally {
      setLogoUploading(false);
    }
  }

  async function saveProfile() {
    setProfileError("");

    const n = name.trim();
    const c = city.trim();
    const cc = country.trim().toUpperCase();

    if (!n) return setProfileError("Business name is required.");
    if (!c) return setProfileError("City is required.");
    if (!cc || cc.length < 2) return setProfileError("Country code is required (e.g. EE).");
    if (!isValidUrlOrEmpty(website)) return setProfileError("Website looks invalid.");

    setSavingProfile(true);
    try {
      const uploadedLogoUrl = await uploadLogoIfAny();

      // ✅ IMPORTANT: do not send logoUrl unless:
      // - user uploaded a new one
      // - OR user explicitly clicked remove
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

      const res = await fetch("/api/owner", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setProfileError(data?.error || "Failed to update profile.");
        return;
      }

      // ✅ update UI (keep old logo unless changed)
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
      }));

      setEditing(false);
      router.refresh();
    } catch (e: any) {
      setProfileError(e?.message || "Network error. Try again.");
    } finally {
      setSavingProfile(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto w-full max-w-screen-2xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {biz.logoUrl ? (
                <img src={biz.logoUrl} alt="Business logo" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-400">
                  {biz.name?.charAt(0)?.toUpperCase() || "S"}
                </div>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-slate-600">Dashboard</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">{biz.name}</h1>
              <p className="mt-1 text-sm text-slate-600">
                <span className="font-semibold text-slate-900">{biz.industry ?? "Industry"}</span>
                {biz.city ? ` • ${biz.city}` : ""}
                {biz.country ? `, ${biz.country}` : ""}
                {" • "}
                <span className="font-semibold text-slate-900">{biz.slug}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={startEdit}
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
            >
              Edit profile
            </button>

            <a
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
              href={bookingPath}
              target="_blank"
              rel="noreferrer"
            >
              Open booking page
            </a>

            <button
              type="button"
              onClick={() => refreshStats()}
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-60"
              disabled={statsLoading}
            >
              {statsLoading ? "Refreshing…" : "Refresh stats"}
            </button>

            <button
              onClick={logout}
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
              type="button"
            >
              Log out
            </button>
          </div>
        </div>

        {/* Profile editor */}
        {editing && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold">Business profile</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Update your public info. Changes reflect on your booking page.
                </p>
              </div>

              <button type="button" onClick={cancelEdit} className="text-sm font-semibold text-slate-600 underline">
                Cancel
              </button>
            </div>

            {profileError ? (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {profileError}
              </div>
            ) : null}

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1 text-sm">
                Business name
                <input className="rounded-xl border border-slate-200 px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
              </label>

              <label className="grid gap-1 text-sm">
                Website (optional)
                <input className="rounded-xl border border-slate-200 px-3 py-2" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." />
              </label>

              <label className="grid gap-1 text-sm">
                City
                <input className="rounded-xl border border-slate-200 px-3 py-2" value={city} onChange={(e) => setCity(e.target.value)} />
              </label>

              <label className="grid gap-1 text-sm">
                Country (code)
                <input className="rounded-xl border border-slate-200 px-3 py-2" value={country} onChange={(e) => setCountry(e.target.value.toUpperCase())} placeholder="EE" />
              </label>

              <label className="grid gap-1 text-sm">
                Street (optional)
                <input className="rounded-xl border border-slate-200 px-3 py-2" value={street} onChange={(e) => setStreet(e.target.value)} />
              </label>

              <label className="grid gap-1 text-sm">
                Postal code (optional)
                <input className="rounded-xl border border-slate-200 px-3 py-2" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
              </label>
            </div>

            {/* Logo upload */}
            <div className="mt-5 grid gap-2">
              <label className="grid gap-1 text-sm">
                Logo (optional)
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
                  <img src={logoPreview} alt="Logo preview" className="h-14 w-14 rounded-2xl border border-slate-200 object-cover" />
                  <button
                    type="button"
                    className="text-sm underline text-slate-600"
                    onClick={() => {
                      // ✅ user wants no logo
                      setLogoFile(null);
                      setLogoPreview("");
                      setRemoveLogo(true);
                    }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Best: square, ≤ 2MB.</p>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={savingProfile || logoUploading}
                onClick={saveProfile}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {logoUploading ? "Uploading logo…" : savingProfile ? "Saving…" : "Save changes"}
              </button>
            </div>
          </section>
        )}

        {/* Stats row */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard title="Total bookings" value={statsLoading ? "—" : String(stats.totalBookings)} sub={statsLoading ? "Loading…" : "All time (not cancelled)"} tone="blue" />
          <StatCard title="Revenue generated" sub={statsLoading ? "Loading…" : "Confirmed in the past"} tone="green">
            <div className="grid gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">Weekly</span>
                <span className="font-semibold text-slate-900">{statsLoading ? "—" : stats.weeklyRevenue}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">Monthly</span>
                <span className="font-semibold text-slate-900">{statsLoading ? "—" : stats.monthlyRevenue}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">Yearly</span>
                <span className="font-semibold text-slate-900">{statsLoading ? "—" : stats.yearlyRevenue}</span>
              </div>
            </div>
          </StatCard>
          <StatCard title="Customers" value={statsLoading ? "—" : String(stats.uniqueCustomers)} sub={statsLoading ? "Loading…" : "Unique customers"} tone="purple" />
        </div>

        {/* Share link card + panels */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="text-sm font-medium text-slate-600">Your shareable booking link</div>

              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 ring-1 ring-slate-200">
                  <div className="truncate">{bookingUrl || bookingPath}</div>
                </div>

                <button type="button" onClick={copyLink} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
                  {copied ? "Copied ✓" : "Copy link"}
                </button>
              </div>

              <div className="mt-2 text-sm text-slate-500">Share on Instagram bio, WhatsApp, your website, anywhere.</div>
            </div>
          </div>

          <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 text-sm text-slate-600">
            Tip: Keep your availability updated, your booking page always reflects changes.
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-4">
                <h2 className="text-base font-semibold">Schedule overview</h2>
                <p className="mt-1 text-sm text-slate-500">See your timeline and upcoming slots.</p>
              </div>
              <SchedulePanel />
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-4">
                <h2 className="text-base font-semibold">Bookings</h2>
                <p className="mt-1 text-sm text-slate-500">Track requests, confirmations, and status.</p>
              </div>
              <BookingsPanel />
            </div>
          </div>

          <div className="space-y-6 lg:col-span-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-4">
                <h2 className="text-base font-semibold">Availability</h2>
                <p className="mt-1 text-sm text-slate-500">Set your working hours and breaks.</p>
              </div>
              <AvailabilityEditor />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-4">
                <h2 className="text-base font-semibold">Services & pricing</h2>
                <p className="mt-1 text-sm text-slate-500">Add services, duration, and price.</p>
              </div>
              <ServicesEditor />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
