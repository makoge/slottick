
import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { locales, t } from "@/lib/i18n";

type Params = { locale: string };

const SITE_NAME = "Slottick";

function baseUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://slottick.com").replace(/\/$/, "");
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
    .reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined), obj);
}

function interpolate(str: string, vars?: Record<string, string | number>) {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

/**
 * Safe translate:
 * - reads a string at key
 * - interpolates {vars}
 * - if missing, returns fallback
 */
function tr(dict: Record<string, any>, key: string, fallback: string, vars?: Record<string, any>) {
  const raw = getPath(dict, key);
  if (typeof raw === "string" && raw.trim()) return interpolate(raw, vars);
  return interpolate(fallback, vars);
}

/** Safe read arrays from dict (fixes faqItems.map crash) */
function getArray<T = any>(dict: Record<string, any>, key: string, fallback: T[] = []) {
  const v = getPath(dict, key);
  return Array.isArray(v) ? (v as T[]) : fallback;
}

/** Next.js 16: themeColor should be in viewport export */
export const viewport: Viewport = {
  themeColor: "#0f172a"
};

export async function generateMetadata({
  params
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
    "Booking management platform for service businesses"
  );

  const description = tr(
    dict,
    "meta.home.description",
    "Manage services, staff availability and online bookings in one place. Share one link that always shows your real schedule, for service businesses like salons, beauty and wellness."
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
  const dict = await getDictionary(locale);

  const site = baseUrl();
  const canonical = `${site}/${locale}`;

  // Arrays from JSON (safe)
  const heroChecks = getArray<string>(dict, "home.hero.checks", [
    "Services, durations & pricing",
    "Availability rules & breaks",
    "Buffer time between clients",
    "One booking link as your website",
    "Track revenue, bookings, and client growth"
  ]);

  const faqItems = getArray<{ q: string; a: string }>(dict, "home.faq.items", []);

  const previewStats = getArray<{ t: string; v: string; s: string }>(dict, "home.preview.stats", [
    { t: "Total bookings", v: "28", s: "This month" },
    { t: "Revenue", v: "€1,240", s: "Confirmed" },
    { t: "Customers", v: "19", s: "Returning: 6" }
  ]);

  const previewBookings = getArray<{ header: string; service: string; price: string }>(
    dict,
    "home.preview.bookings",
    [
      { header: "10:30 • Maria K.", service: "Lash refill • 60 min", price: "€55" },
      { header: "12:00 • Anna P.", service: "Classic lashes • 90 min", price: "€70" },
      { header: "15:30 • Kristi S.", service: "Brow shape • 30 min", price: "€25" }
    ]
  );

  const howItems = getArray<{ title: string; desc: string }>(dict, "home.how.items", [
    { title: "Set services and rules", desc: "Add services, durations, pricing, working hours, breaks and buffer time." },
    { title: "Share one booking link", desc: "Put it on your website, Google Business Profile, and Instagram bio." },
    { title: "Get booked correctly", desc: "Clients choose a service and time slot that matches your schedule." }
  ]);

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
      "Booking management platform for service businesses. Set services and availability once and share a booking link that shows real-time availability."
    ),
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
    name: tr(dict, "home.jsonld.pageName", "Slottick Home"),
    url: canonical,
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: site }
  };

  const faqJsonLd =
    faqItems.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqItems.map((x) => ({
            "@type": "Question",
            name: String(x?.q ?? ""),
            acceptedAnswer: { "@type": "Answer", text: String(x?.a ?? "") }
          }))
        }
      : null;

  return (
    <main className="mx-auto w-full max-w-[1500px] px-3 sm:px-6 lg:px-8  bg-white text-slate-900">
      <div className=" w-full ">
        {/* HERO */}
        <section className=" mt-6 grid gap-8  rounded-4xl   py-16   md:grid-cols-2 md:items-center md:justify-items-center sm:py-20 lg:py-24 ">

          
          
        

     
          <div className="relative z-10  w-full max-w-xl  px-4 py-16 text-center rounded-4xl sm:px-6 sm:py-20 lg:px-10 lg:py-24 bg-[radial-gradient(circle_at_85%_30%,rgba(163,230,53,0.14),transparent_32%),radial-gradient(circle_at_72%_58%,rgba(163,230,53,0.10),transparent_26%),linear-gradient(135deg,#071633_0%,#08142d_48%,#0d1e3f_100%)]">  
            <span className="inline-flex mb-6 w-fit rounded-full bg-slate-100 px-4 py-1 text-sm font-medium text-slate-900">
              {tr(dict, "home.hero.badge", "Booking system for service businesses")}
            </span>

            <h1 className="text-4xl mb-6 font-bold tracking-tight sm:text-5xl text-slate-100">
              {tr(dict, "home.hero.h1Line1", "Booking management platform")}
              <br />
              {tr(dict, "home.hero.h1Line2", "that protects your time.")}
            </h1>

            <p className="max-w-xl mb-6 text-lg text-slate-100">
              {tr(
                dict,
                "home.hero.lead",
                "Slottick turns your availability into a shareable booking website. Clients book your real schedule, no back-and-forth, no double booking. Manage clients, track revenue and grow smarter"
              )}
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href={`/${locale}/register`}
                prefetch
                className="rounded-xl bg-linear-to-r from-lime-400 to-green-500  px-6 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-800"
              >
                {tr(dict, "home.hero.ctaPrimary", "Create your booking page")}
              </Link>

              <Link
                href={`/${locale}/explore`}
                prefetch
                className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-100 hover:bg-slate-900"
              >
                {tr(dict, "home.hero.ctaSecondary", "Explore Services")}
              </Link>
            </div>
          </div>
          

          {/* VISUAL */}
          <div className=" w-full max-w-xl rounded-3xl border border-slate-200 bg-lime-100 p-8 shadow-sm sm:mt-16 ">
            <div className="space-y-4 text-sm text-slate-600">
              {heroChecks.map((x, i) => (
                <p key={`${i}-${x}`}>✔ {x}</p>
              ))}
            </div>
          </div>
        </section>
       {/* FEATURES BENTO GRID */}
<section className=" md:mt-16 lg:mt-16 py-16 sm:py-20 lg:py-24">
  <div className="mx-auto w-full px-0">
    <div className="mb-10 rounded-[2rem] bg-slate-300 px-6 py-10 text-center sm:mb-12 sm:px-8 sm:py-12 lg:mb-16">
      <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
        {tr(dict, "home.features.title", "Master your calendar")}
      </h2>
      <p className="mx-auto max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
        {tr(
          dict,
          "home.features.subtitle",
          "Elite tools designed to give you back your hours and provide a seamless booking journey for your clients."
        )}
      </p>
    </div>

    <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:gap-8 md:grid-cols-3">
      {/* Card 1 */}
      <div className="editorial-shadow group flex flex-col justify-between rounded-2xl bg-white p-6 transition-all hover:bg-slate-100 sm:p-8 lg:p-10 md:col-span-2">
        <div>
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 transition-transform group-hover:scale-110 sm:h-12 sm:w-12">
            <span className="material-symbols-outlined text-slate-900">rule</span>
          </div>

          <h3 className="mb-3 text-xl font-bold text-slate-900 sm:mb-4 sm:text-2xl">
            {tr(
              dict,
              "home.features.card1.title",
              "Intelligent Availability Rules"
            )}
          </h3>

          <p className="max-w-md text-sm leading-7 text-slate-600 sm:text-base">
            {tr(
              dict,
              "home.features.card1.desc",
              "Set complex recurring schedules, holiday overrides, and specific window blocks. Your calendar works on your terms, always."
            )}
          </p>
        </div>

       <div className="mt-8 overflow-hidden sm:mt-10 lg:mt-12">
  <div className="availability-marquee flex w-max items-center gap-3 sm:gap-4">
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
      "Thu Break 12:00",
      "Fri Available",
      "Sat Closed",
      "Sun Custom",
    ].map((item, i) => (
      <div
        key={`${item}-${i}`}
        className={`flex h-10 flex-shrink-0 items-center justify-center rounded-lg px-4 text-xs font-bold sm:h-12 sm:px-5 sm:text-sm ${
          i % 3 === 1
            ? "bg-slate-900 text-white"
            : "bg-slate-100 text-slate-700"
        }`}
      >
        {item}
      </div>
    ))}
  </div>
