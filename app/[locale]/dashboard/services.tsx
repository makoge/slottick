"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Currency,
  Service,
  defaultServices,
  formatMoney,
  makeId,
  servicesKey
} from "@/lib/services";

const currencyOptions: Currency[] = ["EUR", "USD", "FCFA"];

export default function ServicesEditor({ slug }: { slug: string }) {
  const key = useMemo(() => servicesKey(slug), [slug]);

  const [services, setServices] = useState<Service[]>(defaultServices);
  const [saved, setSaved] = useState(false);

  // add form
  const [name, setName] = useState("");
  const [durationMin, setDurationMin] = useState<number>(60);
  const [price, setPrice] = useState<number>(50);
  const [currency, setCurrency] = useState<Currency>("EUR");

  useEffect(() => {
    const raw = localStorage.getItem(key);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Service[];
      if (Array.isArray(parsed) && parsed.length) setServices(parsed);
    } catch {
      // ignore
    }
  }, [key]);

  function save(next: Service[]) {
    setServices(next);
    localStorage.setItem(key, JSON.stringify(next));
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  }

  function addService(e: React.FormEvent) {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;

    const next: Service[] = [
      {
        id: makeId(),
        name: cleanName,
        durationMin: Math.max(5, Number(durationMin) || 5),
        price: Math.max(0, Number(price) || 0),
        currency
      },
      ...services
    ];

    save(next);
    setName("");
    setDurationMin(60);
    setPrice(50);
    setCurrency("EUR");
  }

  function updateService(id: string, patch: Partial<Service>) {
    const next = services.map((s) => (s.id === id ? { ...s, ...patch } : s));
    save(next);
  }

  function deleteService(id: string) {
    const next = services.filter((s) => s.id !== id);
    save(next);
  }

  return (
    <section className="rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Services</h2>
        <span className="text-sm text-slate-600">{saved ? "Saved ✓" : ""}</span>
      </div>

      <p className="mt-2 text-sm text-slate-600">
        Add your services with duration and price. Currency can be EUR, USD, or FCFA (for now).
      </p>

      {/* Add form */}
      <form onSubmit={addService} className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            Service name
            <input
              className="rounded-xl border border-slate-200 px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Wispy Hybrid Set"
              required
            />
          </label>

          <label className="grid gap-1 text-sm">
            Duration (minutes)
            <input
              type="number"
              min={5}
              step={5}
              className="rounded-xl border border-slate-200 px-3 py-2"
              value={durationMin}
              onChange={(e) => setDurationMin(Number(e.target.value))}
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            Price
            <input
              type="number"
              min={0}
              step={1}
              className="rounded-xl border border-slate-200 px-3 py-2"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
            />
          </label>

          <label className="grid gap-1 text-sm">
            Currency
            <select
              className="rounded-xl border border-slate-200 px-3 py-2"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
            >
              {currencyOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          type="submit"
          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Add service
        </button>
      </form>

      {/* List */}
      <div className="mt-5 grid gap-3">
        {services.length === 0 ? (
          <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-600">
            No services yet — add your first one.
          </div>
        ) : (
          services.map((s) => (
            <div key={s.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="font-semibold">{s.name}</div>
                  <div className="mt-1 text-sm text-slate-600">
                    {s.durationMin} min • {formatMoney(s.price, s.currency)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => deleteService(s.id)}
                  className="w-fit rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                >
                  Delete
                </button>
              </div>

              {/* Inline edit */}
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <label className="grid gap-1 text-sm">
                  Name
                  <input
                    className="rounded-xl border border-slate-200 px-3 py-2"
                    value={s.name}
                    onChange={(e) => updateService(s.id, { name: e.target.value })}
                  />
                </label>

                <label className="grid gap-1 text-sm">
                  Duration
                  <input
                    type="number"
                    min={5}
                    step={5}
                    className="rounded-xl border border-slate-200 px-3 py-2"
                    value={s.durationMin}
                    onChange={(e) =>
                      updateService(s.id, { durationMin: Math.max(5, Number(e.target.value) || 5) })
                    }
                  />
                </label>

                <label className="grid gap-1 text-sm">
                  Price
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min={0}
                      step={1}
                      className="rounded-xl border border-slate-200 px-3 py-2"
                      value={s.price}
                      onChange={(e) =>
                        updateService(s.id, { price: Math.max(0, Number(e.target.value) || 0) })
                      }
                    />
                    <select
                      className="rounded-xl border border-slate-200 px-3 py-2"
                      value={s.currency}
                      onChange={(e) => updateService(s.id, { currency: e.target.value as Currency })}
                    >
                      {currencyOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
