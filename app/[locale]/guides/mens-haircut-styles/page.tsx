import Link from "next/link";
import type { Metadata } from "next";

const SITE_NAME = "Slottick";
type Locale = "en" | "fr";

const copy = {
  en: {
    title: "Modern Men’s Haircut Styles: Upgrade Your Image",
    description:
      "A practical guide to modern men’s haircut styles, popular fades, face shape tips, and how to find the right barber near you.",
    badge: "Men’s Grooming Guide",
    readTime: "6 min read",
    intro:
      "Your hair is the accessory you wear every single day. The right cut can sharpen your face, upgrade your style, and make you look more intentional instantly.",
    cta: "Explore barbers",
    secondaryCta: "Find haircut services",
    sections: [
      {
        h: "Why your haircut matters",
        p: [
          "A good haircut does more than remove length. It changes your silhouette, frames your face, and influences how polished you look.",
          "Whether you are walking into work, a date, a meeting, or a night out, your haircut speaks before you do.",
          "The goal is not just to follow trends. The goal is to find a style that fits your face, hair texture, lifestyle, and confidence."
        ]
      },
      {
        h: "Popular types of men’s haircut styles",
        p: [
          "Modern men’s haircut styles are no longer just short, medium, or long. They are about shape, texture, contrast, and how much maintenance you want.",
          "The classic quiff gives volume on top with shorter sides. It feels professional, timeless, and slightly elevated.",
          "The French crop is perfect for low-maintenance styling. It usually has a blunt or textured fringe and works well for men who want shape without daily effort.",
          "The pompadour is bold and high-impact. It needs product and styling, but it creates a strong, confident profile.",
          "Long flow works well for men who want a softer, rugged, creative look while keeping natural movement."
        ]
      },
      {
        h: "Popular fade haircuts explained",
        p: [
          "The fade has become the modern standard because it creates clean contrast and sharp structure.",
          "A low fade starts just above the ears and is ideal if you want something subtle and professional.",
          "A mid fade begins around the temple area. It is balanced, modern, and works for most face shapes.",
          "A high fade starts higher near the crown and creates a stronger, more dramatic silhouette.",
          "A skin fade blends down to the scalp for a fresh, sharp, high-contrast finish.",
          "A taper fade keeps the traditional shape but cleans the sideburns and neckline for a neat modern edge."
        ]
      },
      {
        h: "How to choose the right haircut for your face shape",
        p: [
          "If your face is round, tighter sides and more height on top usually help create structure. A high fade, textured crop, or quiff can work well.",
          "If your face is oval, you have more flexibility. Most styles can work, from a crop to a pompadour to longer flow.",
          "If your face is square, clean fades and classic cuts often look strong because they complement the jawline.",
          "If your face is long, avoid too much height on top. A balanced crop, taper, or medium-length style can help keep proportions controlled."
        ]
      },
      {
        h: "Choose based on your real routine",
        p: [
          "The best haircut is the one you can maintain on a normal weekday.",
          "If you do not want to style your hair every morning, avoid cuts that need blow-drying, pomade, or shaping.",
          "If you enjoy grooming, a quiff, pompadour, or styled crop gives you more room to express personality.",
          "Your barber can help you choose a cut that works with your natural growth pattern instead of fighting it."
        ]
      },
      {
        h: "Ready for a change?",
        p: [
          "Do not settle for a haircut that is just okay.",
          "Whether you want a clean fade, a textured crop, a classic quiff, or a complete style reset, the right barber can help you find a look that fits your face and lifestyle.",
          "Explore barbers near you, compare services, and book your next haircut with confidence."
        ]
      }
    ],
    fades: [
      ["Low fade", "Starts just above the ears", "Subtle, professional look"],
      ["Mid fade", "Starts around the temple", "Balanced and modern"],
      ["High fade", "Starts near the crown", "Bold, high-contrast shape"],
      ["Skin fade", "Blends down to the scalp", "Sharp and fresh finish"],
      ["Taper fade", "Sideburns and neckline only", "Classic with clean edges"]
    ]
  },
  fr: {
    title: "Styles de coupe homme modernes : améliorez votre image",
    description:
      "Guide pratique des coupes homme modernes, fades populaires, conseils selon la forme du visage et comment trouver le bon barbier près de chez vous.",
    badge: "Guide grooming homme",
    readTime: "6 min de lecture",
    intro:
      "Vos cheveux sont l’accessoire que vous portez tous les jours. La bonne coupe peut structurer le visage, moderniser votre style et vous donner une allure plus soignée instantanément.",
    cta: "Explorer les barbiers",
    secondaryCta: "Trouver des services coiffure",
    sections: [
      {
        h: "Pourquoi votre coupe compte",
        p: [
          "Une bonne coupe ne sert pas seulement à raccourcir les cheveux. Elle change la silhouette, encadre le visage et influence votre image.",
          "Au travail, en rendez-vous, en soirée ou dans la vie quotidienne, votre coupe parle avant vous.",
          "Le but n’est pas seulement de suivre la tendance. Le but est de trouver une coupe adaptée à votre visage, votre texture, votre routine et votre confiance."
        ]
      },
      {
        h: "Les styles de coupe homme les plus populaires",
        p: [
          "Les coupes homme modernes ne se résument plus à court, moyen ou long. Elles reposent sur la forme, la texture, le contraste et le niveau d’entretien.",
          "Le quiff classique donne du volume sur le dessus avec des côtés plus courts. Il est professionnel, intemporel et élégant.",
          "La French crop est parfaite pour un style facile à entretenir. Elle utilise souvent une frange courte ou texturée.",
          "Le pompadour est plus audacieux. Il demande du produit et du coiffage, mais crée un profil fort.",
          "Le long flow convient à ceux qui veulent une allure plus naturelle, créative et souple."
        ]
      },
      {
        h: "Les fades populaires expliqués",
        p: [
          "Le fade est devenu une référence moderne car il apporte netteté, contraste et structure.",
          "Le low fade commence juste au-dessus des oreilles. Il est subtil et professionnel.",
          "Le mid fade commence vers les tempes. Il est équilibré et convient à beaucoup de visages.",
          "Le high fade commence plus haut et crée une silhouette plus marquée.",
          "Le skin fade descend jusqu’à la peau pour un rendu très net.",
          "Le taper fade nettoie surtout les pattes et la nuque tout en gardant une forme classique."
        ]
      },
      {
        h: "Choisir selon la forme du visage",
        p: [
          "Si votre visage est rond, des côtés courts et plus de hauteur sur le dessus peuvent créer de la structure. Un high fade, une crop texturée ou un quiff peuvent bien fonctionner.",
          "Si votre visage est ovale, vous avez plus de liberté. La plupart des styles peuvent convenir.",
          "Si votre visage est carré, les fades nets et les coupes classiques mettent souvent la mâchoire en valeur.",
          "Si votre visage est long, évitez trop de hauteur sur le dessus. Une coupe équilibrée aide à contrôler les proportions."
        ]
      },
      {
        h: "Choisissez selon votre vraie routine",
        p: [
          "La meilleure coupe est celle que vous pouvez maintenir un mardi matin normal.",
          "Si vous ne voulez pas vous coiffer chaque jour, évitez les styles qui demandent brushing, cire ou pommade.",
          "Si vous aimez prendre le temps de vous coiffer, un quiff, un pompadour ou une crop stylée peut mieux exprimer votre personnalité.",
          "Un bon barbier vous aide à choisir une coupe qui respecte votre implantation naturelle."
        ]
      },
      {
        h: "Prêt à changer de style ?",
        p: [
          "Ne gardez pas une coupe simplement correcte.",
          "Que vous vouliez un fade net, une crop texturée, un quiff classique ou un vrai changement, le bon barbier peut vous aider à choisir.",
          "Explorez les barbiers près de vous, comparez les services et réservez votre prochaine coupe en confiance."
        ]
      }
    ],
    fades: [
      ["Low fade", "Commence juste au-dessus des oreilles", "Subtil et professionnel"],
      ["Mid fade", "Commence vers les tempes", "Équilibré et moderne"],
      ["High fade", "Commence plus haut", "Contraste fort"],
      ["Skin fade", "Dégradé jusqu’à la peau", "Très net et frais"],
      ["Taper fade", "Pattes et nuque seulement", "Classique avec contours propres"]
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
      canonical: `/${locale}/guides/mens-haircut-styles`,
      languages: {
        en: `/en/guides/mens-haircut-styles`,
        fr: `/fr/guides/mens-haircut-styles`
      }
    }
  };
}

