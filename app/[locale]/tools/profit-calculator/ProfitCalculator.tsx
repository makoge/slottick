"use client";

"use client";

import { useEffect, useMemo, useState } from "react";

type ProductRow = {
  id: string;
  name: string;
  price: number; // in selected currency
  lastsFor: number; // clients
  usesNow: number; // how many "client-uses" this appointment (default 1)
};

const uid = () => Math.random().toString(36).slice(2, 10);

function n(x: unknown) {
  const v = typeof x === "number" ? x : Number(x);
  return Number.isFinite(v) ? v : 0;
}

export default function ProfitCalculator() {
  // Currency
  const [currency, setCurrency] = useState<"EUR" | "USD" | "GBP" | "XOF">("EUR");

  const formatMoney = (x: number) =>
    new Intl.NumberFormat("en", { style: "currency", currency }).format(n(x));

  // Main inputs
  const [price, setPrice] = useState(50);
  const [minutes, setMinutes] = useState(60);
  const [feePct, setFeePct] = useState(0);
  const [taxPct, setTaxPct] = useState(0);
  const [fixedMonthly, setFixedMonthly] = useState(0);
  const [apptsPerMonth, setApptsPerMonth] = useState(40);
  const [targetHourly, setTargetHourly] = useState(40);
  const [loadingPreset, setLoadingPreset] = useState(true);
const [saving, setSaving] = useState(false);
const [savedPreset, setSavedPreset] = useState<any>(null);
const [msg, setMsg] = useState<string | null>(null);

  // Products list
  const [products, setProducts] = useState<ProductRow[]>([
    { id: uid(), name: "Hair oil", price: 12, lastsFor: 40, usesNow: 1 },
  ]);

  const totalProductCost = useMemo(() => {
    return products.reduce((sum, p) => {
      const price = n(p.price);
      const lasts = n(p.lastsFor);
      const uses = n(p.usesNow);
      const cost = lasts > 0 ? (price / lasts) * uses : 0;
      return sum + cost;
    }, 0);
  }, [products]);

  const calc = useMemo(() => {
    const p = n(price);
    const mins = Math.max(1, n(minutes));
    const hours = mins / 60;

    const fee = p * (n(feePct) / 100);
    const revenueNet = p - fee;

    // tax modeled as % of price (simple approximation)
    const tax = p * (n(taxPct) / 100);

    const variableCost = n(totalProductCost) + tax;

    const profitPerAppt = revenueNet - variableCost;
    const profitPerHour = profitPerAppt / hours;

    const monthlyProfit = profitPerAppt * n(apptsPerMonth) - n(fixedMonthly);

    // suggested price to hit target hourly profit
    // targetHourly*hours = (price - price*feePct) - (productCost + price*taxPct)
    // => targetHourly*hours + productCost = price*(1 - feePct - taxPct)
    const keepRate = 1 - n(feePct) / 100 - n(taxPct) / 100;
    const suggestedPrice =
      keepRate > 0 ? (n(targetHourly) * hours + n(totalProductCost)) / keepRate : 0;

      
    return {
      hours,
      fee,
      revenueNet,
      tax,
      variableCost,
      profitPerAppt,
      profitPerHour,
      monthlyProfit,
      suggestedPrice,
    };
  }, [price, minutes, feePct, taxPct, fixedMonthly, apptsPerMonth, targetHourly, totalProductCost]);


type Status = { label: string; tone: "good" | "bad" };

const status: Status =
  calc.profitPerHour >= n(targetHourly)
    ? { label: "Good hourly rate", tone: "good" }
    : { label: "Underpricing (below target)", tone: "bad" };

    async function loadPreset() {
  setLoadingPreset(true);
  setMsg(null);
  try {
    const res = await fetch("/api/tools/profit-preset", { cache: "no-store" });
    const data = await res.json();

    if (data?.preset) {
      const p = data.preset;
      setSavedPreset(p);

      if (p.currency) setCurrency(p.currency);
      if (typeof p.price === "number") setPrice(p.price);
      if (typeof p.minutes === "number") setMinutes(p.minutes);
      if (typeof p.feePct === "number") setFeePct(p.feePct);
      if (typeof p.taxPct === "number") setTaxPct(p.taxPct);
      if (typeof p.fixedMonthly === "number") setFixedMonthly(p.fixedMonthly);
      if (typeof p.apptsPerMonth === "number") setApptsPerMonth(p.apptsPerMonth);
      if (typeof p.targetHourly === "number") setTargetHourly(p.targetHourly);

      if (Array.isArray(p.products)) setProducts(p.products);

      setMsg("Loaded defaults");
    } else {
      setSavedPreset(null);
      setMsg("No saved defaults yet");
    }
  } catch {
    setMsg("Failed to load defaults");
  } finally {
    setLoadingPreset(false);
  }
}

async function savePreset() {
  setSaving(true);
  setMsg(null);
  try {
    const res = await fetch("/api/tools/profit-preset", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        currency,
        price,
        minutes,
        feePct,
        taxPct,
        fixedMonthly,
        apptsPerMonth,
        targetHourly,
        products,
      }),
    });

    if (!res.ok) throw new Error("save failed");

    setMsg("Saved defaults");
    await loadPreset();
  } catch {
    setMsg("Failed to save");
  } finally {
    setSaving(false);
  }
}

