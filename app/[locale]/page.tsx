// app/[locale]/page.tsx
import type { Metadata } from "next";
import { getMessages, locales } from "@/lib/i18n";

export async function generateMetadata({
  params
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = params;

  const brand = "Slottick";
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://slottick.com";
  const canonical = `${baseUrl}/${locale}`;

  const title = "Booking management platform for service businesses";
  const description =
    "Manage services, staff availability and online bookings in one place. Share one link that always shows your real schedule—built for salons, barbers, beauty and wellness.";

  const languages = Object.fromEntries(
    locales.map((l) => [l, `${baseUrl}/${l}`])
  );

  return {
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
  params: Promise<{ locale: string }>;
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
      <div className="mx-auto max-w-6xl px-6 py-20">
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
              Clients book your real schedule—no back-and-forth, no double booking.
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

        {/* WHO IT'S FOR (extra SEO section) */}
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

      {/* Structured data */}
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
