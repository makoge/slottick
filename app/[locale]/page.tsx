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
            name: "Why not just take bookings in Instagram DMs?",
            acceptedAnswer: { "@type": "Answer", text: "DMs don’t understand your availability. A booking system only shows slots that actually fit your schedule, breaks, and buffer." }
          },
      {
            "@type": "Question",
            name: "What problems does a booking system solve?",
            acceptedAnswer: { "@type": "Answer", text: "It stops back-and-forth messages, prevents double booking, and keeps your schedule accurate in real time." }
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
                href={`/${locale}/explore`}
                className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold hover:bg-slate-50"
              >
                Explore Services
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
            <span className="mt-1 text-slate-500 group-open:rotate-45 transition">
              +
            </span>
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


        {/* why slottick (FAQ + visual) */}
<section className="mt-32">
  <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
    {/* LEFT: FAQ / Accordion */}
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
            a: "Set working hours, breaks, buffer time, and services once. Slottick only shows slots that fit your real schedule,no double bookings, no back-and-forth."
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
            a: "Clients book in seconds. You manage everything from one dashboard,no complicated setup, no tech knowledge required."
          }
        ].map((item) => (
          <details
            key={item.q}
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
              <span className="text-base font-semibold text-slate-900">
                {item.q}
              </span>

              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition group-open:rotate-45">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
            </summary>

            <div className="mt-3 text-sm leading-relaxed text-slate-600">
              {item.a}
            </div>
          </details>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <a
          href={`/${locale}/register`}
          className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Create your booking page
        </a>
        
      </div>
    </div>

    {/* RIGHT: Visual (SVG illustration you can keep or replace with an image later) */}
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
      <div className="mb-4">
        <div className="text-sm font-medium text-slate-600">How it feels</div>
        <div className="mt-1 text-xl font-bold tracking-tight text-slate-900">
          One link → bookings → dashboard
        </div>
        <div className="mt-2 text-sm text-slate-600">
          Time protection + marketing in one system.
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
          Slottick Flow
        </div>

        {/* Inline SVG (safe, lightweight, looks like a product diagram) */}
        <div className="p-4">
          <svg
            viewBox="0 0 920 520"
            className="h-auto w-full"
            role="img"
            aria-label="Illustration showing booking link, booking page, explore marketplace, and dashboard stats"
          >
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#0f172a" />
                <stop offset="1" stopColor="#334155" />
              </linearGradient>
            </defs>

            {/* background */}
            <rect x="0" y="0" width="920" height="520" rx="24" fill="#f8fafc" />
            <rect x="18" y="18" width="884" height="484" rx="20" fill="#ffffff" stroke="#e2e8f0" />

            {/* left: share link */}
            <rect x="60" y="70" width="260" height="120" rx="18" fill="#0f172a" opacity="0.06" stroke="#e2e8f0" />
            <text x="80" y="105" fontSize="14" fill="#334155" fontFamily="ui-sans-serif, system-ui">
              Shareable Link
            </text>
            <rect x="80" y="122" width="220" height="38" rx="12" fill="url(#g1)" />
            <text x="92" y="146" fontSize="12" fill="#ffffff" fontFamily="ui-sans-serif, system-ui">
              slottick.com/book/your-slug
            </text>

            {/* middle: booking page */}
            <rect x="360" y="55" width="250" height="170" rx="18" fill="#ffffff" stroke="#e2e8f0" />
            <rect x="360" y="55" width="250" height="36" rx="18" fill="#f1f5f9" />
            <text x="382" y="78" fontSize="13" fill="#334155" fontFamily="ui-sans-serif, system-ui">
              Booking Page
            </text>
            <rect x="382" y="110" width="206" height="16" rx="8" fill="#e2e8f0" />
            <rect x="382" y="140" width="170" height="16" rx="8" fill="#e2e8f0" />
            <rect x="382" y="170" width="206" height="34" rx="12" fill="#0f172a" />
            <text x="406" y="192" fontSize="12" fill="#ffffff" fontFamily="ui-sans-serif, system-ui">
              Book a time slot
            </text>

            {/* right-top: explore */}
            <rect x="650" y="55" width="210" height="170" rx="18" fill="#ffffff" stroke="#e2e8f0" />
            <rect x="650" y="55" width="210" height="36" rx="18" fill="#f1f5f9" />
            <text x="672" y="78" fontSize="13" fill="#334155" fontFamily="ui-sans-serif, system-ui">
              Explore Market
            </text>
            <rect x="672" y="110" width="166" height="18" rx="9" fill="#e2e8f0" />
            <rect x="672" y="140" width="166" height="18" rx="9" fill="#e2e8f0" />
            <rect x="672" y="170" width="166" height="18" rx="9" fill="#e2e8f0" />
            <text x="672" y="212" fontSize="11" fill="#64748b" fontFamily="ui-sans-serif, system-ui">
              New clients discover you
            </text>

            {/* dashboard stats bottom */}
            <rect x="60" y="260" width="800" height="210" rx="18" fill="#ffffff" stroke="#e2e8f0" />
            <rect x="60" y="260" width="800" height="44" rx="18" fill="#f1f5f9" />
            <text x="84" y="288" fontSize="13" fill="#334155" fontFamily="ui-sans-serif, system-ui">
              Dashboard
            </text>

            <rect x="84" y="330" width="220" height="120" rx="16" fill="#0f172a" opacity="0.05" stroke="#e2e8f0" />
            <text x="104" y="360" fontSize="12" fill="#475569" fontFamily="ui-sans-serif, system-ui">
              Total bookings
            </text>
            <text x="104" y="400" fontSize="28" fill="#0f172a" fontFamily="ui-sans-serif, system-ui" fontWeight="700">
              24
            </text>

            <rect x="330" y="330" width="250" height="120" rx="16" fill="#0f172a" opacity="0.05" stroke="#e2e8f0" />
            <text x="350" y="360" fontSize="12" fill="#475569" fontFamily="ui-sans-serif, system-ui">
              Revenue (W / M / Y)
            </text>
            <text x="350" y="392" fontSize="12" fill="#0f172a" fontFamily="ui-sans-serif, system-ui" fontWeight="700">
              €120 / €540 / €6,200
            </text>
            <rect x="350" y="410" width="210" height="10" rx="5" fill="#e2e8f0" />
            <rect x="350" y="410" width="120" height="10" rx="5" fill="#0f172a" opacity="0.7" />

            <rect x="610" y="330" width="250" height="120" rx="16" fill="#0f172a" opacity="0.05" stroke="#e2e8f0" />
            <text x="630" y="360" fontSize="12" fill="#475569" fontFamily="ui-sans-serif, system-ui">
              Customers
            </text>
            <text x="630" y="400" fontSize="28" fill="#0f172a" fontFamily="ui-sans-serif, system-ui" fontWeight="700">
              18
            </text>
            <text x="630" y="426" fontSize="11" fill="#64748b" fontFamily="ui-sans-serif, system-ui">
              Names + countries from bookings
            </text>

            {/* arrows */}
            <path d="M320 130 C340 130, 345 130, 360 130" stroke="#94a3b8" strokeWidth="3" fill="none" />
            <path d="M610 140 C630 140, 635 140, 650 140" stroke="#94a3b8" strokeWidth="3" fill="none" />
            <path d="M485 230 C485 245, 485 250, 485 260" stroke="#94a3b8" strokeWidth="3" fill="none" />
            <circle cx="320" cy="130" r="4" fill="#94a3b8" />
            <circle cx="360" cy="130" r="4" fill="#94a3b8" />
            <circle cx="610" cy="140" r="4" fill="#94a3b8" />
            <circle cx="650" cy="140" r="4" fill="#94a3b8" />
          </svg>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {[
              { k: "Time", v: "Real availability" },
              { k: "Marketing", v: "One link everywhere" },
              { k: "Growth", v: "Explore marketplace" }
            ].map((x) => (
              <div key={x.k} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-xs font-medium text-slate-600">{x.k}</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">{x.v}</div>
              </div>
            ))}
          </div>
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
        <section className="mt-26 rounded-3xl bg-slate-900 px-8 py-14 text-white">
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
