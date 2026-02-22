// lib/blog/posts.ts
export type Locale = "en" | "fr";

export type BlogPost = {
  slug: string;
  publishedAt: string; // YYYY-MM-DD
  updatedAt?: string;
  cover?: { title: Record<Locale, string>; subtitle: Record<Locale, string> };
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  tags: string[];
  readingMinutes: number;
  faqs: Array<{
    q: Record<Locale, string>;
    a: Record<Locale, string>;
  }>;
  sections: Array<{
    heading: Record<Locale, string>;
    body: Record<Locale, string>; // markdown-ish (we render as paragraphs)
  }>;
  cta: {
    heading: Record<Locale, string>;
    body: Record<Locale, string>;
    primaryLabel: Record<Locale, string>;
    primaryHref: string;
    secondaryLabel: Record<Locale, string>;
    secondaryHref: string;
  };
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "why-you-need-a-booking-system",
    publishedAt: "2026-02-22",
    title: {
      en: "Why Every Service Business Needs an Online Booking System in 2026",
      fr: "Pourquoi chaque entreprise de services a besoin d’un système de réservation en ligne en 2026"
    },
    description: {
      en: "Stop losing revenue to missed calls, no-shows, and manual scheduling. Here’s why online booking is now a growth requirement.",
      fr: "Arrêtez de perdre du chiffre d’affaires à cause des appels manqués, des absences et de la gestion manuelle. Voici pourquoi la réservation en ligne est devenue indispensable."
    },
    tags: ["booking-system", "online-booking", "growth", "service-business"],
    readingMinutes: 7,
    sections: [
      {
        heading: { en: "Instant booking is the new baseline", fr: "La réservation instantanée est la nouvelle norme" },
        body: {
          en:
            "Modern customers book when it’s convenient for them, not when it’s convenient for you.\n\nIf booking requires a call, a DM, or waiting for confirmation, you’re adding friction and friction kills conversions.\n\nAn online booking system gives clients real-time availability, instant confirmation, and a smooth experience that feels premium.",
          fr:
            "Les clients modernes réservent quand cela les arrange, pas quand cela vous arrange.\n\nSi réserver implique un appel, un message ou une attente de confirmation, vous ajoutez de la friction et la friction réduit les conversions.\n\nUn système de réservation en ligne offre des disponibilités en temps réel, une confirmation immédiate et une expérience fluide et premium."
        }
      },
      {
        heading: { en: "Manual scheduling quietly drains revenue", fr: "La gestion manuelle fait fuir le chiffre d’affaires" },
        body: {
          en:
            "Revenue leaks come from small, repeatable issues: missed calls, double bookings, last-minute cancellations, and no-shows.\n\nA modern booking system reduces these with automated reminders, deposits, and clear booking rules.\n\nThe result isn’t just “organization.” It’s predictable cash flow.",
          fr:
            "Les pertes viennent de petits problèmes répétés : appels manqués, doubles réservations, annulations de dernière minute et absences.\n\nUn système moderne réduit cela grâce aux rappels automatiques, aux acomptes et à des règles de réservation claires.\n\nLe résultat n’est pas seulement “plus d’ordre”. C’est un revenu plus prévisible."
        }
      },
      {
        heading: { en: "24/7 booking = 24/7 sales", fr: "Réservation 24/7 = ventes 24/7" },
        body: {
          en:
            "Your working hours are limited. Your booking page isn’t.\n\nWhen you enable self-serve booking, clients can book after work, on weekends, or during commutes, the exact moments where they actually make decisions.\n\nThat single shift often lifts total bookings without increasing ad spend.",
          fr:
            "Vos horaires sont limités. Votre page de réservation ne l’est pas.\n\nAvec la réservation en libre-service, les clients réservent après le travail, le week-end ou dans les transports, exactement quand ils prennent des décisions.\n\nCe simple changement augmente souvent les réservations sans augmenter le budget pub."
        }
      },
      {
        heading: { en: "Data beats guessing", fr: "Les données valent mieux que les suppositions" },
        body: {
          en:
            "The best operators don’t “feel” what’s working, they measure it.\n\nWith analytics you can spot your most profitable services, your best days, your top clients, and where drop-off happens.\n\nThat’s how you grow without burning out.",
          fr:
            "Les meilleurs pros ne “devinent” pas ce qui marche, ils le mesurent.\n\nAvec l’analytics, vous identifiez vos services les plus rentables, vos meilleurs créneaux, vos meilleurs clients et où ça décroche.\n\nC’est comme ça qu’on grandit sans s’épuiser."
        }
      }
    ],
    faqs: [
      {
        q: { en: "Will online booking reduce phone calls?", fr: "La réservation en ligne réduit-elle les appels ?" },
        a: { en: "Yes, and that’s good. Calls become higher quality: complex questions, upsells, and VIP clients.", fr: "Oui, et c’est positif. Les appels restants sont plus qualitatifs : questions complexes, upsells, clients VIP." }
      },
      {
        q: { en: "Do I need deposits?", fr: "Faut-il des acomptes ?" },
        a: { en: "If no-shows hurt you, deposits are one of the fastest fixes. Even small deposits change behavior.", fr: "Si les absences vous coûtent cher, les acomptes sont l’un des correctifs les plus rapides. Même un petit acompte change le comportement." }
      }
    ],
    cta: {
      heading: { en: "Ready to modernize your bookings?", fr: "Prêt à moderniser vos réservations ?" },
      body: {
        en: "Start with a clean booking flow, reminders, and analytics, then scale from there.",
        fr: "Commencez avec un parcours de réservation fluide, des rappels et des analytics, puis développez à partir de là."
      },
      primaryLabel: { en: "Create an account", fr: "Créer un compte" },
      primaryHref: "/register",
      secondaryLabel: { en: "View pricing", fr: "Voir les tarifs" },
      secondaryHref: "/pricing"
    }
  },

  {
    slug: "manual-booking-mistakes",
    publishedAt: "2026-02-22",
    title: {
      en: "7 Manual Booking Mistakes That Cost Service Businesses Customers",
      fr: "7 erreurs de gestion manuelle des réservations qui font perdre des clients"
    },
    description: {
      en: "The biggest hidden conversion killers: slow replies, double bookings, unclear policies, and more, plus the fixes.",
      fr: "Les pires tueurs de conversion : réponses lentes, doubles réservations, règles floues, et plus, avec les solutions."
    },
    tags: ["no-shows", "operations", "client-experience", "scheduling"],
    readingMinutes: 8,
    sections: [
      {
        heading: { en: "Mistake #1: Slow confirmation", fr: "Erreur n°1 : confirmation lente" },
        body: {
          en:
            "If a client has to wait for a reply, you’re competing with every other provider in their search results.\n\nFast confirmation wins. Real-time availability wins harder.",
          fr:
            "Si un client doit attendre une réponse, vous êtes en concurrence avec tous les autres prestataires.\n\nLa confirmation rapide gagne. Les disponibilités en temps réel gagnent encore plus."
        }
      },
      {
        heading: { en: "Mistake #2: Double bookings and calendar chaos", fr: "Erreur n°2 : doubles réservations et chaos du calendrier" },
        body: {
          en:
            "Manual calendars break the moment you have multiple staff, multiple services, or multiple channels (calls, DMs, walk-ins).\n\nA booking system becomes the single source of truth.",
          fr:
            "Les calendriers manuels craquent dès que vous avez plusieurs employés, plusieurs services ou plusieurs canaux (appels, messages, passage).\n\nUn système devient la source de vérité unique."
        }
      },
      {
        heading: { en: "Mistake #3: No clear policies", fr: "Erreur n°3 : règles floues" },
        body: {
          en:
            "When policies live only in your head, clients assume they can cancel anytime.\n\nModern booking lets you set rules upfront: deposits, cancellation windows, rescheduling limits without awkward conversations.",
          fr:
            "Quand les règles sont seulement dans votre tête, les clients pensent pouvoir annuler à tout moment.\n\nLa réservation moderne impose des règles claires : acompte, délai d’annulation, limites de report sans discussions gênantes."
        }
      },
      {
        heading: { en: "Mistake #4: No-shows with no prevention", fr: "Erreur n°4 : absences sans prévention" },
        body: {
          en:
            "Reminders are not a “nice to have.” They’re a revenue protection feature.\n\nAutomated reminders + deposits = fewer no-shows, better attendance, calmer days.",
          fr:
            "Les rappels ne sont pas un “bonus”. C’est une protection de revenus.\n\nRappels automatiques + acompte = moins d’absences, meilleure ponctualité, journées plus sereines."
        }
      }
    ],
    faqs: [
      {
        q: { en: "What’s the fastest fix for chaos?", fr: "Quel est le correctif le plus rapide contre le chaos ?" },
        a: { en: "One calendar, one booking link, one set of rules. Remove multi-channel scheduling as much as possible.", fr: "Un calendrier, un lien de réservation, un ensemble de règles. Réduisez au maximum la prise de RDV sur plusieurs canaux." }
      }
    ],
    cta: {
      heading: { en: "Turn mistakes into a system", fr: "Transformez les erreurs en système" },
      body: {
        en: "A modern booking flow removes friction for clients and stress for you.",
        fr: "Un parcours de réservation moderne réduit la friction côté client et le stress côté pro."
      },
      primaryLabel: { en: "Start free setup", fr: "Commencer la mise en place" },
      primaryHref: "/register",
      secondaryLabel: { en: "See features", fr: "Voir les fonctionnalités" },
      secondaryHref: "/services/discover"
    }
  },

  {
    slug: "how-booking-systems-increase-revenue",
    publishedAt: "2026-02-22",
    title: {
      en: "How an Online Booking System Increases Revenue (Without More Ads)",
      fr: "Comment un système de réservation augmente le chiffre d’affaires (sans plus de pubs)"
    },
    description: {
      en: "More completed bookings, fewer no-shows, higher upsells, better retention, the real revenue levers.",
      fr: "Plus de réservations confirmées, moins d’absences, plus d’upsell, meilleure rétention, les vrais leviers."
    },
    tags: ["revenue", "conversion", "upsell", "retention"],
    readingMinutes: 9,
    sections: [
      {
        heading: { en: "Revenue lever #1: Convert intent instantly", fr: "Levier n°1 : convertir l’intention immédiatement" },
        body: {
          en:
            "When people want to book, they’re at peak intent. Delay kills intent.\n\nOnline booking captures that intent in seconds, turning “maybe” into “confirmed.”",
          fr:
            "Quand quelqu’un veut réserver, l’intention est au maximum. L’attente la fait baisser.\n\nLa réservation en ligne capte cette intention en quelques secondes."
        }
      },
      {
        heading: { en: "Revenue lever #2: Reduce no-shows", fr: "Levier n°2 : réduire les absences" },
        body: {
          en:
            "No-shows are not random, they’re often uncommitted bookings.\n\nReminders, deposits, and clear policies create commitment and protect your calendar.",
          fr:
            "Les absences ne sont pas “au hasard”, ce sont souvent des réservations sans engagement.\n\nRappels, acomptes et règles claires créent l’engagement et protègent votre planning."
        }
      },
      {
        heading: { en: "Revenue lever #3: Raise average order value", fr: "Levier n°3 : augmenter le panier moyen" },
        body: {
          en:
            "A booking system can nudge upgrades: add-ons, longer sessions, premium options.\n\nThe key is tasteful: suggest relevant add-ons at checkout, not spam.",
          fr:
            "Un système peut proposer des options : extras, durée plus longue, premium.\n\nLa clé : rester subtil et pertinent, pas intrusif."
        }
      },
      {
        heading: { en: "Revenue lever #4: Retention and rebooking", fr: "Levier n°4 : rétention et re-réservation" },
        body: {
          en:
            "The easiest sale is the second one.\n\nAutomated follow-ups, rebooking prompts, and client history improve repeat visits, without you chasing messages.",
          fr:
            "La vente la plus simple est la deuxième.\n\nRelances, incitations à re-réserver et historique client augmentent les retours,sans courir après les messages."
        }
      }
    ],
    faqs: [
      {
        q: { en: "Do I need a big audience to earn more?", fr: "Faut-il une grosse audience pour gagner plus ?" },
        a: { en: "No. Most gains come from better conversion, fewer no-shows, and higher repeat rate.", fr: "Non. Les gains viennent surtout d’une meilleure conversion, moins d’absences et plus de récurrence." }
      }
    ],
    cta: {
      heading: { en: "Get more bookings from the traffic you already have", fr: "Obtenez plus de réservations avec votre trafic actuel" },
      body: { en: "Optimize conversion first. Then scale marketing.", fr: "Optimisez la conversion d’abord. Puis développez le marketing." },
      primaryLabel: { en: "Register now", fr: "S’inscrire" },
      primaryHref: "/register",
      secondaryLabel: { en: "Pricing", fr: "Tarifs" },
      secondaryHref: "/pricing"
    }
  },

  {
    slug: "booking-system-features-2026",
    publishedAt: "2026-02-22",
    title: {
      en: "Must-Have Booking System Features in 2026 (Checklist)",
      fr: "Fonctionnalités indispensables d’un système de réservation en 2026 (checklist)"
    },
    description: {
      en: "A modern checklist for service providers: reminders, deposits, analytics, client CRM, and more.",
      fr: "Checklist moderne : rappels, acomptes, analytics, CRM client, et plus."
    },
    tags: ["features", "checklist", "software", "productivity"],
    readingMinutes: 8,
    sections: [
      {
        heading: { en: "Core booking experience", fr: "Expérience de réservation essentielle" },
        body: {
          en:
            "Real-time availability, simple service selection, fast checkout, and instant confirmation.\n\nIf this isn’t perfect, nothing else matters.",
          fr:
            "Disponibilités en temps réel, choix de service simple, réservation rapide, confirmation immédiate.\n\nSi ce point n’est pas excellent, le reste ne compte pas."
        }
      },
      {
        heading: { en: "No-show protection", fr: "Protection contre les absences" },
        body: {
          en:
            "Automated reminders, deposits, cancellation windows, and reschedule rules.\n\nThese features pay for themselves quickly.",
          fr:
            "Rappels automatiques, acomptes, délai d’annulation et règles de report.\n\nCes fonctions se rentabilisent vite."
        }
      },
      {
        heading: { en: "Operations + growth", fr: "Opérations + croissance" },
        body: {
          en:
            "Analytics dashboard, revenue tracking, customer insights, and repeat booking.\n\nA booking system should help you run the business, not only schedule it.",
          fr:
            "Dashboard analytics, suivi du CA, insights clients et re-réservation.\n\nUn système doit aider à piloter l’activité, pas seulement à planifier."
        }
      }
    ],
    faqs: [
      {
        q: { en: "What’s the most underrated feature?", fr: "La fonctionnalité la plus sous-estimée ?" },
        a: { en: "Rules + automation. They remove 80% of admin work and awkward conversations.", fr: "Les règles + l’automatisation. Elles suppriment 80% de l’administratif et des discussions gênantes." }
      }
    ],
    cta: {
      heading: { en: "Want a system that feels premium?", fr: "Envie d’un système vraiment premium ?" },
      body: { en: "Use a tool built for speed, clarity, and growth.", fr: "Utilisez un outil pensé pour la vitesse, la clarté et la croissance." },
      primaryLabel: { en: "Create account", fr: "Créer un compte" },
      primaryHref: "/register",
      secondaryLabel: { en: "Explore features", fr: "Explorer les fonctionnalités" },
      secondaryHref: "/services/discover"
    }
  },

  {
    slug: "how-to-choose-booking-system",
    publishedAt: "2026-02-22",
    title: {
      en: "How to Choose the Best Booking System for Your Small Business",
      fr: "Comment choisir le meilleur système de réservation pour votre petite entreprise"
    },
    description: {
      en: "A buyer-intent guide: what to compare, what to avoid, and what actually drives results.",
      fr: "Guide d’achat : quoi comparer, quoi éviter, et ce qui donne vraiment des résultats."
    },
    tags: ["comparison", "small-business", "buyers-guide"],
    readingMinutes: 10,
    sections: [
      {
        heading: { en: "Start with your booking reality", fr: "Commencez par votre réalité" },
        body: {
          en:
            "How many services? How many staff? How many locations? Do you need deposits?\n\nChoose tools that match your real workflow — not the fanciest demo.",
          fr:
            "Combien de services ? Combien d’employés ? Plusieurs lieux ? Besoin d’acompte ?\n\nChoisissez un outil aligné avec votre workflow — pas la démo la plus flashy."
        }
      },
      {
        heading: { en: "The 5 things to compare", fr: "Les 5 points à comparer" },
        body: {
          en:
            "1) Booking speed (mobile-first)\n2) Rules + reminders\n3) Payments/deposits\n4) Analytics and client insights\n5) Support and reliability\n\nIf one of these is weak, growth becomes harder.",
          fr:
            "1) Vitesse de réservation (mobile-first)\n2) Règles + rappels\n3) Paiements/acomptes\n4) Analytics et insights clients\n5) Support et fiabilité\n\nSi un point est faible, la croissance devient plus difficile."
        }
      },
      {
        heading: { en: "Avoid these traps", fr: "Évitez ces pièges" },
        body: {
          en:
            "Hidden fees, complicated setup, poor mobile UI, and tools that don’t match your niche.\n\nA booking system should save time from day one.",
          fr:
            "Frais cachés, configuration complexe, mauvaise UI mobile, et outils pas adaptés à votre niche.\n\nUn système doit faire gagner du temps dès le premier jour."
        }
      }
    ],
    faqs: [
      {
        q: { en: "Should I switch if I’m already using something?", fr: "Faut-il changer si j’utilise déjà un outil ?" },
        a: { en: "If it’s costing time, causing no-shows, or blocking growth, switching pays back quickly.", fr: "Si cela vous coûte du temps, génère des absences ou bloque la croissance, changer se rentabilise vite." }
      }
    ],
    cta: {
      heading: { en: "Choose a system that scales with you", fr: "Choisissez un système qui évolue avec vous" },
      body: { en: "Start simple, keep it clean, and grow with data.", fr: "Commencez simple, restez clair, et grandissez avec des données." },
      primaryLabel: { en: "Get started", fr: "Commencer" },
      primaryHref: "/register",
      secondaryLabel: { en: "Explore features", fr: "Explorer les fonctionnalités" },
      secondaryHref: "/services/discover"
      
    }
  },
  {
  slug: "booking-system-for-salons",
  publishedAt: "2026-02-22",
  title: {
    en: "Why Salons Grow Faster With Online Booking",
    fr: "Pourquoi les salons grandissent plus vite avec la réservation en ligne"
  },
  description: {
    en: "Salon-specific reasons: fewer no-shows, better scheduling, and more repeat clients.",
    fr: "Raisons spécifiques aux salons : moins d’absences, meilleure organisation, plus de clients réguliers."
  },
  tags: ["salon", "online-booking", "no-shows"],
  readingMinutes: 6,
  sections: [
    {
      heading: { en: "Salons lose money in the gaps", fr: "Les salons perdent de l’argent dans les “trous”" },
      body: {
        en: "Empty slots happen when scheduling is manual...\n\nOnline booking fills gaps with last-minute availability.",
        fr: "Les créneaux vides arrivent quand la gestion est manuelle...\n\nLa réservation en ligne comble les trous avec des disponibilités de dernière minute."
      }
    }
  ],
  faqs: [],
  cta: {
    heading: { en: "Want more filled slots?", fr: "Envie de remplir plus de créneaux ?" },
    body: { en: "Use Slottick to automate bookings and reminders.", fr: "Utilisez Slottick pour automatiser les réservations et les rappels." },
    primaryLabel: { en: "Create account", fr: "Créer un compte" },
    primaryHref: "/register",
    secondaryLabel: { en: "Explore features", fr: "Explorer les fonctionnalités" },
      secondaryHref: "/services/discover"
    
  }
}
];

export const getPostBySlug = (slug: string) => BLOG_POSTS.find((p) => p.slug === slug);

export const getPosts = () =>
  [...BLOG_POSTS].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));