</div>
      </div>

      {/* Card 2 */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-6 text-white sm:p-8 lg:p-10">
        <div className="relative z-10">
          <div className="mb-5 flex h-11 w-11 items-center justify-center  sm:h-12 sm:w-12 px-9">
            <span className="material-symbols-outlined text-white ">
              hourglass_empty
            </span>
          </div>

          <h3 className="mb-3 text-xl font-bold sm:mb-4 sm:text-2xl">
            {tr(dict, "home.features.card2.title", "Smart Buffer Times")}
          </h3>

          <p className="text-sm leading-7 text-slate-300 sm:text-base">
            {tr(
              dict,
              "home.features.card2.desc",
              "Automatically add travel or prep time between appointments to prevent burnout."
            )}
          </p>
        </div>

        <div className="absolute bottom-0 right-0 h-24 w-24 rounded-full bg-white/10 blur-3xl sm:h-32 sm:w-32" />
      </div>

      {/* Card 3 */}
      <div className="editorial-shadow group rounded-2xl bg-white p-6 transition-all hover:bg-slate-100 sm:p-8 lg:p-10">
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 transition-transform group-hover:scale-110 sm:h-12 sm:w-12">
          <span className="material-symbols-outlined text-slate-900">sync</span>
        </div>

        <h3 className="mb-3 text-xl font-bold text-slate-900 sm:mb-4 sm:text-2xl">
          {tr(dict, "home.features.card3.title", "Real-time Scheduling")}
        </h3>

        <p className="text-sm leading-7 text-slate-600 sm:text-base">
          {tr(
            dict,
            "home.features.card3.desc",
            "Instant synchronization across all your personal and professional calendars to eliminate double bookings."
          )}
        </p>
      </div>

      {/* Card 4 */}
      <div className="group relative overflow-hidden rounded-2xl bg-slate-200 p-6 sm:p-8 lg:p-10 md:col-span-2">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:gap-10 lg:gap-12">
          <div className="flex-1">
            <h3 className="mb-3 text-xl font-bold text-slate-900 sm:mb-4 sm:text-2xl">
              {tr(
                dict,
                "home.features.card4.title",
                "Digital Concierge Experience"
              )}
            </h3>

            <p className="text-sm leading-7 text-slate-600 sm:text-base">
              {tr(
                dict,
                "home.features.card4.desc",
                "A beautifully branded booking page that acts as an extension of your business identity, not just another form."
              )}
            </p>
<Link
  href={`/${locale}/register`}
  className="mt-6 flex items-center gap-2 text-sm font-bold text-slate-900 transition-all group-hover:gap-4 sm:mt-8 sm:text-base"
>
  {tr(dict, "home.features.cta", "Explore all features")}
  <span className="material-symbols-outlined">east</span>
</Link>
          </div>

          <div className="flex aspect-square w-full max-w-[220px] items-center justify-center self-center rounded-2xl border border-slate-100 shadow-lg md:w-1/3 md:max-w-none bg-[radial-gradient(circle_at_85%_30%,rgba(163,230,53,0.14),transparent_32%),radial-gradient(circle_at_72%_58%,rgba(163,230,53,0.10),transparent_26%),linear-gradient(135deg,#071633_0%,#08142d_48%,#0d1e3f_100%)]">
            <span className="material-symbols-outlined text-5xl text-slate-300 sm:text-6xl">
              dashboard_customize
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
        {/* DASHBOARD PREVIEW */}
        <section className="mt-14 grid gap-8 lg:grid-cols-12 lg:items-start">
          {/* Left FAQ */}
          <div className="lg:col-span-5 min-w-0 shadow-sm bg-slate-400 rounded-4xl px-5 py-8">
            <span className="inline-flex w-fit rounded-full bg-slate-100 px-4 py-1 text-sm font-medium ring-emerald-200">
              {tr(dict, "home.faq.badge", "FAQ")}
            </span>

            <h2 className="mt-4 text-3xl font-bold tracking-tight">
              {tr(
                dict,
                "home.faq.title",
                "Why do service businesses need a booking system?"
              )}
            </h2>

            
            <div className="mt-8 grid gap-3">
              {(faqItems.length
                ? faqItems
                : [
                    {
                      q: "What problems does a booking system solve?",
                      a: "It stops back-and-forth messages, prevents double booking, and keeps your schedule accurate in real time."
                    },
                    { q: "Can it reduce no-shows?", a: "Yes. Confirmations and reminders make clients show up more often, and your time stays protected." },
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
                  ]
              ).map((item) => (
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
          <div className="lg:col-span-7 min-w-0">
            <div className="mx-auto w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-slate-600">
                    {tr(dict, "home.preview.badge", "Dashboard preview")}
                  </div>
                  <div className="mt-1 text-lg font-bold tracking-tight">
                    {tr(dict, "home.preview.businessName", "Lash Studio Tallinn")}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
                  {tr(dict, "home.preview.liveDemo", "Live demo")}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {previewStats.map((x) => (
                  <div key={x.t} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-sm font-medium text-slate-600">{x.t}</div>
                    <div className="mt-2 text-2xl font-bold tracking-tight">{x.v}</div>
                    <div className="mt-1 text-xs text-slate-500">{x.s}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-medium text-slate-700">
                  {tr(dict, "home.preview.linkTitle", "Your booking link")}
                </div>

                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-900 ring-1 ring-slate-200">
                    <div className="truncate">slottick.com/{locale}/book/lash-studio-London</div>
                  </div>

                  <button
                    type="button"
                    className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 sm:w-fit"
                  >
                    {tr(dict, "home.preview.copy", "Copy")}
                  </button>
                </div>

                <div className="mt-2 text-xs text-slate-500">
                  {tr(dict, "home.preview.shareHint", "Share on Instagram bio, WhatsApp, website.")}
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">
                    {tr(dict, "home.preview.upcomingTitle", "Upcoming bookings")}
                  </div>
                  <div className="text-xs font-medium text-slate-500">
                    {tr(dict, "home.preview.today", "Today")}
                  </div>
                </div>

                <div className="mt-3 grid gap-3">
                  {previewBookings.map((b) => (
                    <div
                      key={b.header}
                      className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold">{b.header}</div>
                        <div className="mt-1 text-sm text-slate-600">{b.service}</div>
                      </div>
                      <div className="shrink-0 text-sm font-semibold text-slate-900">{b.price}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                  {tr(
                    dict,
                    "home.preview.note",
                    "Clients only see real available slots — no double booking."
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* WHY SLOTTICK (2nd question section — kept) */}
<section className="mt-32">
  <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
    <div className="max-w-xl">
      <span className="inline-flex w-fit rounded-full bg-slate-100 px-4 py-1 text-sm font-medium ring-emerald-200">
        {t(dict, "home.why.badge")}
      </span>

      <h2 className="mt-4 text-3xl font-bold tracking-tight">
        {t(dict, "home.why.title")}
      </h2>

      <p className="mt-4 text-lg text-slate-600">
        {t(dict, "home.why.lead")}
      </p>

      <div className="mt-8 grid gap-3">
        {(Array.isArray((dict as any)?.home?.why?.items) ? (dict as any).home.why.items : []).map(
          (item: any) => (
            <details
              key={String(item?.q ?? "")}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <span className="text-base font-semibold text-slate-900">
                  {String(item?.q ?? "")}
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition group-open:rotate-45">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </span>
              </summary>
              <div className="mt-3 text-sm leading-relaxed text-slate-600">
                {String(item?.a ?? "")}
              </div>
            </details>
          )
        )}
      </div>
    </div>

    {/* RIGHT: Visual (kept) */}
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
      <div className="mb-4">
        <div className="text-sm font-medium text-slate-600">{t(dict, "home.why.visual.kicker")}</div>
        <div className="mt-1 text-xl font-bold tracking-tight text-slate-900">
          {t(dict, "home.why.visual.title")}
        </div>
        <div className="mt-2 text-sm text-slate-600">{t(dict, "home.why.visual.desc")}</div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
          {t(dict, "home.why.visual.panelTitle")}
        </div>

        <div className="p-4">
          <svg
            viewBox="0 0 920 520"
            className="h-auto w-full"
            role="img"
            aria-label={t(dict, "home.why.visual.aria")}
          >
            <defs>
              <linearGradient id={`g1-${locale}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#0f172a" />
                <stop offset="1" stopColor="#334155" />
              </linearGradient>
            </defs>

            <rect x="0" y="0" width="920" height="520" rx="24" fill="#f8fafc" />
            <rect x="18" y="18" width="884" height="484" rx="20" fill="#ffffff" stroke="#e2e8f0" />

            <rect x="60" y="70" width="260" height="120" rx="18" fill="#0f172a" opacity="0.06" stroke="#e2e8f0" />
            <text x="80" y="105" fontSize="14" fill="#334155" fontFamily="ui-sans-serif, system-ui">
              {t(dict, "home.why.visual.shareableLink")}
            </text>
            <rect x="80" y="122" width="220" height="38" rx="12" fill={`url(#g1-${locale})`} />
            <text x="92" y="146" fontSize="12" fill="#ffffff" fontFamily="ui-sans-serif, system-ui">
              slottick.com/{locale}/book/your-business
            </text>

            <rect x="360" y="55" width="250" height="170" rx="18" fill="#ffffff" stroke="#e2e8f0" />
            <rect x="360" y="55" width="250" height="36" rx="18" fill="#f1f5f9" />
            <text x="382" y="78" fontSize="13" fill="#334155" fontFamily="ui-sans-serif, system-ui">
              {t(dict, "home.why.visual.bookingPage")}
            </text>
            <rect x="382" y="110" width="206" height="16" rx="8" fill="#e2e8f0" />
            <rect x="382" y="140" width="170" height="16" rx="8" fill="#e2e8f0" />
            <rect x="382" y="170" width="206" height="34" rx="12" fill="#0f172a" />
            <text x="406" y="192" fontSize="12" fill="#ffffff" fontFamily="ui-sans-serif, system-ui">
              {t(dict, "home.why.visual.bookSlot")}
            </text>

            <rect x="650" y="55" width="210" height="170" rx="18" fill="#ffffff" stroke="#e2e8f0" />
            <rect x="650" y="55" width="210" height="36" rx="18" fill="#f1f5f9" />
            <text x="672" y="78" fontSize="13" fill="#334155" fontFamily="ui-sans-serif, system-ui">
              {t(dict, "home.why.visual.exploreMarket")}
            </text>
            <rect x="672" y="110" width="166" height="18" rx="9" fill="#e2e8f0" />
            <rect x="672" y="140" width="166" height="18" rx="9" fill="#e2e8f0" />
            <rect x="672" y="170" width="166" height="18" rx="9" fill="#e2e8f0" />
            <text x="672" y="212" fontSize="11" fill="#64748b" fontFamily="ui-sans-serif, system-ui">
              {t(dict, "home.why.visual.discover")}
            </text>

            <rect x="60" y="260" width="800" height="210" rx="18" fill="#ffffff" stroke="#e2e8f0" />
            <rect x="60" y="260" width="800" height="44" rx="18" fill="#f1f5f9" />
            <text x="84" y="288" fontSize="13" fill="#334155" fontFamily="ui-sans-serif, system-ui">
              {t(dict, "home.why.visual.dashboard")}
            </text>

            <rect x="84" y="330" width="220" height="120" rx="16" fill="#0f172a" opacity="0.05" stroke="#e2e8f0" />
            <text x="104" y="360" fontSize="12" fill="#475569" fontFamily="ui-sans-serif, system-ui">
              {t(dict, "home.why.visual.totalBookings")}
            </text>
            <text x="104" y="400" fontSize="28" fill="#0f172a" fontFamily="ui-sans-serif, system-ui" fontWeight="700">
              24
            </text>

            <rect x="330" y="330" width="250" height="120" rx="16" fill="#0f172a" opacity="0.05" stroke="#e2e8f0" />
            <text x="350" y="360" fontSize="12" fill="#475569" fontFamily="ui-sans-serif, system-ui">
              {t(dict, "home.why.visual.revenue")}
            </text>
            <text x="350" y="392" fontSize="12" fill="#0f172a" fontFamily="ui-sans-serif, system-ui" fontWeight="700">
              €120 / €540 / €6,200
            </text>
            <rect x="350" y="410" width="210" height="10" rx="5" fill="#e2e8f0" />
            <rect x="350" y="410" width="120" height="10" rx="5" fill="#0f172a" opacity="0.7" />

            <rect x="610" y="330" width="250" height="120" rx="16" fill="#0f172a" opacity="0.05" stroke="#e2e8f0" />
            <text x="630" y="360" fontSize="12" fill="#475569" fontFamily="ui-sans-serif, system-ui">
              {t(dict, "home.why.visual.customers")}
            </text>
            <text x="630" y="400" fontSize="28" fill="#0f172a" fontFamily="ui-sans-serif, system-ui" fontWeight="700">
              18
            </text>
            <text x="630" y="426" fontSize="11" fill="#64748b" fontFamily="ui-sans-serif, system-ui">
              {t(dict, "home.why.visual.namesCountries")}
            </text>

            <path d="M320 130 C340 130, 345 130, 360 130" stroke="#94a3b8" strokeWidth="3" fill="none" />
            <path d="M610 140 C630 140, 635 140, 650 140" stroke="#94a3b8" strokeWidth="3" fill="none" />
            <path d="M485 230 C485 245, 485 250, 485 260" stroke="#94a3b8" strokeWidth="3" fill="none" />
            <circle cx="320" cy="130" r="4" fill="#94a3b8" />
            <circle cx="360" cy="130" r="4" fill="#94a3b8" />
            <circle cx="610" cy="140" r="4" fill="#94a3b8" />
            <circle cx="650" cy="140" r="4" fill="#94a3b8" />
          </svg>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {(Array.isArray((dict as any)?.home?.why?.visual?.pillars) ? (dict as any).home.why.visual.pillars : []).map(
              (x: any) => (
                <div key={String(x?.k ?? "")} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="text-xs font-medium text-slate-600">{String(x?.k ?? "")}</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{String(x?.v ?? "")}</div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

        {/* HOW IT WORKS */}
        <section className="mt-20 grid gap-8 md:grid-cols-3">
          {howItems.map((item) => (
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
        <section className="relative mt-20 overflow-hidden rounded-[2rem] px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-10 lg:py-24 bg-[radial-gradient(circle_at_85%_30%,rgba(163,230,53,0.14),transparent_32%),radial-gradient(circle_at_72%_58%,rgba(163,230,53,0.10),transparent_26%),linear-gradient(135deg,#071633_0%,#08142d_48%,#0d1e3f_100%)]">

  <div className="relative mx-auto max-w-4xl">

    {/* BUILT FOR */}
    <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
      {tr(dict, "home.for.title", "Built for appointment-based businesses")}
    </h2>

    <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
      {tr(
        dict,
        "home.for.desc",
        "Perfect for salons, barbers, lash and nail studios, massage therapists, beauty clinics, personal trainers, and any service business that sells time."
      )}
    </p>

    {/* DIVIDER SPACE */}
    <div className="my-12 h-px w-full bg-white/10" />

    {/* CTA */}
    <h2 className="mb-6 text-3xl font-extrabold tracking-tight text-slate-200 sm:text-4xl md:text-5xl lg:text-6xl">
      {tr(dict, "home.finalCta.title", "Ready to elevate your schedule?")}
    </h2>

    <p className="mx-auto mb-10 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
      {tr(
        dict,
        "home.finalCta.desc",
        "Join thousands of service professionals who have reclaimed their time with Slottick."
      )}
    </p>

    <div className="inline-flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
      <Link
        href={`/${locale}/register`}
        prefetch
        className="rounded-xl px-8 py-4 text-base font-bold text-slate-950 transition-transform bg-gradient-to-r from-lime-400 to-green-500 hover:scale-105 sm:px-10 sm:py-5 sm:text-lg"
      >
        {tr(dict, "home.finalCta.button", "Get Started Free")}
      </Link>

      <p className="text-sm font-medium text-slate-300">
        {tr(
          dict,
          "home.finalCta.note",
          "No credit card required • 14-day trial"
        )}
      </p>
    </div>

  </div>
</section>
      </div>

      {/* Structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }} />
      {faqJsonLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      ) : null}
    </main>
  );
}

