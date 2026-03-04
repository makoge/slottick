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
    <main className="mx-auto max-w-5xl px-4 py-10">
      <ProfitCalculator />

      <section className="mx-auto mt-16 max-w-3xl text-slate-700">
        <h2 className="text-2xl font-semibold">
          {t(messages, "profit.seo.h2")}
        </h2>

        <p className="mt-4">{t(messages, "profit.seo.p1")}</p>

        <h3 className="mt-8 text-xl font-semibold">
          {t(messages, "profit.seo.h3a")}
        </h3>

        <p className="mt-3">{t(messages, "profit.seo.p2")}</p>

        <h3 className="mt-8 text-xl font-semibold">
          {t(messages, "profit.seo.h3b")}
        </h3>

        <p className="mt-3">{t(messages, "profit.seo.p3")}</p>

        <p className="mt-6">{t(messages, "profit.seo.p4")}</p>
      </section>
    </main>
  );
}