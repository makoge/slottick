import { getAuthedBusiness } from "@/lib/auth";
import { t, getMessages } from "@/lib/i18n";
import { SubscribeButton } from "./subscribe-button";
import { MobileMoneySubscribe } from "./mobile-money-subscribe";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages(locale);

  const business = await getAuthedBusiness();
  if (!business) return <p>{t(messages, "nav.login")}</p>;

  const benefitItems = [
    t(messages, "subscribe.benefits.items.0"),
    t(messages, "subscribe.benefits.items.1"),
    t(messages, "subscribe.benefits.items.2"),
    t(messages, "subscribe.benefits.items.3"),
    t(messages, "subscribe.benefits.items.4"),
    t(messages, "subscribe.benefits.items.5"),
    t(messages, "subscribe.benefits.items.6"),
    t(messages, "subscribe.benefits.items.7"),
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1 text-sm font-semibold text-indigo-700">
          {t(messages, "subscribe.badge")}
        </span>

        <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          {t(messages, "subscribe.title")}
        </h1>

        <p className="mt-4 text-lg leading-8 text-slate-600">
          {t(messages, "subscribe.lead")}
        </p>
      </div>

      <div className="mt-14 grid gap-8 lg:grid-cols-2 lg:items-stretch">
        <div className="rounded-[32px] bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-8 text-white shadow-[0_30px_80px_-30px_rgba(15,23,42,0.45)] sm:p-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-200">
                {t(messages, "subscribe.plan.label")}
              </p>
              <h2 className="mt-3 text-3xl font-bold">
                {t(messages, "subscribe.plan.title")}
              </h2>
            </div>

            <div className="w-fit rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-indigo-100 backdrop-blur">
              {t(messages, "subscribe.plan.popular")}
            </div>
          </div>

          <div className="mt-8">
            <div className="inline-flex rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-slate-200">
              {t(messages, "subscribe.plan.noVisiblePrice")}
            </div>
          </div>

          <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
            {t(messages, "subscribe.plan.desc")}
          </p>

          <div className="mt-8 space-y-5">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-white">
                {t(messages, "subscribe.card.title")}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-300">
                {t(messages, "subscribe.card.desc")}
              </p>

              <div className="mt-4">
                <SubscribeButton
                  messages={messages}
                  locale={locale}
                  userId={business.id}
                  email={business.ownerEmail}
                />
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-white">
                {t(messages, "subscribe.momo.title")}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-300">
                {t(messages, "subscribe.momo.desc")}
              </p>

              <div className="mt-4">
                <MobileMoneySubscribe
                  businessId={business.id}
                  messages={messages}
                />
              </div>
            </div>
          </div>

          <p className="mt-5 text-sm text-slate-400">
            {t(messages, "subscribe.plan.note")}
          </p>
        </div>

        <div className="rounded-4xl border border-slate-200 bg-lime-100 p-8 shadow-[0_20px_70px_-40px_rgba(15,23,42,0.35)] sm:p-10">
          <h3 className="text-2xl font-bold tracking-tight text-slate-900">
            {t(messages, "subscribe.benefits.title")}
          </h3>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {benefitItems.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700"
              >
                {item}
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-3xl bg-slate-50 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
              {t(messages, "subscribe.why.label")}
            </p>
            <p className="mt-3 text-base leading-7 text-slate-600">
              {t(messages, "subscribe.why.body")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
