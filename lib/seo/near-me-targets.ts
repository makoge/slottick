// lib/seo/near-me-targets.ts

export type SeoIntent = {
  slug: string;
  title: string;
  categoryParam?: string;
  synonyms: string[];
  faqs: Array<{ q: string; a: string }>;
};

export type SeoCity = {
  slug: string;
  name: string;
  countryName?: string;
};

export const SEO_CITIES_20: SeoCity[] = [
  { slug: "warsaw", name: "Varsovie", countryName: "Pologne" },
  { slug: "berlin", name: "Berlin", countryName: "Allemagne" },
  { slug: "hamburg", name: "Hambourg", countryName: "Allemagne" },
  { slug: "munich", name: "Munich", countryName: "Allemagne" },
  { slug: "frankfurt", name: "Francfort", countryName: "Allemagne" },

  { slug: "london", name: "Londres", countryName: "Royaume-Uni" },
  { slug: "manchester", name: "Manchester", countryName: "Royaume-Uni" },
  { slug: "birmingham", name: "Birmingham", countryName: "Royaume-Uni" },
  { slug: "bristol", name: "Bristol", countryName: "Royaume-Uni" },
  { slug: "leeds", name: "Leeds", countryName: "Royaume-Uni" },

  { slug: "new-york", name: "New York", countryName: "États-Unis" },
  { slug: "los-angeles", name: "Los Angeles", countryName: "États-Unis" },
  { slug: "chicago", name: "Chicago", countryName: "États-Unis" },
  { slug: "miami", name: "Miami", countryName: "États-Unis" },
  { slug: "atlanta", name: "Atlanta", countryName: "États-Unis" },

  { slug: "tallinn", name: "Tallinn", countryName: "Estonie" },
  { slug: "helsinki", name: "Helsinki", countryName: "Finlande" },
  { slug: "tampere", name: "Tampere", countryName: "Finlande" },
  { slug: "riga", name: "Riga", countryName: "Lettonie" },
  { slug: "stockholm", name: "Stockholm", countryName: "Suède" },

  { slug: "paris", name: "Paris", countryName: "France" },
{ slug: "lyon", name: "Lyon", countryName: "France" },
{ slug: "marseille", name: "Marseille", countryName: "France" },
{ slug: "douala", name: "Douala", countryName: "Cameroun" },
{ slug: "yaounde", name: "Yaoundé", countryName: "Cameroun" },
{ slug: "buea", name: "Buea", countryName: "Cameroun" },

{ slug: "toronto", name: "Toronto", countryName: "Canada" },
{ slug: "montreal", name: "Montréal", countryName: "Canada" },
{ slug: "vancouver", name: "Vancouver", countryName: "Canada" }
];

