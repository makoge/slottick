// lib/seo/near-me-targets.ts

export type SeoIntent = {
  slug: string;              // "massage-near-me"
  title: string;             // "Massage near me"
  categoryParam?: string;    // "Massage" (used for /explore?category=...)
  synonyms: string[];        // used to vary content
  faqs: Array<{ q: string; a: string }>;
};

export type SeoCity = {
  slug: string;     // "warsaw"
  name: string;     // "Warsaw"
  countryName?: string; // optional for richer text
};

export const SEO_CITIES_20: SeoCity[] = [
  { slug: "warsaw", name: "Warsaw", countryName: "Poland" },
  { slug: "berlin", name: "Berlin", countryName: "Germany" },
  { slug: "hamburg", name: "Hamburg", countryName: "Germany" },
  { slug: "munich", name: "Munich", countryName: "Germany" },
  { slug: "frankfurt", name: "Frankfurt", countryName: "Germany" },

  { slug: "london", name: "London", countryName: "United Kingdom" },
  { slug: "manchester", name: "Manchester", countryName: "United Kingdom" },
  { slug: "birmingham", name: "Birmingham", countryName: "United Kingdom" },
  { slug: "bristol", name: "Bristol", countryName: "United Kingdom" },
  { slug: "leeds", name: "Leeds", countryName: "United Kingdom" },

  { slug: "new-york", name: "New York", countryName: "United States" },
  { slug: "los-angeles", name: "Los Angeles", countryName: "United States" },
  { slug: "chicago", name: "Chicago", countryName: "United States" },
  { slug: "miami", name: "Miami", countryName: "United States" },
  { slug: "atlanta", name: "Atlanta", countryName: "United States" },

  { slug: "tallinn", name: "Tallinn", countryName: "Estonia" },
  { slug: "helsinki", name: "Helsinki", countryName: "Finland" },
  { slug: "tampere", name: "Tampere", countryName: "Finland" },
  { slug: "riga", name: "Riga", countryName: "Latvia" },
  { slug: "stockholm", name: "Stockholm", countryName: "Sweden" }
];

