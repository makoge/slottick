import Link from "next/link";
import type { Metadata } from "next";

const SITE_NAME = "Slottick";
type Locale = "en" | "fr";

const copy = {
  en: {
    title: "The Zoomer Perm: The Modern Guide to Fluffy, Textured Hair",
    description:
      "Learn what a zoomer perm is, why it became so popular, how to maintain it, and where to book perm and texture specialists near you.",
    badge: "Hair Trend Guide",
    readTime: "6 min read",
    intro:
      "Voluminous, textured, and effortlessly cool — the zoomer perm has redefined modern men’s hair. It turns flat hair into movement, shape, and that famous fluffy finish.",
    cta: "Explore perm specialists",
    secondaryCta: "Find hair services",
    sections: [
      {
        h: "What is a zoomer perm?",
        p: [
          "A zoomer perm is a chemical texture treatment designed to give straight or flat hair more volume, wave, and movement.",
          "Unlike old-school tight perms, the modern version usually focuses on the top of the head while keeping the sides clean with a taper, fade, or skin fade.",
          "It is often called the broccoli cut, wet mop, or fluffy perm because of its soft, messy, high-volume shape."
        ]
      },
      {
        h: "Why the zoomer perm became so popular",
        p: [
          "The hype is simple: it gives instant texture without daily struggle.",
          "For people with flat or straight hair, a zoomer perm creates height, body, and a more playful shape in one salon appointment.",
          "It also fits the current grooming mood: natural-looking, relaxed, slightly messy, but still intentional."
        ]
      },
      {
        h: "Who is it best for?",
        p: [
          "A zoomer perm is ideal for men with straight, flat, or fine hair who want more volume on top.",
          "It works especially well with fades and tapers because the contrast between tight sides and textured top makes the hairstyle look sharper.",
          "A stylist can adjust the curl pattern from loose S-waves to tighter curls depending on your face shape, hair length, and personal style."
        ]
      },
      {
        h: "How to maintain a zoomer perm",
        p: [
          "Do not wash your hair for the first 48 hours after the perm. This gives the chemical bonds time to fully set.",
          "Use sulfate-free shampoo and curl-friendly products to avoid dryness and frizz.",
          "Style with your hands instead of brushing. Brushing breaks the curl pattern and creates unwanted puffiness.",
          "Sea salt spray or curl cream can help enhance texture while keeping the finish natural."
        ]
      },
      {
        h: "Keep the curls healthy",
        p: [
          "Because a perm uses chemicals, hair health matters.",
          "A weekly deep-conditioning treatment helps keep the curls soft, flexible, and less crunchy.",
          "If your hair has already been bleached, dyed, or damaged, speak with a professional before booking. A good stylist will check your hair condition before applying any chemical treatment."
        ]
      },
      {
        h: "Ready to level up your volume?",
        p: [
          "If you are tired of flat hair and want a style that feels modern, expressive, and low effort, the zoomer perm is worth considering.",
          "Explore texture specialists near you, compare services, and book a consultation before committing to the look."
        ]
      }
    ],
    rules: [
      ["48-hour wait", "Do not wash your hair for 2 days", "Helps the curls set properly"],
      ["Sulfate-free shampoo", "Use curl-friendly shampoo", "Reduces dryness and frizz"],
      ["Scrunch, don’t brush", "Style with your hands", "Protects the curl pattern"],
      ["Sea salt spray", "Mist on damp hair", "Adds texture and matte volume"],
      ["Deep conditioning", "Treat once a week", "Keeps curls soft and healthy"]
    ]
  },
  fr: {
    title: "Le Zoomer Perm : guide moderne des cheveux texturés et volumineux",
    description:
      "Découvrez ce qu’est le zoomer perm, pourquoi il est populaire, comment l’entretenir et où réserver un spécialiste près de chez vous.",
    badge: "Guide tendance cheveux",
    readTime: "6 min de lecture",
    intro:
      "Volumineux, texturé et naturellement cool — le zoomer perm a transformé les coupes homme modernes. Il donne du mouvement, du volume et ce fameux effet fluffy.",
    cta: "Explorer les spécialistes permanente",
    secondaryCta: "Trouver des services coiffure",
    sections: [
      {
        h: "Qu’est-ce qu’un zoomer perm ?",
        p: [
          "Le zoomer perm est un traitement chimique qui ajoute du volume, des ondulations et du mouvement aux cheveux raides ou plats.",
          "Contrairement aux permanentes très serrées du passé, la version moderne se concentre souvent sur le dessus de la tête, avec des côtés courts en taper, fade ou skin fade.",
          "On l’appelle aussi broccoli cut, wet mop ou fluffy perm à cause de sa forme souple, texturée et volumineuse."
        ]
      },
      {
        h: "Pourquoi le zoomer perm est devenu si populaire",
        p: [
          "Son succès est simple : il donne de la texture immédiatement, sans effort quotidien important.",
          "Pour les cheveux plats ou raides, le zoomer perm crée de la hauteur, du corps et une forme plus expressive en un seul rendez-vous.",
          "Il correspond aussi à l’esthétique actuelle : naturel, décontracté, légèrement messy, mais toujours travaillé."
        ]
      },
      {
        h: "À qui convient-il ?",
        p: [
          "Le zoomer perm convient particulièrement aux hommes avec cheveux raides, fins ou plats qui veulent plus de volume sur le dessus.",
          "Il fonctionne très bien avec les fades et tapers, car le contraste entre côtés courts et dessus texturé rend la coupe plus nette.",
          "Un professionnel peut adapter le niveau de boucle : ondulations légères, mouvement souple ou boucles plus marquées."
        ]
      },
      {
        h: "Comment entretenir un zoomer perm",
        p: [
          "Ne lavez pas vos cheveux pendant les 48 premières heures après la permanente. Cela permet aux boucles de bien se fixer.",
          "Utilisez un shampoing sans sulfates et des produits adaptés aux boucles pour éviter sécheresse et frisottis.",
          "Coiffez avec les mains plutôt qu’avec une brosse. Le brossage casse la forme de la boucle.",
          "Un spray au sel marin ou une crème boucle peut aider à définir la texture tout en gardant un rendu naturel."
        ]
      },
      {
        h: "Gardez les boucles en bonne santé",
        p: [
          "Comme la permanente est un traitement chimique, la santé du cheveu est importante.",
          "Un soin profond chaque semaine aide à garder les boucles souples, douces et moins sèches.",
          "Si vos cheveux sont déjà décolorés, colorés ou abîmés, demandez l’avis d’un professionnel avant de réserver."
        ]
      },
      {
        h: "Prêt à booster votre volume ?",
        p: [
          "Si vous en avez assez des cheveux plats et voulez un style moderne, expressif et facile à vivre, le zoomer perm peut être une excellente option.",
          "Explorez les spécialistes près de vous, comparez les services et réservez une consultation avant de vous lancer."
        ]
      }
    ],
    rules: [
      ["Attendre 48h", "Ne pas laver pendant 2 jours", "Permet aux boucles de se fixer"],
      ["Shampoing sans sulfates", "Utiliser des produits adaptés", "Réduit sécheresse et frisottis"],
      ["Scrunch, pas de brosse", "Coiffer avec les mains", "Protège la forme des boucles"],
      ["Spray sel marin", "Appliquer sur cheveux humides", "Ajoute texture et volume mat"],
      ["Soin profond", "Une fois par semaine", "Garde les boucles souples"]
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
      canonical: `/${locale}/guides/zoomer-perm`,
      languages: {
        en: `/en/guides/zoomer-perm`,
        fr: `/fr/guides/zoomer-perm`
      }
    }
  };
}

export default async function ZoomerPermGuidePage({
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
                {locale === "fr" ? "Entretien du zoomer perm" : "Zoomer perm maintenance"}
              </h2>
            </div>

            <div className="divide-y divide-slate-200">
              {t.rules.map(([rule, action, why]) => (
                <div key={rule} className="grid gap-2 px-5 py-4 sm:grid-cols-[150px_1fr_1fr]">
                  <p className="font-medium text-slate-900">{rule}</p>
                  <p className="text-slate-600">{action}</p>
                  <p className="text-sm text-slate-500">{why}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-14 rounded-3xl bg-slate-50 p-6 sm:p-8">
            <h2 className="text-2xl font-semibold tracking-tight">
              {locale === "fr" ? "Trouvez le bon spécialiste" : "Find the right specialist"}
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
              <li>✓ {locale === "fr" ? "Demandez une consultation" : "Ask for a consultation"}</li>
              <li>✓ {locale === "fr" ? "Parlez de l’état de vos cheveux" : "Discuss your hair condition"}</li>
              <li>✓ {locale === "fr" ? "Apportez des photos d’inspiration" : "Bring inspiration photos"}</li>
              <li>✓ {locale === "fr" ? "Prévoyez l’entretien" : "Plan maintenance"}</li>
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