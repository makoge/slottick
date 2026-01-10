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
  notes?: string | null;
  status: "CONFIRMED" | "CANCELLED";
};

function StatCard({
  title,
  value,
  sub,
}: {
  title: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm font-medium text-slate-600">{title}</div>
      <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </div>
      {sub ? <div className="mt-1 text-sm text-slate-500">{sub}</div> : null}
    </div>
  );
}

export default function DashboardClient({ locale, business }: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  // ✅ stats data
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

  // ✅ compute stats from bookings
  const {
    totalBookings,
    customerCount,
    revenueLabel,
    revenueSub,
    totalSub,
    customerSub,
  } = useMemo(() => {
    const active = bookings.filter((b) => b.status !== "CANCELLED");

    // total bookings (all time)
    const total = active.length;

    // unique customers (phone is best key)
    const customers = new Set<string>();
    for (const b of active) {
      const key = (b.customerPhone || "").trim() || `${b.customerName}`.trim();
      if (key) customers.add(key);
    }

    // revenue (only past confirmed, since you don't have "COMPLETED" yet)
    const now = Date.now();
    const revenueBookings = active.filter(
      (b) => b.status === "CONFIRMED" && new Date(b.startsAt).getTime() <= now
    );

    // handle currency: show value only if single currency; otherwise show "Mixed"
    const currencies = new Set(revenueBookings.map((b) => String(b.currency || "").toUpperCase()));
    const singleCurrency = currencies.size === 1 ? [...currencies][0] : null;

    const revenue = revenueBookings.reduce((sum, b) => sum + Number(b.price || 0), 0);

    const revenueValue =
      revenueBookings.length === 0
        ? "0"
        : singleCurrency
          ? formatMoney(revenue, singleCurrency as any)
          : "Mixed";

    return {
      totalBookings: statsLoading ? "—" : String(total),
      customerCount: statsLoading ? "—" : String(customers.size),
      revenueLabel: statsLoading ? "—" : revenueValue,

      totalSub: statsLoading ? "Loading…" : "All time (not cancelled)",
      revenueSub: statsLoading
        ? "Loading…"
        : singleCurrency
          ? "Confirmed in the past"
          : "Revenue in multiple currencies",
      customerSub: statsLoading ? "Loading…" : "Unique customers",
    };
  }, [bookings, statsLoading]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">Dashboard</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">{business.name}</h1>
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
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
            >
              Refresh stats
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
          <StatCard title="Total bookings" value={totalBookings} sub={totalSub} />
          <StatCard title="Revenue generated" value={revenueLabel} sub={revenueSub} />
          <StatCard title="Customer data" value={customerCount} sub={customerSub} />
        </div>

        {/* Share link card */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="text-sm font-medium text-slate-600">Your shareable booking link</div>

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
                <p className="mt-1 text-sm text-slate-500">
                  Track requests, confirmations, and status.
                </p>
              </div>
              <BookingsPanel />
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
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
