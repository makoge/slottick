"use client";

import { useEffect, useState } from "react";
import { Currency, Service, formatMoney } from "@/lib/services";

const currencyOptions: Currency[] = ["EUR", "USD", "FCFA"];

type DbService = {
  id: string;
  name: string;
  durationMin: number;
  price: number;
  currency: string;
};

export default function ServicesEditor() {
  const [services, setServices] = useState<Service[]>([]);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // add form
  const [name, setName] = useState("");
  const [durationMin, setDurationMin] = useState<number>(60);
  const [price, setPrice] = useState<number>(50);
  const [currency, setCurrency] = useState<Currency>("EUR");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/services", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setServices([]);
        setError(data.error || "Failed to load services");
        return;
      }

      const mapped: Service[] = Array.isArray(data.services)
        ? (data.services as DbService[]).map((s) => ({
            id: String(s.id),
            name: String(s.name),
            durationMin: Number(s.durationMin),
            price: Number(s.price),
            currency: String(s.currency) as Currency
          }))
        : [];

      setServices(mapped);
    } catch {
      setError("Network error loading services");
      setServices([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await load();
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function persist(next: Service[]) {
    setServices(next);
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const res = await fetch("/api/services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ services: next })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Failed to save services");
        return;
      }

      // trust server as source of truth (ids etc)
      if (Array.isArray(data.services)) {
        const mapped: Service[] = (data.services as DbService[]).map((s) => ({
          id: String(s.id),
          name: String(s.name),
          durationMin: Number(s.durationMin),
          price: Number(s.price),
          currency: String(s.currency) as Currency
        }));
        setServices(mapped);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 1200);
    } catch {
      setError("Network error saving services");
    } finally {
      setSaving(false);
    }
  }

  function addService(e: React.FormEvent) {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;

    const next: Service[] = [
      {
        id: crypto.randomUUID(), // temp client id; server will replace
        name: cleanName,
        durationMin: Math.max(5, Number(durationMin) || 5),
        price: Math.max(0, Number(price) || 0),
        currency
      },
      ...services
    ];

    persist(next);

    setName("");
    setDurationMin(60);
    setPrice(50);
    setCurrency("EUR");
  }

  function updateService(id: string, patch: Partial<Service>) {
    const next = services.map((s) => (s.id === id ? { ...s, ...patch } : s));
    persist(next);
  }

  function deleteService(id: string) {
    const next = services.filter((s) => s.id !== id);
    persist(next);
  }

  return (
    <section className="rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Services</h2>
        <span className="text-sm text-slate-600">
          {loading ? "Loading..." : saving ? "Saving..." : saved ? "Saved ✓" : ""}
        </span>
      </div>

      <p className="mt-2 text-sm text-slate-600">
        Add your services with duration and price. Currency can be EUR, USD, or FCFA (for now).
      </p>

      {error ? (
        <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <form onSubmit={addService} className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            Service name
            <input
              className="rounded-xl border border-slate-200 px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Haircut"
              required
              disabled={loading || saving}
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
              disabled={loading || saving}
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
              disabled={loading || saving}
            />
          </label>

          <label className="grid gap-1 text-sm">
            Currency
            <select
              className="rounded-xl border border-slate-200 px-3 py-2"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              disabled={loading || saving}
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
          disabled={loading || saving}
          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          Add service
        </button>
      </form>

      <div className="mt-5 grid gap-3">
        {loading ? (
          <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-600">
            Loading services...
          </div>
        ) : services.length === 0 ? (
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
                  disabled={saving}
                  className="w-fit rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60"
                >
                  Delete
                </button>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <label className="grid gap-1 text-sm">
                  Name
                  <input
                    className="rounded-xl border border-slate-200 px-3 py-2"
                    value={s.name}
                    onChange={(e) => updateService(s.id, { name: e.target.value })}
                    disabled={saving}
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
                    disabled={saving}
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
                      disabled={saving}
                    />
                    <select
                      className="rounded-xl border border-slate-200 px-3 py-2"
                      value={s.currency}
                      onChange={(e) =>
                        updateService(s.id, { currency: e.target.value as Currency })
                      }
                      disabled={saving}
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
