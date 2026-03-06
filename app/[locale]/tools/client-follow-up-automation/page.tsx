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

export default async function Page({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale } = await params;
  const messages = await getMessages(locale);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
      <section className="rounded-[32px] bg-white/80 p-8 shadow-[0_30px_90px_-60px_rgba(15,23,42,0.35)] ring-1 ring-slate-100 backdrop-blur">
        <span className="inline-flex rounded-full bg-slate-900 px-4 py-1 text-sm font-medium text-white">
          {t(messages, "clientFollowUpAutomation.ui.badge")}
        </span>

        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl text-slate-900">
          {t(messages, "clientFollowUpAutomation.ui.hero.h1")}
        </h1>

        <p className="mt-4 max-w-2xl text-lg text-slate-600">
          {t(messages, "clientFollowUpAutomation.ui.hero.lead")}
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a
            href="#tool"
            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            {t(messages, "clientFollowUpAutomation.ui.hero.ctaPrimary")}
          </a>
          <a
            href="#how"
            className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
          >
            {t(messages, "clientFollowUpAutomation.ui.hero.ctaSecondary")}
          </a>
        </div>

        <p className="mt-4 text-xs text-slate-500">
          {t(messages, "clientFollowUpAutomation.ui.hero.trust")}
        </p>
      </section>

      <section id="tool" className="mt-12">
        <div className="rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <ClientFollowUpAutomation locale={locale} messages={messages} />
        </div>
      </section>

      <section id="how" className="mt-14">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-slate-900">
          {t(messages, "clientFollowUpAutomation.ui.how.title")}
        </h2>

        <ol className="mt-6 grid gap-4 md:grid-cols-2">
          {Array.isArray(t(messages, "clientFollowUpAutomation.ui.how.steps"))
            ? (t(messages, "clientFollowUpAutomation.ui.how.steps") as string[]).map((step, i) => (
                <li key={i} className="rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-slate-100">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white">
                      {i + 1}
                    </div>
                    <p className="text-sm leading-relaxed text-slate-700">{step}</p>
                  </div>
                </li>
              ))
            : null}
        </ol>
      </section>
    </main>
  );
}