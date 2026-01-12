export type CountryTarget = {
  code: string;      // "GB"
  slug: string;      // "uk"
  name: string;      // "United Kingdom"
  cities: string[];  // ["Bristol", "London", ...]
};

export const TARGET_CATEGORIES = [
  { slug: "beauty-salons", label: "Beauty salons" },
  { slug: "lash-techs", label: "Lash techs" },
  { slug: "hair-braiders", label: "Hair braiders" },
  { slug: "barbers", label: "Barbers" },
  { slug: "nail-salons", label: "Nail salons" },
  { slug: "massage", label: "Massage" },
] as const;

export const TARGET_COUNTRIES: CountryTarget[] = [
  {
    code: "GB",
    slug: "uk",
    name: "United Kingdom",
    cities: ["Bristol", "London", "Manchester", "Birmingham", "Leeds", "Liverpool"],
  },
  {
    code: "US",
    slug: "usa",
    name: "United States",
    cities: ["New York", "Los Angeles", "Chicago", "Houston", "Miami", "Atlanta"],
  },
  {
    code: "DE",
    slug: "germany",
    name: "Germany",
    cities: ["Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt", "Stuttgart"],
  },
  {
    code: "EE",
    slug: "estonia",
    name: "Estonia",
    cities: ["Tallinn", "Tartu"],
  },
  {
    code: "FI",
    slug: "finland",
    name: "Finland",
    cities: ["Helsinki", "Espoo", "Tampere", "Turku"],
  },
];