function resetToSaved() {
  if (!savedPreset) return;
  const p = savedPreset;

  setCurrency(p.currency ?? "EUR");
  setPrice(p.price ?? 0);
  setMinutes(p.minutes ?? 60);
  setFeePct(p.feePct ?? 0);
  setTaxPct(p.taxPct ?? 0);
  setFixedMonthly(p.fixedMonthly ?? 0);
  setApptsPerMonth(p.apptsPerMonth ?? 0);
  setTargetHourly(p.targetHourly ?? 0);
  setProducts(Array.isArray(p.products) ? p.products : []);

  setMsg("Reset to saved defaults");
}

useEffect(() => {
  loadPreset();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);


  return (
    <div className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-[0_30px_90px_-60px_rgba(15,23,42,0.35)] ring-1 ring-slate-200">
      <div className="flex flex-wrap items-start justify-between gap-4">
  <div>
    <h2 className="text-2xl font-bold text-slate-900">Profit Calculator</h2>
    <p className="mt-1 text-slate-600">
      Real profit per appointment, per hour, and monthly.
    </p>
  </div>

  {/* right side controls */}
  <div className="flex flex-wrap items-end justify-end gap-2">
    <label className="grid gap-1 w-full sm:w-auto sm:mr-2">
      <span className="text-sm font-medium text-slate-700">Currency</span>
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value as any)}
        className="h-11 w-full sm:w-[170px] rounded-2xl border border-slate-300 bg-white px-4 text-slate-900 shadow-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
      >
        <option value="EUR">EUR (€)</option>
        <option value="USD">USD ($)</option>
        <option value="GBP">GBP (£)</option>
        <option value="XOF">FCFA (XOF)</option>
      </select>
    </label>

    <button
      type="button"
      onClick={loadPreset}
      disabled={loadingPreset || saving}
      className="h-11 rounded-2xl bg-white px-4 text-sm font-semibold ring-1 ring-slate-200 disabled:opacity-50 text-slate-900"
    >
      {loadingPreset ? "Loading..." : "Load defaults"}
    </button>

    <button
      type="button"
      onClick={savePreset}
      disabled={saving || loadingPreset}
      className="h-11 rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white disabled:opacity-50"
    >
      {saving ? "Saving..." : "Save defaults"}
    </button>

    <button
      type="button"
      onClick={resetToSaved}
      disabled={!savedPreset || saving || loadingPreset}
      className="h-11 rounded-2xl bg-white px-4 text-sm font-semibold ring-1 ring-slate-200 disabled:opacity-50 text-slate-900"
    >
      Reset
    </button>
  </div>
