import type { Metadata } from "next";
import ProfitCalculator from "./ProfitCalculator";

import { getMessages, t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Beauty Service Profit Calculator | Free Pricing & Cost Tool",
  description:
    "Free profit calculator for hairstylists, nail techs, barbers and beauty professionals. Calculate real profit per appointment, hourly earnings, product costs, and monthly income.",
  keywords: [
    "beauty profit calculator",
    "hair stylist profit calculator",
    "nail tech pricing calculator",
    "service pricing calculator",
    "beauty business profit tool",
    "salon pricing tool",
  ],
  openGraph: {
    title: "Beauty Business Profit Calculator",
    description:
      "See your real profit per appointment and per hour. Built for beauty and wellness professionals.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function Page({ params }: PageProps) {
  const { locale } = await params;
  const messages = await getMessages(locale);

  return (
    <div className="w-full pb-20">
      {/* 1. HERO HEADER */}
      <section className="relative w-full border-b border-slate-400/30 bg-white/40 px-4 py-8 shadow-xs backdrop-blur-xl sm:px-8 sm:py-12">
        <div className="mx-auto max-w-5xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-lime-300/80 bg-lime-100 px-3.5 py-1 text-xs font-bold text-lime-950 shadow-xs">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-lime-900 text-[10px] text-white">
              ✓
            </span>
            <span className="font-mono uppercase tracking-wider">
              Financial Engine
            </span>
          </div>

          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Beauty Service Profit Calculator
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-700 sm:text-base">
            Calculate your true take-home earnings, margin breakdowns, and
            optimal service duration pricing.
          </p>
        </div>
      </section>

      {/* 2. MAIN INTERACTIVE CALCULATOR */}
      <div className="mx-auto mt-8 max-w-5xl px-4 sm:px-8">
        <ProfitCalculator />

        {/* 3. SEO & METHODOLOGY CARD */}
        <section className="mt-12 rounded-3xl border border-slate-400/40 bg-white/65 p-6 shadow-sm backdrop-blur-xl sm:p-10">
          <div className="flex items-center gap-2 border-b border-slate-300/70 pb-4">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-lime-300/80 bg-lime-100 font-mono text-xs font-bold text-lime-950">
              ✓
            </span>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              {t(messages, "profit.seo.h2")}
            </h2>
          </div>

          <div className="mt-5 space-y-4 text-sm leading-relaxed text-slate-700 sm:text-base">
            <p>{t(messages, "profit.seo.p1")}</p>

            <div className="pt-2">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900">
                {t(messages, "profit.seo.h3a")}
              </h3>
              <p className="mt-1.5">{t(messages, "profit.seo.p2")}</p>
            </div>

            <div className="pt-2">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900">
                {t(messages, "profit.seo.h3b")}
              </h3>
              <p className="mt-1.5">{t(messages, "profit.seo.p3")}</p>
            </div>

            <p className="border-t border-slate-300/60 pt-4 text-slate-600">
              {t(messages, "profit.seo.p4")}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
