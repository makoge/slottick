// lib/seo/guides.ts
import { slugify } from "@/lib/seo/slug";

export type GuideLocation = {
  slug: string;          // "helsinki"
  name: string;          // "Helsinki"
  countryName?: string;  // "Finland"
  exploreCity?: string;  // what you pass into /explore?city=
};

export type GuideService = {
  slug: string;        // "manicure"
  label: string;       // "Manicure"
  exploreCategory?: string; // optional if you support it in Explore
  exploreQ: string;    // query used in Explore deep-link
  headlineTpl: (city: string) => string;
  introTpl: (city: string) => string;
  sectionsTpl: (city: string) => Array<{ h: string; p: string | string[] }>;
  faqsTpl: (city: string) => Array<{ q: string; a: string }>;
  relatedServiceSlugs: string[]; // internal links to other guides
};

// ✅ Locations (UK/Germany are mapped to default cities for Explore)
export const GUIDE_LOCATIONS: GuideLocation[] = [
  { slug: "helsinki", name: "Helsinki", countryName: "Finland", exploreCity: "Helsinki" },
  { slug: "vilnius", name: "Vilnius", countryName: "Lithuania", exploreCity: "Vilnius" },
  { slug: "tallinn", name: "Tallinn", countryName: "Estonia", exploreCity: "Tallinn" },
  { slug: "warsaw", name: "Warsaw", countryName: "Poland", exploreCity: "Warsaw" },

  // My opinion: these should be country hub pages later.
  // For now, route them as location guides but Explore deep-links use a flagship city.
  { slug: "uk", name: "United Kingdom", exploreCity: "London" },
  { slug: "germany", name: "Germany", exploreCity: "Berlin" }
];

function durationTips(service: string) {
  if (service === "manicure") return "Most manicures take 30–60 minutes (longer for builder gel or nail art).";
  if (service === "pedicure") return "Pedicures usually run 45–75 minutes depending on extras (callus care, gel, spa).";
  if (service === "hairstylist") return "Hair appointments vary a lot—cuts are often 30–60 min, color can be 2–4 hours.";
  if (service === "hair-braiding") return "Braiding often needs longer blocks—2–6+ hours depending on style and length.";
  if (service === "lash-techs") return "Full sets are commonly 90–150 minutes; infills are usually 45–90 minutes.";
  return "Service duration depends on the provider and what you book.";
}

