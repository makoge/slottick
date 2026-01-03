export type BusinessCategory = "Lash" | "Nails" | "Brows" | "Barber" | "Massage" | "Other";

export type BusinessDirectoryItem = {
  slug: string;
  name: string;
  category: BusinessCategory;
  city: string;
  country: string;
  ratingAvg: number; // 0..5
  ratingCount: number;
  heroTag?: string; // e.g. "Top rated", "New"
};

export const BUSINESS_DIRECTORY: BusinessDirectoryItem[] = [
  {
    slug: "demo-lash-studio",
    name: "Demo Lash Studio",
    category: "Lash",
    city: "Tallinn",
    country: "Estonia",
    ratingAvg: 4.8,
    ratingCount: 124,
    heroTag: "Top rated"
  },
  {
    slug: "nails-by-lina",
    name: "Nails by Lina",
    category: "Nails",
    city: "Tallinn",
    country: "Estonia",
    ratingAvg: 4.6,
    ratingCount: 58
  },
  {
    slug: "brow-room-central",
    name: "Brow Room Central",
    category: "Brows",
    city: "Helsinki",
    country: "Finland",
    ratingAvg: 4.7,
    ratingCount: 92,
    heroTag: "Popular"
  },
  {
    slug: "barber-club-north",
    name: "Barber Club North",
    category: "Barber",
    city: "Riga",
    country: "Latvia",
    ratingAvg: 4.5,
    ratingCount: 210
  }
];

export const ALL_CATEGORIES: BusinessCategory[] = ["Lash", "Nails", "Brows", "Barber", "Massage", "Other"];
