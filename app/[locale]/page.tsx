// app/[locale]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { locales } from "@/lib/i18n";

type Params = { locale: string };

const SITE_NAME = "Slottick";

function baseUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://slottick.com").replace(/\/$/, "");
}

function ogLocale(locale: string) {
  const map: Record<string, string> = { en: "en_US", fr: "fr_FR" };
  return map[locale] ?? undefined;
}

export async function generateMetadata({
  params
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale } = await params;

  const site = baseUrl();
  const canonical = `${site}/${locale}`;

  const title = "Booking management platform for service businesses";
  const description =
    "Manage services, staff availability and online bookings in one place. Share one link that always shows your real schedule—built for salons, barbers, beauty and wellness.";

  const ogImage = `${site}/og.png`;

  return {
    metadataBase: new URL(site),
    title,
    description,

    // ✅ My opinion: don’t output hreflang until you have real French page copy.
    // If you later translate, switch to: alternates: { canonical, languages: ... }
    alternates: { canonical },

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1
      }
    },

    openGraph: {
      type: "website",
      url: canonical,
      siteName: SITE_NAME,
      title,
      description,
      locale: ogLocale(locale),
      images: [{ url: ogImage, width: 1200, height: 630, alt: SITE_NAME }]
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage]
    }
  };
}