export const GUIDE_SERVICES: GuideService[] = [
  {
    slug: "manicure",
    label: "Manicure",
    exploreCategory: "Nails",
    exploreQ: "manicure",
    headlineTpl: (city) => `Manicure in ${city} — Book nail appointments online`,
    introTpl: (city) =>
      `Looking for a manicure in ${city}? This guide helps you understand popular options (gel, builder, classic), what affects pricing, and how to book based on real availability.`,
    sectionsTpl: (city) => [
      { h: `What to book in ${city}`, p: ["Classic manicure", "Gel manicure", "Builder gel / BIAB", "Nail art add-ons"] },
      { h: "How long it takes", p: durationTips("manicure") },
      {
        h: "How to pick a good nail tech",
        p: [
          "Check recent photos (clean cuticles, even shape, consistent finish).",
          "Look for clear service names + durations (less surprises).",
          "Book a slot that matches the service length—avoid rushed work."
        ]
      },
      {
        h: `Best way to find availability fast in ${city}`,
        p: `Use the marketplace filters + search terms like “gel”, “BIAB”, “nail art”. Choose a business and book a time that’s actually open—no back-and-forth.`
      }
    ],
    faqsTpl: (city) => [
      { q: `Can I book a manicure last-minute in ${city}?`, a: "Yes—if the calendar has openings, you can book instantly." },
      { q: "Can I see pricing before booking?", a: "If the business lists prices, they show next to the service." },
      { q: "What should I write in notes?", a: "Style reference, nail length preference, and any allergies/sensitivities." }
    ],
    relatedServiceSlugs: ["pedicure", "lash-techs", "hairstylist"]
  },

  {
    slug: "pedicure",
    label: "Pedicure",
    exploreCategory: "Nails",
    exploreQ: "pedicure",
    headlineTpl: (city) => `Pedicure in ${city} — Book foot care & gel pedicures online`,
    introTpl: (city) =>
      `Need a pedicure in ${city}? Here’s what to expect from classic vs gel vs spa pedicures, typical appointment time, and how to book without waiting for replies.`,
    sectionsTpl: (city) => [
      { h: "Popular pedicure types", p: ["Classic pedicure", "Gel pedicure", "Spa pedicure", "Callus care add-on"] },
      { h: "How long it takes", p: durationTips("pedicure") },
      {
        h: "What affects price",
        p: [
          "Gel polish vs regular polish",
          "Callus treatment / spa upgrades",
          "Extra time for detailed work"
        ]
      },
      { h: `Booking tip for ${city}`, p: "Pick the exact service (gel vs classic) so the time block matches the real duration." }
    ],
    faqsTpl: (city) => [
      { q: "Is gel pedicure worth it?", a: "If you want longer wear and a stronger finish, yes—especially for travel." },
      { q: `Can I book a pedicure same day in ${city}?`, a: "Sometimes—depends on availability. Online booking makes it easy to check." },
      { q: "What should I bring?", a: "Usually nothing—just arrive a few minutes early." }
    ],
    relatedServiceSlugs: ["manicure", "lash-techs", "beauty-services"]
  },

  {
    slug: "hairstylist",
    label: "Hairstylist",
    exploreCategory: "Hair",
    exploreQ: "hairstylist",
    headlineTpl: (city) => `Hairstylist in ${city} — Book hair appointments online`,
    introTpl: (city) =>
      `Find a hairstylist in ${city} for cuts, blowouts, styling, and (where available) color services. Book based on real appointment slots.`,
    sectionsTpl: (city) => [
      { h: "Common services", p: ["Women’s / men’s cuts", "Blowout & styling", "Hair treatments", "Consultations"] },
      { h: "How long it takes", p: durationTips("hairstylist") },
      {
        h: "How to choose the right stylist",
        p: [
          "Match the portfolio to your hair type and goal.",
          "Book a consult if you’re unsure (especially for color).",
          "Choose a time slot that fits the service length."
        ]
      },
      { h: `Fastest way to book in ${city}`, p: "Search by keyword (cut, blowout, treatment) and pick from live availability." }
    ],
    faqsTpl: (city) => [
      { q: "Do I need a consultation?", a: "For major changes or color work, it’s a good idea." },
      { q: "Can I book without calling?", a: "Yes—online booking is the whole point." },
      { q: "Can I change or cancel?", a: "Depends on business policy; check the booking details." }
    ],
    relatedServiceSlugs: ["hair-braiding", "lash-techs", "manicure"]
  },

  {
    slug: "hair-braiding",
    label: "Hair Braiding",
    exploreCategory: "Hair",
    exploreQ: "braids hair braiding",
    headlineTpl: (city) => `Hair braiding in ${city} — Find braiders and book online`,
    introTpl: (city) =>
      `Braiding in ${city} can take hours, so booking the correct time slot matters. This guide covers popular styles, how long they take, and how to book with real availability.`,
    sectionsTpl: (city) => [
      { h: "Popular braiding styles", p: ["Box braids", "Knotless braids", "Cornrows", "Twists", "Protective styling"] },
      { h: "How long it takes", p: durationTips("hair-braiding") },
      {
        h: "What to ask before booking",
        p: [
          "Hair length + desired size (small/medium/large).",
          "Do you provide hair or should I bring it?",
          "Is there prep required (wash/blow-dry)?"
        ]
      },
      { h: `Booking tip for ${city}`, p: "Pick the service that matches the real duration so you’re not squeezed into the wrong slot." }
    ],
    faqsTpl: (city) => [
      { q: `Can I book long braiding sessions in ${city}?`, a: "Yes—if providers list long-duration services, you can reserve them properly." },
      { q: "Do braiders require deposits?", a: "Some do. Always check the booking policy before confirming." },
      { q: "How long do braids last?", a: "Often 3–8 weeks depending on style and maintenance." }
    ],
    relatedServiceSlugs: ["hairstylist", "manicure", "lash-techs"]
  },

  {
    slug: "lash-techs",
    label: "Lash Techs",
    exploreCategory: "Lash",
    exploreQ: "lash tech lashes extensions",
    headlineTpl: (city) => `Lash techs in ${city} — Book lash services online`,
    introTpl: (city) =>
      `Looking for lash techs in ${city}? Compare services like classic, hybrid, volume, lifts, and book a real slot without waiting for DMs.`,
    sectionsTpl: (city) => [
      { h: "Most booked lash services", p: ["Classic extensions", "Hybrid sets", "Volume sets", "Infills", "Lash lift + tint"] },
      { h: "How long it takes", p: durationTips("lash-techs") },
      {
        h: "How to choose a lash tech",
        p: [
          "Look for clean isolation + consistent sets in photos.",
          "Choose a style that matches your lifestyle (natural vs full).",
          "Book infills on time (usually every 2–3 weeks)."
        ]
      },
      { h: `Booking tip for ${city}`, p: "Select the exact set type (classic/hybrid/volume) so the time block is correct." }
    ],
    faqsTpl: (city) => [
      { q: "How long do lash extensions last?", a: "Usually 2–4 weeks depending on aftercare and lash cycle." },
      { q: `Can I book a lash appointment online in ${city}?`, a: "Yes—choose a service and a time slot from live availability." },
      { q: "What should I do before my appointment?", a: "Arrive with clean lashes and avoid oily makeup/removers." }
    ],
    relatedServiceSlugs: ["manicure", "pedicure", "hairstylist"]
  }
];

// optional “general” slug used by a couple related lists
export const EXTRA_SERVICE_PAGES = [
  { slug: "beauty-services", label: "Beauty services", exploreCategory: "Other", exploreQ: "beauty" }
] as const;

export function findLocation(slug: string) {
  return GUIDE_LOCATIONS.find((x) => x.slug === slug) ?? null;
}
export function findService(slug: string) {
  return GUIDE_SERVICES.find((x) => x.slug === slug) ?? null;
}

export function guidePairs() {
  const pairs: Array<{ locationSlug: string; serviceSlug: string }> = [];
  for (const loc of GUIDE_LOCATIONS) {
    for (const svc of GUIDE_SERVICES) pairs.push({ locationSlug: loc.slug, serviceSlug: svc.slug });
  }
  return pairs;
}

export function prettyLocationName(loc: GuideLocation) {
  return loc.countryName ? `${loc.name}, ${loc.countryName}` : loc.name;
}

export function safeInternalSlug(input: string) {
  return slugify(input);
}
