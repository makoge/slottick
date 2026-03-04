import type { Metadata } from "next";
import Link from "next/link";

import { getMessages, t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Free Tools for Beauty & Service Businesses | Slottick",
  description:
    "Free calculators and tools for beauty and service businesses. Improve pricing, profit, deposits, and scheduling with simple tools built for hairstylists, nail techs, barbers, massage therapists and more.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Free Tools for Beauty & Service Businesses | Slottick",
    description:
      "Pricing, profit and booking tools made for beauty and service professionals.",
    type: "website",
  },
};

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ToolsPage({ params }: PageProps) {
  const { locale } = await params;
  const messages = await getMessages(locale);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {t(messages, "tools.h1")}
        </h1>

        <p className="mt-3 text-slate-600">{t(messages, "tools.intro")}</p>
      </header>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <ToolCard
          title={t(messages, "tools.cards.profit.title")}
          desc={t(messages, "tools.cards.profit.desc")}
          href={`/${locale}/tools/profit-calculator`}
          badge={t(messages, "tools.badges.mostPopular")}
          ctaLabel={t(messages, "tools.cta.open")}
          disabledLabel={t(messages, "tools.cta.unavailable")}
        />

        <ToolCard
          title={t(messages, "tools.cards.deposit.title")}
          desc={t(messages, "tools.cards.deposit.desc")}
          href={`/${locale}/tools/deposit-optimizer`}
          badge={t(messages, "tools.badges.comingSoon")}
          disabled
          disabledLabel={t(messages, "tools.cta.unavailable")}
          ctaLabel={t(messages, "tools.cta.open")}
        />
      </section>

      <section className="mt-12 max-w-3xl">
        <h2 className="text-xl font-semibold text-slate-900">
          {t(messages, "tools.why.title")}
        </h2>

        <p className="mt-3 text-slate-600">{t(messages, "tools.why.body")}</p>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">
          {t(messages, "tools.who.title")}
        </h2>

        <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-600">
          <li>{t(messages, "tools.who.items.0")}</li>
          <li>{t(messages, "tools.who.items.1")}</li>
          <li>{t(messages, "tools.who.items.2")}</li>
          <li>{t(messages, "tools.who.items.3")}</li>
        </ul>
      </section>

      <section className="mt-12 rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-200">
        <h2 className="text-xl font-semibold text-slate-900">
          {t(messages, "tools.bookingCta.title")}
        </h2>

        <p className="mt-2 text-slate-600">
          {t(messages, "tools.bookingCta.body")}
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`/${locale}`}
            className="inline-flex h-11 items-center rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white"
          >
            {t(messages, "tools.bookingCta.button")}
          </Link>
        </div>
      </section>
    </main>
  );
}

function ToolCard({
  title,
  desc,
  href,
  badge,
  disabled,
  ctaLabel = "Open tool →",
  disabledLabel = "Unavailable",
}: {
  title: string;
  desc: string;
  href: string;
  badge?: string;
  disabled?: boolean;
  ctaLabel?: string;
  disabledLabel?: string;
}) {
  const Card = (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-emerald-200">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <p className="mt-2 text-slate-600">{desc}</p>
        </div>

        {badge ? (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {badge}
          </span>
        ) : null}
      </div>

      <div className="mt-5">
        <span
          className={[
            "inline-flex h-11 items-center rounded-2xl px-4 text-sm font-semibold",
            disabled ? "bg-slate-100 text-slate-500" : "bg-slate-900 text-white",
          ].join(" ")}
        >
          {disabled ? disabledLabel : ctaLabel}
        </span>
      </div>
    </div>
  );

  return disabled ? Card : (
    <Link href={href} className="block">
      {Card}
    </Link>
  );
}