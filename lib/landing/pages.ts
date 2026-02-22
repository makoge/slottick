// lib/landing/pages.ts
export type Locale = "en" | "fr";

export type LandingPage = {
  slug: string;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  keyword: string;
  sections: Array<{
    heading: Record<Locale, string>;
    body: Record<Locale, string>; // paragraphs separated by blank lines
  }>;
  ctaLabel: Record<Locale, string>;
};

export const LANDING_PAGES: LandingPage[] = [
  {
    slug: "salon-booking-system",
    keyword: "salon booking system",
    title: {
      en: "Salon Booking System That Fills Your Calendar",
      fr: "Système de réservation pour salon qui remplit votre agenda"
    },
    description: {
      en: "Reduce no-shows, automate reminders, and let clients book 24/7 with a modern salon booking system.",
      fr: "Réduisez les absences, automatisez les rappels et laissez vos clients réserver 24/7 avec un système moderne."
    },
    sections: [
      {
        heading: { en: "Why salons need a real system", fr: "Pourquoi les salons ont besoin d’un vrai système" },
        body: {
          en:
            "A salon runs on time, trust, and flow. When bookings get messy, gaps appear, clients wait, and revenue becomes unpredictable.\n\nA modern salon booking system turns scheduling into a clean process clients can complete in seconds.",
          fr:
            "Un salon tourne grâce au temps, à la confiance et à une bonne organisation. Quand les réservations deviennent chaotiques, les trous apparaissent et le chiffre d’affaires devient imprévisible.\n\nUn système moderne transforme la prise de rendez-vous en un parcours simple, en quelques secondes."
        }
      },
      {
        heading: { en: "What to expect from a modern salon booking system", fr: "Ce qu’un système moderne doit offrir" },
        body: {
          en:
            "Real-time availability, instant confirmation, automated reminders, and clear booking rules.\n\nThat’s how you reduce no-shows and keep the team aligned.",
          fr:
            "Disponibilités en temps réel, confirmation immédiate, rappels automatiques et règles claires.\n\nC’est ainsi qu’on réduit les absences et qu’on garde l’équipe alignée."
        }
      }
    ],
    ctaLabel: { en: "Register your business", fr: "Inscrire mon entreprise" }
  },

  {
    slug: "website-booking-system",
    keyword: "website booking system",
    title: {
      en: "Website Booking System That Converts Visitors Into Appointments",
      fr: "Système de réservation sur site web qui convertit en rendez-vous"
    },
    description: {
      en: "Turn website traffic into bookings with real-time availability, fast checkout, and automated confirmation.",
      fr: "Transformez votre trafic en réservations avec des créneaux en temps réel, un parcours rapide et une confirmation automatique."
    },
    sections: [
      {
        heading: { en: "Traffic is useless without action", fr: "Le trafic ne vaut rien sans action" },
        body: {
          en:
            "A website booking system makes your site a sales engine. Clients book the moment they decide.\n\nLess friction = more completed bookings.",
          fr:
            "Un système de réservation sur votre site transforme votre site en moteur de ventes. Les clients réservent au moment où ils décident.\n\nMoins de friction = plus de réservations confirmées."
        }
      },
      {
        heading: { en: "What “premium booking” looks like", fr: "À quoi ressemble une réservation premium" },
        body: {
          en:
            "Mobile-first flow, clear services, instant confirmation, and a single booking link you can share everywhere.\n\nYour website becomes your best salesperson.",
          fr:
            "Un parcours mobile-first, des services clairs, une confirmation immédiate et un lien unique à partager partout.\n\nVotre site devient votre meilleur commercial."
        }
      }
    ],
    ctaLabel: { en: "Register your business", fr: "Inscrire mon entreprise" }
  },

  {
    slug: "booking-platform",
    keyword: "booking platform",
    title: {
      en: "A Booking Platform Built for Service Businesses",
      fr: "Une plateforme de réservation pensée pour les services"
    },
    description: {
      en: "Not just a calendar: rules, reminders, client history, and analytics that help you grow.",
      fr: "Pas juste un calendrier : règles, rappels, historique client et analytics pour grandir."
    },
    sections: [
      {
        heading: { en: "A platform is more than scheduling", fr: "Une plateforme, c’est plus que planifier" },
        body: {
          en:
            "A booking platform protects revenue and improves client experience.\n\nIt standardizes your workflow so growth doesn’t create chaos.",
          fr:
            "Une plateforme protège votre chiffre d’affaires et améliore l’expérience client.\n\nElle standardise votre organisation pour éviter le chaos quand vous grandissez."
        }
      },
      {
        heading: { en: "The features that actually matter", fr: "Les fonctionnalités qui comptent vraiment" },
        body: {
          en:
            "Rules (cancellation windows, deposits), reminders, client management, and analytics.\n\nIf you want scale, you need systems, not spreadsheets.",
          fr:
            "Règles (annulation, acomptes), rappels, gestion client et analytics.\n\nPour scaler, il faut des systèmes, not des tableurs."
        }
      }
    ],
    ctaLabel: { en: "Register your business", fr: "Inscrire mon entreprise" }
  },

  {
    slug: "slot-booking",
    keyword: "slot booking",
    title: {
      en: "Slot Booking Made Simple for Clients and Businesses",
      fr: "Réservation par créneaux, simple pour les clients et pour vous"
    },
    description: {
      en: "Clients choose an available slot instantly with confirmations, reminders, and clean rules.",
      fr: "Les clients choisissent un créneau disponible instantanément avec confirmations, rappels et règles claires."
    },
    sections: [
      {
        heading: { en: "Why slot booking converts", fr: "Pourquoi la réservation par créneaux convertit" },
        body: {
          en:
            "Slot booking removes back-and-forth messages. Clients see only available times and confirm in seconds.\n\nThat speed is what wins bookings.",
          fr:
            "La réservation par créneaux supprime les échanges inutiles. Les clients voient les horaires disponibles et confirment en quelques secondes.\n\nCette vitesse fait la différence."
        }
      },
      {
        heading: { en: "Best for time-based services", fr: "Idéal pour les services au temps" },
        body: {
          en:
            "Salons, barbers, tattoos, massage, clinics, any business where time slots matter.\n\nProtect your day with reminders and clear rules.",
          fr:
            "Salons, barbiers, tatouages, massage, cliniques, tout ce qui fonctionne par créneaux.\n\nProtégez votre planning avec des rappels et des règles claires."
        }
      }
    ],
    ctaLabel: { en: "Register your business", fr: "Inscrire mon entreprise" }
  },

  {
    slug: "booking-management-system",
    keyword: "booking management system",
    title: {
      en: "Booking Management System That Reduces Admin Work",
      fr: "Système de gestion des réservations qui réduit l’administratif"
    },
    description: {
      en: "Manage appointments, reminders, client history, and performance tracking in one place.",
      fr: "Gérez rendez-vous, rappels, historique client et suivi de performance au même endroit."
    },
    sections: [
      {
        heading: { en: "Stop managing bookings manually", fr: "Arrêtez la gestion manuelle" },
        body: {
          en:
            "If you’re spending time managing appointments, you’re losing time delivering service.\n\nA booking management system handles the repetitive work so your business runs smoother.",
          fr:
            "Si vous passez du temps à gérer les rendez-vous, vous perdez du temps sur votre service.\n\nUn système de gestion automatise l’administratif pour une activité plus fluide."
        }
      },
      {
        heading: { en: "The outcome", fr: "Le résultat" },
        body: {
          en:
            "Less admin. Fewer errors. Fewer no-shows. More calm. More revenue.\n\nThat’s what a real system is for.",
          fr:
            "Moins d’administratif. Moins d’erreurs. Moins d’absences. Plus de sérénité. Plus de revenus.\n\nC’est le but d’un vrai système."
        }
      }
    ],
    ctaLabel: { en: "Register your business", fr: "Inscrire mon entreprise" }
  },

  {
    slug: "business-booking-system",
    keyword: "business booking system",
    title: {
      en: "Business Booking System for Teams, Services, and Growth",
      fr: "Système de réservation pour entreprise, équipes, services et croissance"
    },
    description: {
      en: "Centralize staff calendars, set rules, reduce no-shows, and scale with data.",
      fr: "Centralisez les calendriers, fixez des règles, réduisez les absences et scalez avec les données."
    },
    sections: [
      {
        heading: { en: "Think like an operator", fr: "Pensez comme un opérateur" },
        body: {
          en:
            "A business booking system is what you move to when growth starts.\n\nIt keeps policies consistent, calendars clean, and clients confident.",
          fr:
            "Un système de réservation “business” devient essentiel quand la croissance commence.\n\nIl garde les règles cohérentes, les calendriers propres et les clients confiants."
        }
      },
      {
        heading: { en: "Scale with systems + analytics", fr: "Scaler avec des systèmes + analytics" },
        body: {
          en:
            "When you measure bookings and performance, you stop guessing.\n\nThat’s how you grow without burning out.",
          fr:
            "Quand vous mesurez réservations et performance, vous arrêtez de deviner.\n\nC’est comme ça qu’on grandit sans s’épuiser."
        }
      }
    ],
    ctaLabel: { en: "Register your business", fr: "Inscrire mon entreprise" }
  }
];

export function getLandingBySlug(slug: string) {
  return LANDING_PAGES.find((p) => p.slug === slug);
}

export function getLandingPages() {
  return [...LANDING_PAGES];
}