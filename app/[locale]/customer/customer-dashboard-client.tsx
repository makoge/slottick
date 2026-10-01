"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

export interface DashboardBooking {
  id: string;
  serviceName: string;
  startsAt: string;
  price: number;
  currency: string;
  status: "CONFIRMED" | "PENDING" | "DONE" | "CANCELLED";
  business: {
    name: string;
    slug: string;
    city?: string | null;
  };
  hasReview?: boolean;
}

interface Props {
  initialBookings?: DashboardBooking[];
  customerName?: string;
  creditsBalance?: number;
  isVip?: boolean;
}

const dict = {
  en: {
    badge: "Client Pass",
    title: "My bookings & perks",
    subtitle:
      "Track upcoming slots, manage reschedules, and unlock member credits.",
    upcoming: "Upcoming slots",
    spent: "Total spent",
    services: "Services booked",
    credits: "Slottick credits",
    tabUpcoming: "Upcoming slots",
    tabHistory: "Visit history",
    noBookings: "No upcoming bookings scheduled.",
    noBookingsSub:
      "Explore top stylists, barbers, and wellness providers near you.",
    bookNow: "Find an open slot",
    bookAgain: "Rebook",
    reschedule: "Reschedule",
    addToCal: "Add to Calendar",
    leaveReview: "Leave Review ⭐",
    vipTitle: "Slottick Pass+",
    vipBadge: "VIP Member",
    vipSubtitle: "Automated peak-hour slot alerts & 5% cashback balance.",
    vipBenefit1: "Instant SMS waitlist alerts when appointments cancel",
    vipBenefit2: "Free last-minute rescheduling protection",
    vipBenefit3: "5% back in booking credits on every completed visit",
    vipUpgradeBtn: "Upgrade for 4.99 € / mo",
    vipActive: "VIP Active — Enjoy 5% Cashback",
    rebookTitle: "Favorite Specialists",
    rebookSub: "Rebook your go-to providers in one tap",
  },
  fr: {
    badge: "Accès Client",
    title: "Mes réservations & avantages",
    subtitle:
      "Suivez vos créneaux, gérez vos déplacements et profitez de vos crédits.",
    upcoming: "Créneaux à venir",
    spent: "Total dépensé",
    services: "Services réservés",
    credits: "Crédits Slottick",
    tabUpcoming: "À venir",
    tabHistory: "Historique",
    noBookings: "Aucune réservation programmée.",
    noBookingsSub:
      "Découvrez les meilleurs coiffeurs, barbiers et praticiens près de chez vous.",
    bookNow: "Trouver un créneau",
    bookAgain: "Réserver à nouveau",
    reschedule: "Déplacer",
    addToCal: "Ajouter au calendrier",
    leaveReview: "Donner un avis ⭐",
    vipTitle: "Slottick Pass+",
    vipBadge: "Membre VIP",
    vipSubtitle: "Alertes automatiques créneaux de pointe & 5% de cashback.",
    vipBenefit1: "Alertes SMS immédiates en cas de créneau libéré",
    vipBenefit2: "Protection report et annulation sans frais",
    vipBenefit3: "5% reversés en crédits sur chaque soin effectué",
    vipUpgradeBtn: "Passer VIP pour 4,99 € / mois",
    vipActive: "VIP Actif — 5% de cashback appliqués",
    rebookTitle: "Spécialistes favoris",
    rebookSub: "Réservez vos professionnels habituels en 1 clic",
  },
} as const;

