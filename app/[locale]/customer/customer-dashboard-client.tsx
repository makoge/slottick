"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";

const dict = {
  en: {
    title: "My bookings",
    subtitle: "Track your bookings, spending, saved services, and nearby deals.",
    upcoming: "Upcoming bookings",
    spent: "Money spent",
    services: "Services booked",
    deals: "Nearby discounts",
    noBookings: "No upcoming bookings yet.",
    bookAgain: "Book again",
    viewDeals: "View cheap services near me",
    promoTitle: "Promotions for services you like",
    promoText: "When a business you booked before adds a discount, you’ll see it here.",
  },
  fr: {
    title: "Mes réservations",
    subtitle: "Suivez vos réservations, dépenses, services réservés et offres proches.",
    upcoming: "Réservations à venir",
    spent: "Argent dépensé",
    services: "Services réservés",
    deals: "Réductions proches",
    noBookings: "Aucune réservation à venir.",
    bookAgain: "Réserver encore",
    viewDeals: "Voir les services moins chers près de moi",
    promoTitle: "Promotions pour les services que vous aimez",
    promoText: "Quand une entreprise déjà réservée ajoute une réduction, elle apparaîtra ici.",
  },
} as const;

export default function CustomerDashboardClient() {
  const params = useParams<{ locale?: string }>();
  const locale = params?.locale === "fr" ? "fr" : "en";
  const t = dict[locale];

  const stats = useMemo(
    () => [
      { label: t.upcoming, value: "0" },
      { label: t.spent, value: "€0" },
      { label: t.services, value: "0" },
      { label: t.deals, value: "0" },
    ],
    [t]
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-slate-950 px-5 py-8 text-white shadow-sm sm:px-8">
          <p className="text-sm font-semibold text-lime-200">Slottick</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
            {t.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
            {t.subtitle}
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className="mt-2 text-3xl font-bold">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-bold">{t.upcoming}</h2>
              <a
                href={`/${locale}/explore`}
                className="rounded-xl bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-slate-800"
              >
                {t.bookAgain}
              </a>
            </div>

            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="font-medium text-slate-700">{t.noBookings}</p>
            </div>
          </section>

          <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-bold">{t.promoTitle}</h2>
            <p className="mt-2 text-sm text-slate-600">{t.promoText}</p>

            <a
              href={`/${locale}/explore`}
              className="mt-5 block rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold hover:bg-slate-50"
            >
              {t.viewDeals}
            </a>
          </aside>
        </div>
      </section>
    </main>
  );
}