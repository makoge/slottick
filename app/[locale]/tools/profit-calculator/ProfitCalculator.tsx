"use client";

import { useEffect, useMemo, useState } from "react";
import { getMessages, t } from "@/lib/i18n";

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

function getLocaleFromPathname(): "en" | "fr" {
  if (typeof window === "undefined") return "en";
  const seg = window.location.pathname.split("/")[1];
  return seg === "fr" ? "fr" : "en";
}

export default function ProfitCalculator() {
  // i18n (client)
  const [messages, setMessages] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    const loc = getLocaleFromPathname();
    getMessages(loc)
      .then(setMessages)
      .catch(() => setMessages(null));
  }, []);

  const tt = (key: string, fallback: string) =>
    messages ? t(messages, key) : fallback;

  // Currency
  const [currency, setCurrency] = useState<"EUR" | "USD" | "GBP" | "XOF">(
    "EUR",
  );

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

  // Preset states
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
      const priceVal = n(p.price);
      const lasts = n(p.lastsFor);
      const uses = n(p.usesNow);
      const cost = lasts > 0 ? (priceVal / lasts) * uses : 0;
      return sum + cost;
    }, 0);
  }, [products]);

  const calc = useMemo(() => {
    const p = n(price);
    const mins = Math.max(1, n(minutes));
    const hours = mins / 60;

    const fee = p * (n(feePct) / 100);
    const revenueNet = p - fee;

    const tax = p * (n(taxPct) / 100);
    const variableCost = n(totalProductCost) + tax;

    const profitPerAppt = revenueNet - variableCost;
    const profitPerHour = profitPerAppt / hours;

    const monthlyProfit = profitPerAppt * n(apptsPerMonth) - n(fixedMonthly);

    const keepRate = 1 - n(feePct) / 100 - n(taxPct) / 100;
    const suggestedPrice =
      keepRate > 0
        ? (n(targetHourly) * hours + n(totalProductCost)) / keepRate
        : 0;

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
  }, [
    price,
    minutes,
    feePct,
    taxPct,
    fixedMonthly,
    apptsPerMonth,
    targetHourly,
    totalProductCost,
  ]);

  type Status = { label: string; tone: "good" | "bad" };

  const status: Status =
    calc.profitPerHour >= n(targetHourly)
      ? { label: tt("profit.ui.status.good", "Good hourly rate"), tone: "good" }
      : {
          label: tt("profit.ui.status.bad", "Underpricing (below target)"),
          tone: "bad",
        };

  async function loadPreset() {
    setLoadingPreset(true);
    setMsg(null);
    try {
      const res = await fetch("/api/tools/profit-preset", {
        cache: "no-store",
      });
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
        if (typeof p.apptsPerMonth === "number")
          setApptsPerMonth(p.apptsPerMonth);
        if (typeof p.targetHourly === "number") setTargetHourly(p.targetHourly);

        if (Array.isArray(p.products)) setProducts(p.products);

        setMsg(tt("profit.ui.msg.loaded", "Loaded defaults"));
      } else {
        setSavedPreset(null);
        setMsg(tt("profit.ui.msg.none", "No saved defaults yet"));
      }
    } catch {
      setMsg(tt("profit.ui.msg.loadFail", "Failed to load defaults"));
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

      setMsg(tt("profit.ui.msg.saved", "Saved defaults"));
      await loadPreset();
    } catch {
      setMsg(tt("profit.ui.msg.saveFail", "Failed to save"));
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

    setMsg(tt("profit.ui.msg.reset", "Reset to saved defaults"));
  }

  useEffect(() => {
    loadPreset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-slate-400/40 bg-white/75 p-6 shadow-xl backdrop-blur-2xl sm:p-9">
      {/* HEADER & PRESET CONTROLS */}
      <div className="flex flex-col gap-6 border-b border-slate-300/70 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-lime-300/80 bg-lime-100 font-mono text-xs font-bold text-lime-950 shadow-xs">
              ✓
            </span>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
              Unit Economics
            </span>
          </div>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            {tt("profit.ui.title", "Profit Calculator")}
          </h2>
          <p className="mt-1 text-xs text-slate-600 sm:text-sm">
            {tt(
              "profit.ui.subtitle",
              "Real profit per appointment, per hour, and monthly.",
            )}
          </p>
        </div>

        {/* Currency & Preset action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as any)}
              className="h-10 rounded-xl border border-slate-300/80 bg-white/90 px-3.5 pr-8 font-mono text-xs font-bold text-slate-900 shadow-xs outline-none focus:border-slate-800"
            >
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
              <option value="XOF">FCFA (XOF)</option>
            </select>
          </div>

          <button
            type="button"
            onClick={loadPreset}
            disabled={loadingPreset || saving}
            className="h-10 rounded-xl border border-slate-300/80 bg-white/80 px-3.5 font-mono text-xs font-semibold text-slate-700 shadow-2xs backdrop-blur-sm transition hover:bg-white active:scale-95 disabled:opacity-50"
          >
            {loadingPreset
              ? tt("profit.ui.loading", "Loading...")
              : tt("profit.ui.loadDefaults", "Defaults")}
          </button>

          <button
            type="button"
            onClick={savePreset}
            disabled={saving || loadingPreset}
            className="h-10 rounded-xl border border-lime-300/80 bg-lime-100 px-3.5 font-mono text-xs font-bold text-lime-950 shadow-xs transition hover:bg-lime-200 active:scale-95 disabled:opacity-50"
          >
            {saving
              ? tt("profit.ui.saving", "Saving...")
              : tt("profit.ui.saveDefaults", "Save")}
          </button>

          <button
            type="button"
            onClick={resetToSaved}
            disabled={!savedPreset || saving || loadingPreset}
            className="h-10 rounded-xl border border-slate-300/80 bg-white/80 px-3.5 font-mono text-xs font-semibold text-slate-700 shadow-2xs backdrop-blur-sm transition hover:bg-white active:scale-95 disabled:opacity-50"
          >
            {tt("profit.ui.reset", "Reset")}
          </button>
        </div>
      </div>

      {msg && (
        <div className="mt-4 rounded-xl border border-slate-300/80 bg-slate-100/80 px-3.5 py-2 font-mono text-xs text-slate-700">
          ℹ {msg}
        </div>
      )}

      {/* CORE PARAMETERS */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field
          label={tt("profit.ui.fields.servicePrice", "Service price")}
          value={price}
          onChange={setPrice}
          prefix={currency}
          required
        />
        <Field
          label={tt("profit.ui.fields.duration", "Duration (minutes)")}
          value={minutes}
          onChange={setMinutes}
          suffix="min"
          required
        />
        <Field
          label={tt("profit.ui.fields.targetHourly", "Target profit / hour")}
          value={targetHourly}
          onChange={setTargetHourly}
          prefix={currency}
        />
        <Field
          label={tt("profit.ui.fields.platformFee", "Platform fee (%)")}
          value={feePct}
          onChange={setFeePct}
          suffix="%"
        />
        <Field
          label={tt("profit.ui.fields.tax", "Tax (%)")}
          value={taxPct}
          onChange={setTaxPct}
          suffix="%"
        />
        <Field
          label={tt("profit.ui.fields.apptsPerMonth", "Monthly clients")}
          value={apptsPerMonth}
          onChange={setApptsPerMonth}
          suffix="appts"
        />
        <div className="sm:col-span-2 lg:col-span-3">
          <Field
            label={tt(
              "profit.ui.fields.fixedMonthly",
              "Monthly fixed costs (rent, salon utilities, software)",
            )}
            value={fixedMonthly}
            onChange={setFixedMonthly}
            prefix={currency}
          />
        </div>
      </div>

      {/* PRODUCTS SECTION */}
      <div className="mt-8 rounded-2xl border border-slate-300/80 bg-slate-100/70 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-bold text-slate-900">
              {tt("profit.ui.products.title", "Products & Materials Used")}
            </div>
            <div className="text-xs text-slate-600">
              {tt(
                "profit.ui.products.subtitle",
                "Add each product and how many clients it lasts. We calculate exact cost per appointment.",
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setProducts((xs) => [
                ...xs,
                {
                  id: uid(),
                  name: `Product ${xs.length + 1}`,
                  price: 0,
                  lastsFor: 1,
                  usesNow: 1,
                },
              ])
            }
            className="inline-flex h-9 items-center justify-center rounded-xl border border-lime-300/80 bg-lime-100 px-3 font-mono text-xs font-bold text-lime-950 shadow-xs transition hover:bg-lime-200 active:scale-95"
          >
            {tt("profit.ui.products.add", "+ Add product")}
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {products.map((p) => {
            const costPerAppt =
              n(p.lastsFor) > 0
                ? (n(p.price) / n(p.lastsFor)) * n(p.usesNow)
                : 0;

            return (
              <div
                key={p.id}
                className="grid grid-cols-1 items-end gap-3 rounded-xl border border-slate-300/70 bg-white/90 p-3.5 shadow-2xs sm:grid-cols-12"
              >
                <label className="sm:col-span-4">
                  <div className="font-mono text-[10px] font-bold uppercase text-slate-500">
                    {tt("profit.ui.products.name", "Product name")}
                  </div>
                  <input
                    className="mt-1 h-9 w-full rounded-lg border border-slate-300/80 bg-white px-3 text-xs font-medium text-slate-900 focus:border-slate-800 focus:outline-none"
                    value={p.name}
                    onChange={(e) =>
                      setProducts((xs) =>
                        xs.map((x) =>
                          x.id === p.id ? { ...x, name: e.target.value } : x,
                        ),
                      )
                    }
                  />
                </label>

                <label className="sm:col-span-2">
                  <div className="font-mono text-[10px] font-bold uppercase text-slate-500">
                    {tt("profit.ui.products.price", "Bottle Cost")}
                  </div>
                  <input
                    type="number"
                    className="mt-1 h-9 w-full rounded-lg border border-slate-300/80 bg-white px-3 font-mono text-xs text-slate-900 focus:border-slate-800 focus:outline-none"
                    value={p.price}
                    onChange={(e) =>
                      setProducts((xs) =>
                        xs.map((x) =>
                          x.id === p.id
                            ? { ...x, price: Number(e.target.value) }
                            : x,
                        ),
                      )
                    }
                  />
                </label>

                <label className="sm:col-span-2">
                  <div className="font-mono text-[10px] font-bold uppercase text-slate-500">
                    {tt("profit.ui.products.lastsFor", "Clients/Pack")}
                  </div>
                  <input
                    type="number"
                    className="mt-1 h-9 w-full rounded-lg border border-slate-300/80 bg-white px-3 font-mono text-xs text-slate-900 focus:border-slate-800 focus:outline-none"
                    value={p.lastsFor}
                    onChange={(e) =>
                      setProducts((xs) =>
                        xs.map((x) =>
                          x.id === p.id
                            ? { ...x, lastsFor: Number(e.target.value) }
                            : x,
                        ),
                      )
                    }
                  />
                </label>

                <label className="sm:col-span-2">
                  <div className="font-mono text-[10px] font-bold uppercase text-slate-500">
                    {tt("profit.ui.products.portion", "Portion Used")}
                  </div>
                  <input
                    type="number"
                    className="mt-1 h-9 w-full rounded-lg border border-slate-300/80 bg-white px-3 font-mono text-xs text-slate-900 focus:border-slate-800 focus:outline-none"
                    value={p.usesNow}
                    onChange={(e) =>
                      setProducts((xs) =>
                        xs.map((x) =>
                          x.id === p.id
                            ? { ...x, usesNow: Number(e.target.value) }
                            : x,
                        ),
                      )
                    }
                  />
                </label>

                <div className="flex items-center justify-between sm:col-span-2 sm:flex-col sm:items-end sm:justify-end">
                  <div className="text-right font-mono text-xs font-bold text-slate-900">
                    {formatMoney(costPerAppt)}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setProducts((xs) => xs.filter((x) => x.id !== p.id))
                    }
                    className="mt-1 font-mono text-[11px] font-semibold text-rose-600 hover:text-rose-800"
                  >
                    {tt("profit.ui.products.remove", "Remove")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-300/80 bg-white px-4 py-3 shadow-2xs">
          <span className="font-mono text-xs font-bold text-slate-700">
            {tt("profit.ui.products.total", "Total Product Cost / Client")}
          </span>
          <span className="font-mono text-base font-extrabold text-slate-900">
            {formatMoney(totalProductCost)}
          </span>
        </div>
      </div>

      {/* HEALTH STATUS INDICATOR */}
      <div
        className={`mt-6 flex flex-col gap-2 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
          status.tone === "good"
            ? "border-lime-300/90 bg-lime-100 text-lime-950"
            : "border-rose-300/80 bg-rose-50/90 text-rose-950"
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/10 font-bold">
            {status.tone === "good" ? "✓" : "!"}
          </span>
          <span className="font-mono text-xs font-bold uppercase tracking-wider">
            {status.label}
          </span>
        </div>
        <div className="font-mono text-xs font-semibold">
          {formatMoney(calc.profitPerHour)}{" "}
          {tt("profit.ui.status.vs", "/ hr vs target")}{" "}
          {formatMoney(targetHourly)}
        </div>
      </div>

      {/* KEY METRICS GRID */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Stat
          title={tt("profit.ui.stats.profitPerAppt", "Profit per appointment")}
          value={formatMoney(calc.profitPerAppt)}
        />
        <Stat
          title={tt("profit.ui.stats.profitPerHour", "Profit per hour")}
          value={formatMoney(calc.profitPerHour)}
        />
        <Stat
          title={tt(
            "profit.ui.stats.monthlyProfit",
            "Monthly profit (after fixed costs)",
          )}
          value={formatMoney(calc.monthlyProfit)}
        />
        <Stat
          title={tt(
            "profit.ui.stats.suggestedPrice",
            "Suggested price for target hourly",
          )}
          value={formatMoney(calc.suggestedPrice)}
          highlighted
        />
      </div>

      {/* UNIT BREAKDOWN FOOTER */}
      <div className="mt-6 rounded-2xl border border-slate-300/80 bg-slate-100/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs text-slate-600">
          <span>
            {tt("profit.ui.breakdown.fee", "Fee")}:{" "}
            <strong className="text-slate-900">{formatMoney(calc.fee)}</strong>
          </span>
          <span>
            {tt("profit.ui.breakdown.tax", "Tax")}:{" "}
            <strong className="text-slate-900">{formatMoney(calc.tax)}</strong>
          </span>
          <span>
            {tt("profit.ui.breakdown.variable", "Variable costs")}:{" "}
            <strong className="text-slate-900">
              {formatMoney(calc.variableCost)}
            </strong>
          </span>
          <span>
            {tt("profit.ui.breakdown.netRevenue", "Net revenue")}:{" "}
            <strong className="text-slate-900">
              {formatMoney(calc.revenueNet)}
            </strong>
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
  prefix,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  required?: boolean;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <label className="block">
      <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700">
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </span>
      <div className="relative mt-1.5 flex items-center">
        {prefix && (
          <span className="pointer-events-none absolute left-3 font-mono text-xs font-semibold text-slate-400">
            {prefix}
          </span>
        )}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`h-11 w-full rounded-xl border border-slate-300/80 bg-white/90 font-mono text-sm font-semibold text-slate-900 shadow-2xs outline-none focus:border-slate-800 focus:bg-white ${
            prefix ? "pl-12" : "pl-3.5"
          } ${suffix ? "pr-12" : "pr-3.5"}`}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 font-mono text-xs font-semibold text-slate-400">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

function Stat({
  title,
  value,
  highlighted,
}: {
  title: string;
  value: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm backdrop-blur-md transition-transform ${
        highlighted
          ? "border-lime-300/90 bg-lime-100/90 text-lime-950"
          : "border-slate-300/80 bg-white/85 text-slate-900"
      }`}
    >
      <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-600">
        {title}
      </div>
      <div className="mt-2 font-mono text-2xl font-extrabold tracking-tight">
        {value}
      </div>
    </div>
  );
}