</div>

      {/* MAIN INPUTS */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Field label="Service price" value={price} onChange={setPrice} required/>
        <Field label="Duration (minutes)" value={minutes} onChange={setMinutes} required/>
        <Field label="Platform fee (%)" value={feePct} onChange={setFeePct} />
        <Field label="Tax (%)" value={taxPct} onChange={setTaxPct} />
        <Field label="Monthly fixed costs(rent, utilities)" value={fixedMonthly} onChange={setFixedMonthly} />
        <Field label="Appointments(number of clients) / month" value={apptsPerMonth} onChange={setApptsPerMonth} />
        <Field label="Target profit / hour" value={targetHourly} onChange={setTargetHourly} />
      </div>
      {msg ? <div className="mt-3 text-sm text-slate-600">{msg}</div> : null}

      {/* PRODUCTS */}
      <div className="mt-6 rounded-3xl bg-white p-4 ring-1 ring-slate-200">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">Products used</div>
            <div className="text-xs text-slate-600">
              Add each product and how many clients it lasts. We’ll calculate cost per appointment.
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setProducts((xs) => [
                ...xs,
                { id: uid(), name: `Product ${xs.length + 1}`, price: 0, lastsFor: 1, usesNow: 1 },
              ])
            }
            className="h-9 rounded-2xl bg-slate-900 px-3 text-sm font-semibold text-white"
          >
            + Add product
          </button>
        </div>

        <div className="mt-4 grid gap-3">
          {products.map((p) => {
            const costPerAppt = n(p.lastsFor) > 0 ? (n(p.price) / n(p.lastsFor)) * n(p.usesNow) : 0;

            return (
              <div
                key={p.id}
                className="grid gap-2 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200 md:grid-cols-12 md:items-end"
              >
                <label className="md:col-span-3">
                  <div className="text-xs font-medium text-slate-700">Name</div>
                  <input
                    className="mt-1 h-10 w-full rounded-2xl border border-slate-300 bg-white px-3 text-slate-900 shadow-sm focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                    value={p.name}
                    onChange={(e) =>
                      setProducts((xs) =>
                        xs.map((x) => (x.id === p.id ? { ...x, name: e.target.value } : x))
                      )
                    }
                  />
                </label>

                <label className="md:col-span-2">
                  <div className="text-xs font-medium text-slate-700">Price</div>
                  <input
                    type="number"
                    className="mt-1 h-10 w-full rounded-2xl border border-slate-300 bg-white px-3 text-slate-900 shadow-sm focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                    value={p.price}
                    onChange={(e) =>
                      setProducts((xs) =>
                        xs.map((x) => (x.id === p.id ? { ...x, price: Number(e.target.value) } : x))
                      )
                    }
                  />
                </label>

                <label className="md:col-span-3">
                  <div className="text-xs font-medium text-slate-700">Lasts for how many clients</div>
                  <input
                    type="number"
                    className="mt-1 h-10 w-full rounded-2xl border border-slate-300 bg-white px-3 text-slate-900 shadow-sm focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                    value={p.lastsFor}
                    onChange={(e) =>
                      setProducts((xs) =>
                        xs.map((x) => (x.id === p.id ? { ...x, lastsFor: Number(e.target.value) } : x))
                      )
                    }
                  />
                </label>

                <label className="md:col-span-2">
                  <div className="text-xs font-medium text-slate-700">portion used now</div>
                  <input
                    type="number"
                    className="mt-1 h-10 w-full rounded-2xl border border-slate-300 bg-white px-3 text-slate-900 shadow-sm focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                    value={p.usesNow}
                    onChange={(e) =>
                      setProducts((xs) =>
                        xs.map((x) => (x.id === p.id ? { ...x, usesNow: Number(e.target.value) } : x))
                      )
                    }
                  />
                </label>

                <div className="md:col-span-2">
                  <div className="text-xs font-medium text-slate-700">Cost / appt</div>
                  <div className="mt-1 h-10 rounded-2xl bg-white px-3 text-sm font-semibold leading-10 ring-1 text-slate-900">
                    {formatMoney(costPerAppt)}
                  </div>
                </div>

                <div className="md:col-span-12 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setProducts((xs) => xs.filter((x) => x.id !== p.id))}
                    className="text-xs font-semibold text-slate-900 hover:text-slate-900"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-900 px-4 py-3 text-white">
          <span className="text-sm">Total product cost per appointment</span>
          <span className="text-lg font-bold ">{formatMoney(totalProductCost)}</span>
        </div>
      </div>

      <div
  className={[
    "mt-6 flex items-center justify-between rounded-2xl px-4 py-3 ring-1",
    status.tone === "good"
      ? "bg-emerald-50 text-emerald-900 ring-emerald-200"
      : "bg-rose-50 text-rose-900 ring-rose-200",
  ].join(" ")}
>
  <span className="text-sm font-semibold">{status.label}</span>
  <span className="text-sm">
    {formatMoney(calc.profitPerHour)} / hour vs target {formatMoney(targetHourly)}
  </span>
</div>

      {/* RESULTS */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Stat title="Profit per appointment" value={formatMoney(calc.profitPerAppt)} />
        <Stat title="Profit per hour" value={formatMoney(calc.profitPerHour)} />
        <Stat title="Monthly profit (after fixed costs)" value={formatMoney(calc.monthlyProfit)} />
        <Stat title="Suggested price for target hourly" value={formatMoney(calc.suggestedPrice)} />
      </div>

      

      {/* BREAKDOWN */}
      <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 ring-1 ring-slate-200">
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <span>
            Fee: <b>{formatMoney(calc.fee)}</b>
          </span>
          <span>
            Tax: <b>{formatMoney(calc.tax)}</b>
          </span>
          <span>
            Variable cost: <b>{formatMoney(calc.variableCost)}</b>
          </span>
          <span>
            Net revenue: <b>{formatMoney(calc.revenueNet)}</b>
          </span>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-medium text-slate-700">
  {label}
  {required && <span className="ml-1 text-rose-500">*</span>}
</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-11 rounded-2xl border border-slate-200 px-4 outline-none  focus:border-slate-400 text-slate-900"
      />
    </label>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
      <div className="text-sm text-slate-600">{title}</div>
      <div className="mt-1 text-2xl font-bold text-emerald-100">{value}</div>
    </div>
  );
}