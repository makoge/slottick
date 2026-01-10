"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AvailabilityRule,
  defaultAvailability,
  generateTimeSlots,
  canFitServiceAt,
  overlapsBreak,
  slotRangeForService,
} from "@/lib/availability";
import { Currency, Service, formatMoney } from "@/lib/services";

function formatBusinessName(slug?: string) {
  if (!slug) return "this studio";
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

type DbDayBooking = {
  startsAt: string; // ISO
  durationMin: number;
};

type DbService = {
  id: string;
  name: string;
  durationMin: number;
  price: number;
  currency: string;
};

type CustomerMe = {
  customer: null | {
    id: string;
    email: string;
    name?: string | null;
    phone?: string | null;
  };
};

function toCurrency(x: unknown): Currency {
  const s = String(x ?? "EUR").toUpperCase();
  return s === "EUR" || s === "USD" || s === "FCFA" ? (s as Currency) : "EUR";
}

function hhmmFromISO(iso: string) {
  const dt = new Date(iso);
  const h = String(dt.getUTCHours()).padStart(2, "0");
  const m = String(dt.getUTCMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

// MVP: build startsAt as UTC from date+time.
function startsAtISOFromDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00.000Z`).toISOString();
}

export default function BookingClient({
  locale,
  businessSlug,
}: {
  locale: string;
  businessSlug: string;
}) {
  const router = useRouter();

  const [rule, setRule] = useState<AvailabilityRule>(defaultAvailability);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingRule, setLoadingRule] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);

  // customer session (optional)
  const [customer, setCustomer] = useState<CustomerMe["customer"]>(null);
  const [loadingCustomer, setLoadingCustomer] = useState(true);

  // DB-truth bookings for selected date (for UI blocking)
  const [dayBookings, setDayBookings] = useState<DbDayBooking[]>([]);

  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Check if customer logged in (cookie session)
  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoadingCustomer(true);
      try {
        const res = await fetch("/api/customer/me", { cache: "no-store" });
        const data = (await res.json().catch(() => ({}))) as CustomerMe;
        if (cancelled) return;
        setCustomer(data?.customer ?? null);
      } catch {
        if (!cancelled) setCustomer(null);
      } finally {
        if (!cancelled) setLoadingCustomer(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  // ✅ Public: load availability rule
  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoadingRule(true);
      try {
        const res = await fetch(
          `/api/availability?businessSlug=${encodeURIComponent(businessSlug)}`,
          { cache: "no-store" }
        );
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;

        if (res.ok && data?.rule) {
          setRule({ ...defaultAvailability, ...data.rule });
        } else {
          setRule(defaultAvailability);
        }
      } catch {
        if (!cancelled) setRule(defaultAvailability);
      } finally {
        if (!cancelled) setLoadingRule(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [businessSlug]);

  // ✅ Public: load services
  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoadingServices(true);
      try {
        const res = await fetch(
          `/api/services?businessSlug=${encodeURIComponent(businessSlug)}`,
          { cache: "no-store" }
        );
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;

        const mapped: Service[] = Array.isArray(data.services)
          ? (data.services as DbService[]).map((s) => ({
              id: String(s.id),
              name: String(s.name ?? ""),
              durationMin: Number(s.durationMin ?? 0),
              price: Number(s.price ?? 0),
              currency: toCurrency(s.currency),
            }))
          : [];

        setServices(mapped);
      } catch {
        if (!cancelled) setServices([]);
      } finally {
        if (!cancelled) setLoadingServices(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [businessSlug]);

  // ✅ Fetch booked slots for selected date (blocking)
  useEffect(() => {
    let cancelled = false;

    async function run() {
      setDayBookings([]);
      if (!date) return;

      try {
        const qs = new URLSearchParams({ businessSlug, date });
        const res = await fetch(`/api/bookings/availability?${qs.toString()}`, {
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;

        if (res.ok && Array.isArray(data.bookings)) {
          setDayBookings(
            data.bookings
              .map((b: any) => ({
                startsAt: String(b.startsAt ?? ""),
                durationMin: Number(b.durationMin ?? 0),
              }))
              .filter((b: DbDayBooking) => b.startsAt && b.durationMin > 0)
          );
        }
      } catch {
        // ignore
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [businessSlug, date]);

  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId) ?? null,
    [services, serviceId]
  );

  const allSlots = useMemo(() => {
    if (!date) return [];
    return generateTimeSlots(date, rule);
  }, [date, rule]);

  const bookedSet = useMemo(() => {
    const s = new Set<string>();
    for (const b of dayBookings) {
      const bTime = hhmmFromISO(b.startsAt);
      const blocked = slotRangeForService(bTime, rule, b.durationMin);
      blocked.forEach((x) => s.add(x));
    }
    return s;
  }, [dayBookings, rule]);

  const availableSlots = useMemo(() => {
    if (!date || !selectedService) return [];

    return allSlots.filter((tm) => {
      if (!canFitServiceAt(tm, rule, selectedService.durationMin)) return false;
      if (overlapsBreak(tm, rule, selectedService.durationMin)) return false;

      const needed = slotRangeForService(tm, rule, selectedService.durationMin);
      return needed.every((x) => !bookedSet.has(x));
    });
  }, [allSlots, bookedSet, date, rule, selectedService]);

  const step = !serviceId ? 1 : !date ? 2 : !time ? 3 : 4;
  const loading = loadingRule || loadingServices;

  async function confirmBooking() {
    if (submitting) return;
    setError(null);

    if (!selectedService) return setError("Select a service.");
    if (!date) return setError("Select a date.");
    if (!time) return setError("Select a time.");
    if (!fullName.trim()) return setError("Enter your full name.");
    if (!phone.trim()) return setError("Enter your phone.");

    const emailTrim = customerEmail.trim();
          if (!emailTrim) {
         return setError("Email is required.");
         }
         if (!isValidEmail(emailTrim)) {
        return setError("Enter a valid email.");
        }


    // last-second collision check (client-side cache)
    const needed = slotRangeForService(time, rule, selectedService.durationMin);
    for (const b of dayBookings) {
      const blocked = new Set(
        slotRangeForService(hhmmFromISO(b.startsAt), rule, b.durationMin)
      );
      if (needed.some((x) => blocked.has(x))) {
        return setError("That time was just booked. Pick another slot.");
      }
    }

    setSubmitting(true);
    try {
      const startsAt = startsAtISOFromDateTime(date, time);

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessSlug,
          serviceName: selectedService.name,
          durationMin: selectedService.durationMin,
          price: selectedService.price,
          currency: selectedService.currency,
          startsAt,
          customerName: fullName.trim(),
          customerPhone: phone.trim(),
          customerEmail: emailTrim,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Booking failed");
        return;
      }

      const id: string | undefined = data.booking?.id;
      if (!id) {
        setError("Booking created but missing id.");
        return;
      }

      router.push(
        `/${locale}/book/${businessSlug}/success?id=${encodeURIComponent(id)}`
      );
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const createAccountHref = `/${locale}/customer/signup?next=${encodeURIComponent(
    `/${locale}/book/${businessSlug}`
  )}`;
  const loginHref = `/${locale}/customer/login?next=${encodeURIComponent(
    `/${locale}/book/${businessSlug}`
  )}`;

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-600">Slottick • Booking</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Book with {formatBusinessName(businessSlug)}
            </h1>
            <p className="mt-2 text-slate-600">
              {loading ? "Loading..." : `Step ${step} of 4`}
            </p>
          </div>

          <nav className="flex gap-2 text-sm">
            <a className="rounded-lg border px-3 py-1 hover:bg-slate-50" href={`/en/book/${businessSlug}`}>
              EN
            </a>
            <a className="rounded-lg border px-3 py-1 hover:bg-slate-50" href={`/fr/book/${businessSlug}`}>
              FR
            </a>
          </nav>
        </header>

        {/* ✅ Guest vs Account */}
        <section className="mt-6 rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-medium text-slate-700">Booking options</div>
              <div className="mt-1 text-sm text-slate-600">
                Book instantly as guest, or create an account to explore more businesses in your city.
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
             
              <a
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                href={createAccountHref}
              >
                Create account
              </a>
              <a
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                href={loginHref}
              >
                Log in
              </a>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm">
            {loadingCustomer ? (
              <div className="text-slate-600">Checking account...</div>
            ) : customer ? (
              <div>
                <div className="font-semibold">Signed in as {customer.email}</div>
                <div className="mt-1 text-slate-600">
                  You’ll be able to explore other services nearby (city-based) after booking.
                </div>
              </div>
            ) : (
              <div className="text-slate-600">
                You’re booking as guest. Creating an account lets you discover more businesses and rebook faster.
              </div>
            )}
          </div>
        </section>

        {error ? (
          <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-8 grid gap-6">
          {/* 1) Service */}
          <section className="rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-lg font-semibold">1) Choose a service</h2>

            {loadingServices ? (
              <p className="mt-3 text-sm text-slate-600">Loading services...</p>
            ) : services.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">
                No services available. The business owner needs to add services.
              </p>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {services.map((s) => {
                  const active = s.id === serviceId;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setServiceId(s.id);
                        setDate("");
                        setTime("");
                        setError(null);
                      }}
                      className={[
                        "text-left rounded-xl border p-4 transition hover:bg-slate-50",
                        active ? "border-slate-900" : "border-slate-200",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold">{s.name}</div>
                          <div className="mt-1 text-sm text-slate-600">
                            {s.durationMin} min • {formatMoney(s.price, s.currency)}
                          </div>
                        </div>
                        {active ? (
                          <span className="rounded-full bg-slate-900 px-2 py-1 text-xs font-semibold text-white">
                            Selected
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* 2) Date */}
          <section className="rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-lg font-semibold">2) Pick a date</h2>

            {!serviceId ? (
              <p className="mt-3 text-sm text-slate-600">Select a service first.</p>
            ) : (
              <div className="mt-4 flex flex-wrap items-end gap-3">
                <label className="grid gap-1 text-sm">
                  Date
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      setTime("");
                      setError(null);
                    }}
                    className="w-56 rounded-xl border border-slate-200 px-3 py-2"
                    required
                  />
                </label>
              </div>
            )}
          </section>

          {/* 3) Time */}
          <section className="rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-lg font-semibold">3) Pick a time</h2>

            {!serviceId || !date ? (
              <p className="mt-3 text-sm text-slate-600">Select a service and date first.</p>
            ) : availableSlots.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">No available slots on this date.</p>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {availableSlots.map((tm) => {
                  const active = tm === time;
                  return (
                    <button
                      key={tm}
                      type="button"
                      onClick={() => {
                        setTime(tm);
                        setError(null);
                      }}
                      className={[
                        "rounded-xl border px-4 py-3 text-center text-sm font-semibold hover:bg-slate-50",
                        active ? "border-slate-900" : "border-slate-200",
                      ].join(" ")}
                    >
                      {tm}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* 4) Details */}
          <section className="rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-lg font-semibold">4) Your details</h2>

            {!selectedService || !date || !time ? (
              <p className="mt-3 text-sm text-slate-600">Finish steps 1–3 first.</p>
            ) : (
              <div className="mt-4 grid gap-4">
                <div className="rounded-xl bg-slate-50 p-4 text-sm">
                  <div className="font-semibold">{selectedService.name}</div>
                  <div className="mt-1 text-slate-600">
                    {date} • {time} • {selectedService.durationMin} min •{" "}
                    {formatMoney(selectedService.price, selectedService.currency)}
                  </div>
                </div>

                <label className="grid gap-1 text-sm">
                  Full name
                  <input
                    className="rounded-xl border border-slate-200 px-3 py-2"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                  />
                </label>

                <label className="grid gap-1 text-sm">
                  Phone
                  <input
                    className="rounded-xl border border-slate-200 px-3 py-2"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+372..."
                  />
                </label>

                <label className="grid gap-1 text-sm">
                  Email*
                  <input
                    type="email"
                    required
                    className="rounded-xl border border-slate-200 px-3 py-2"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                </label>

                <label className="grid gap-1 text-sm">
                  Notes (optional)
                  <textarea
                    className="min-h-[90px] rounded-xl border border-slate-200 px-3 py-2"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any details..."
                  />
                </label>

                <button
                  type="button"
                  disabled={submitting}
                  className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                  onClick={confirmBooking}
                >
                  {submitting ? "Confirming..." : "Confirm booking"}
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
