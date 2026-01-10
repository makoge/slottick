// app/[locale]/page.tsx
import type { Metadata } from "next";
import { getMessages, locales } from "@/lib/i18n";

type Params = { locale: string };

export async function generateMetadata({
  params
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale } = await params;

  const brand = "Slottick";
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://slottick.com";
  const canonical = `${baseUrl}/${locale}`;

  const title = "Booking management platform for service businesses";
  const description =
    "Manage services, staff availability and online bookings in one place. Share one link that always shows your real schedule—built for salons, barbers, beauty and wellness.";

  const languages = Object.fromEntries(locales.map((l) => [l, `${baseUrl}/${l}`]));

  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    alternates: { canonical, languages },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: brand,
      title,
      description,
      locale,
      images: [{ url: "/og.png", width: 1200, height: 630, alt: brand }]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og.png"]
    }
  };
}

export default async function Home({
  params
}: {
  params: Promise<Params>;
}) {
  const { locale } = await params;
  await getMessages(locale);

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://slottick.com";

  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Slottick",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: `${baseUrl}/${locale}`,
    description:
      "Booking management platform for service businesses. Set services and availability once and share a booking link that shows real-time availability.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR"
    }
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is Slottick?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Slottick is a booking management platform for service businesses. You set services and availability rules and share one booking link."
        }
      },
      {
        "@type": "Question",
        name: "Who is it for?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Salons, barbers, lash and nail studios, massage therapists, fitness and other appointment-based businesses."
        }
      },
      {
        "@type": "Question",
        name: "Does availability update automatically?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. The booking link always reflects your latest availability and services."
        }
      }
    ]
  };

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-6xl px-6 pb-20 pt-0">
        {/* HERO */}
        <section className="grid gap-10 md:grid-cols-2 md:items-center">
          <div className="flex flex-col gap-6">
            <span className="inline-flex w-fit rounded-full bg-slate-100 px-4 py-1 text-sm font-medium">
              Booking management for service businesses
            </span>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Booking management platform
              <br />
              that protects your time.
            </h1>

            <p className="max-w-xl text-lg text-slate-600">
              Slottick turns your availability into a shareable booking page.
              Clients book your real schedule, no back-and-forth, no double booking.
            </p>

            <div className="flex flex-wrap gap-4">
              <a
                href={`/${locale}/register`}
                className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Create your booking page
              </a>

              <a
                href={`/${locale}/book/demo-lash-studio`}
                className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold hover:bg-slate-50"
              >
                View demo booking flow
              </a>

              <a
                href={`/${locale}/explore`}
                className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold hover:bg-slate-50"
              >
                Explore marketplace
              </a>
            </div>
          </div>

          {/* VISUAL */}
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
            <div className="space-y-4 text-sm text-slate-600">
              <p>✔ Services, durations & pricing</p>
              <p>✔ Availability rules & breaks</p>
              <p>✔ Buffer time between clients</p>
              <p>✔ One booking link for your bio</p>
              <p>✔ Real-time schedule (no double booking)</p>
            </div>
          </div>
        </section>

        {/* DASHBOARD PREVIEW */}