export const SEO_INTENTS_10: SeoIntent[] = [
  {
    slug: "massage-near-me",
    title: "Massage near me",
    categoryParam: "Massage",
    synonyms: ["massage therapist", "deep tissue massage", "relaxation massage", "sports massage"],
    faqs: [
      { q: "How do I choose a good massage therapist?", a: "Check reviews, specialties, availability, and whether the service matches your needs (relaxation, sports, deep tissue)." },
      { q: "How much does a massage usually cost?", a: "Prices vary by city and duration. Compare options and check what’s included before booking." },
      { q: "Can I book same-day massage appointments?", a: "Yes—availability depends on the provider. Use filters and pick a time slot that fits." }
    ]
  },
  {
    slug: "beauty-salons-near-me",
    title: "Beauty salons near me",
    categoryParam: "Other",
    synonyms: ["beauty salon", "beauty studio", "beauty services", "beauty appointment"],
    faqs: [
      { q: "What services do beauty salons offer?", a: "Common services include facials, brows, lashes, nails, skincare, and makeup—depending on the salon." },
      { q: "How do I find the best salon near me?", a: "Use reviews, ratings, and service categories. Book businesses with consistent feedback and clear pricing." },
      { q: "Do I need to call to confirm?", a: "No—online booking shows real availability and confirms the appointment instantly." }
    ]
  },
  {
    slug: "barber-near-me",
    title: "Barber near me",
    categoryParam: "Barber",
    synonyms: ["barbershop", "fade haircut", "beard trim", "line-up"],
    faqs: [
      { q: "What should I ask for at a barber?", a: "Bring a reference photo or describe the style (fade level, length on top, beard shape) to avoid misunderstandings." },
      { q: "How long does a barber appointment take?", a: "Typically 20–60 minutes depending on haircut and beard services." },
      { q: "Can I book a barber online?", a: "Yes—book a slot directly based on real availability." }
    ]
  },
  {
    slug: "nail-salon-near-me",
    title: "Nail salon near me",
    categoryParam: "Nails",
    synonyms: ["manicure", "pedicure", "gel nails", "acrylic nails"],
    faqs: [
      { q: "What’s the difference between gel and acrylic nails?", a: "Gel is often lighter and cured under UV; acrylic is stronger and built with powder + liquid. Choose based on durability and style." },
      { q: "How often should I get a refill?", a: "Most people do refills every 2–3 weeks depending on growth and wear." },
      { q: "How do I find a trusted nail salon?", a: "Look for consistent reviews, clean photos, and clear service listings." }
    ]
  },
  {
    slug: "lash-tech-near-me",
    title: "Lash tech near me",
    categoryParam: "Lash",
    synonyms: ["lash extensions", "classic lashes", "volume lashes", "lash lift"],
    faqs: [
      { q: "How long do lash extensions last?", a: "Usually 2–4 weeks depending on aftercare and lash cycle." },
      { q: "What lash style should I choose?", a: "Classic for natural, volume for fullness, hybrid for balance. A good tech will recommend what suits your eye shape." },
      { q: "Can I book a lash appointment online?", a: "Yes—choose a service and a slot that matches the duration." }
    ]
  },
  {
    slug: "hair-braiders-near-me",
    title: "Hair braiders near me",
    categoryParam: "Hair",
    synonyms: ["braids", "knotless braids", "box braids", "cornrows"],
    faqs: [
      { q: "How long do braids take?", a: "It depends on style and length—often 2–6+ hours. Booking platforms help reserve the correct time." },
      { q: "How long do braids last?", a: "Commonly 3–8 weeks depending on style and maintenance." },
      { q: "Do braiders require deposits?", a: "Some do. Always check the booking details and policies before confirming." }
    ]
  },
  {
    slug: "afro-hair-salon-near-me",
    title: "Afro hair salon near me",
    categoryParam: "Hair",
    synonyms: ["afro hair", "natural hair salon", "textured hair specialist", "curly hair salon"],
    faqs: [
      { q: "What services do afro hair salons offer?", a: "Often includes braids, twists, locs, silk press, treatments, and styling for textured hair." },
      { q: "How do I find a textured hair specialist?", a: "Look for service listings that mention textured/curly hair and check photos + reviews." },
      { q: "Can I book online?", a: "Yes—book a time slot that matches the service duration." }
    ]
  },
  {
    slug: "brow-services-near-me",
    title: "Brow services near me",
    categoryParam: "Brows",
    synonyms: ["brow shaping", "brow tint", "lamination", "microblading consult"],
    faqs: [
      { q: "What’s the most popular brow service?", a: "Shaping + tint is common; lamination is popular for a fuller, lifted look." },
      { q: "How often should I do brows?", a: "Most people do shaping every 2–4 weeks depending on growth." },
      { q: "Can I book last-minute?", a: "Sometimes—availability depends on the business. Use filters to check." }
    ]
  },
  {
    slug: "skincare-facial-near-me",
    title: "Facials and skincare near me",
    categoryParam: "Skincare",
    synonyms: ["facial", "skincare clinic", "acne facial", "glow facial"],
    faqs: [
      { q: "How often should I get a facial?", a: "Many people do facials monthly, but it depends on skin goals and sensitivity." },
      { q: "Are facials good for acne?", a: "Some treatments can help. Choose providers that clearly list acne-focused services." },
      { q: "What should I do before a facial?", a: "Avoid harsh exfoliants and mention sensitivities or allergies when booking." }
    ]
  },
  {
    slug: "best-beauty-services-in-city",
    title: "Best beauty services near me",
    categoryParam: "Other",
    synonyms: ["top rated beauty", "best local salons", "trusted beauty services", "beauty appointments"],
    faqs: [
      { q: "How do I find the best beauty services near me?", a: "Compare ratings, categories, and availability. Focus on services that match your needs and budget." },
      { q: "Is online booking reliable?", a: "Yes—real availability means fewer conflicts and instant confirmation." },
      { q: "Can I discover new businesses in my city?", a: "That’s the point of a marketplace—browse, compare, then book." }
    ]
  }
];
