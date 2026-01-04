"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import AvailabilityEditor from "./availability";
import ServicesEditor from "./services";
import BookingsPanel from "./bookings";
import SchedulePanel from "./schedule";

type Account = {
  createdAt: string;
  businessName: string;
  slug: string;
  website?: string | null;
  email: string;
  category?: string | null;
  city?: string | null;
  country?: string | null;
};

type Props = { locale: string };

type MeResponse =
  | {
      business: {
        createdAt: string;
        name: string;
        slug: string;
        website: string | null;
        ownerEmail: string;
        category: string | null;
        city: string | null;
        country: string | null;
      };
    }
  | { error: string };

export default function DashboardClient({ locale }: Props) {
  const router = useRouter();

  const [account, setAccount] = useState<Account | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  // ✅ load from DB via session cookie
  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);

      try {
        const res = await fetch("/api/owner/me", {
          method: "GET",
          cache: "no-store"
        });

        const data = (await res.json().catch(() => ({}))) as MeResponse;

        if (cancelled) return;

        if (!res.ok || !("business" in data)) {
          router.replace(`/${locale}/login`);
          return;
        }

        setAccount({
          createdAt: String(data.business.createdAt),
          businessName: String(data.business.name),
          slug: String(data.business.slug),
          website: data.business.website ?? null,
          email: String(data.business.ownerEmail),
          category: data.business.category ?? null,
          city: data.business.city ?? null,
          country: data.business.country ?? null
        });
      } catch {
        if (!cancelled) router.replace(`/${locale}/login`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [locale, router]);

  const bookingPath = useMemo(() => {
    if (!account) return "";
    return `/${locale}/book/${account.slug}`;
  }, [account, locale]);

  const bookingUrl = useMemo(() => {
    if (typeof window === "undefined" || !bookingPath) return "";
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

  if (loading || !account) {
    return (
      <main className="min-h-screen bg-white text-slate-900">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="text-sm text-slate-600">Loading your dashboard…</div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-5xl px-6 py-12">
        {/* Top bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">Dashboard</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              {account.businessName}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Category:{" "}
              <span className="font-semibold text-slate-900">
                {account.category ?? "Service"}
              </span>{" "}
              • Slug:{" "}
              <span className="font-semibold text-slate-900">{account.slug}</span>
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

        {/* Owner schedule */}
        <div className="mt-8">
          <SchedulePanel slug={account.slug} />
        </div>

        {/* Main grid */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <AvailabilityEditor slug={account.slug} />
          <ServicesEditor slug={account.slug} />
        </div>

        {/* Bookings */}
        <div className="mt-6">
          <BookingsPanel slug={account.slug} />
        </div>
      </div>
    </main>
  );
}