<section className="mt-20 grid gap-8 lg:grid-cols-12 lg:items-start">
  {/* Left copy */}
  <div className="lg:col-span-5">
    <span className="inline-flex w-fit rounded-full bg-slate-100 px-4 py-1 text-sm font-medium">
      What you get instantly
    </span>

    <h2 className="mt-4 text-3xl font-bold tracking-tight">
      Your business dashboard without the chaos
    </h2>

    <p className="mt-4 text-lg text-slate-600">
      Set services + availability once. Slottick turns it into a booking page clients can use
      immediately, while you track bookings and revenue in one place.
    </p>

    <div className="mt-6 flex flex-wrap gap-3">
      <a
        href={`/${locale}/register`}
        className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
      >
        Create your booking page
      </a>
      <a
        href={`/${locale}/book/demo-lash-studio`}
        className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold hover:bg-slate-50"
      >
        See demo
      </a>
    </div>

    <div className="mt-8 grid gap-3 text-sm text-slate-600">
      <div className="flex items-start gap-3">
        <span className="mt-1 inline-block h-2 w-2 rounded-full bg-slate-900" />
        <p>One booking link that always reflects your real schedule</p>
      </div>
      <div className="flex items-start gap-3">
        <span className="mt-1 inline-block h-2 w-2 rounded-full bg-slate-900" />
        <p>Automatic slot generation, breaks, and buffer time</p>
      </div>
      <div className="flex items-start gap-3">
        <span className="mt-1 inline-block h-2 w-2 rounded-full bg-slate-900" />
        <p>Track bookings, revenue, and customers (all in one screen)</p>
      </div>
    </div>
  </div>

  {/* Right preview */}
  <div className="lg:col-span-7">
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-slate-600">Dashboard preview</div>
          <div className="mt-1 text-lg font-bold tracking-tight">Lash Studio Tallinn</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
          Live demo
        </div>
      </div>

      {/* Stats */}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          { t: "Total bookings", v: "28", s: "This month" },
          { t: "Revenue", v: "€1,240", s: "Confirmed" },
          { t: "Customers", v: "19", s: "Returning: 6" }
        ].map((x) => (
          <div key={x.t} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-medium text-slate-600">{x.t}</div>
            <div className="mt-2 text-2xl font-bold tracking-tight">{x.v}</div>
            <div className="mt-1 text-xs text-slate-500">{x.s}</div>
          </div>
        ))}
      </div>

      {/* Booking link */}
      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-sm font-medium text-slate-700">Your booking link</div>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-900 ring-1 ring-slate-200">
            <div className="truncate">slottick.com/{locale}/book/lash-studio-tallinn</div>
          </div>
          <button
            type="button"
            className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 sm:w-fit"
          >
            Copy
          </button>
        </div>
        <div className="mt-2 text-xs text-slate-500">
          Share on Instagram bio, WhatsApp, website.
        </div>
      </div>

      {/* Upcoming */}
      <div className="mt-5 rounded-2xl border border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Upcoming bookings</div>
          <div className="text-xs font-medium text-slate-500">Today</div>
        </div>

        <div className="mt-3 grid gap-3">
          {[
            { time: "10:30", name: "Maria K.", service: "Lash refill • 60 min", price: "€55" },
            { time: "12:00", name: "Anna P.", service: "Classic lashes • 90 min", price: "€70" },
            { time: "15:30", name: "Kristi S.", service: "Brow shape • 30 min", price: "€25" }
          ].map((b) => (
            <div
              key={`${b.time}-${b.name}`}
              className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3"
            >
              <div className="min-w-0">
                <div className="font-semibold">
                  {b.time} • {b.name}
                </div>
                <div className="mt-1 text-sm text-slate-600">{b.service}</div>
              </div>
              <div className="shrink-0 text-sm font-semibold text-slate-900">{b.price}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
          Clients only see real available slots — no double booking.
        </div>
      </div>
    </div>
  </div>
</section>


        {/* PROBLEM */}
        <section className="mt-32 max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight">
            Stop losing time to messages and manual confirmations
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            If bookings live in DMs, your day gets messy fast. Slottick keeps your
            schedule clean with real availability and confirmed appointments.
          </p>
        </section>

        {/* HOW IT WORKS */}
        <section className="mt-20 grid gap-8 md:grid-cols-3">
          {[
            {
              title: "Set services and rules",
              desc: "Add services, durations, pricing, working hours, breaks and buffer time."
            },
            {
              title: "Share one booking link",
              desc: "Put it on your website, Google Business Profile, and Instagram bio."
            },
            {
              title: "Get booked correctly",
              desc: "Clients choose a service and time slot that matches your schedule."
            }
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200 p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-slate-600">{item.desc}</p>
            </div>
          ))}
        </section>

        {/* WHO IT'S FOR */}
        <section className="mt-32 max-w-4xl">
          <h2 className="text-3xl font-bold tracking-tight">
            Built for appointment-based businesses
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Perfect for salons, barbers, lash and nail studios, massage therapists,
            beauty clinics, personal trainers, and any service business that sells time.
          </p>
        </section>

        {/* CTA */}
        <section className="mt-32 rounded-3xl bg-slate-900 px-8 py-14 text-white">
          <h2 className="text-3xl font-bold tracking-tight">
            Your availability is your business.
          </h2>
          <p className="mt-4 max-w-xl text-slate-300">
            Set your schedule once. Share one link. Get booked without chaos.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={`/${locale}/register`}
              className="inline-flex rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
            >
              Create your booking page
            </a>
            <a
              href={`/${locale}/explore`}
              className="inline-flex rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Explore marketplace
            </a>
          </div>
        </section>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </main>
  );
}
