// app/[locale]/page.tsx// app/[locale]/page.tsx
import type { Metadata } from "next";
import { getMessages, locales } from "@/lib/i18n";
import Link from "next/link";

type Params = { locale: string };

function baseUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://slottick.com").replace(/\/$/, "");
}

// OG locales often want en_US style. If you don't want to maintain this, remove OG locale.
function ogLocale(locale: string) {
  const map: Record<string, string> = {
    en: "en_US",
    et: "et_EE"
  };
  return map[locale] ?? undefined;
}

export async function generateMetadata({
  params
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale } = await params;

  const brand = "Slottick";
  const urlBase = baseUrl();
  const canonical = `${urlBase}/${locale}`;
  const languages = Object.fromEntries(locales.map((l) => [l, `${urlBase}/${l}`]));
  const title = "Booking management platform for service businesses";
  const description =
    "Manage services, staff availability and online bookings in one place. Share one link that always shows your real schedule—built for salons, barbers, beauty and wellness.";
  const ogImage = `${urlBase}/og.png`;

  return {
    metadataBase: new URL(urlBase),
    title,
    description,
    alternates: { canonical, languages },
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
      siteName: brand,
      title,
      description,
      // remove if you don't want to maintain mapping
      locale: ogLocale(locale),
      images: [{ url: ogImage, width: 1200, height: 630, alt: brand }]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage]
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

  const urlBase = baseUrl();

  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Slottick",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: `${urlBase}/${locale}`,
    description:
      "Booking management platform for service businesses. Set services and availability once and share a booking link that shows real-time availability.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" }
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

        {/* ... keep your remaining sections as-is ... */}

        <section className="mt-24 rounded-3xl bg-slate-900 px-8 py-14 text-white">
          <h2 className="text-3xl font-bold tracking-tight">
            Your availability is your business.
          </h2>
          <p className="mt-4 max-w-xl text-slate-300">
            Set your schedule once. Share one link. Get booked without chaos.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/${locale}/register`}
              prefetch
              className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
            >
              Create your booking page
            </Link>

            <Link
              href={`/${locale}/explore`}
              prefetch
              className="rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold hover:bg-white/10"
            >
              Explore Services
            </Link>
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
