export type CountryTarget = {
  code: string;      // "GB"
  slug: string;      // "uk"
  name: string;      // "United Kingdom"
  cities: string[];  // ["Bristol", "London", ...]
};

export const TARGET_CATEGORIES = [
  "Beauty salons",
  "Lash techs",
  "Hair braiders",
  "Barbers",
  "Nail salons",
  "Massage",
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
];
