import Link from "next/link";
import type { Metadata } from "next";

const SITE_NAME = "Slottick";
type Locale = "en" | "fr";

const copy = {
  en: {
    title: "The Power of a Professional Cut and Blow",
    description:
      "Discover what a cut and blow is, why it transforms your hair, what to expect during your appointment, and where to book professionals near you.",
    badge: "Hair Guide",
    readTime: "5 min read",
    intro:
      "There is a special kind of confidence that happens in a salon chair. A professional cut and blow removes damaged ends, shapes your hair beautifully, and finishes it with bounce, shine, and movement.",
    cta: "Explore hair services",
    secondaryCta: "Find salons near you",
    sections: [
      {
        h: "What is a cut and blow?",
        p: [
          "A cut and blow, short for cut and blow-dry, is a complete salon service that combines a tailored haircut with a professional blow-dry finish.",
          "The cut shapes the hair based on your face shape, texture, lifestyle, and personal style. The blow-dry then brings that shape to life with volume, smoothness, shine, and movement.",
          "Unlike a quick trim, a cut and blow lets your stylist see how your hair falls when fully styled, making the final result more polished and precise."
        ]
      },
      {
        h: "Why it feels like a total reset",
        p: [
          "A professional cut removes weight, split ends, and tired shape. The blow-dry adds the finishing energy: bounce, softness, and a salon-level shine that is hard to recreate at home.",
          "This is why the cut and blow remains one of the most popular salon services. It is practical, flattering, and instantly confidence-boosting."
        ]
      },
      {
        h: "Why the blow-dry matters",
        p: [
          "The blow-dry is not just decoration. It helps reveal the true shape of the haircut.",
          "Once the hair is dry and styled, the stylist can make tiny refinements so the cut sits better, moves naturally, and frames your face properly.",
          "Whether you want sleek, soft waves, volume, or a smooth everyday finish, the blow-dry is where the final personality of the look appears."
        ]
      },
      {
        h: "What to expect during your appointment",
        p: [
          "Your appointment usually starts with a consultation. The stylist asks about your hair goals, routine, texture, and how much maintenance you want.",
          "Next comes the cleanse: shampoo, conditioning, and often a relaxing scalp massage. Then the stylist cuts the hair to create shape, remove damage, and build the right silhouette.",
          "Finally, the hair is blow-dried using professional brushes, heat control, and finishing techniques to create shine, hold, and movement."
        ]
      },
      {
        h: "Who should book a cut and blow?",
        p: [
          "A cut and blow is perfect if your hair feels heavy, flat, shapeless, dry, or difficult to manage.",
          "It is also ideal before events, photos, interviews, holidays, or any moment when you want to look polished without changing your entire style.",
          "Sometimes the smallest refresh creates the biggest difference."
        ]
      }
    ],
    table: [
      ["Consultation", "Discuss your goals, lifestyle, face shape, and ideal finish."],
      ["Cleanse", "Shampoo, conditioning, and scalp preparation."],
      ["Cut", "Precision shaping to remove damage and create structure."],
      ["Blow-dry", "Professional finish for volume, shine, movement, and hold."]
    ]
  },
  fr: {
    title: "La puissance d’une coupe brushing professionnelle",
    description:
      "Découvrez ce qu’est une coupe brushing, pourquoi elle transforme les cheveux, comment se déroule le rendez-vous et où réserver près de chez vous.",
    badge: "Guide coiffure",
    readTime: "5 min de lecture",
    intro:
      "Il y a une confiance particulière qui naît dans un fauteuil de salon. Une coupe brushing professionnelle retire les pointes abîmées, redonne une vraie forme aux cheveux et termine le look avec volume, brillance et mouvement.",
    cta: "Explorer les services coiffure",
    secondaryCta: "Trouver des salons près de moi",
    sections: [
      {
        h: "Qu’est-ce qu’une coupe brushing ?",
        p: [
          "Une coupe brushing est un service complet qui combine une coupe personnalisée avec un brushing professionnel.",
          "La coupe structure les cheveux selon la forme du visage, la texture, le style de vie et les envies. Le brushing révèle ensuite le résultat avec volume, douceur, brillance et mouvement.",
          "Contrairement à une simple coupe rapide, la coupe brushing permet au coiffeur de voir comment les cheveux tombent une fois coiffés."
        ]
      },
      {
        h: "Pourquoi cela donne l’impression d’un vrai reset",
        p: [
          "Une coupe professionnelle retire les pointes abîmées, le poids inutile et les formes fatiguées. Le brushing ajoute la finition : rebond, douceur et brillance salon.",
          "C’est pour cette raison que la coupe brushing reste l’un des services les plus demandés en salon. Elle est pratique, flatteuse et donne immédiatement confiance."
        ]
      },
      {
        h: "Pourquoi le brushing est important",
        p: [
          "Le brushing n’est pas seulement une finition esthétique. Il révèle la vraie forme de la coupe.",
          "Une fois les cheveux secs et coiffés, le professionnel peut effectuer de petits ajustements pour que la coupe tombe mieux et encadre le visage naturellement.",
          "Que vous vouliez un rendu lisse, ondulé, volumineux ou naturel, le brushing donne au look sa personnalité finale."
        ]
      },
      {
        h: "Comment se déroule le rendez-vous",
        p: [
          "Le rendez-vous commence souvent par une consultation : objectifs, routine, texture, longueur souhaitée et niveau d’entretien.",
          "Vient ensuite le lavage, avec shampoing, soin et parfois massage du cuir chevelu. Puis la coupe permet de retirer les dommages et construire une belle silhouette.",
          "Enfin, les cheveux sont séchés et coiffés avec des techniques professionnelles pour obtenir brillance, tenue et mouvement."
        ]
      },
      {
        h: "Qui devrait réserver une coupe brushing ?",
        p: [
          "C’est idéal si vos cheveux semblent lourds, plats, secs, sans forme ou difficiles à coiffer.",
          "C’est aussi parfait avant un événement, des photos, un entretien, des vacances ou simplement pour se sentir plus soigné.",
          "Parfois, un simple rafraîchissement change tout."
        ]
      }
    ],
    table: [
      ["Consultation", "Discussion sur vos objectifs, votre routine et le résultat souhaité."],
      ["Lavage", "Shampoing, soin et préparation du cuir chevelu."],
      ["Coupe", "Coupe précise pour retirer les dommages et structurer la forme."],
      ["Brushing", "Finition professionnelle pour volume, brillance, mouvement et tenue."]
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
      canonical: `/${locale}/guides/cut-and-blow`,
      languages: {
        en: `/en/guides/cut-and-blow`,
        fr: `/fr/guides/cut-and-blow`
      }
    }
  };
}

