export type Booking = {
  id: string;
  businessSlug: string;

  serviceId: string;
  serviceName: string;
  durationMin: number;

  price: number;
  currency: string;

  date: string; // YYYY-MM-DD
  time: string; // HH:MM

  customerName: string;
  customerPhone: string;
  customerCountry: string;
  notes?: string;

  createdAt: string;
};

export function bookingsKey(slug: string) {
  return `slotta_bookings:${slug}`;
}

export function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

export function loadBookings(slug: string): Booking[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(bookingsKey(slug));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Booking[]) : [];
  } catch {
    return [];
  }
}

export function saveBookings(slug: string, bookings: Booking[]) {
  localStorage.setItem(bookingsKey(slug), JSON.stringify(bookings));
}

export function isSlotBooked(bookings: Booking[], date: string, time: string) {
  return bookings.some((b) => b.date === date && b.time === time);
}
