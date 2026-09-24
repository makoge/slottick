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
  if (!business) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="font-mono text-sm text-slate-700">
          {t(messages, "nav.login")}
        </p>
      </div>
    );
  }

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
    <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      {/* Background ambient accents */}
      <div className="pointer-events-none absolute -top-12 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-lime-200/35 blur-3xl pointer-events-none" />

      {/* HEADER BANNER */}
      <div className="mx-auto max-w-3xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-lime-300/80 bg-lime-100 px-3.5 py-1 text-xs font-bold text-lime-950 shadow-xs">
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-lime-900 text-[10px] text-white">
            ✓
          </span>
          <span className="font-mono uppercase tracking-wider">
            {t(messages, "subscribe.badge")}
          </span>
        </div>

        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          {t(messages, "subscribe.title")}
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-slate-700 sm:text-base">
          {t(messages, "subscribe.lead")}
        </p>
      </div>

      {/* SUBSCRIPTION & VALUE PROPOSITION TWO-COLUMN GRID */}
      <div className="mt-12 grid gap-8 lg:grid-cols-2 lg:items-stretch">
        {/* LEFT COLUMN: ACTIVE PLAN & CHECKOUT MODES */}
        <div className="flex flex-col justify-between rounded-3xl border border-slate-400/40 bg-white/75 p-6 shadow-xl backdrop-blur-2xl sm:p-10">
          <div>
            <div className="flex flex-col gap-3 border-b border-slate-300/70 pb-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
                  {t(messages, "subscribe.plan.label")}
                </p>
                <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                  {t(messages, "subscribe.plan.title")}
                </h2>
              </div>

              <div className="w-fit rounded-full border border-lime-300/80 bg-lime-100 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-lime-950 shadow-2xs">
                {t(messages, "subscribe.plan.popular")}
              </div>
            </div>

            <div className="mt-6">
              <div className="inline-flex rounded-2xl border border-slate-300/80 bg-slate-100/70 px-4 py-2.5 font-mono text-xs font-bold text-slate-800">
                {t(messages, "subscribe.plan.noVisiblePrice")}
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
              {t(messages, "subscribe.plan.desc")}
            </p>

            {/* CHECKOUT CONTAINERS */}
            <div className="mt-8 space-y-5">
              {/* Card Gateway Drawer */}
              <div className="rounded-2xl border border-slate-300/80 bg-white/80 p-5 shadow-2xs backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-500">
                    💳
                  </span>
                  <p className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900">
                    {t(messages, "subscribe.card.title")}
                  </p>
                </div>
                <p className="mt-1 font-mono text-xs text-slate-600">
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

              {/* Mobile Money Gateway Drawer */}
              <div className="rounded-2xl border border-slate-300/80 bg-white/80 p-5 shadow-2xs backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-500">
                    📱
                  </span>
                  <p className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900">
                    {t(messages, "subscribe.momo.title")}
                  </p>
                </div>
                <p className="mt-1 font-mono text-xs text-slate-600">
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
          </div>

          <p className="mt-8 border-t border-slate-200/80 pt-4 font-mono text-[11px] text-slate-500">
            {t(messages, "subscribe.plan.note")}
          </p>
        </div>

        {/* RIGHT COLUMN: BENEFITS & WHY SLOTTICK */}
        <div className="flex flex-col justify-between rounded-3xl border border-slate-400/40 bg-white/75 p-6 shadow-xl backdrop-blur-2xl sm:p-10">
          <div>
            <div className="border-b border-slate-300/70 pb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-md border border-lime-300/80 bg-lime-100 font-mono text-[10px] font-bold text-lime-950 shadow-2xs">
                  ✓
                </span>
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
                  Tier Inclusions
                </h3>
              </div>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                {t(messages, "subscribe.benefits.title")}
              </h2>
            </div>

            {/* Benefits Feature Grid */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {benefitItems.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-2.5 rounded-2xl border border-slate-300/80 bg-slate-100/70 p-3.5 shadow-2xs backdrop-blur-sm"
                >
                  <span className="mt-0.5 font-mono text-xs font-bold text-lime-950">
                    ✓
                  </span>
                  <span className="font-mono text-xs font-semibold leading-relaxed text-slate-800">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Philosophy / Why Section */}
          <div className="mt-8 rounded-2xl border border-lime-300/80 bg-lime-100/70 p-5 shadow-xs backdrop-blur-sm">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-lime-950">
              {t(messages, "subscribe.why.label")}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-lime-950 sm:text-sm">
              {t(messages, "subscribe.why.body")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
