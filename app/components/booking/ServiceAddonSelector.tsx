"use client";

import React from "react";
import { formatMoney } from "@/lib/services";

export type ServiceItem = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  currency: string;
  durationMin: number;
  isAddon?: boolean;
  parentServiceIds?: string[];
};

type Props = {
  currency: string;
  primaryService: ServiceItem;
  availableAddons: ServiceItem[];
  selectedAddonIds: string[];
  onToggleAddon: (addon: ServiceItem) => void;
  onProceed: () => void;
  onBack: () => void;
};

export default function ServiceAddonSelector({
  currency,
  primaryService,
  availableAddons,
  selectedAddonIds,
  onToggleAddon,
  onProceed,
  onBack,
}: Props) {
  // Filter add-ons matching this service or universal add-ons
  const relevantAddons = availableAddons.filter((addon) => {
    if (!addon.parentServiceIds || addon.parentServiceIds.length === 0) {
      return true; // Universal upsell
    }
    return addon.parentServiceIds.includes(primaryService.id);
  });

  const selectedAddons = relevantAddons.filter((a) =>
    selectedAddonIds.includes(a.id),
  );

  const totalDuration =
    primaryService.durationMin +
    selectedAddons.reduce((acc, a) => acc + a.durationMin, 0);

  const totalPrice =
    primaryService.price + selectedAddons.reduce((acc, a) => acc + a.price, 0);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header Ledger */}
      <div className="border-b border-[#DCD3C4] pb-4">
        <div className="font-mono text-[11px] uppercase tracking-widest text-[#7C6E5E]">
          ✦ Atelier Enhancement Selection ✦
        </div>
        <h2 className="mt-1 font-serif text-2xl text-[#1E1915]">
          Enhance Your Experience
        </h2>
        <p className="mt-1 font-serif text-xs italic text-[#736555]">
          Select optional apothecary rituals and finishing treatments to
          complement your {primaryService.name}.
        </p>
      </div>

      {/* Selected Base Service Summary Pill */}
      <div className="flex items-center justify-between rounded-xl border border-[#DFD6C7] bg-[#F7F2E9] p-4 font-mono text-xs">
        <div>
          <span className="text-[#8C6D2B] font-bold uppercase">
            Primary Service:{" "}
          </span>
          <span className="font-bold text-[#1E1915]">
            {primaryService.name}
          </span>
          <span className="ml-2 text-[#7C6E5E]">
            ({primaryService.durationMin} min)
          </span>
        </div>
        <div className="font-bold text-[#1E1915]">
          {formatMoney(primaryService.price, (currency as any) || "EUR")}
        </div>
      </div>

      {/* Add-On Upsell Options List */}
      <div className="space-y-3">
        {relevantAddons.length === 0 ? (
          <p className="font-mono text-xs italic text-[#8A7C6E]">
            No add-ons available for this treatment.
          </p>
        ) : (
          relevantAddons.map((addon) => {
            const isSelected = selectedAddonIds.includes(addon.id);

            return (
              <div
                key={addon.id}
                onClick={() => onToggleAddon(addon)}
                className={`group flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition-all select-none ${
                  isSelected
                    ? "border-[#251E18] bg-[#FAF8F5] shadow-sm ring-1 ring-[#251E18]"
                    : "border-[#DFD6C7] bg-white hover:border-[#8C6D2B]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-lg border font-mono text-xs transition ${
                      isSelected
                        ? "border-[#251E18] bg-[#251E18] text-white"
                        : "border-[#CEC1AF] bg-[#FAF8F5] text-transparent group-hover:border-[#8C6D2B]"
                    }`}
                  >
                    ✓
                  </div>
                  <div>
                    <h3 className="font-serif text-sm font-bold text-[#1E1915]">
                      {addon.name}
                    </h3>
                    {addon.description && (
                      <p className="mt-0.5 font-sans text-xs text-[#736555]">
                        {addon.description}
                      </p>
                    )}
                    <span className="font-mono text-[10px] uppercase text-[#8C6D2B]">
                      +{addon.durationMin} mins
                    </span>
                  </div>
                </div>

                <div className="font-mono text-xs font-bold text-[#1E1915]">
                  +{formatMoney(addon.price, (currency as any) || "EUR")}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Dynamic Total Ledger Dock */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[#D5C9B8] bg-[#251E18] p-5 text-[#FAF6F0] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-[#D5C9B8]">
            Estimated Time & Investment
          </div>
          <div className="mt-0.5 font-serif text-lg">
            {formatMoney(totalPrice, (currency as any) || "EUR")}{" "}
            <span className="font-mono text-xs text-[#C5B8A5]">
              • {totalDuration} minutes total
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl border border-[#7C6E5E] px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-[#FAF6F0] hover:bg-[#3D3228]"
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={onProceed}
            className="rounded-xl bg-[#FAF6F0] px-5 py-2 font-mono text-xs font-bold uppercase tracking-wider text-[#251E18] hover:bg-white transition"
          >
            Select Schedule →
          </button>
        </div>
      </div>
    </div>
  );
}
