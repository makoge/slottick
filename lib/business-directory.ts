export type BusinessIndustry =
  | "Beauty & care"
  | "Wellness & lifestyle"
  | "Creative services"
  | "Home & local"
  | "Education & professionals";

export type BusinessDirectoryItem = {
  slug: string;
  name: string;
  industry: BusinessIndustry;
  city: string;
  country: string;
  ratingAvg: number; // 0..5
  ratingCount: number;
  heroTag?: string; // e.g. "Top rated", "New"
  logoUrl?: string;
};

export const BUSINESS_DIRECTORY: BusinessDirectoryItem[] = [
  {
    slug: "demo-lash-studio",
    name: "Demo Lash Studio",
    industry: "Beauty & care",
    city: "Tallinn",
    country: "Estonia",
    ratingAvg: 4.8,
    ratingCount: 124,
    heroTag: "Top rated",
    logoUrl: "/demo-logos/lash.png"
  },
  {
    slug: "nails-by-lina",
    name: "Nails by Lina",
    industry: "Beauty & care",
    city: "Tallinn",
    country: "Estonia",
    ratingAvg: 4.6,
    ratingCount: 58
  },
  {
    slug: "brow-room-central",
    name: "Brow Room Central",
    industry: "Beauty & care",
    city: "Helsinki",
    country: "Finland",
    ratingAvg: 4.7,
    ratingCount: 92,
    heroTag: "Popular"
  },
  {
    slug: "barber-club-north",
    name: "Barber Club North",
    industry: "Beauty & care",
    city: "Riga",
    country: "Latvia",
    ratingAvg: 4.5,
    ratingCount: 210
  }
];

export const ALL_INDUSTRIES: BusinessIndustry[] = [
  "Beauty & care",
  "Wellness & lifestyle",
  "Creative services",
  "Home & local",
  "Education & professionals"
];
