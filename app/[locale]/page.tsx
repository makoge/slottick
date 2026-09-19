import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { locales, t } from "@/lib/i18n";

type Params = { locale: string };

const SITE_NAME = "Slottick";

function baseUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://slottick.com").replace(
    /\/$/,
    "",
  );
}

function ogLocale(locale: string) {
  const map: Record<string, string> = { en: "en_US", fr: "fr_FR" };
  return map[locale] ?? undefined;
}

/** Load messages for current locale (server) */
async function getDictionary(locale: string) {
  try {
    if (locale === "fr") {
      const mod = await import("@/messages/fr.json");
      return (mod as any).default ?? mod;
    }
    const mod = await import("@/messages/en.json");
    return (mod as any).default ?? mod;
  } catch {
    const mod = await import("@/messages/en.json");
    return (mod as any).default ?? mod;
  }
}

function getPath(obj: any, path: string) {
  return path
    .split(".")
    .reduce(
      (acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined),
      obj,
    );
}

function interpolate(str: string, vars?: Record<string, string | number>) {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

function tr(
  dict: Record<string, any>,
  key: string,
  fallback: string,
  vars?: Record<string, any>,
) {
  const raw = getPath(dict, key);
  if (typeof raw === "string" && raw.trim()) return interpolate(raw, vars);
  return interpolate(fallback, vars);
}

function getArray<T = any>(
  dict: Record<string, any>,
  key: string,
  fallback: T[] = [],
) {
  const v = getPath(dict, key);
  return Array.isArray(v) ? (v as T[]) : fallback;
}

export const viewport: Viewport = {
  themeColor: "#cbd5e1",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  const site = baseUrl();
  const canonical = `${site}/${locale}`;

  const title = tr(
    dict,
    "meta.home.title",
    "Booking management platform for service businesses",
  );

  const description = tr(
    dict,
    "meta.home.description",
    "Manage services, staff availability and online bookings in one place. Share one link that always shows your real schedule, for service businesses like salons, beauty and wellness.",
  );

  const ogImage = `${site}/og.png`;
  const languages = Object.fromEntries(locales.map((l) => [l, `${site}/${l}`]));

  return {
    metadataBase: new URL(site),
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
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: SITE_NAME,
      title,
      description,
      locale: ogLocale(locale),
      images: [{ url: ogImage, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function Home({ params }: { params: Promise<Params> }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  const site = baseUrl();
  const canonical = `${site}/${locale}`;

  const heroChecks = getArray<string>(dict, "home.hero.checks", [
    "Services, durations & pricing",
    "Availability rules & breaks",
    "Buffer time between clients",
    "One booking link as your website",
    "Track revenue, bookings, and client growth",
  ]);

  const faqItems = getArray<{ q: string; a: string }>(
    dict,
    "home.faq.items",
    [],
  );

  const previewStats = getArray<{ t: string; v: string; s: string }>(
    dict,
    "home.preview.stats",
    [
      { t: "Total bookings", v: "28", s: "This month" },
      { t: "Revenue", v: "€1,240", s: "Confirmed" },
      { t: "Customers", v: "19", s: "Returning: 6" },
    ],
  );

  const previewBookings = getArray<{
    header: string;
    service: string;
    price: string;
  }>(dict, "home.preview.bookings", [
    {
      header: "10:30 • Maria K.",
      service: "Lash refill • 60 min",
      price: "€55",
    },
    {
      header: "12:00 • Anna P.",
      service: "Classic lashes • 90 min",
      price: "€70",
    },
    {
      header: "15:30 • Kristi S.",
      service: "Brow shape • 30 min",
      price: "€25",
    },
  ]);

  const howItems = getArray<{ title: string; desc: string }>(
    dict,
    "home.how.items",
    [
      {
        title: "Set services and rules",
        desc: "Add services, durations, pricing, working hours, breaks and buffer time.",
      },
      {
        title: "Share one booking link",
        desc: "Put it on your website, Google Business Profile, and Instagram bio.",
      },
      {
        title: "Get booked correctly",
        desc: "Clients choose a service and time slot that matches your schedule.",
      },
    ],
  );

  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: canonical,
    description: tr(
      dict,
      "home.jsonld.softwareDesc",
      "Booking management platform for service businesses. Set services and availability once and share a booking link that shows real-time availability.",
    ),
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: site,
    logo: `${site}/icon-512.png`,
  };

  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: tr(dict, "home.jsonld.pageName", "Slottick Home"),
    url: canonical,
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: site },
  };

  const faqJsonLd =
    faqItems.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqItems.map((x) => ({
            "@type": "Question",
            name: String(x?.q ?? ""),
            acceptedAnswer: { "@type": "Answer", text: String(x?.a ?? "") },
          })),
        }
      : null;

  return (
    <div className="w-full space-y-16 sm:space-y-24">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-400/40 bg-white/40 p-4 shadow-xl backdrop-blur-2xl sm:p-8 lg:p-12">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-lime-200/40 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-slate-400/30 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid gap-8 md:grid-cols-12 md:items-center">
          {/* Hero Left: Value Proposition */}
          <div className="flex flex-col items-center text-center md:col-span-7 md:items-start md:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-lime-300/80 bg-lime-100 px-3.5 py-1.5 shadow-sm">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-lime-900 text-[10px] font-bold text-lime-100">
                ✓
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-lime-950">
                {tr(
                  dict,
                  "home.hero.badge",
                  "Booking system for service businesses",
                )}
              </span>
            </div>

            <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              {tr(dict, "home.hero.h1Line1", "Booking management platform")}{" "}
              <span className="block text-slate-700">
                {tr(dict, "home.hero.h1Line2", "that protects your time.")}
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-700 sm:text-lg">
              {tr(
                dict,
                "home.hero.lead",
                "Slottick turns your availability into a shareable booking website. Clients book your real schedule, no back-and-forth, no double booking. Manage clients, track revenue and grow smarter.",
              )}
            </p>

            <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              <Link
                href={`/${locale}/register`}
                prefetch
                className="inline-flex items-center justify-center rounded-2xl border border-lime-300/80 bg-lime-100 px-6 py-3.5 text-sm font-bold text-lime-950 shadow-sm transition-all hover:bg-lime-200 hover:shadow active:scale-95"
              >
                {tr(dict, "home.hero.ctaPrimary", "Create your booking page")}
              </Link>

              <Link
                href={`/${locale}/explore`}
                prefetch
                className="inline-flex items-center justify-center rounded-2xl border border-slate-400/60 bg-white/70 px-6 py-3.5 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur-md transition-all hover:bg-white hover:text-slate-950 active:scale-95"
              >
                {tr(dict, "home.hero.ctaSecondary", "Explore Services")}
              </Link>
            </div>
          </div>

          {/* Hero Right: Lucid Feature Panel */}
          <div className="md:col-span-5">
            <div className="relative rounded-2xl border border-slate-400/50 bg-white/75 p-6 shadow-md backdrop-blur-xl sm:p-7">
              <div className="mb-4 flex items-center justify-between border-b border-slate-300/80 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Platform Core
                </span>
                <span className="rounded-md border border-lime-300/80 bg-lime-100 px-2 py-0.5 font-mono text-xs font-semibold text-lime-950">
                  Ready
                </span>
              </div>

              <div className="space-y-3.5">
                {heroChecks.map((item, idx) => (
                  <div
                    key={`${idx}-${item}`}
                    className="flex items-start gap-3"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-lime-300/90 bg-lime-100 text-xs font-bold text-lime-950 shadow-xs">
                      ✓
                    </span>
                    <span className="text-sm font-medium text-slate-800">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BENTO GRID FEATURES */}
      <section className="space-y-8">
        <div className="rounded-3xl border border-slate-400/30 bg-white/40 px-6 py-10 text-center backdrop-blur-xl sm:px-12 sm:py-14">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            {tr(dict, "home.features.title", "Master your calendar")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-700 sm:text-base">
            {tr(
              dict,
              "home.features.subtitle",
              "Elite tools designed to give you back your hours and provide a seamless booking journey for your clients.",
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3 sm:gap-6">
          {/* Card 1: Availability Rules */}
          <div className="group flex flex-col justify-between rounded-3xl border border-slate-400/40 bg-white/65 p-6 shadow-sm backdrop-blur-xl transition-all hover:bg-white/80 sm:p-8 md:col-span-2">
            <div>
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-lime-300/80 bg-lime-100 text-lime-950 shadow-xs">
                <span className="material-symbols-outlined text-[26px]">
                  rule
                </span>
              </div>

              <h3 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                {tr(
                  dict,
                  "home.features.card1.title",
                  "Intelligent Availability Rules",
                )}
              </h3>

              <p className="mt-2.5 max-w-lg text-sm leading-relaxed text-slate-700 sm:text-base">
                {tr(
                  dict,
                  "home.features.card1.desc",
                  "Set complex recurring schedules, holiday overrides, and specific window blocks. Your calendar works on your terms, always.",
                )}
              </p>
            </div>

            <div className="mt-8 overflow-hidden rounded-2xl border border-slate-300/80 bg-slate-200/50 p-3 backdrop-blur-md sm:mt-10">
              <div className="availability-marquee flex w-max items-center gap-2.5 sm:gap-3">
                {[
                  "Mon Available",
                  "Tue Holiday",
                  "Wed 09:00–17:00",
                  "Thu Break 12:00",
                  "Fri Available",
                  "Sat Closed",
                  "Sun Custom",
                  "Mon Available",
                  "Tue Holiday",
                  "Wed 09:00–17:00",
                ].map((slot, i) => (
                  <div
                    key={`${slot}-${i}`}
                    className={`flex h-10 items-center justify-center rounded-xl border px-3.5 font-mono text-xs font-semibold ${
                      i % 3 === 1
                        ? "border-lime-300/90 bg-lime-100 text-lime-950"
                        : "border-slate-300/90 bg-white/80 text-slate-800"
                    }`}
                  >
                    {slot}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Smart Buffer Times */}
          <div className="relative overflow-hidden rounded-3xl border border-slate-400/40 bg-slate-900/90 p-6 text-white shadow-md backdrop-blur-xl sm:p-8">
            <div className="relative z-10">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800 text-lime-300">
                <span className="material-symbols-outlined text-[26px]">
                  hourglass_empty
                </span>
              </div>

              <h3 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                {tr(dict, "home.features.card2.title", "Smart Buffer Times")}
              </h3>

              <p className="mt-2.5 text-sm leading-relaxed text-slate-300 sm:text-base">
                {tr(
                  dict,
                  "home.features.card2.desc",
                  "Automatically add travel or prep time between appointments to prevent burnout.",
                )}
              </p>
            </div>
            <div className="absolute -bottom-10 -right-10 h-36 w-36 rounded-full bg-lime-400/10 blur-2xl" />
          </div>

          {/* Card 3: Real-time Scheduling */}
          <div className="group rounded-3xl border border-slate-400/40 bg-white/65 p-6 shadow-sm backdrop-blur-xl transition-all hover:bg-white/80 sm:p-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-lime-300/80 bg-lime-100 text-lime-950 shadow-xs">
              <span className="material-symbols-outlined text-[26px]">
                sync
              </span>
            </div>

            <h3 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              {tr(dict, "home.features.card3.title", "Real-time Scheduling")}
            </h3>

            <p className="mt-2.5 text-sm leading-relaxed text-slate-700 sm:text-base">
              {tr(
                dict,
                "home.features.card3.desc",
                "Instant synchronization across all your personal and professional calendars to eliminate double bookings.",
              )}
            </p>
          </div>

          {/* Card 4: Digital Concierge */}
          <div className="group relative overflow-hidden rounded-3xl border border-slate-400/40 bg-white/65 p-6 shadow-sm backdrop-blur-xl sm:p-8 md:col-span-2">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-md">
                <h3 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  {tr(
                    dict,
                    "home.features.card4.title",
                    "Digital Concierge Experience",
                  )}
                </h3>

                <p className="mt-2.5 text-sm leading-relaxed text-slate-700 sm:text-base">
                  {tr(
                    dict,
                    "home.features.card4.desc",
                    "A beautifully branded booking page that acts as an extension of your business identity, not just another form.",
                  )}
                </p>

                <Link
                  href={`/${locale}/register`}
                  className="mt-6 inline-flex items-center gap-2 font-mono text-sm font-bold text-slate-900 transition-all hover:gap-3"
                >
                  <span>
                    {tr(dict, "home.features.cta", "Explore all features")}
                  </span>
                  <span className="material-symbols-outlined text-base">
                    east
                  </span>
                </Link>
              </div>

              <div className="flex h-36 w-36 shrink-0 items-center justify-center self-center rounded-2xl border border-slate-300/80 bg-white/80 shadow-inner sm:h-44 sm:w-44">
                <span className="material-symbols-outlined text-5xl text-slate-700 sm:text-6xl">
                  dashboard_customize
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DASHBOARD PREVIEW & FAQ */}
      <section className="grid gap-8 lg:grid-cols-12 lg:items-start">
        {/* Left: FAQ Section */}
        <div className="rounded-3xl border border-slate-400/40 bg-white/55 p-6 shadow-sm backdrop-blur-xl sm:p-8 lg:col-span-5">
          <span className="inline-flex rounded-full border border-lime-300/80 bg-lime-100 px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-lime-950">
            {tr(dict, "home.faq.badge", "FAQ")}
          </span>

          <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {tr(
              dict,
              "home.faq.title",
              "Why do service businesses need a booking system?",
            )}
          </h2>

          <div className="mt-6 space-y-3">
            {(faqItems.length
              ? faqItems
              : [
                  {
                    q: "What problems does a booking system solve?",
                    a: "It stops back-and-forth messages, prevents double booking, and keeps your schedule accurate in real time.",
                  },
                  {
                    q: "Can it reduce no-shows?",
                    a: "Yes. Confirmations and reminders make clients show up more often, and your time stays protected.",
                  },
                  {
                    q: "Why not just take bookings in Instagram DMs?",
                    a: "DMs do not understand your availability. A booking system only shows slots that actually fit your schedule, breaks, and buffer.",
                  },
                  {
                    q: "Do I need a website to use Slottick?",
                    a: "No. You get one shareable booking link you can put on Instagram bio, WhatsApp, Google Business Profile, or anywhere.",
                  },
                  {
                    q: "What if I change my schedule later?",
                    a: "Your booking page updates automatically, clients always see your latest availability.",
                  },
                  {
                    q: "Is it good for salons, barbers, beauty and wellness?",
                    a: "Yes. Any business that sells time (appointments) benefits: hair, nails, lash, massage, fitness, clinics, and more.",
                  },
                ]
            ).map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl border border-slate-300/70 bg-white/70 p-4 shadow-xs backdrop-blur-md transition-all open:bg-white"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-900">
                  <span className="text-sm sm:text-base">{item.q}</span>
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-slate-100 text-slate-600 transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-700">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>

        {/* Right: Live Interactive Dashboard Simulation */}
        <div className="lg:col-span-7">
          <div className="rounded-3xl border border-slate-400/40 bg-white/75 p-5 shadow-lg backdrop-blur-2xl sm:p-7">
            <div className="flex items-center justify-between border-b border-slate-300/70 pb-4">
              <div>
                <div className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {tr(dict, "home.preview.badge", "Dashboard preview")}
                </div>
                <div className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
                  {tr(dict, "home.preview.businessName", "Lash Studio Tallinn")}
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-xl border border-lime-300/80 bg-lime-100 px-3 py-1.5 font-mono text-xs font-bold text-lime-950 shadow-xs">
                <span className="h-2 w-2 animate-pulse rounded-full bg-lime-600" />
                {tr(dict, "home.preview.liveDemo", "Live demo")}
              </div>
            </div>

            {/* Simulated Key Metrics */}
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {previewStats.map((stat) => (
                <div
                  key={stat.t}
                  className="rounded-2xl border border-slate-300/80 bg-slate-100/70 p-4 backdrop-blur-sm"
                >
                  <div className="text-xs font-semibold text-slate-600">
                    {stat.t}
                  </div>
                  <div className="mt-1.5 font-mono text-2xl font-extrabold text-slate-900">
                    {stat.v}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">{stat.s}</div>
                </div>
              ))}
            </div>

            {/* Shareable Link Box */}
            <div className="mt-4 rounded-2xl border border-slate-300/80 bg-slate-100/60 p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
                {tr(dict, "home.preview.linkTitle", "Your booking link")}
              </div>

              <div className="mt-2.5 flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1 rounded-xl border border-slate-300/90 bg-white px-3.5 py-2 font-mono text-xs font-medium text-slate-900 shadow-inner sm:text-sm">
                  <div className="truncate">
                    slottick.com/{locale}/book/lash-studio
                  </div>
                </div>

                <button
                  type="button"
                  className="rounded-xl border border-lime-300/80 bg-lime-100 px-4 py-2 font-mono text-xs font-bold text-lime-950 shadow-xs transition-all hover:bg-lime-200 active:scale-95"
                >
                  {tr(dict, "home.preview.copy", "Copy")}
                </button>
              </div>

              <div className="mt-2 text-xs text-slate-500">
                {tr(
                  dict,
                  "home.preview.shareHint",
                  "Share on Instagram bio, WhatsApp, website.",
                )}
              </div>
            </div>

            {/* Upcoming Schedule List */}
            <div className="mt-5 rounded-2xl border border-slate-300/80 bg-slate-100/60 p-4">
              <div className="flex items-center justify-between border-b border-slate-300/60 pb-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {tr(dict, "home.preview.upcomingTitle", "Upcoming bookings")}
                </div>
                <div className="rounded-md bg-white px-2 py-0.5 font-mono text-xs font-semibold text-slate-600">
                  {tr(dict, "home.preview.today", "Today")}
                </div>
              </div>

              <div className="mt-3 space-y-2.5">
                {previewBookings.map((b) => (
                  <div
                    key={b.header}
                    className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-white p-3 shadow-xs"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {b.header}
                      </div>
                      <div className="text-xs text-slate-600">{b.service}</div>
                    </div>
                    <div className="font-mono text-sm font-bold text-slate-900">
                      {b.price}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-xl border border-lime-300/60 bg-lime-100/80 p-3 text-xs font-medium text-lime-950">
                <span className="font-bold">✓</span>
                <span>
                  {tr(
                    dict,
                    "home.preview.note",
                    "Clients only see real available slots — no double booking.",
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY SLOTTICK / ARCHITECTURE SECTION */}
      <section className="rounded-3xl border border-slate-400/40 bg-white/45 p-6 shadow-sm backdrop-blur-xl sm:p-10">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <span className="inline-flex rounded-full border border-lime-300/80 bg-lime-100 px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-lime-950">
              {t(dict, "home.why.badge")}
            </span>

            <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {t(dict, "home.why.title")}
            </h2>

            <p className="mt-4 text-base leading-relaxed text-slate-700">
              {t(dict, "home.why.lead")}
            </p>

            <div className="mt-8 space-y-3">
              {(Array.isArray((dict as any)?.home?.why?.items)
                ? (dict as any).home.why.items
                : []
              ).map((item: any) => (
                <details
                  key={String(item?.q ?? "")}
                  className="group rounded-2xl border border-slate-300/70 bg-white/70 p-4 shadow-xs backdrop-blur-md transition-all open:bg-white"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-900">
                    <span className="text-sm sm:text-base">
                      {String(item?.q ?? "")}
                    </span>
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-slate-100 text-slate-600 transition group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-slate-700">
                    {String(item?.a ?? "")}
                  </p>
                </details>
              ))}
            </div>
          </div>

          {/* Architecture Visual */}
          <div className="rounded-3xl border border-slate-300/80 bg-slate-100/80 p-5 shadow-inner backdrop-blur-md sm:p-6">
            <div className="mb-4">
              <div className="font-mono text-xs font-semibold uppercase text-slate-500">
                {t(dict, "home.why.visual.kicker")}
              </div>
              <div className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
                {t(dict, "home.why.visual.title")}
              </div>
              <div className="mt-1 text-xs text-slate-600">
                {t(dict, "home.why.visual.desc")}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-300/80 bg-white p-2 shadow-xs">
              <svg
                viewBox="0 0 920 520"
                className="h-auto w-full"
                role="img"
                aria-label={t(dict, "home.why.visual.aria")}
              >
                <defs>
                  <linearGradient
                    id={`g1-${locale}`}
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="1"
                  >
                    <stop offset="0" stopColor="#0f172a" />
                    <stop offset="1" stopColor="#334155" />
                  </linearGradient>
                </defs>

                <rect
                  x="0"
                  y="0"
                  width="920"
                  height="520"
                  rx="20"
                  fill="#f8fafc"
                />
                <rect
                  x="18"
                  y="18"
                  width="884"
                  height="484"
                  rx="16"
                  fill="#ffffff"
                  stroke="#e2e8f0"
                />

                <rect
                  x="60"
                  y="70"
                  width="260"
                  height="120"
                  rx="16"
                  fill="#0f172a"
                  opacity="0.05"
                  stroke="#e2e8f0"
                />
                <text
                  x="80"
                  y="105"
                  fontSize="13"
                  fill="#334155"
                  fontFamily="var(--font-geist-sans), ui-sans-serif"
                >
                  {t(dict, "home.why.visual.shareableLink")}
                </text>
                <rect
                  x="80"
                  y="122"
                  width="220"
                  height="38"
                  rx="10"
                  fill={`url(#g1-${locale})`}
                />
                <text
                  x="92"
                  y="146"
                  fontSize="12"
                  fill="#ffffff"
                  fontFamily="var(--font-geist-mono), monospace"
                >
                  slottick.com/{locale}/book
                </text>

                <rect
                  x="360"
                  y="55"
                  width="250"
                  height="170"
                  rx="16"
                  fill="#ffffff"
                  stroke="#e2e8f0"
                />
                <rect
                  x="360"
                  y="55"
                  width="250"
                  height="36"
                  rx="16"
                  fill="#f1f5f9"
                />
                <text
                  x="382"
                  y="78"
                  fontSize="13"
                  fill="#334155"
                  fontFamily="var(--font-geist-sans), ui-sans-serif"
                >
                  {t(dict, "home.why.visual.bookingPage")}
                </text>
                <rect
                  x="382"
                  y="110"
                  width="206"
                  height="16"
                  rx="6"
                  fill="#e2e8f0"
                />
                <rect
                  x="382"
                  y="140"
                  width="170"
                  height="16"
                  rx="6"
                  fill="#e2e8f0"
                />
                <rect
                  x="382"
                  y="170"
                  width="206"
                  height="34"
                  rx="10"
                  fill="#0f172a"
                />
                <text
                  x="406"
                  y="192"
                  fontSize="12"
                  fill="#ffffff"
                  fontFamily="var(--font-geist-sans), ui-sans-serif"
                >
                  {t(dict, "home.why.visual.bookSlot")}
                </text>

                <rect
                  x="650"
                  y="55"
                  width="210"
                  height="170"
                  rx="16"
                  fill="#ffffff"
                  stroke="#e2e8f0"
                />
                <rect
                  x="650"
                  y="55"
                  width="210"
                  height="36"
                  rx="16"
                  fill="#f1f5f9"
                />
                <text
                  x="672"
                  y="78"
                  fontSize="13"
                  fill="#334155"
                  fontFamily="var(--font-geist-sans), ui-sans-serif"
                >
                  {t(dict, "home.why.visual.exploreMarket")}
                </text>
                <rect
                  x="672"
                  y="110"
                  width="166"
                  height="18"
                  rx="8"
                  fill="#e2e8f0"
                />
                <rect
                  x="672"
                  y="140"
                  width="166"
                  height="18"
                  rx="8"
                  fill="#e2e8f0"
                />
                <rect
                  x="672"
                  y="170"
                  width="166"
                  height="18"
                  rx="8"
                  fill="#e2e8f0"
                />

                <rect
                  x="60"
                  y="260"
                  width="800"
                  height="210"
                  rx="16"
                  fill="#ffffff"
                  stroke="#e2e8f0"
                />
                <rect
                  x="60"
                  y="260"
                  width="800"
                  height="44"
                  rx="16"
                  fill="#f1f5f9"
                />
                <text
                  x="84"
                  y="288"
                  fontSize="13"
                  fill="#334155"
                  fontFamily="var(--font-geist-sans), ui-sans-serif"
                >
                  {t(dict, "home.why.visual.dashboard")}
                </text>

                <rect
                  x="84"
                  y="330"
                  width="220"
                  height="120"
                  rx="14"
                  fill="#0f172a"
                  opacity="0.04"
                  stroke="#e2e8f0"
                />
                <text
                  x="104"
                  y="360"
                  fontSize="12"
                  fill="#475569"
                  fontFamily="var(--font-geist-sans), ui-sans-serif"
                >
                  {t(dict, "home.why.visual.totalBookings")}
                </text>
                <text
                  x="104"
                  y="405"
                  fontSize="28"
                  fill="#0f172a"
                  fontFamily="var(--font-geist-mono), monospace"
                  fontWeight="700"
                >
                  24
                </text>

                <rect
                  x="330"
                  y="330"
                  width="250"
                  height="120"
                  rx="14"
                  fill="#0f172a"
                  opacity="0.04"
                  stroke="#e2e8f0"
                />
                <text
                  x="350"
                  y="360"
                  fontSize="12"
                  fill="#475569"
                  fontFamily="var(--font-geist-sans), ui-sans-serif"
                >
                  {t(dict, "home.why.visual.revenue")}
                </text>
                <text
                  x="350"
                  y="395"
                  fontSize="12"
                  fill="#0f172a"
                  fontFamily="var(--font-geist-mono), monospace"
                  fontWeight="700"
                >
                  €120 / €540 / €6,200
                </text>

                <rect
                  x="610"
                  y="330"
                  width="250"
                  height="120"
                  rx="14"
                  fill="#0f172a"
                  opacity="0.04"
                  stroke="#e2e8f0"
                />
                <text
                  x="630"
                  y="360"
                  fontSize="12"
                  fill="#475569"
                  fontFamily="var(--font-geist-sans), ui-sans-serif"
                >
                  {t(dict, "home.why.visual.customers")}
                </text>
                <text
                  x="630"
                  y="405"
                  fontSize="28"
                  fill="#0f172a"
                  fontFamily="var(--font-geist-mono), monospace"
                  fontWeight="700"
                >
                  18
                </text>

                <path
                  d="M320 130 C340 130, 345 130, 360 130"
                  stroke="#94a3b8"
                  strokeWidth="2.5"
                  fill="none"
                />
                <path
                  d="M610 140 C630 140, 635 140, 650 140"
                  stroke="#94a3b8"
                  strokeWidth="2.5"
                  fill="none"
                />
                <path
                  d="M485 230 C485 245, 485 250, 485 260"
                  stroke="#94a3b8"
                  strokeWidth="2.5"
                  fill="none"
                />
              </svg>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {(Array.isArray((dict as any)?.home?.why?.visual?.pillars)
                ? (dict as any).home.why.visual.pillars
                : []
              ).map((x: any) => (
                <div
                  key={String(x?.k ?? "")}
                  className="rounded-xl border border-slate-300/80 bg-white/80 px-3.5 py-2.5 shadow-xs"
                >
                  <div className="text-[11px] font-medium text-slate-500">
                    {String(x?.k ?? "")}
                  </div>
                  <div className="mt-0.5 text-xs font-bold text-slate-900">
                    {String(x?.v ?? "")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="grid gap-6 md:grid-cols-3">
        {howItems.map((item, index) => (
          <div
            key={item.title}
            className="flex flex-col justify-between rounded-3xl border border-slate-400/40 bg-white/65 p-6 shadow-sm backdrop-blur-xl sm:p-7"
          >
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-lime-300/80 bg-lime-100 font-mono text-sm font-bold text-lime-950 shadow-xs">
                0{index + 1}
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900 sm:text-xl">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-400/50 bg-slate-900/95 px-6 py-16 text-center text-white shadow-xl backdrop-blur-2xl sm:px-10 sm:py-24">
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-lime-400/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-3xl">
          <div className="inline-flex rounded-full border border-slate-700 bg-slate-800/80 px-4 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-lime-300">
            {tr(
              dict,
              "home.for.title",
              "Built for appointment-based businesses",
            )}
          </div>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
            {tr(
              dict,
              "home.for.desc",
              "Perfect for salons, barbers, lash and nail studios, massage therapists, beauty clinics, personal trainers, and any service business that sells time.",
            )}
          </p>

          <div className="my-10 h-px w-full bg-slate-800" />

          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
            {tr(dict, "home.finalCta.title", "Ready to elevate your schedule?")}
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
            {tr(
              dict,
              "home.finalCta.desc",
              "Join thousands of service professionals who have reclaimed their time with Slottick.",
            )}
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href={`/${locale}/register`}
              prefetch
              className="inline-flex items-center justify-center rounded-2xl border border-lime-300/80 bg-lime-100 px-8 py-4 text-base font-bold text-lime-950 shadow-md transition-all hover:bg-lime-200 active:scale-95"
            >
              {tr(dict, "home.finalCta.button", "Get Started Free")}
            </Link>

            <span className="font-mono text-xs font-medium text-slate-400">
              {tr(
                dict,
                "home.finalCta.note",
                "No credit card required • 14-day trial",
              )}
            </span>
          </div>
        </div>
      </section>

      {/* Structured data schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      {faqJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      ) : null}
    </div>
  );
}
