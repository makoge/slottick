"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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

  // ✅ placeholders (wire these to real data later without changing layout)
  const totalBookings = "—"; // e.g. "28"
  const revenueGenerated = "—"; // e.g. "€1,240"
  const customerData = "—"; // e.g. "19 customers"

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
              <span className="font-semibold text-slate-900">
                {business.slug}
              </span>
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
            value={totalBookings}
            sub="All time"
          />
          <StatCard
            title="Revenue generated"
            value={revenueGenerated}
            sub="Based on completed bookings"
          />
          <StatCard
            title="Customer data"
            value={customerData}
            sub="Unique customers"
          />
        </div>

        {/* Share link card */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="text-sm font-medium text-slate-600">
                Your shareable booking link
              </div>

              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 ring-1 ring-slate-200">
                  <div className="truncate">
                    {bookingUrl || bookingPath}
                  </div>
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