export const SEO_INTENTS_10: SeoIntent[] = [
  {
    slug: "massage-near-me",
    title: "Massage près de moi",
    categoryParam: "Massage",
    synonyms: ["thérapeute de massage", "massage deep tissue", "massage relaxant", "massage sportif"],
    faqs: [
      { q: "Comment choisir un bon thérapeute de massage ?", a: "Vérifiez les avis, les spécialités et les disponibilités, et assurez-vous que le service correspond à vos besoins (relaxation, sport, deep tissue)." },
      { q: "Combien coûte généralement un massage ?", a: "Les prix varient selon la ville et la durée. Comparez les options et regardez ce qui est inclus avant de réserver." },
      { q: "Puis-je réserver un massage le jour même ?", a: "Oui — cela dépend de la disponibilité du prestataire. Utilisez les filtres et choisissez un créneau adapté." }
    ]
  },
  {
    slug: "beauty-salons-near-me",
    title: "Salons de beauté près de moi",
    categoryParam: "Other",
    synonyms: ["salon de beauté", "studio de beauté", "services de beauté", "rendez-vous beauté"],
    faqs: [
      { q: "Quels services proposent les salons de beauté ?", a: "Les services courants incluent soins du visage, sourcils, cils, ongles, soins de la peau et maquillage selon le salon." },
      { q: "Comment trouver le meilleur salon près de moi ?", a: "Utilisez les avis, les notes et les catégories de services. Réservez les établissements avec des retours constants et des prix clairs." },
      { q: "Dois-je appeler pour confirmer ?", a: "Non — la réservation en ligne montre les disponibilités réelles et confirme instantanément le rendez-vous." }
    ]
  },
  {
    slug: "barber-near-me",
    title: "Barbier près de moi",
    categoryParam: "Barber",
    synonyms: ["barbershop", "coupe dégradée", "taille de barbe", "line-up"],
    faqs: [
      { q: "Que dois-je demander chez un barbier ?", a: "Apportez une photo de référence ou décrivez la coupe (niveau du dégradé, longueur sur le dessus, forme de barbe)." },
      { q: "Combien de temps dure un rendez-vous chez le barbier ?", a: "En général 20 à 60 minutes selon la coupe et les services de barbe." },
      { q: "Puis-je réserver un barbier en ligne ?", a: "Oui — choisissez simplement un créneau disponible." }
    ]
  },
  {
    slug: "nail-salon-near-me",
    title: "Salon de manucure près de moi",
    categoryParam: "Nails",
    synonyms: ["manucure", "pédicure", "ongles gel", "ongles acryliques"],
    faqs: [
      { q: "Quelle est la différence entre gel et acrylique ?", a: "Le gel est souvent plus léger et durci sous UV ; l'acrylique est plus solide et construit avec poudre + liquide." },
      { q: "À quelle fréquence dois-je faire un remplissage ?", a: "La plupart des gens font un remplissage toutes les 2 à 3 semaines selon la repousse." },
      { q: "Comment trouver un salon d’ongles fiable ?", a: "Regardez les avis, les photos et les services clairement listés." }
    ]
  },
  {
    slug: "lash-tech-near-me",
    title: "Technicienne de cils près de moi",
    categoryParam: "Lash",
    synonyms: ["extensions de cils", "cils classiques", "volume russe", "rehaussement de cils"],
    faqs: [
      { q: "Combien de temps durent les extensions de cils ?", a: "Généralement 2 à 4 semaines selon l’entretien et le cycle naturel des cils." },
      { q: "Quel style de cils choisir ?", a: "Classique pour un look naturel, volume pour plus de densité, hybride pour un équilibre." },
      { q: "Puis-je réserver un rendez-vous pour les cils en ligne ?", a: "Oui — choisissez le service et un créneau adapté." }
    ]
  },
  {
    slug: "hair-braiders-near-me",
    title: "Coiffeuses de tresses près de moi",
    categoryParam: "Hair",
    synonyms: ["tresses", "knotless braids", "box braids", "cornrows"],
    faqs: [
      { q: "Combien de temps prennent les tresses ?", a: "Cela dépend du style et de la longueur — souvent entre 2 et 6 heures ou plus." },
      { q: "Combien de temps les tresses durent-elles ?", a: "En général entre 3 et 8 semaines selon le style et l’entretien." },
      { q: "Les coiffeuses demandent-elles un acompte ?", a: "Certaines oui. Vérifiez les politiques avant de confirmer la réservation." }
    ]
  },
  {
    slug: "afro-hair-salon-near-me",
    title: "Salon afro près de moi",
    categoryParam: "Hair",
    synonyms: ["cheveux afro", "salon cheveux naturels", "spécialiste cheveux texturés", "salon cheveux bouclés"],
    faqs: [
      { q: "Quels services proposent les salons afro ?", a: "Souvent tresses, twists, locks, silk press, soins et coiffures pour cheveux texturés." },
      { q: "Comment trouver un spécialiste des cheveux texturés ?", a: "Cherchez des services mentionnant cheveux bouclés ou texturés et regardez photos et avis." },
      { q: "Puis-je réserver en ligne ?", a: "Oui — choisissez un créneau adapté à la durée du service." }
    ]
  },
  {
    slug: "brow-services-near-me",
    title: "Services pour sourcils près de moi",
    categoryParam: "Brows",
    synonyms: ["épilation sourcils", "teinture sourcils", "lamination", "consultation microblading"],
    faqs: [
      { q: "Quel est le service de sourcils le plus populaire ?", a: "La mise en forme + teinture est très populaire ; la lamination donne un effet plus fourni." },
      { q: "À quelle fréquence faire les sourcils ?", a: "La plupart des gens toutes les 2 à 4 semaines." },
      { q: "Puis-je réserver à la dernière minute ?", a: "Parfois — cela dépend des disponibilités du salon." }
    ]
  },
  {
    slug: "skincare-facial-near-me",
    title: "Soins du visage près de moi",
    categoryParam: "Skincare",
    synonyms: ["soin du visage", "clinique de soins de peau", "soin anti-acné", "soin éclat"],
    faqs: [
      { q: "À quelle fréquence faire un soin du visage ?", a: "Beaucoup de personnes en font un par mois selon leurs objectifs de peau." },
      { q: "Les soins du visage aident-ils contre l’acné ?", a: "Certains traitements peuvent aider. Choisissez des services spécialisés." },
      { q: "Que faire avant un soin du visage ?", a: "Évitez les exfoliants agressifs et mentionnez allergies ou sensibilités." }
    ]
  },
  {
    slug: "best-beauty-services-in-city",
    title: "Meilleurs services de beauté près de moi",
    categoryParam: "Other",
    synonyms: ["beauté la mieux notée", "meilleurs salons locaux", "services beauté fiables", "rendez-vous beauté"],
    faqs: [
      { q: "Comment trouver les meilleurs services de beauté près de moi ?", a: "Comparez les notes, catégories et disponibilités pour choisir ce qui correspond à vos besoins." },
      { q: "La réservation en ligne est-elle fiable ?", a: "Oui — les disponibilités réelles réduisent les conflits et confirment immédiatement." },
      { q: "Puis-je découvrir de nouveaux salons dans ma ville ?", a: "Oui — une marketplace permet de parcourir, comparer et réserver facilement." }
    ]
  }
];