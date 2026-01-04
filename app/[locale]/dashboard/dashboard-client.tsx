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

export default function DashboardClient({ locale, business }: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const bookingPath = useMemo(() => {
    return `/${locale}/book/${business.slug}`;
  }, [business.slug, locale]);

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

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-5xl px-6 py-12">
        {/* Top bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">Dashboard</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">{business.name}</h1>
            <p className="mt-1 text-sm text-slate-600">
              Category:{" "}
              <span className="font-semibold text-slate-900">
                {business.category ?? "Service"}
              </span>{" "}
              • Slug:{" "}
              <span className="font-semibold text-slate-900">{business.slug}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
              href={bookingPath}
              target="_blank"
              rel="noreferrer"
            >
              Open booking page
            </a>

            <button
              onClick={logout}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
              type="button"
            >
              Log out
            </button>
          </div>
        </div>

        {/* Booking link card */}
        <section className="mt-8 rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-medium text-slate-600">
                Your shareable booking link
              </div>
              <div className="mt-1 break-all text-lg font-semibold">
                {bookingUrl || bookingPath}
              </div>
              <div className="mt-1 text-sm text-slate-500">
                Share this link on Instagram bio, WhatsApp, your website, anywhere.
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
        </section>

        <div className="mt-8">
          <SchedulePanel slug={business.slug} />
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <AvailabilityEditor slug={business.slug} />
          <ServicesEditor slug={business.slug} />
        </div>

        <div className="mt-6">
          <BookingsPanel slug={business.slug} />
        </div>
      </div>
    </main>
  );
}
