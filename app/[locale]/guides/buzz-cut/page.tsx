import Link from "next/link";
import type { Metadata } from "next";

const SITE_NAME = "Slottick";
type Locale = "en" | "fr";

const copy = {
  en: {
    title: "Finding Your Signature Buzz Cut",
    description:
      "A practical guide to buzz cuts: what they are, which style fits you best, and where to find a barber near you.",
    badge: "Hair Guide",
    readTime: "5 min read",
    intro:
      "There is power in simplicity. A buzz cut is not just short hair — it is a clean, confident style that highlights your face, saves time, and makes a strong statement.",
    cta: "Explore barbers",
    secondaryCta: "Find haircut services",
    sections: [
      {
        h: "What is a buzz cut?",
        p: [
          "A buzz cut is any haircut created mainly with electric clippers. It gets its name from the buzzing sound of the machine.",
          "Unlike layered cuts, the buzz cut focuses on precision, simplicity, and shape. It removes excess and puts your face, jawline, and confidence in focus.",
          "It can be extremely short and bold, or slightly longer and softer depending on your style."
        ]
      },
      {
        h: "Which buzz cut is best for you?",
        p: [
          "The best buzz cut depends on your face shape, head shape, hair density, and how sharp you want the final look to feel.",
          "Oval and rectangular faces can usually wear most buzz cut lengths. Rounder faces often look great with a buzz fade because the tapered sides help create structure.",
          "A professional barber can help you choose the right guard length and fade level before making the cut."
        ]
      },
      {
        h: "Popular buzz cut styles",
        p: [
          "The induction cut is the boldest option — almost bald, clean, and powerful.",
          "The burr cut keeps a little more texture while staying very short.",
          "The butch cut gives a uniform length with a softer finish.",
          "The buzz fade adds modern shape with tapered sides.",
          "The crew cut is the safest version, with short sides and slightly more length on top."
        ]
      },
      {
        h: "Why people choose buzz cuts",
        p: [
          "Buzz cuts save time. Your hair is basically ready the moment you wake up.",
          "They frame your features. Without longer hair distracting the eye, your bone structure and eyes stand out more.",
          "They are also a great reset if your hair is damaged from dyes, heat, or over-styling."
        ]
      },
      {
        h: "Ready to make the move?",
        p: [
          "A buzz cut can feel liberating, stylish, and practical all at once.",
          "Whether you want a simple induction cut or a sharp buzz fade, booking with a professional barber helps you get the cleanest result."
        ]
      }
    ],
    styles: [
      ["Induction cut", "Bold, almost bald look", "High"],
      ["Burr cut", "Ultra-short with soft texture", "Medium"],
      ["Butch cut", "Uniform length with more fuzz", "Low"],
      ["Buzz fade", "Modern taper with sharp sides", "High"],
      ["Crew cut", "Safer short cut with more length on top", "Low"]
    ]
  },
  fr: {
    title: "Trouver votre buzz cut signature",
    description:
      "Un guide pratique du buzz cut : définition, styles, choix selon votre visage et où trouver un barbier près de vous.",
    badge: "Guide coiffure",
    readTime: "5 min de lecture",
    intro:
      "Il y a une vraie puissance dans la simplicité. Le buzz cut n’est pas seulement une coupe très courte — c’est un style net, confiant et fort.",
    cta: "Explorer les barbiers",
    secondaryCta: "Trouver des services coiffure",
    sections: [
      {
        h: "Qu’est-ce qu’un buzz cut ?",
        p: [
          "Un buzz cut est une coupe réalisée principalement à la tondeuse. Son nom vient du bruit de la machine.",
          "Contrairement aux coupes dégradées aux ciseaux, le buzz cut mise sur la précision, la simplicité et la forme.",
          "Il met en valeur le visage, la mâchoire, les yeux et la confiance."
        ]
      },
      {
        h: "Quel buzz cut vous convient le mieux ?",
        p: [
          "Le meilleur buzz cut dépend de la forme du visage, de la densité des cheveux et du niveau d’audace recherché.",
          "Les visages ovales ou rectangulaires peuvent porter presque toutes les longueurs. Les visages plus ronds gagnent souvent en structure avec un buzz fade.",
          "Un barbier professionnel peut vous conseiller sur la bonne longueur et le bon dégradé."
        ]
      },
      {
        h: "Les styles de buzz cut populaires",
        p: [
          "L’induction cut est le plus audacieux : presque rasé, net et puissant.",
          "Le burr cut garde un peu plus de texture tout en restant très court.",
          "Le butch cut offre une longueur uniforme avec un rendu plus doux.",
          "Le buzz fade apporte une touche moderne avec des côtés dégradés.",
          "Le crew cut est l’option la plus sécurisée, avec un peu plus de longueur sur le dessus."
        ]
      },
      {
        h: "Pourquoi choisir un buzz cut ?",
        p: [
          "Le buzz cut fait gagner du temps. Vos cheveux sont prêts dès le réveil.",
          "Il met les traits du visage en valeur, surtout les yeux, les pommettes et la mâchoire.",
          "C’est aussi une excellente façon de repartir à zéro si vos cheveux sont abîmés par les colorations ou la chaleur."
        ]
      },
      {
        h: "Prêt à passer à l’action ?",
        p: [
          "Un buzz cut peut être libérateur, moderne et pratique à la fois.",
          "Que vous vouliez une coupe très courte ou un buzz fade précis, un barbier professionnel vous aidera à obtenir un résultat net."
        ]
      }
    ],
    styles: [
      ["Induction cut", "Look presque rasé et très audacieux", "Élevé"],
      ["Burr cut", "Très court avec un peu de texture", "Moyen"],
      ["Butch cut", "Longueur uniforme et douce", "Faible"],
      ["Buzz fade", "Dégradé moderne et précis", "Élevé"],
      ["Crew cut", "Option plus sécurisée avec longueur sur le dessus", "Faible"]
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
      canonical: `/${locale}/guides/buzz-cut`,
      languages: {
        en: `/en/guides/buzz-cut`,
        fr: `/fr/guides/buzz-cut`
      }
    }
  };
}

export default async function BuzzCutGuidePage({
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
                {locale === "fr" ? "Types de buzz cut" : "Buzz cut styles"}
              </h2>
            </div>

            <div className="divide-y divide-slate-200">
              {t.styles.map(([style, bestFor, maintenance]) => (
                <div key={style} className="grid gap-2 px-5 py-4 sm:grid-cols-[140px_1fr_90px]">
                  <p className="font-medium text-slate-900">{style}</p>
                  <p className="text-slate-600">{bestFor}</p>
                  <p className="text-sm text-slate-500">{maintenance}</p>
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
              <li>✓ {locale === "fr" ? "Choisissez une longueur" : "Choose a length"}</li>
              <li>✓ {locale === "fr" ? "Demandez si un fade convient" : "Ask if a fade suits you"}</li>
              <li>✓ {locale === "fr" ? "Apportez une photo d’inspiration" : "Bring an inspiration photo"}</li>
              <li>✓ {locale === "fr" ? "Planifiez les retouches" : "Plan touch-ups"}</li>
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