export default async function CutAndBlowGuidePage({
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
                className="rounded-xl bg-white px-5 py-3 text-center font-medium text-slate-900 hover:bg-slate-100"
              >
                {t.cta}
              </Link>

              <Link
                href={`/${locale}/explore`}
                className="rounded-xl border border-white/20 px-5 py-3 text-center font-medium text-white hover:bg-white/10"
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

          <div className="mt-14 overflow-hidden rounded-3xl border border-slate-200">
            <div className="bg-slate-50 px-5 py-4">
              <h2 className="text-xl font-semibold">
                {locale === "fr" ? "À quoi s’attendre" : "What to expect"}
              </h2>
            </div>

            <div className="divide-y divide-slate-200">
              {t.table.map(([step, text]) => (
                <div key={step} className="grid gap-2 px-5 py-4 sm:grid-cols-[150px_1fr]">
                  <p className="font-medium text-slate-900">{step}</p>
                  <p className="text-slate-600">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-14 rounded-3xl bg-slate-50 p-6 sm:p-8">
            <h2 className="text-2xl font-semibold tracking-tight">
              {locale === "fr" ? "Prêt pour un vrai refresh ?" : "Ready for a real refresh?"}
            </h2>
            <p className="mt-3 text-slate-600">
              {locale === "fr"
                ? "Comparez les salons, découvrez les services disponibles et réservez facilement depuis Explore."
                : "Compare salons, discover available services, and book easily from Explore."}
            </p>
            <Link
              href={`/${locale}/explore`}
              className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 font-medium text-white hover:bg-slate-800"
            >
              {t.cta}
            </Link>
          </div>
        </article>

        <aside className="h-fit lg:sticky lg:top-10">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold">
              {locale === "fr" ? "Bon à savoir" : "Good to know"}
            </h3>

            <ul className="mt-5 space-y-4 text-sm leading-6 text-slate-600">
              <li>✓ {locale === "fr" ? "Apportez des inspirations" : "Bring inspiration photos"}</li>
              <li>✓ {locale === "fr" ? "Expliquez votre routine quotidienne" : "Explain your daily routine"}</li>
              <li>✓ {locale === "fr" ? "Demandez le niveau d’entretien" : "Ask about maintenance level"}</li>
              <li>✓ {locale === "fr" ? "Réservez avant un événement" : "Book before an event"}</li>
            </ul>

            <Link
              href={`/${locale}/explore`}
              className="mt-6 flex w-full justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800"
            >
              {locale === "fr" ? "Explorer maintenant" : "Explore now"}
            </Link>
          </div>
        </aside>
      </section>
    </main>
  );
}