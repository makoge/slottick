import Link from "next/link";
import type { Metadata } from "next";

const SITE_NAME = "Slottick";

type Locale = "en" | "fr";

const copy = {
  en: {
    title: "The Ultimate Power Move: Mastering the Blond Buzz Cut",
    description:
      "A bold guide to the blond buzz cut: what it is, why it works, how to maintain it, and where to find professionals near you.",
    badge: "Style Guide",
    readTime: "5 min read",
    intro:
      "Ready to shed endless styling routines and make a bold, unforgettable statement? Nothing feels quite as liberating or as fashionable  as chopping it all off and going blond.",
    cta: "Explore hair services",
    secondaryCta: "Find salons near you",
    sections: [
      {
        h: "What is a blond buzz cut?",
        p: [
          "A blond buzz cut is a radically short haircut, usually around grade 1 to 3, bleached and toned into a striking blond shade.",
          "It can be icy platinum, soft beige, honey blond, or warm golden. But more than anything, it is an attitude: clean, confident, minimal, and impossible to ignore.",
          "Because the hair is so short, your face becomes the focus. Your eyes, jawline, cheekbones, and natural structure take center stage."
        ]
      },
      {
        h: "Why the blond buzz cut is taking over",
        p: [
          "Zero bad hair days. Wake up, wash your face, and the look is already there.",
          "It is a confidence booster. There is nothing to hide behind, which makes the style feel powerful and intentional.",
          "It is also the perfect reset if your hair has been damaged by heat, dyes, or over-styling. You start fresh while looking sharp and editorial."
        ]
      },
      {
        h: "How to choose the right blond tone",
        p: [
          "Not every blond works the same on every skin tone. Cool undertones usually look great with icy, ash, or platinum blond. Warmer undertones often glow with honey, champagne, or golden blond.",
          "A professional stylist can help you choose the safest bleach level and toner, especially if your hair is dark or previously colored."
        ]
      },
      {
        h: "How to maintain the look",
        p: [
          "Use purple shampoo once a week to reduce brassiness and keep the blond fresh.",
          "Hydrate your scalp with a gentle oil or leave-in treatment, because bleach can cause dryness.",
          "Keep it trimmed every 3 to 4 weeks. With a buzz cut, growth shows quickly, so regular touch-ups keep the shape crisp."
        ]
      },
      {
        h: "Ready to make the chop?",
        p: [
          "Life is too short for boring hair. A blond buzz cut is bold, clean, modern, and expressive.",
          "Explore professionals near you, compare services, and book a consultation before making the move."
        ]
      }
    ]
  },
  fr: {
    title: "Le geste ultime : maîtriser le buzz cut blond",
    description:
      "Un guide moderne du buzz cut blond : définition, style, entretien, choix de la teinte et où trouver un professionnel près de chez vous.",
    badge: "Guide style",
    readTime: "5 min de lecture",
    intro:
      "Prêt à abandonner les routines capillaires interminables et à adopter un style fort, moderne et inoubliable ? Rien n’est aussi libérateur, et aussi tendance, qu’un buzz cut blond.",
    cta: "Explorer les services coiffure",
    secondaryCta: "Trouver des salons près de moi",
    sections: [
      {
        h: "Qu’est-ce qu’un buzz cut blond ?",
        p: [
          "Un buzz cut blond est une coupe très courte, généralement entre grade 1 et 3, décolorée puis tonifiée dans une nuance de blond marquante.",
          "Il peut être platine, beige, miel ou doré. Mais au-delà de la coupe, c’est une attitude : minimaliste, audacieuse, propre et impossible à ignorer.",
          "Comme les cheveux sont très courts, le visage devient le centre de l’attention. Les yeux, la mâchoire, les pommettes et la structure naturelle ressortent davantage."
        ]
      },
      {
        h: "Pourquoi le buzz cut blond est partout",
        p: [
          "Zéro mauvais jour capillaire. Vous vous levez, vous vous préparez, et le style est déjà là.",
          "C’est une coupe qui donne confiance. Il n’y a rien derrière quoi se cacher, ce qui rend le look fort et assumé.",
          "C’est aussi un excellent reset si vos cheveux ont été abîmés par la chaleur, les colorations ou les décolorations répétées."
        ]
      },
      {
        h: "Comment choisir la bonne nuance de blond",
        p: [
          "Tous les blonds ne conviennent pas à toutes les carnations. Les sous-tons froids vont souvent très bien avec le platine, le cendré ou l’icy blond. Les sous-tons chauds ressortent mieux avec le miel, le champagne ou le doré.",
          "Un professionnel peut vous aider à choisir la bonne décoloration et le bon toner, surtout si vos cheveux sont foncés ou déjà colorés."
        ]
      },
      {
        h: "Comment entretenir le look",
        p: [
          "Utilisez un shampoing violet une fois par semaine pour éviter les reflets jaunes.",
          "Hydratez votre cuir chevelu avec une huile douce ou un soin sans rinçage, car la décoloration peut assécher.",
          "Prévoyez une retouche toutes les 3 à 4 semaines. Sur cheveux très courts, la repousse se voit vite."
        ]
      },
      {
        h: "Prêt à passer à l’action ?",
        p: [
          "La vie est trop courte pour une coupe ennuyeuse. Le buzz cut blond est moderne, audacieux et expressif.",
          "Explorez les professionnels près de chez vous, comparez les services et réservez une consultation avant de vous lancer."
        ]
      }
    ]
  }
};

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale?.toLowerCase().startsWith("fr") ? "fr" : "en";
  const t = copy[locale];

  return {
    title: `${t.title} | ${SITE_NAME}`,
    description: t.description,
    alternates: {
      canonical: `/${locale}/guides/buzz-cut-blond`,
      languages: {
        en: `/en/guides/buzz-cut-blond`,
        fr: `/fr/guides/buzz-cut-blond`
      }
    }
  };
}

export default async function BuzzCutBlondGuidePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale?.toLowerCase().startsWith("fr") ? "fr" : "en";
  const t = copy[locale];

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <section className="rounded-4xl bg-slate-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1 text-sm text-white/80">
              {t.badge}
            </span>

            <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              {t.title}
            </h1>

            <p className="mt-6 text-lg leading-8 text-white/75">{t.intro}</p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/${locale}/explore`}
                className="rounded-xl bg-white px-5 py-3 text-center font-medium text-slate-900 transition hover:bg-slate-100"
              >
                {t.cta}
              </Link>

              <Link
                href={`/${locale}/explore`}
                className="rounded-xl border border-white/20 px-5 py-3 text-center font-medium text-white transition hover:bg-white/10"
              >
                {t.secondaryCta}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_320px] lg:py-16">
        <article className="max-w-3xl">
          <div className="border-b border-slate-200 pb-8">
            <p className="text-sm font-medium text-slate-500">{t.readTime}</p>
            <p className="mt-3 text-xl leading-8 text-slate-700">{t.description}</p>
          </div>

          <div className="mt-10 space-y-12">
            {t.sections.map((section) => (
              <section key={section.h}>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                  {section.h}
                </h2>

                <div className="mt-5 space-y-5 text-base leading-8 text-slate-700">
                  {section.p.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-14 rounded-3xl bg-slate-50 p-6 sm:p-8">
            <h2 className="text-2xl font-semibold tracking-tight">
              {locale === "fr" ? "Trouvez le bon professionnel" : "Find the right professional"}
            </h2>
            <p className="mt-3 text-slate-600">
              {locale === "fr"
                ? "Comparez les services, consultez les disponibilités et réservez facilement depuis la page Explore."
                : "Compare services, check availability, and book easily from the Explore page."}
            </p>
            <Link
              href={`/${locale}/explore`}
              className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 font-medium text-white transition hover:bg-slate-800"
            >
              {t.cta}
            </Link>
          </div>
        </article>

        <aside className="lg:sticky lg:top-10 h-fit">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold">
              {locale === "fr" ? "Avant de réserver" : "Before you book"}
            </h3>

            <ul className="mt-5 space-y-4 text-sm leading-6 text-slate-600">
              <li>✓ {locale === "fr" ? "Demandez une consultation couleur" : "Ask for a color consultation"}</li>
              <li>✓ {locale === "fr" ? "Vérifiez l’expérience en décoloration" : "Check bleach experience"}</li>
              <li>✓ {locale === "fr" ? "Préparez des photos d’inspiration" : "Bring inspiration photos"}</li>
              <li>✓ {locale === "fr" ? "Planifiez les retouches" : "Plan your touch-ups"}</li>
            </ul>

            <Link
              href={`/${locale}/explore`}
              className="mt-6 flex w-full justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              {locale === "fr" ? "Explorer maintenant" : "Explore now"}
            </Link>
          </div>
        </aside>
      </section>
    </main>
  );
}