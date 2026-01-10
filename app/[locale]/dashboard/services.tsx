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

function toCurrency(x: unknown): Currency {
  const s = String(x ?? "EUR").toUpperCase();
  return s === "EUR" || s === "USD" || s === "FCFA" ? (s as Currency) : "EUR";
}

function toPositiveInt(x: string, fallback = 0) {
  const n = Number(x);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.floor(n));
}

export default function ServicesEditor() {
  const [services, setServices] = useState<Service[]>([]);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // add form
  const [name, setName] = useState("");
  const [durationMin, setDurationMin] = useState<number>(60);
  const [priceText, setPriceText] = useState<string>("50"); // ✅ text => no spinners
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
            name: String(s.name ?? ""),
            durationMin: Number(s.durationMin ?? 0),
            price: Number(s.price ?? 0),
            currency: toCurrency(s.currency),
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
        body: JSON.stringify({ services: next }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Failed to save services");
        return;
      }

      if (Array.isArray(data.services)) {
        const mapped: Service[] = (data.services as DbService[]).map((s) => ({
          id: String(s.id),
          name: String(s.name ?? ""),
          durationMin: Number(s.durationMin ?? 0),
          price: Number(s.price ?? 0),
          currency: toCurrency(s.currency),
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

    const price = toPositiveInt(priceText, 0);

    const next: Service[] = [
      {
        id: crypto.randomUUID(),
        name: cleanName,
        durationMin: Math.max(5, Number(durationMin) || 5),
        price,
        currency,
      },
      ...services,
    ];

    persist(next);

    setName("");
    setDurationMin(60);
    setPriceText("50");
    setCurrency("EUR");
  }

  // ✅ Only allow editing name + duration. Price/currency are locked after creation.
  function updateService(id: string, patch: Pick<Service, "name" | "durationMin">) {
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
        Add your services with duration and price. Price + currency are locked after you create the
        service.
      </p>

      {error ? (
        <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      {/* Add form */}
      <form onSubmit={addService} className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4">
  <div className="grid min-w-0 gap-3 sm:grid-cols-2">
    <label className="grid min-w-0 gap-1 text-sm">
      Service name
      <input
        className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Haircut"
        required
        disabled={loading || saving}
      />
    </label>

    <label className="grid min-w-0 gap-1 text-sm">
      Duration (minutes)
      <input
        type="number"
        min={5}
        step={5}
        className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2"
        value={durationMin}
        onChange={(e) => setDurationMin(Number(e.target.value))}
        disabled={loading || saving}
      />
    </label>
  </div>

  <div className="grid min-w-0 gap-3 sm:grid-cols-[2fr_1fr]">
    <label className="grid min-w-0 gap-1 text-sm">
      Price
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-3 text-lg font-semibold"
        value={priceText}
        onChange={(e) => setPriceText(e.target.value.replace(/[^\d]/g, ""))}
        disabled={loading || saving}
      />
    </label>

    <label className="grid min-w-0 gap-1 text-sm">
      Currency
      <select
        className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-3 text-base font-medium"
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
    className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 sm:w-fit"
  >
    Add service
  </button>
</form>

      {/* List */}
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

              {/* ✅ Inline edit: name + duration only. Price + currency locked (read-only). */}
              <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-3">

                <label className="grid gap-1 text-sm">
                  Name
                  <input
                    className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2"
                    value={s.name}
                    onChange={(e) => updateService(s.id, { name: e.target.value, durationMin: s.durationMin })}
                    disabled={saving}
                  />
                </label>

                <label className="grid gap-1 text-sm">
                  Duration
                  <input
                    type="number"
                    min={5}
                    step={5}
                    className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2"
                    value={s.durationMin}
                    onChange={(e) =>
                      updateService(s.id, {
                        name: s.name,
                        durationMin: Math.max(5, Number(e.target.value) || 5),
                      })
                    }
                    disabled={saving}
                  />
                </label>

                <div className="grid gap-1 text-sm">
                  <div>Price</div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-lg font-semibold break-words">
                  {formatMoney(s.price, s.currency)}
                       </div>

                  
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