export default async function Home({ params }: { params: Promise<Params> }) {
  const { locale } = await params;

  const site = baseUrl();
  const canonical = `${site}/${locale}`;

  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: canonical,
    description:
      "Booking management platform for service businesses. Set services and availability once and share a booking link that shows real-time availability.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" }
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: site,
    logo: `${site}/icon-512.png`
  };

  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Slottick Home",
    url: canonical,
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: site }
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
        name: "Why not just take bookings in Instagram DMs?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "DMs don’t understand your availability. A booking system only shows slots that actually fit your schedule, breaks, and buffer."
        }
      },
      {
        "@type": "Question",
        name: "What problems does a booking system solve?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "It stops back-and-forth messages, prevents double booking, and keeps your schedule accurate in real time."
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
              Slottick turns your availability into a shareable booking page. Clients book your real
              schedule, no back-and-forth, no double booking.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href={`/${locale}/register`}
                prefetch
                className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Create your booking page
              </Link>

              <Link
                href={`/${locale}/explore`}
                prefetch
                className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold hover:bg-slate-50"
              >
                Explore Services
              </Link>
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
          {/* Left FAQ */}
          <div className="lg:col-span-5">
            <span className="inline-flex w-fit rounded-full bg-slate-100 px-4 py-1 text-sm font-medium">
              FAQ
            </span>

            <h2 className="mt-4 text-3xl font-bold tracking-tight">
              Why do service businesses need a booking system?
            </h2>

            <p className="mt-4 text-lg text-slate-600">
              Short answers to the questions your customers (and you) feel every week.
            </p>

            <div className="mt-8 grid gap-3">
              {[
                {
                  q: "What problems does a booking system solve?",
                  a: "It stops back-and-forth messages, prevents double booking, and keeps your schedule accurate in real time."
                },
                {
                  q: "Can it reduce no-shows?",
                  a: "Yes. Confirmations and reminders make clients show up more often, and your time stays protected."
                },
                {
                  q: "Why not just take bookings in Instagram DMs?",
                  a: "DMs do not understand your availability. A booking system only shows slots that actually fit your schedule, breaks, and buffer."
                },
                {
                  q: "Do I need a website to use Slottick?",
                  a: "No. You get one shareable booking link you can put on Instagram bio, WhatsApp, Google Business Profile, or anywhere."
                },
                {
                  q: "What if I change my schedule later?",
                  a: "Your booking page updates automatically, clients always see your latest availability."
                },
                {
                  q: "Is it good for salons, barbers, beauty and wellness?",
                  a: "Yes. Any business that sells time (appointments) benefits: hair, nails, lash, massage, fitness, clinics, and more."
                }
              ].map((item) => (
                <details
                  key={item.q}
                  className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <summary className="cursor-pointer list-none font-semibold text-slate-900">
                    <div className="flex items-start justify-between gap-4">
                      <span>{item.q}</span>
                      <span className="mt-1 text-slate-500 transition group-open:rotate-45">+</span>
                    </div>
                  </summary>
                  <p className="mt-3 text-sm text-slate-600">{item.a}</p>
                </details>
              ))}
            </div>
          </div>

          {/* Right preview */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-slate-600">Dashboard preview</div>
                  <div className="mt-1 text-lg font-bold tracking-tight">Lash Studio Tallinn</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
                  Live demo
                </div>
              </div>

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

        {/* WHY SLOTTICK */}
        <section className="mt-32">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
            <div className="max-w-xl">
              <span className="inline-flex w-fit rounded-full bg-slate-100 px-4 py-1 text-sm font-medium">
                Why Slottick
              </span>

              <h2 className="mt-4 text-3xl font-bold tracking-tight">
                Why choose Slottick as your booking system?
              </h2>

              <p className="mt-4 text-lg text-slate-600">
                Less time in DMs, fewer mistakes, and a cleaner way for clients to book you.
              </p>

              <div className="mt-8 grid gap-3">
                {[
                  {
                    q: "It manages your time automatically",
                    a: "Set working hours, breaks, buffer time, and services once. Slottick only shows slots that fit your real schedule—no double bookings, no back-and-forth."
                  },
                  {
                    q: "It helps market your business",
                    a: "Your booking page works everywhere: Instagram bio, WhatsApp, Google Business Profile, ads. Clients book instantly without messaging first."
                  },
                  {
                    q: "You can get new clients through Slottick",
                    a: "Get discovered in the Slottick Explore marketplace so new customers can find and book you even if they’ve never heard of you."
                  },
                  {
                    q: "No website? No problem.",
                    a: "Slottick acts like your booking website. One clean link shows your services, prices, and live availability, always up to date."
                  },
                  {
                    q: "Simple, fast, and easy to use",
                    a: "Clients book in seconds. You manage everything from one dashboard—no complicated setup, no tech knowledge required."
                  }
                ].map((item) => (
                  <details
                    key={item.q}
                    className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                      <span className="text-base font-semibold text-slate-900">{item.q}</span>
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition group-open:rotate-45">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path
                            d="M12 5v14M5 12h14"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>
                    </summary>
                    <div className="mt-3 text-sm leading-relaxed text-slate-600">{item.a}</div>
                  </details>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={`/${locale}/register`}
                  className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Create your booking page
                </Link>
              </div>
            </div>

            {/* Visual */}
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <div className="mb-4">
                <div className="text-sm font-medium text-slate-600">How it feels</div>
                <div className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                  One link → bookings → dashboard
                </div>
                <div className="mt-2 text-sm text-slate-600">Time protection + marketing in one system.</div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                  Slottick Flow
                </div>

                <div className="p-4">
                  {/* Keep your SVG as-is */}
                  {/* (unchanged to avoid breaking design) */}
                  {/* ... paste your SVG block here exactly ... */}
                </div>
              </div>
            </div>
          </div>
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
              className="rounded-2xl bg-slate-900 text-white ring-1 ring-white/10 border border-slate-200 p-6 shadow-lg"
            >
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-slate-200">{item.desc}</p>
            </div>
          ))}
        </section>

        {/* WHO IT'S FOR */}
        <section className="mt-32 max-w-4xl">
          <h2 className="text-3xl font-bold tracking-tight">Built for appointment-based businesses</h2>
          <p className="mt-4 text-lg text-slate-600">
            Perfect for salons, barbers, lash and nail studios, massage therapists, beauty clinics,
            personal trainers, and any service business that sells time.
          </p>
        </section>

        {/* CTA */}
        <section className="mt-24 rounded-3xl bg-slate-900 px-8 py-14 text-white">
          <h2 className="text-3xl font-bold tracking-tight">Your availability is your business.</h2>
          <p className="mt-4 max-w-xl text-slate-300">
            Set your schedule once. Share one link. Get booked without chaos.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/${locale}/register`}
              prefetch
              className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Create your booking page
            </Link>

            <Link
              href={`/${locale}/explore`}
              prefetch
              className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold hover:bg-slate-900"
            >
              Explore Services
            </Link>
          </div>
        </section>
      </div>

      {/* Structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
    </main>
  );
}
