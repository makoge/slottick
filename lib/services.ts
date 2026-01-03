export type Currency = "EUR" | "USD" | "FCFA";

export type Service = {
  id: string;
  name: string;
  durationMin: number;
  price: number;
  currency: Currency;
};

export const defaultServices: Service[] = [
  { id: "classic", name: "Classic Full Set", durationMin: 90, price: 70, currency: "EUR" },
  { id: "hybrid", name: "Hybrid Full Set", durationMin: 105, price: 85, currency: "EUR" },
  { id: "volume", name: "Volume Full Set", durationMin: 120, price: 100, currency: "EUR" },
  { id: "refill-2w", name: "Refill (2 weeks)", durationMin: 75, price: 55, currency: "EUR" }
];

export function servicesKey(slug: string) {
  return `slotta_services:${slug}`;
}

export function formatMoney(amount: number, currency: Currency) {
  const n = Number.isFinite(amount) ? amount : 0;

  if (currency === "EUR") return `€${n}`;
  if (currency === "USD") return `$${n}`;
  return `${n} FCFA`;
}

export function makeId() {
  return Math.random().toString(36).slice(2, 10);
}
