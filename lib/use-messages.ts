// lib/use-messages.ts
"use client";

import { useMemo } from "react";
import en from "@/messages/en.json";
import fr from "@/messages/fr.json";

type Dict = Record<string, any>;

export function useMessages(locale?: string): Dict {
  return useMemo(() => {
    const l = String(locale || "en").toLowerCase();
    if (l === "fr") return fr as Dict;
    return en as Dict;
  }, [locale]);
}
