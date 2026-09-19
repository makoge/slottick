import type { Metadata } from "next";
import ClientFollowUpAutomation from "./ClientFollowUpAutomation";
import { getMessages, t } from "@/lib/i18n";

type Params = { locale: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = await getMessages(locale);

  return {
    title: t(messages, "meta.clientFollowUpAutomation.title"),
    description: t(messages, "meta.clientFollowUpAutomation.description"),
    alternates: {
      canonical: `/${locale}/tools/client-follow-up-automation`,
      languages: {
        en: "/en/tools/client-follow-up-automation",
        fr: "/fr/tools/client-follow-up-automation",
      },
    },
    openGraph: {
      title: t(messages, "meta.clientFollowUpAutomation.title"),
      description: t(messages, "meta.clientFollowUpAutomation.description"),
      type: "website",
      url: `/${locale}/tools/client-follow-up-automation`,
      locale: locale === "fr" ? "fr_FR" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: t(messages, "meta.clientFollowUpAutomation.title"),
      description: t(messages, "meta.clientFollowUpAutomation.description"),
    },
    robots: { index: true, follow: true },
  };
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { locale } = await params;
  const messages = await getMessages(locale);

  const rawSteps = t(messages, "clientFollowUpAutomation.ui.how.steps");
  const stepsList: string[] = Array.isArray(rawSteps)
    ? (rawSteps as string[])
    : [];

  return (
    <div className="w-full pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative w-full border-b border-slate-400/30 bg-white/40 px-4 py-10 shadow-sm backdrop-blur-xl sm:px-8 sm:py-14">
        <div className="mx-auto max-w-5xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-lime-300/80 bg-lime-100 px-3.5 py-1 text-xs font-bold text-lime-950 shadow-xs">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-lime-900 text-[10px] text-white">
              ✓
            </span>
            <span className="font-mono uppercase tracking-wider">
              {t(messages, "clientFollowUpAutomation.ui.badge")}
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            {t(messages, "clientFollowUpAutomation.ui.hero.h1")}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-700 sm:text-base">
            {t(messages, "clientFollowUpAutomation.ui.hero.lead")}
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="#tool"
              className="inline-flex items-center justify-center rounded-2xl border border-lime-300/80 bg-lime-100 px-6 py-3.5 font-mono text-xs font-bold uppercase tracking-wider text-lime-950 shadow-xs transition hover:bg-lime-200 active:scale-95"
            >
              {t(messages, "clientFollowUpAutomation.ui.hero.ctaPrimary")}
            </a>
            <a
              href="#how"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-400/60 bg-white/80 px-6 py-3.5 font-mono text-xs font-semibold text-slate-800 shadow-2xs backdrop-blur-sm transition hover:bg-white active:scale-95"
            >
              {t(messages, "clientFollowUpAutomation.ui.hero.ctaSecondary")}
            </a>
          </div>

          <p className="mt-4 font-mono text-xs text-slate-500">
            {t(messages, "clientFollowUpAutomation.ui.hero.trust")}
          </p>
        </div>
      </section>

      <div className="mx-auto mt-8 max-w-5xl px-4 sm:px-8 space-y-12">
        {/* 2. AUTOMATION TOOL CONTAINER */}
        <section id="tool" className="scroll-mt-24">
          <div className="overflow-hidden rounded-3xl border border-slate-400/40 bg-white/75 p-6 shadow-xl backdrop-blur-2xl sm:p-9">
            <ClientFollowUpAutomation locale={locale} messages={messages} />
          </div>
        </section>

        {/* 3. STEP-BY-STEP PROCESS */}
        <section id="how" className="scroll-mt-24">
          <div className="flex items-center gap-2 border-b border-slate-400/40 pb-4">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-lime-300/80 bg-lime-100 font-mono text-xs font-bold text-lime-950">
              ✓
            </span>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              {t(messages, "clientFollowUpAutomation.ui.how.title")}
            </h2>
          </div>

          <ol className="mt-6 grid gap-4 md:grid-cols-2">
            {stepsList.map((step, i) => (
              <li
                key={i}
                className="group rounded-3xl border border-slate-400/40 bg-white/65 p-6 shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/85"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-lime-300/80 bg-lime-100 font-mono text-xs font-bold text-lime-950 shadow-xs">
                    0{i + 1}
                  </div>
                  <p className="text-sm leading-relaxed text-slate-700">
                    {step}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