export default function CustomerDashboardClient({
  initialBookings = [],
  customerName = "Client",
  creditsBalance = 0,
  isVip = false,
}: Props) {
  const params = useParams<{ locale?: string }>();
  const locale = params?.locale === "fr" ? "fr" : "en";
  const t = dict[locale];

  const [activeTab, setActiveTab] = useState<"upcoming" | "history">(
    "upcoming",
  );

  const nowMs = Date.now();

  const { upcoming, history, totalSpent, uniqueServicesCount } = useMemo(() => {
    const up: DashboardBooking[] = [];
    const past: DashboardBooking[] = [];
    let spent = 0;
    const servicesSet = new Set<string>();

    initialBookings.forEach((b) => {
      const bTime = new Date(b.startsAt).getTime();
      if (b.status !== "CANCELLED") {
        spent += Number(b.price || 0);
        servicesSet.add(b.serviceName);
      }

      if (bTime >= nowMs && b.status !== "CANCELLED") {
        up.push(b);
      } else {
        past.push(b);
      }
    });

    return {
      upcoming: up.sort(
        (a, b) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      ),
      history: past.sort(
        (a, b) =>
          new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
      ),
      totalSpent: spent,
      uniqueServicesCount: servicesSet.size,
    };
  }, [initialBookings, nowMs]);

  const recentProviders = useMemo(() => {
    const map = new Map<string, DashboardBooking>();
    initialBookings.forEach((b) => {
      if (!map.has(b.business.slug)) {
        map.set(b.business.slug, b);
      }
    });
    return Array.from(map.values()).slice(0, 3);
  }, [initialBookings]);

  const stats = useMemo(
    () => [
      {
        label: t.upcoming,
        value: String(upcoming.length),
        badge: upcoming.length > 0 ? "Active" : null,
      },
      {
        label: t.credits,
        value: `${creditsBalance.toFixed(2)} €`,
        badge: "Reward",
      },
      {
        label: t.spent,
        value: `${totalSpent.toFixed(2)} €`,
        badge: null,
      },
      {
        label: t.services,
        value: String(uniqueServicesCount),
        badge: null,
      },
    ],
    [t, upcoming.length, creditsBalance, totalSpent, uniqueServicesCount],
  );

  return (
    <main className="min-h-screen bg-slate-100/70 text-slate-900 selection:bg-lime-200">
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Slottick Dark Accent Hero */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-900 bg-slate-950 p-6 text-white shadow-xl sm:p-10">
          <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-lime-400/10 blur-3xl pointer-events-none" />

          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-lime-400/30 bg-lime-400/10 px-3 py-1 font-mono text-[11px] font-extrabold uppercase tracking-wider text-lime-300">
                <span className="h-1.5 w-1.5 rounded-full bg-lime-400 animate-pulse" />
                {isVip ? t.vipBadge : t.badge}
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                {t.title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
                {t.subtitle}
              </p>
            </div>

            <Link
              href={`/${locale}/explore`}
              className="inline-flex shrink-0 items-center justify-center rounded-2xl border border-lime-300 bg-lime-300 px-6 py-3.5 font-mono text-xs font-black uppercase tracking-wider text-lime-950 shadow-sm transition hover:bg-lime-200 hover:shadow-md active:scale-[0.98]"
            >
              + {t.bookNow}
            </Link>
          </div>
        </div>

        {/* Quick KPI Stat Grid */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition hover:border-slate-300"
            >
              <div className="flex items-center justify-between">
                <p className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
                  {item.label}
                </p>
                {item.badge && (
                  <span className="rounded-full bg-lime-100 px-2 py-0.5 font-mono text-[10px] font-extrabold text-lime-900 border border-lime-200">
                    {item.badge}
                  </span>
                )}
              </div>
              <p className="mt-3 font-mono text-3xl font-black tracking-tight text-slate-900">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {/* Main Content Layout */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_0.9fr]">
          {/* Left: Bookings Management */}
          <section className="space-y-6">
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs sm:p-7">
              {/* Tab Selector */}
              <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                <button
                  type="button"
                  onClick={() => setActiveTab("upcoming")}
                  className={`rounded-xl px-4 py-2 font-mono text-xs font-bold transition ${
                    activeTab === "upcoming"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {t.tabUpcoming} ({upcoming.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("history")}
                  className={`rounded-xl px-4 py-2 font-mono text-xs font-bold transition ${
                    activeTab === "history"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {t.tabHistory} ({history.length})
                </button>
              </div>

              {/* Bookings View */}
              <div className="mt-6">
                {activeTab === "upcoming" ? (
                  upcoming.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-10 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-slate-200 text-xl shadow-2xs">
                        🗓️
                      </div>
                      <p className="mt-4 font-bold text-slate-900">
                        {t.noBookings}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                        {t.noBookingsSub}
                      </p>
                      <Link
                        href={`/${locale}/explore`}
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 font-mono text-xs font-bold text-white transition hover:bg-slate-800"
                      >
                        {t.bookNow} →
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {upcoming.map((b) => {
                        const dateObj = new Date(b.startsAt);
                        return (
                          <div
                            key={b.id}
                            className="group relative rounded-2xl border border-slate-200 bg-slate-50/50 p-5 transition hover:border-slate-400 hover:bg-white"
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-bold uppercase text-slate-400">
                                    {b.business.city || "Direct Location"}
                                  </span>
                                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                                  <span className="rounded-full bg-lime-100 px-2 py-0.5 font-mono text-[10px] font-extrabold text-lime-950 border border-lime-300/80">
                                    {b.status}
                                  </span>
                                </div>
                                <h3 className="mt-1.5 text-base font-bold text-slate-900">
                                  {b.serviceName}
                                </h3>
                                <Link
                                  href={`/${locale}/book/${b.business.slug}`}
                                  className="font-mono text-xs font-semibold text-slate-600 underline hover:text-slate-900"
                                >
                                  {b.business.name}
                                </Link>
                              </div>

                              <div className="rounded-xl border border-slate-200 bg-white p-3 text-left sm:text-right">
                                <div className="font-mono text-xs font-bold text-slate-900">
                                  {dateObj.toLocaleDateString(locale, {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </div>
                                <div className="font-mono text-sm font-black text-slate-900">
                                  {dateObj.toLocaleTimeString(locale, {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                                <div className="font-mono text-[11px] text-slate-500">
                                  {b.price} {b.currency}
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/60 pt-3">
                              <span className="font-mono text-[11px] text-slate-400">
                                #{b.id.slice(0, 8)}
                              </span>
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/${locale}/book/${b.business.slug}`}
                                  className="rounded-xl border border-slate-200 bg-white px-3 py-1 font-mono text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                                >
                                  {t.reschedule}
                                </Link>
                                <a
                                  href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                                    `${b.serviceName} @${b.business.name}`,
                                  )}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="rounded-xl border border-slate-200 bg-white px-3 py-1 font-mono text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                                >
                                  {t.addToCal} ↗
                                </a>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : (
                  <div className="space-y-3">
                    {history.map((b) => (
                      <div
                        key={b.id}
                        className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">
                            {b.serviceName}
                          </h4>
                          <p className="font-mono text-xs text-slate-500">
                            {b.business.name} •{" "}
                            {new Date(b.startsAt).toLocaleDateString(locale)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {!b.hasReview && (
                            <Link
                              href={`/${locale}/book/${b.business.slug}?reviewBookingId=${b.id}`}
                              className="rounded-xl border border-lime-300 bg-lime-100 px-3 py-1.5 font-mono text-[11px] font-bold text-lime-950 hover:bg-lime-200"
                            >
                              {t.leaveReview}
                            </Link>
                          )}
                          <Link
                            href={`/${locale}/book/${b.business.slug}`}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                          >
                            {t.bookAgain} ↻
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Rebook Carousel */}
            {recentProviders.length > 0 && (
              <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-800">
                      {t.rebookTitle}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {t.rebookSub}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {recentProviders.map((item) => (
                    <Link
                      key={item.business.slug}
                      href={`/${locale}/book/${item.business.slug}`}
                      className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition hover:border-slate-900 hover:bg-white"
                    >
                      <div>
                        <div className="font-bold text-slate-900 text-sm group-hover:text-slate-950">
                          {item.business.name}
                        </div>
                        <div className="font-mono text-[11px] text-slate-500 mt-1">
                          {item.serviceName}
                        </div>
                      </div>
                      <div className="mt-4 font-mono text-xs font-bold text-lime-700 flex items-center gap-1">
                        Book Slot <span>→</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Right: VIP Membership & Upsell Perks */}
          <aside className="space-y-6">
            {/* VIP Pass Card */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-900 bg-slate-950 p-6 text-white shadow-xl sm:p-7">
              <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-lime-400/20 blur-2xl pointer-events-none" />

              <div className="inline-flex items-center gap-1.5 rounded-full border border-lime-400/40 bg-lime-400/10 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-lime-300">
                {t.vipBadge}
              </div>

              <h3 className="mt-3 text-xl font-black tracking-tight">
                {t.vipTitle}
              </h3>
              <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                {t.vipSubtitle}
              </p>

              <ul className="mt-5 space-y-2.5 font-mono text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-lime-400 font-bold shrink-0">✓</span>
                  <span>{t.vipBenefit1}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-lime-400 font-bold shrink-0">✓</span>
                  <span>{t.vipBenefit2}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-lime-400 font-bold shrink-0">✓</span>
                  <span>{t.vipBenefit3}</span>
                </li>
              </ul>

              {isVip ? (
                <div className="mt-6 rounded-2xl border border-lime-500/40 bg-lime-500/10 py-3 text-center font-mono text-xs font-bold text-lime-300">
                  {t.vipActive}
                </div>
              ) : (
                <button
                  type="button"
                  className="mt-6 w-full rounded-2xl border border-lime-300 bg-lime-300 py-3 font-mono text-xs font-black uppercase tracking-wider text-lime-950 shadow-sm transition hover:bg-lime-200 active:scale-[0.98]"
                >
                  {t.vipUpgradeBtn}
                </button>
              )}
            </div>

            {/* Quick Profile Snapshot */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs">
              <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
                Connected Profile
              </h4>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 font-mono text-sm font-bold text-white">
                  {customerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">
                    {customerName}
                  </div>
                  <div className="font-mono text-[11px] text-slate-500">
                    Slottick Client Member
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
