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
  "slug": "salon-booking-system",
  "keyword": "salon booking system",
  "title": {
    "en": "Salon Booking System: Fill Your Calendar, Reduce No-Shows, and Grow Revenue",
    "fr": "Système de réservation pour salon : remplissez votre agenda et augmentez vos revenus"
  },
  "description": {
    "en": "A professional salon booking system helps hair and beauty salons reduce no-shows, automate reminders, manage staff calendars, and allow clients to book 24/7.",
    "fr": "Un système professionnel de réservation pour salon aide les salons de coiffure et beauté à réduire les absences, automatiser les rappels et permettre la réservation 24/7."
  },
  "sections": [
    {
      "heading": {
        "en": "Why salons need a real booking system",
        "fr": "Pourquoi les salons ont besoin d’un véritable système de réservation"
      },
      "body": {
        "en": "A salon runs on time, trust, and smooth flow.\n\nWhen bookings are managed through calls, DMs, or manual notes, gaps appear. Double bookings happen. Clients wait. Staff become stressed.\n\nA professional salon booking system replaces this chaos with structure.\n\nClients choose their service, select an available time slot, and receive instant confirmation. No confusion. No back-and-forth.\n\nStructure creates consistency. Consistency builds reputation.",
        "fr": "Un salon fonctionne grâce au temps, à la confiance et à une organisation fluide.\n\nLorsque les réservations passent par appels ou messages, des erreurs apparaissent. Les doubles réservations augmentent. Les clients attendent.\n\nUn système professionnel remplace ce chaos par une structure claire.\n\nLes clients choisissent un service, sélectionnent un créneau disponible et reçoivent une confirmation immédiate."
      }
    },
    {
      "heading": {
        "en": "24/7 online booking fills empty slots",
        "fr": "La réservation en ligne 24/7 remplit les créneaux vides"
      },
      "body": {
        "en": "Your salon closes at night. Your booking page does not.\n\nMany clients book appointments outside business hours — late evenings, weekends, or during short breaks.\n\nA salon booking system allows clients to reserve anytime.\n\nInstead of missing calls or delayed responses, your website becomes a permanent booking assistant.\n\nMore accessibility means more completed appointments.",
        "fr": "Votre salon ferme le soir. Votre page de réservation reste ouverte.\n\nBeaucoup de clients réservent en dehors des heures d’ouverture.\n\nUn système en ligne permet la réservation à tout moment et augmente le nombre de rendez-vous confirmés."
      }
    },
    {
      "heading": {
        "en": "Reduce no-shows with automated reminders",
        "fr": "Réduisez les absences avec des rappels automatiques"
      },
      "body": {
        "en": "No-shows cost salons significant revenue.\n\nA modern salon booking system sends automatic confirmations and reminders via email or SMS.\n\nYou can also require deposits for high-value services such as color treatments, extensions, or long sessions.\n\nWhen clients commit financially, cancellation rates drop.\n\nPredictable attendance leads to predictable revenue.",
        "fr": "Les absences coûtent cher aux salons.\n\nLes rappels automatiques par email ou SMS réduisent fortement ces pertes.\n\nLes acomptes pour les services premium renforcent l’engagement.\n\nUne meilleure présence signifie un chiffre d’affaires plus stable."
      }
    },
    {
      "heading": {
        "en": "Manage multiple stylists and services",
        "fr": "Gérez plusieurs stylistes et services"
      },
      "body": {
        "en": "As your salon grows, managing individual staff schedules becomes complex.\n\nA salon booking system allows each stylist to have personalized availability, service durations, and pricing.\n\nManagers gain visibility across all calendars in one dashboard.\n\nThis prevents overlaps, improves coordination, and increases team efficiency.\n\nOperational clarity strengthens salon performance.",
        "fr": "Lorsque le salon grandit, gérer plusieurs agendas devient complexe.\n\nUn système moderne centralise les calendriers et permet une gestion claire des disponibilités.\n\nCela améliore la coordination et l’efficacité de l’équipe."
      }
    },
    {
      "heading": {
        "en": "Integrated payments and deposits",
        "fr": "Paiements et acomptes intégrés"
      },
      "body": {
        "en": "A complete salon booking system integrates secure payment processing.\n\nClients can pay deposits or full amounts during booking.\n\nThis reduces last-minute cancellations and improves cash flow.\n\nIntegrated payments also simplify accounting and eliminate manual tracking.\n\nYour booking system becomes a revenue engine, not just a scheduler.",
        "fr": "Un système complet intègre les paiements sécurisés.\n\nLes acomptes réduisent les annulations de dernière minute et améliorent la trésorerie.\n\nLa gestion financière devient plus simple et structurée."
      }
    },
    {
      "heading": {
        "en": "Client history and retention tools",
        "fr": "Historique client et fidélisation"
      },
      "body": {
        "en": "A salon booking system stores client history, past services, preferences, and notes.\n\nThis allows stylists to personalize experiences and recommend relevant services.\n\nAutomated follow-ups and rebooking reminders increase repeat visits.\n\nRetention drives long-term growth more efficiently than constant new client acquisition.",
        "fr": "Un système conserve l’historique client et les préférences.\n\nCela permet une expérience personnalisée et favorise la fidélisation.\n\nLa fidélité est le moteur principal d’une croissance durable."
      }
    },
    {
      "heading": {
        "en": "The result: a salon that runs smoother and grows faster",
        "fr": "Le résultat : un salon plus fluide et plus rentable"
      },
      "body": {
        "en": "With a modern salon booking system, you gain:\n\n• Fewer scheduling errors\n• Reduced no-shows\n• Better staff coordination\n• Higher booking completion rates\n• More predictable monthly revenue\n\nInstead of spending time managing appointments, you focus on delivering exceptional service.\n\nWhen systems are strong, growth becomes sustainable.",
        "fr": "Avec un système moderne, vous obtenez :\n\n• Moins d’erreurs\n• Moins d’absences\n• Une meilleure coordination\n• Plus de réservations confirmées\n• Des revenus plus prévisibles\n\nVous vous concentrez sur le service plutôt que sur l’administratif."
      }
    }
  ],
  "ctaLabel": {
    "en": "Register your salon",
    "fr": "Inscrire mon salon"
  }
},

  {
  "slug": "website-booking-system",
  "keyword": "website booking system",
  "title": {
    "en": "Website Booking System That Converts Website Visitors Into Confirmed Appointments",
    "fr": "Système de réservation sur site web qui transforme les visiteurs en rendez-vous confirmés"
  },
  "description": {
    "en": "A powerful website booking system turns traffic into revenue with real-time availability, mobile-first booking flow, secure payments, and automated confirmations.",
    "fr": "Un système de réservation performant transforme le trafic en chiffre d’affaires grâce aux disponibilités en temps réel, un parcours mobile optimisé et des confirmations automatiques."
  },
  "sections": [
    {
      "heading": {
        "en": "Traffic is useless without action",
        "fr": "Le trafic ne vaut rien sans action"
      },
      "body": {
        "en": "You can invest in SEO, ads, or social media, but without a website booking system, visitors leave without converting.\n\nWhen someone lands on your website, they are already interested. That moment of intent is short.\n\nIf booking requires calling, messaging, or waiting for confirmation, friction increases and conversions drop.\n\nA website booking system captures intent instantly. Visitors choose a time slot, confirm, and receive automatic confirmation in seconds.\n\nLess friction equals more completed bookings.",
        "fr": "Vous pouvez investir dans le SEO ou la publicité, mais sans système de réservation, les visiteurs repartent.\n\nQuand quelqu’un arrive sur votre site, l’intention est déjà présente.\n\nSi réserver nécessite un appel ou une attente, la friction augmente et la conversion baisse.\n\nUn système intégré capte cette intention immédiatement."
      }
    },
    {
      "heading": {
        "en": "Real-time availability builds confidence",
        "fr": "Les disponibilités en temps réel renforcent la confiance"
      },
      "body": {
        "en": "A website booking system displays only available time slots.\n\nClients do not need to ask if a time is free. They see it clearly.\n\nThis transparency removes uncertainty and builds trust.\n\nReal-time availability also prevents double bookings and manual corrections, protecting both your schedule and your reputation.",
        "fr": "Un système affiche uniquement les créneaux disponibles.\n\nLes clients n’ont pas besoin de demander.\n\nCette transparence renforce la confiance et évite les doubles réservations."
      }
    },
    {
      "heading": {
        "en": "Mobile-first booking flow is essential",
        "fr": "Un parcours mobile-first est indispensable"
      },
      "body": {
        "en": "Most visitors access websites from their phones.\n\nA modern website booking system must be fast, responsive, and simple on mobile devices.\n\nClear service selection, transparent pricing, and a short checkout flow dramatically improve conversion rates.\n\nIf booking is complicated on mobile, you lose sales before they start.",
        "fr": "La majorité des visiteurs consultent votre site depuis leur téléphone.\n\nUn système moderne doit être rapide et simple sur mobile.\n\nUn parcours court et clair améliore fortement les conversions."
      }
    },
    {
      "heading": {
        "en": "Integrated payments increase commitment",
        "fr": "Les paiements intégrés renforcent l’engagement"
      },
      "body": {
        "en": "A complete website booking system allows deposits or full payments during checkout.\n\nWhen clients commit financially, no-show rates decrease.\n\nSecure payment processing also simplifies accounting and improves cash flow predictability.\n\nFinancial integration turns your website into a true sales platform.",
        "fr": "Un système complet permet de collecter un acompte ou un paiement complet.\n\nL’engagement financier réduit les absences.\n\nLes paiements sécurisés simplifient la gestion."
      }
    },
    {
      "heading": {
        "en": "Automated confirmations and reminders",
        "fr": "Confirmations et rappels automatiques"
      },
      "body": {
        "en": "After booking, clients receive instant confirmation.\n\nAutomated reminders reduce no-shows and eliminate manual follow-up.\n\nYour website does not just generate appointments — it manages them.\n\nAutomation creates consistency without additional effort.",
        "fr": "Après réservation, les clients reçoivent une confirmation immédiate.\n\nLes rappels automatiques réduisent les absences.\n\nVotre site gère les rendez-vous sans effort supplémentaire."
      }
    },
    {
      "heading": {
        "en": "One booking link everywhere",
        "fr": "Un lien de réservation unique partout"
      },
      "body": {
        "en": "Your website booking system provides one clean booking link.\n\nYou can share it in your Instagram bio, Google Business profile, emails, and advertisements.\n\nEvery channel drives traffic back to the same structured booking experience.\n\nConsistency increases trust and improves conversion performance.",
        "fr": "Votre système fournit un lien unique à partager partout : Instagram, Google, emails.\n\nTous les canaux redirigent vers la même expérience structurée."
      }
    },
    {
      "heading": {
        "en": "Analytics turn your website into a growth engine",
        "fr": "Les analytics transforment votre site en moteur de croissance"
      },
      "body": {
        "en": "A professional website booking system provides data on conversion rates, booking volume, peak hours, and service performance.\n\nWith this information, you can optimize pricing, adjust service offerings, and improve marketing strategy.\n\nYour website becomes more than a digital brochure. It becomes a measurable revenue channel.\n\nData-driven decisions accelerate growth.",
        "fr": "Un système professionnel fournit des données sur les conversions et la performance.\n\nVotre site devient un canal de revenus mesurable."
      }
    },
    {
      "heading": {
        "en": "The outcome: more bookings from the same traffic",
        "fr": "Le résultat : plus de réservations avec le même trafic"
      },
      "body": {
        "en": "A website booking system maximizes the value of every visitor.\n\nHigher conversion rates.\nFewer abandoned inquiries.\nReduced no-shows.\nMore predictable revenue.\n\nInstead of constantly chasing more traffic, you convert the traffic you already have.\n\nThat is how modern service businesses grow efficiently.",
        "fr": "Un système de réservation maximise chaque visite.\n\nPlus de conversions.\nMoins d’abandons.\nRevenus plus prévisibles.\n\nVous optimisez le trafic existant plutôt que d’en chercher toujours plus."
      }
    }
  ],
  "ctaLabel": {
    "en": "Register your business",
    "fr": "Inscrire mon entreprise"
  }
},

  {
  "slug": "booking-platform",
  "keyword": "booking platform",
  "title": {
    "en": "Booking Platform for Service Businesses: Appointments, Payments, and Growth in One System",
    "fr": "Plateforme de réservation pour entreprises de services : rendez-vous, paiements et croissance dans un seul système"
  },
  "description": {
    "en": "A modern booking platform centralizes scheduling, payments, reminders, client management, and analytics to help service businesses grow without chaos.",
    "fr": "Une plateforme de réservation moderne centralise planning, paiements, rappels, gestion client et analytics pour permettre aux entreprises de services de grandir sans chaos."
  },
  "sections": [
    {
      "heading": {
        "en": "A booking platform is more than a calendar",
        "fr": "Une plateforme de réservation est plus qu’un simple calendrier"
      },
      "body": {
        "en": "A basic calendar only shows availability. A true booking platform manages your entire appointment workflow.\n\nIt handles scheduling, confirmations, reminders, payments, policies, and performance tracking in one structured system.\n\nAs your business grows, disconnected tools create friction. A unified platform eliminates fragmentation and keeps operations consistent.\n\nGrowth requires structure. Structure requires a platform.",
        "fr": "Un simple calendrier montre des disponibilités. Une vraie plateforme gère tout le parcours de réservation.\n\nElle centralise planning, confirmations, paiements et suivi de performance.\n\nQuand l’entreprise grandit, les outils dispersés créent de la friction. Une plateforme unifiée apporte cohérence et efficacité."
      }
    },
    {
      "heading": {
        "en": "Designed for service-based businesses",
        "fr": "Conçue pour les entreprises de services"
      },
      "body": {
        "en": "Service businesses operate on time.\n\nSalons, barbers, massage therapists, consultants, clinics, trainers, and studios all rely on structured appointments.\n\nA booking platform tailored for service providers allows you to define service durations, buffer times, staff assignments, and booking rules.\n\nThis ensures consistency and prevents scheduling conflicts as volume increases.",
        "fr": "Les entreprises de services fonctionnent au temps.\n\nSalons, thérapeutes, coachs ou cliniques dépendent de créneaux structurés.\n\nUne plateforme adaptée permet de définir durées, pauses et règles de réservation."
      }
    },
    {
      "heading": {
        "en": "Standardized rules protect your revenue",
        "fr": "Des règles standardisées protègent vos revenus"
      },
      "body": {
        "en": "A booking platform enforces cancellation policies, deposits, and rescheduling limits automatically.\n\nInstead of manually negotiating with clients, your system applies rules consistently.\n\nThis protects revenue, reduces disputes, and builds a more professional brand image.\n\nConsistency builds trust.",
        "fr": "Une plateforme applique automatiquement les règles d’annulation et les acomptes.\n\nCela protège vos revenus et renforce votre image professionnelle."
      }
    },
    {
      "heading": {
        "en": "Automation reduces administrative work",
        "fr": "L’automatisation réduit l’administratif"
      },
      "body": {
        "en": "Manual confirmations and reminders consume valuable time.\n\nA modern booking platform automates confirmations, reminders, follow-ups, and rebooking prompts.\n\nThis reduces no-shows and eliminates repetitive tasks.\n\nLess administrative work means more time focused on delivering exceptional service.",
        "fr": "Les confirmations manuelles prennent du temps.\n\nUne plateforme moderne automatise rappels et relances.\n\nMoins d’administratif signifie plus de temps pour vos clients."
      }
    },
    {
      "heading": {
        "en": "Integrated payments and deposits",
        "fr": "Paiements et acomptes intégrés"
      },
      "body": {
        "en": "A complete booking platform integrates online payments and deposits directly into the booking flow.\n\nClients can pay securely at checkout, reducing cancellations and improving cash flow predictability.\n\nIntegrated payments simplify accounting and eliminate manual tracking.\n\nFinancial clarity supports sustainable growth.",
        "fr": "Une plateforme complète intègre les paiements et acomptes directement dans le parcours de réservation.\n\nCela réduit les annulations et simplifie la gestion financière."
      }
    },
    {
      "heading": {
        "en": "Client management and retention tools",
        "fr": "Gestion client et fidélisation"
      },
      "body": {
        "en": "A booking platform stores client profiles, service history, and preferences.\n\nWith this data, you can personalize services, encourage repeat bookings, and increase customer lifetime value.\n\nRetention is often more profitable than constant new acquisition.\n\nA strong platform supports long-term relationships.",
        "fr": "Une plateforme conserve l’historique client et les préférences.\n\nCela favorise la personnalisation et la fidélisation.\n\nLa rétention est plus rentable que l’acquisition constante."
      }
    },
    {
      "heading": {
        "en": "Analytics that drive smarter decisions",
        "fr": "Des analytics pour des décisions plus intelligentes"
      },
      "body": {
        "en": "A professional booking platform provides insights into booking volume, revenue trends, staff performance, peak hours, and repeat rates.\n\nThese metrics allow you to optimize pricing, staffing, and marketing strategies.\n\nData-driven decisions reduce risk and accelerate growth.\n\nWithout analytics, growth remains guesswork.",
        "fr": "Une plateforme professionnelle fournit des données sur les réservations et les revenus.\n\nCes indicateurs permettent d’optimiser la stratégie et d’accélérer la croissance."
      }
    },
    {
      "heading": {
        "en": "The outcome: structure, scalability, and calm",
        "fr": "Le résultat : structure, scalabilité et sérénité"
      },
      "body": {
        "en": "A booking platform does not just manage appointments. It upgrades how your business operates.\n\nFewer errors.\nFewer no-shows.\nLess manual coordination.\nMore predictable revenue.\n\nWhen operations are structured, growth becomes sustainable instead of chaotic.\n\nSystems create stability. Stability enables scale.",
        "fr": "Une plateforme ne gère pas seulement des rendez-vous.\n\nElle transforme l’organisation.\n\nMoins d’erreurs. Moins d’absences. Revenus plus prévisibles.\n\nLa structure rend la croissance durable."
      }
    }
  ],
  "ctaLabel": {
    "en": "Register your business",
    "fr": "Inscrire mon entreprise"
  }
},

  {
  "slug": "slot-booking",
  "keyword": "slot booking",
  "title": {
    "en": "Slot Booking System: Simple, Fast, and Efficient Time Slot Management",
    "fr": "Système de réservation par créneaux : simple, rapide et efficace"
  },
  "description": {
    "en": "A modern slot booking system allows clients to instantly choose available time slots while businesses automate confirmations, reminders, and scheduling rules.",
    "fr": "Un système moderne de réservation par créneaux permet aux clients de choisir instantanément un horaire disponible tout en automatisant confirmations et rappels."
  },
  "sections": [
    {
      "heading": {
        "en": "Why slot booking increases conversions",
        "fr": "Pourquoi la réservation par créneaux augmente les conversions"
      },
      "body": {
        "en": "Slot booking removes the back-and-forth that slows down decisions.\n\nInstead of asking, waiting, and confirming manually, clients see only available time slots in real time and confirm instantly.\n\nThis immediate clarity increases booking completion rates. When clients can choose a specific time in seconds, hesitation disappears.\n\nSpeed and simplicity directly impact revenue.",
        "fr": "La réservation par créneaux supprime les échanges inutiles qui ralentissent la décision.\n\nLes clients voient les créneaux disponibles en temps réel et confirment immédiatement.\n\nCette clarté augmente fortement le taux de réservation."
      }
    },
    {
      "heading": {
        "en": "Perfect for time-based businesses",
        "fr": "Idéal pour les entreprises basées sur le temps"
      },
      "body": {
        "en": "Slot booking works best for businesses where time equals inventory.\n\nHair salons, barbers, tattoo studios, massage therapists, clinics, consultants, and fitness trainers all rely on structured time slots.\n\nA professional slot booking system ensures each appointment has a defined duration, optional buffer time, and availability rules.\n\nThis prevents overlaps and protects the quality of service.",
        "fr": "La réservation par créneaux est idéale lorsque le temps est votre ressource principale.\n\nSalons, barbiers, tatoueurs, thérapeutes, cliniques, coachs… tous fonctionnent par créneaux horaires.\n\nUn système structuré évite les chevauchements et protège la qualité du service."
      }
    },
    {
      "heading": {
        "en": "Real-time availability builds trust",
        "fr": "Les disponibilités en temps réel renforcent la confiance"
      },
      "body": {
        "en": "Clients want certainty.\n\nWhen they see available slots clearly displayed, confidence increases. There is no uncertainty about whether a time is truly free.\n\nReal-time availability prevents double bookings and reduces manual corrections.\n\nTransparency creates professionalism.",
        "fr": "Les clients recherchent la certitude.\n\nLes disponibilités en temps réel évitent les doubles réservations et renforcent la confiance."
      }
    },
    {
      "heading": {
        "en": "Automated confirmations and reminders",
        "fr": "Confirmations et rappels automatiques"
      },
      "body": {
        "en": "Slot booking systems automatically send confirmations and reminders.\n\nThis reduces no-shows and eliminates the need for manual follow-ups.\n\nCombined with cancellation rules and optional deposits, attendance rates improve significantly.\n\nAutomation protects your day before problems appear.",
        "fr": "Les systèmes modernes envoient des confirmations et rappels automatiques.\n\nCela réduit les absences et protège votre planning."
      }
    },
    {
      "heading": {
        "en": "Clean scheduling rules protect your time",
        "fr": "Des règles claires protègent votre temps"
      },
      "body": {
        "en": "A slot booking system allows you to define:\n\n• Working hours\n• Break times\n• Service durations\n• Buffer intervals\n• Cancellation windows\n\nThese rules ensure your schedule stays organized even as booking volume grows.\n\nStructure reduces stress and increases operational efficiency.",
        "fr": "Un système par créneaux permet de définir horaires, pauses et durées de service.\n\nCes règles garantissent un planning organisé même en période de forte demande."
      }
    },
    {
      "heading": {
        "en": "Scalable slot booking for growing teams",
        "fr": "Réservation par créneaux pour équipes en croissance"
      },
      "body": {
        "en": "As businesses grow, managing slots across multiple staff members becomes complex.\n\nA modern slot booking system supports multiple calendars and service providers under one dashboard.\n\nManagers gain visibility into availability and performance without manual coordination.\n\nScalability starts with structured scheduling.",
        "fr": "Quand l’entreprise grandit, gérer plusieurs calendriers devient complexe.\n\nUn système moderne centralise la gestion et facilite la coordination."
      }
    },
    {
      "heading": {
        "en": "The outcome: more bookings, less chaos",
        "fr": "Le résultat : plus de réservations, moins de chaos"
      },
      "body": {
        "en": "Slot booking delivers predictable structure.\n\nLess messaging.\nFewer scheduling errors.\nReduced no-shows.\nHigher booking completion rates.\n\nInstead of spending time coordinating appointments, you focus on delivering exceptional service.\n\nEfficiency becomes your competitive advantage.",
        "fr": "La réservation par créneaux apporte structure et efficacité.\n\nMoins d’échanges.\nMoins d’erreurs.\nPlus de sérénité.\n\nVous vous concentrez sur le service plutôt que sur la coordination."
      }
    }
  ],
  "ctaLabel": {
    "en": "Register your business",
    "fr": "Inscrire mon entreprise"
  }
},

  {
  "slug": "booking-management-system",
  "keyword": "booking management system",
  "title": {
    "en": "Booking Management System: Automate Appointments, Reduce Admin, and Scale Smarter",
    "fr": "Système de gestion des réservations : automatisez les rendez-vous et réduisez l’administratif"
  },
  "description": {
    "en": "A complete booking management system centralizes appointments, reminders, payments, client records, and performance tracking to reduce admin work and increase revenue.",
    "fr": "Un système complet de gestion des réservations centralise rendez-vous, rappels, paiements et données clients pour réduire l’administratif et augmenter les revenus."
  },
  "sections": [
    {
      "heading": {
        "en": "Stop managing bookings manually",
        "fr": "Arrêtez la gestion manuelle des rendez-vous"
      },
      "body": {
        "en": "Manual scheduling looks manageable at first. Then bookings increase. Messages multiply. Errors appear.\n\nPhone calls, social media DMs, spreadsheets, and paper calendars quickly turn into operational friction.\n\nA professional booking management system removes this friction. It centralizes all appointments in one place and automates repetitive tasks.\n\nInstead of reacting to scheduling problems, you operate with structure and clarity.",
        "fr": "La gestion manuelle semble simple au début. Puis les réservations augmentent. Les messages se multiplient. Les erreurs apparaissent.\n\nAppels, messages, tableurs… tout devient friction.\n\nUn système professionnel centralise les rendez-vous et automatise les tâches répétitives."
      }
    },
    {
      "heading": {
        "en": "Centralized control for appointments and calendars",
        "fr": "Contrôle centralisé des calendriers"
      },
      "body": {
        "en": "A modern booking management system allows you to manage multiple calendars, services, and team members from one dashboard.\n\nYou can define service duration, buffer times, staff availability, and booking rules.\n\nThis prevents double bookings, scheduling conflicts, and costly mistakes.\n\nOperational clarity reduces stress across the entire team.",
        "fr": "Un système moderne permet de gérer plusieurs calendriers et employés depuis un tableau de bord unique.\n\nVous définissez durées, pauses et règles de réservation.\n\nCela évite les doubles réservations et réduit les erreurs."
      }
    },
    {
      "heading": {
        "en": "Automated reminders reduce no-shows",
        "fr": "Rappels automatiques et réduction des absences"
      },
      "body": {
        "en": "No-shows directly impact revenue.\n\nA booking management system sends automatic confirmations and reminders via email or SMS.\n\nWhen combined with clear cancellation policies and optional deposits, attendance rates improve significantly.\n\nAutomation protects your calendar without requiring manual follow-up.",
        "fr": "Les absences impactent directement le chiffre d’affaires.\n\nLes rappels automatiques améliorent fortement la présence.\n\nCombinés à des règles claires, ils protègent votre planning."
      }
    },
    {
      "heading": {
        "en": "Client records and booking history",
        "fr": "Historique client et suivi des réservations"
      },
      "body": {
        "en": "A booking management system stores client profiles, service history, notes, and preferences.\n\nThis allows you to personalize services, improve retention, and increase average order value.\n\nWhen you understand client behavior, you can recommend relevant services and encourage repeat bookings.\n\nRetention drives long-term profitability.",
        "fr": "Un système conserve l’historique client et les préférences.\n\nCela permet une expérience personnalisée et améliore la fidélisation.\n\nLa rétention est la base d’une croissance durable."
      }
    },
    {
      "heading": {
        "en": "Integrated payments and deposits",
        "fr": "Paiements intégrés et acomptes"
      },
      "body": {
        "en": "Managing payments separately from bookings creates unnecessary complexity.\n\nA complete booking management system integrates payment collection, deposits, and cancellation fees.\n\nThis simplifies accounting and ensures financial consistency.\n\nSecure payment integration builds client trust and reduces administrative effort.",
        "fr": "Séparer paiements et réservations complique inutilement la gestion.\n\nUn système complet intègre acomptes et frais d’annulation.\n\nCela simplifie la comptabilité et renforce la confiance."
      }
    },
    {
      "heading": {
        "en": "Performance tracking and business insights",
        "fr": "Suivi de performance et données stratégiques"
      },
      "body": {
        "en": "Without data, management decisions rely on guesswork.\n\nA booking management system provides insights into revenue trends, booking volume, peak hours, staff performance, and client retention rates.\n\nThese insights allow you to optimize pricing, staffing, and marketing efforts.\n\nData transforms operations into strategy.",
        "fr": "Sans données, les décisions reposent sur l’intuition.\n\nUn système fournit des indicateurs clairs sur les revenus et la performance.\n\nLes décisions deviennent stratégiques."
      }
    },
    {
      "heading": {
        "en": "Scalable foundation for growing businesses",
        "fr": "Fondation scalable pour les entreprises en croissance"
      },
      "body": {
        "en": "As your business expands, manual systems become bottlenecks.\n\nA booking management system supports growth by maintaining consistency across staff, locations, and services.\n\nWith standardized rules, automated workflows, and centralized reporting, scaling becomes structured instead of chaotic.\n\nSystems create sustainable growth.",
        "fr": "Quand l’entreprise grandit, les méthodes manuelles deviennent des freins.\n\nUn système structuré permet de scaler avec cohérence et efficacité."
      }
    },
    {
      "heading": {
        "en": "The real outcome",
        "fr": "Le véritable résultat"
      },
      "body": {
        "en": "Less administrative work.\nFewer scheduling errors.\nReduced no-shows.\nHigher client retention.\nMore predictable revenue.\n\nA true booking management system does not just organize appointments. It upgrades how your business operates.\n\nCalm replaces chaos. Strategy replaces stress.",
        "fr": "Moins d’administratif.\nMoins d’erreurs.\nMoins d’absences.\nPlus de fidélisation.\nRevenus plus prévisibles.\n\nUn vrai système transforme la manière dont votre entreprise fonctionne."
      }
    }
  ],
  "ctaLabel": {
    "en": "Register your business",
    "fr": "Inscrire mon entreprise"
  }
},

  {
  "slug": "business-booking-system",
  "keyword": "business booking system",
  "title": {
    "en": "Business Booking System: The Complete Solution for Teams, Services, and Scalable Growth",
    "fr": "Système de réservation pour entreprise : solution complète pour équipes, services et croissance durable"
  },
  "description": {
    "en": "A powerful business booking system centralizes team calendars, automates rules, reduces no-shows, increases revenue, and gives you the data needed to scale confidently.",
    "fr": "Un système de réservation professionnel centralise les calendriers, automatise les règles, réduit les absences, augmente les revenus et fournit les données nécessaires pour grandir sereinement."
  },
  "sections": [
    {
      "heading": {
        "en": "When your business outgrows manual scheduling",
        "fr": "Quand votre entreprise dépasse la gestion manuelle"
      },
      "body": {
        "en": "A basic calendar works when you are solo. It breaks the moment you add staff, multiple services, or multiple locations.\n\nManual scheduling creates inconsistencies. Policies vary. Double bookings happen. Staff miscommunication increases.\n\nA business booking system replaces chaos with structure. It centralizes calendars, standardizes rules, and ensures every client interaction follows the same professional workflow.\n\nGrowth demands systems. Not more messages. Not more spreadsheets.",
        "fr": "Un simple agenda fonctionne en solo. Il se casse dès que vous ajoutez du personnel, plusieurs services ou plusieurs lieux.\n\nLa gestion manuelle crée des incohérences. Les règles changent. Les doubles réservations apparaissent.\n\nUn système professionnel centralise les calendriers et standardise les règles.\n\nLa croissance exige des systèmes, pas plus de messages ou de fichiers Excel."
      }
    },
    {
      "heading": {
        "en": "Centralized calendars for teams and departments",
        "fr": "Calendriers centralisés pour équipes et départements"
      },
      "body": {
        "en": "A true business booking platform allows each staff member to have individual availability, services, and pricing.\n\nManagers can monitor performance, assign appointments, and prevent overlaps.\n\nWhen calendars are unified, decision-making becomes easier. You can identify underutilized time, optimize staffing, and increase overall capacity without increasing costs.\n\nClarity inside the business creates confidence outside the business.",
        "fr": "Une plateforme professionnelle permet à chaque employé d’avoir ses propres disponibilités et services.\n\nLes responsables peuvent suivre la performance et éviter les conflits de planning.\n\nLorsque les calendriers sont unifiés, l’optimisation devient naturelle."
      }
    },
    {
      "heading": {
        "en": "Standardized policies protect revenue",
        "fr": "Des règles standardisées protègent vos revenus"
      },
      "body": {
        "en": "In growing businesses, inconsistency is expensive.\n\nA business booking system enforces cancellation windows, deposits, and rescheduling rules automatically.\n\nInstead of staff negotiating policies manually, the system applies them fairly and consistently.\n\nThis protects revenue, reduces disputes, and builds a more professional brand image.",
        "fr": "Dans une entreprise en croissance, l’incohérence coûte cher.\n\nUn système applique automatiquement les règles d’annulation et les acomptes.\n\nCela protège les revenus et renforce l’image professionnelle."
      }
    },
    {
      "heading": {
        "en": "Automation reduces operational pressure",
        "fr": "L’automatisation réduit la pression opérationnelle"
      },
      "body": {
        "en": "As booking volume increases, manual confirmation and reminders become unsustainable.\n\nAutomation handles confirmations, reminders, follow-ups, and rebooking prompts.\n\nThis reduces administrative workload, improves attendance rates, and allows your team to focus on service delivery.\n\nEfficiency compounds over time.",
        "fr": "Quand le volume augmente, la gestion manuelle devient impossible.\n\nLes confirmations et rappels automatiques réduisent la charge administrative.\n\nL’efficacité augmente avec le temps."
      }
    },
    {
      "heading": {
        "en": "Data transforms management decisions",
        "fr": "Les données transforment les décisions stratégiques"
      },
      "body": {
        "en": "Without analytics, growth feels uncertain.\n\nA modern business booking system provides insights into revenue trends, peak booking times, staff performance, client retention, and service profitability.\n\nWith clear data, you can:\n\n• Adjust pricing strategically\n• Optimize staffing schedules\n• Promote high-margin services\n• Improve repeat booking rates\n\nData replaces guesswork. Strategy replaces stress.",
        "fr": "Sans données, la croissance est incertaine.\n\nUn système moderne fournit des indicateurs clairs sur les revenus, les heures de pointe et la rentabilité des services.\n\nLes décisions deviennent stratégiques plutôt qu’intuitives."
      }
    },
    {
      "heading": {
        "en": "Client experience at scale",
        "fr": "Expérience client à grande échelle"
      },
      "body": {
        "en": "As businesses grow, maintaining a premium experience becomes harder.\n\nA business booking system ensures clients receive instant confirmations, clear communication, and consistent service policies.\n\nFrom booking to reminder to follow-up, the journey feels structured and reliable.\n\nProfessional systems create professional perception.",
        "fr": "Lorsque l’entreprise grandit, maintenir une expérience premium devient complexe.\n\nUn système structuré garantit une communication claire et cohérente.\n\nLa perception professionnelle est renforcée."
      }
    },
    {
      "heading": {
        "en": "Built for scale, not just scheduling",
        "fr": "Conçu pour scaler, pas seulement planifier"
      },
      "body": {
        "en": "A business booking system is not just about appointments.\n\nIt becomes the operational backbone of service-based companies.\n\nFrom team coordination to revenue tracking, from automation to performance measurement, it supports sustainable growth.\n\nWhen the system is solid, expansion becomes easier, whether adding staff, locations, or services.",
        "fr": "Un système professionnel n’est pas qu’un agenda.\n\nIl devient la colonne vertébrale opérationnelle.\n\nIl soutient la croissance durable et facilite l’expansion."
      }
    }
  ],
  "ctaLabel": {
    "en": "Register your business",
    "fr": "Inscrire mon entreprise"
  }
}
];

export function getLandingBySlug(slug: string) {
  return LANDING_PAGES.find((p) => p.slug === slug);
}

export function getLandingPages() {
  return [...LANDING_PAGES];
}