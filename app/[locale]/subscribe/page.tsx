import { getAuthedBusiness } from "@/lib/auth";
import { SubscribeButton } from "./subscribe-button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false }
};

export default async function PricingPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const business = await getAuthedBusiness();
  if (!business) return <p>Please sign in</p>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
  <div className="mx-auto max-w-3xl text-center">
    <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1 text-sm font-semibold text-indigo-700">
      Upgrade your business
    </span>

    <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
      Unlock premium tools to grow faster with Slottick
    </h1>

    <p className="mt-4 text-lg leading-8 text-slate-600">
      Accept more bookings, look more professional, and save time with premium features built for service businesses.
    </p>
  </div>

  <div className="mt-14 grid gap-8 lg:grid-cols-2 lg:items-stretch">
    {/* Left side */}
    <div className="rounded-[32px] bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-8 text-white shadow-[0_30px_80px_-30px_rgba(15,23,42,0.45)] sm:p-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-200">
            Subsription Plan
          </p>
          <h2 className="mt-3 text-3xl font-bold">Simple pricing, serious growth</h2>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-indigo-100 backdrop-blur">
          Most popular
        </div>
      </div>

      <div className="mt-8 flex items-end gap-2">
        <span className="text-5xl font-bold">€2</span>
        <span className="pb-1 text-base text-slate-300">/ month</span>
      </div>

      <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
        A small monthly fee for a more polished booking experience and better business growth tools.
      </p>

      <div className="mt-8">
        <SubscribeButton
          locale={locale}
          userId={business.id}
          email={business.ownerEmail}
        />
      </div>

      <p className="mt-4 text-sm text-slate-400">
        Secure checkout with Stripe. Cancel anytime.
      </p>
    </div>

    {/* Right side */}
    <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_20px_70px_-40px_rgba(15,23,42,0.35)] sm:p-10">
      <h3 className="text-2xl font-bold tracking-tight text-slate-900">
        What you get with slottick
      </h3>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {[
          "Professional booking page",
          "More trust with a premium brand feel",
          "Better client experience",
          "More conversions from visitors",
          "Cleaner business presentation",
          "Time-saving booking automation",
          "Access to future premium tools",
          "Built to help you grow revenue",
        ].map((item) => (
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
          Why subscribe
        </p>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Slottick makes your business look more serious, helps clients trust your brand, and gives you tools that support long-term growth instead of just basic booking.
        </p>
      </div>
    </div>
  </div>
</div>
  );
}
