// app/[locale]/tools/page.tsx
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
    <div className="w-full pb-20">
      {/* 1. HERO HEADER SECTION */}
      <section className="relative w-full border-b border-slate-400/30 bg-white/40 px-4 py-10 shadow-sm backdrop-blur-xl sm:px-8 sm:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-lime-300/80 bg-lime-100 px-3.5 py-1 text-xs font-bold text-lime-950 shadow-xs">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-lime-900 text-[10px] text-white">
              ✓
            </span>
            <span className="font-mono uppercase tracking-wider">
              Business Utilities
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            {t(messages, "tools.h1")}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-700 sm:text-base">
            {t(messages, "tools.intro")}
          </p>
        </div>
      </section>

      <div className="mx-auto mt-8 max-w-6xl px-4 sm:px-8 space-y-10">
        {/* 2. TOOLS BENTO GRID */}
        <section className="grid gap-6 md:grid-cols-2">
          <ToolCard
            title={t(messages, "tools.cards.profit.title")}
            desc={t(messages, "tools.cards.profit.desc")}
            href={`/${locale}/tools/profit-calculator`}
            badge={t(messages, "tools.badges.mostPopular")}
            ctaLabel={t(messages, "tools.cta.open")}
            disabledLabel={t(messages, "tools.cta.unavailable")}
            icon="calculate"
          />
          <ToolCard
            title={t(messages, "tools.cards.followUp.title")}
            desc={t(messages, "tools.cards.followUp.desc")}
            href={`/${locale}/tools/client-follow-up-automation`}
            badge={t(messages, "tools.badges.mostPopular")}
            ctaLabel={t(messages, "tools.cta.open")}
            disabledLabel={t(messages, "tools.cta.unavailable")}
            icon="mark_email_read"
          />
        </section>

        {/* 3. VALUE PROPOSITION & AUDIENCE */}
        <section className="grid gap-6 md:grid-cols-12">
          {/* Why section */}
          <div className="rounded-3xl border border-slate-400/40 bg-white/60 p-6 shadow-sm backdrop-blur-xl sm:p-8 md:col-span-6">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl border border-lime-300/80 bg-lime-100 font-mono text-xs font-bold text-lime-950">
                ★
              </span>
              <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                {t(messages, "tools.why.title")}
              </h2>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-700">
              {t(messages, "tools.why.body")}
            </p>
          </div>

          {/* Who it is for */}
          <div className="rounded-3xl border border-slate-400/40 bg-white/60 p-6 shadow-sm backdrop-blur-xl sm:p-8 md:col-span-6">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl border border-slate-300/80 bg-white/90 font-mono text-xs font-bold text-slate-900">
                ✓
              </span>
              <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                {t(messages, "tools.who.title")}
              </h2>
            </div>

            <ul className="mt-4 space-y-2.5">
              {[0, 1, 2, 3].map((idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-sm text-slate-700"
                >
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-500" />
                  <span>{t(messages, `tools.who.items.${idx}`)}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 4. CALL TO ACTION BANNER */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-400/40 bg-slate-900/95 p-6 text-white shadow-xl backdrop-blur-2xl sm:p-10">
          <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-lime-400/15 blur-[90px] pointer-events-none" />

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex rounded-full border border-slate-700 bg-slate-800 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-lime-300">
              Complete Scheduling Engine
            </div>

            <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
              {t(messages, "tools.bookingCta.title")}
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-slate-300 sm:text-base">
              {t(messages, "tools.bookingCta.body")}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/${locale}`}
                className="inline-flex items-center justify-center rounded-2xl border border-lime-300/80 bg-lime-100 px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider text-lime-950 shadow-xs transition hover:bg-lime-200 active:scale-95"
              >
                {t(messages, "tools.bookingCta.button")} →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
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
  icon = "build",
}: {
  title: string;
  desc: string;
  href: string;
  badge?: string;
  disabled?: boolean;
  ctaLabel?: string;
  disabledLabel?: string;
  icon?: string;
}) {
  const Card = (
    <div className="group flex h-full flex-col justify-between rounded-3xl border border-slate-400/40 bg-white/70 p-6 shadow-sm backdrop-blur-xl transition hover:-translate-y-1 hover:border-slate-400/80 hover:bg-white/90 hover:shadow-md sm:p-7">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-lime-300/80 bg-lime-100 text-lime-950 shadow-xs">
            <span className="material-symbols-outlined text-xl">{icon}</span>
          </div>

          {badge ? (
            <span className="rounded-full border border-lime-300/80 bg-lime-100 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-lime-950">
              {badge}
            </span>
          ) : null}
        </div>

        <h3 className="mt-4 text-xl font-bold tracking-tight text-slate-900 group-hover:text-black">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{desc}</p>
      </div>

      <div className="mt-6 border-t border-slate-300/60 pt-4 flex items-center justify-between">
        <span className="font-mono text-xs font-semibold text-slate-500">
          Free to use
        </span>
        <span
          className={[
            "inline-flex items-center rounded-xl px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition active:scale-95",
            disabled
              ? "border border-slate-300/80 bg-slate-100 text-slate-400"
              : "border border-lime-300/80 bg-lime-100 text-lime-950 shadow-xs hover:bg-lime-200",
          ].join(" ")}
        >
          {disabled ? disabledLabel : `${ctaLabel} →`}
        </span>
      </div>
    </div>
  );

  return disabled ? (
    Card
  ) : (
    <Link href={href} className="block h-full">
      {Card}
    </Link>
  );
}
