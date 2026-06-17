"use client";

import { useCallback, useState } from "react";
import type { SplitResult } from "@/lib/specs/split-cart";
import type { BuildIndexSummary } from "@/lib/specs/build-index";

export interface BuildPricingPart {
  slot: string;
  name: string;
  url: string;
  retailer: string;
  priceEur: number;
  mock?: boolean;
}

export interface BuildIndexResult {
  points: { day: string; totalCents: number }[];
  partsTracked: number;
  partsTotal: number;
  summary: BuildIndexSummary | null;
}

export interface BuildPricing {
  split: SplitResult | null;
  index: BuildIndexResult | null;
  shippingNote: string;
}

/**
 * On-demand: berekent de slimste verdeling + build-prijsindex voor de huidige
 * build. Bewust niet automatisch op elke buildwijziging (scheelt DB-reads en
 * voorkomt geflikker tijdens het samenstellen) — de gebruiker drukt op een knop.
 */
export function useBuildPricing() {
  const [data, setData] = useState<BuildPricing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const run = useCallback(async (parts: BuildPricingPart[]) => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/build-pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parts }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setData((await res.json()) as BuildPricing);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, run };
}
