import type { Metadata } from "next";
import Link from "next/link";

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

export default function ToolsPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Free tools for beauty and service businesses
        </h1>
        <p className="mt-3 text-slate-600">
          Use these free tools to price services correctly, understand real profit,
          and make smarter booking decisions. Built for hairstylists, nail techs,
          barbers, massage therapists, tattoo artists, and more.
        </p>
      </header>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <ToolCard
          title="Beauty Service Profit Calculator"
          desc="Calculate profit per appointment, hourly earnings, product costs per client, and monthly profit."
          href="./tools/profit-calculator"
          badge="Most popular"
        />
        <ToolCard
          title="Deposit & No-Show Cost Calculator"
          desc="Estimate how much no-shows cost you monthly and choose a fair deposit that protects your income."
          href="./tools/deposit-optimizer"
          badge="Coming soon"
          disabled
        />
      </section>

      <section className="mt-12 max-w-3xl">
        <h2 className="text-xl font-semibold text-slate-900">Why these tools exist</h2>
        <p className="mt-3 text-slate-600">
          Many service businesses underprice without realizing the impact of product costs,
          platform fees, taxes, and fixed expenses. These tools help you see your real numbers
          so you can charge confidently and grow sustainably.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">Who these tools are for</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-600">
          <li>Hair stylists, braiders, barbers</li>
          <li>Nail techs, lash techs, makeup artists</li>
          <li>Massage therapists, tattoo artists, wellness services</li>
          <li>Any appointment-based service business</li>
        </ul>
      </section>

      <section className="mt-12 rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-200">
        <h2 className="text-xl font-semibold text-slate-900">Want a booking website too?</h2>
        <p className="mt-2 text-slate-600">
          Slottick turns your availability into a shareable booking page so clients can book your real schedule.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/en"
            className="inline-flex h-11 items-center rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white"
          >
            See Slottick
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
}: {
  title: string;
  desc: string;
  href: string;
  badge?: string;
  disabled?: boolean;
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
            disabled
              ? "bg-slate-100 text-slate-500"
              : "bg-slate-900 text-white",
          ].join(" ")}
        >
          {disabled ? "Unavailable" : "Open tool →"}
        </span>
      </div>
    </div>
  );

  return disabled ? (
    Card
  ) : (
    <Link href={href} className="block">
      {Card}
    </Link>
  );
}