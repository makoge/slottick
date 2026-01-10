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
    category?: string | null;
    city?: string | null;
    country?: string | null;
  };
};

type DbBooking = {
  id: string;
  startsAt: string; // ISO
  durationMin: number;
  serviceName: string;
  price: number;
  currency: string;
  customerName: string;
  customerPhone: string;
  customerCountry?: string | null; // ✅ optional (falls back to "Unknown")
  notes?: string | null;
  status: "CONFIRMED" | "CANCELLED";
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function toISODateLocal(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
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

function StatCard({
  title,
  value,
  sub,
  children,
}: {
  title: string;
  value?: string;
  sub?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm font-medium text-slate-600">{title}</div>
      {value ? (
        <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          {value}
        </div>
      ) : null}
      {sub ? <div className="mt-1 text-sm text-slate-500">{sub}</div> : null}
      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}

export default function DashboardClient({ locale, business }: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const [statsLoading, setStatsLoading] = useState(true);
  const [bookings, setBookings] = useState<DbBooking[]>([]);

  const bookingPath = useMemo(
    () => `/${locale}/book/${business.slug}`,
    [business.slug, locale]
  );

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
      const res = await fetch("/api/bookings?scope=owner", {
        cache: "no-store",
        signal,
      });
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
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const nowMs = now.getTime();

    const active = bookings.filter((b) => b.status !== "CANCELLED");

    // Total bookings (all-time, not cancelled)
    const totalBookings = active.length;

    // Unique customers
    const customerKeys = new Set<string>();
    for (const b of active) {
      const key = (b.customerPhone || "").trim() || b.customerName.trim().toLowerCase();
      if (key) customerKeys.add(key);
    }
    const uniqueCustomers = customerKeys.size;

    // Revenue bookings: confirmed and in the past (since you don't have COMPLETED)
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

    // Recent customers (name + country)
    const customerMap = new Map<string, { name: string; country: string; lastAt: number }>();
    for (const b of active) {
      const key = (b.customerPhone || "").trim() || b.customerName.trim().toLowerCase();
      if (!key) continue;

      const lastAt = new Date(b.startsAt).getTime();
      const name = b.customerName?.trim() || "Unknown";
      const country = (b.customerCountry ?? "").trim() || "Unknown";

      const existing = customerMap.get(key);
      if (!existing || lastAt > existing.lastAt) {
        customerMap.set(key, { name, country, lastAt });
      }
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
      recentCustomers,
    };
  }, [bookings]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">Dashboard</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              {business.name}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              <span className="font-semibold text-slate-900">
                {business.category ?? "Service"}
              </span>
              {business.city ? ` • ${business.city}` : ""}
              {business.country ? `, ${business.country}` : ""}
              {" • "}
              <span className="text-slate-500">slug:</span>{" "}
              <span className="font-semibold text-slate-900">{business.slug}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
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

        {/* Stats row */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Total bookings"
            value={statsLoading ? "—" : String(stats.totalBookings)}
            sub={statsLoading ? "Loading…" : "All time (not cancelled)"}
          />

          <StatCard title="Revenue generated" sub={statsLoading ? "Loading…" : "Confirmed in the past"}>
            <div className="grid gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Weekly</span>
                <span className="font-semibold text-slate-900">
                  {statsLoading ? "—" : stats.weeklyRevenue}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Monthly</span>
                <span className="font-semibold text-slate-900">
                  {statsLoading ? "—" : stats.monthlyRevenue}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Yearly</span>
                <span className="font-semibold text-slate-900">
                  {statsLoading ? "—" : stats.yearlyRevenue}
                </span>
              </div>
            </div>
          </StatCard>

          <StatCard
            title="Customers"
            value={statsLoading ? "—" : String(stats.uniqueCustomers)}
            sub={statsLoading ? "Loading…" : "Unique customers"}
          />
        </div>

        {/* Recent customers */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Recent customers</h2>
              <p className="mt-1 text-sm text-slate-500">Name and country from recent bookings</p>
            </div>
            <div className="text-xs font-medium text-slate-500">
              {statsLoading ? "Loading…" : `${stats.recentCustomers.length} shown`}
            </div>
          </div>

          {statsLoading ? (
            <div className="mt-4 rounded-xl border border-slate-200 p-4 text-sm text-slate-600">
              Loading…
            </div>
          ) : stats.recentCustomers.length === 0 ? (
            <div className="mt-4 rounded-xl border border-slate-200 p-4 text-sm text-slate-600">
              No customers yet.
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {stats.recentCustomers.map((c, i) => (
                <li key={`${c.name}-${i}`} className="flex items-center justify-between py-3">
                  <span className="font-medium text-slate-900">{c.name}</span>
                  <span className="text-sm text-slate-500">{c.country}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
            Tip: if country always shows “Unknown”, add <span className="font-semibold">customerCountry</span>{" "}
            to your bookings API response.
          </div>
        </section>

        {/* Share link card */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="text-sm font-medium text-slate-600">
                Your shareable booking link
              </div>

              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 ring-1 ring-slate-200">
                  <div className="truncate">{bookingUrl || bookingPath}</div>
                </div>

                <button
                  type="button"
                  onClick={copyLink}
                  className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  {copied ? "Copied ✓" : "Copy link"}
                </button>
              </div>

              <div className="mt-2 text-sm text-slate-500">
                Share on Instagram bio, WhatsApp, your website, anywhere.
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 text-sm text-slate-600">
            Tip: Keep your availability updated, your booking page always reflects changes.
          </div>
        </section>

        {/* Main content layout */}
        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          {/* Left column */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-4">
                <h2 className="text-base font-semibold">Schedule overview</h2>
                <p className="mt-1 text-sm text-slate-500">
                  See your timeline and upcoming slots.
                </p>
              </div>
              <SchedulePanel />
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-4">
                <h2 className="text-base font-semibold">Bookings</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Track requests, confirmations, and status.
                </p>
              </div>
              <BookingsPanel />
            </div>
          </div>

          {/* Right column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-4">
                <h2 className="text-base font-semibold">Availability</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Set your working hours and breaks.
                </p>
              </div>
              <AvailabilityEditor />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-4">
                <h2 className="text-base font-semibold">Services & pricing</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Add services, duration, and price.
                </p>
              </div>
              <ServicesEditor />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