export default async function MensHaircutStylesGuidePage({
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
                {locale === "fr" ? "Types de fades populaires" : "Popular fade types"}
              </h2>
            </div>

            <div className="divide-y divide-slate-200">
              {t.fades.map(([fade, starts, best]) => (
                <div key={fade} className="grid gap-2 px-5 py-4 sm:grid-cols-[120px_1fr_1fr]">
                  <p className="font-medium text-slate-900">{fade}</p>
                  <p className="text-slate-600">{starts}</p>
                  <p className="text-sm text-slate-500">{best}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-14 rounded-3xl bg-slate-50 p-6 sm:p-8">
            <h2 className="text-2xl font-semibold tracking-tight">
              {locale === "fr" ? "Trouvez le bon barbier" : "Find the right barber"}
            </h2>
            <p className="mt-3 text-slate-600">
              {locale === "fr"
                ? "Comparez les services, consultez les disponibilités et réservez facilement depuis Explore."
                : "Compare services, check availability, and book easily from Explore."}
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
              {locale === "fr" ? "Avant de réserver" : "Before you book"}
            </h3>

            <ul className="mt-5 space-y-4 text-sm leading-6 text-slate-600">
              <li>✓ {locale === "fr" ? "Connaissez votre routine" : "Know your routine"}</li>
              <li>✓ {locale === "fr" ? "Apportez des photos" : "Bring reference photos"}</li>
              <li>✓ {locale === "fr" ? "Demandez quel fade vous va" : "Ask which fade suits you"}</li>
              <li>✓ {locale === "fr" ? "Parlez de l’entretien" : "Discuss maintenance"}</li>
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