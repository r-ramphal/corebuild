"use client";

import useSWR from "swr";

export interface PricePoint {
  day: string;
  priceCents: number;
}

async function fetcher(urls: string[]): Promise<PricePoint[]> {
  const res = await fetch("/api/price-history", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ urls }),
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { points?: PricePoint[] };
  return data.points ?? [];
}

/**
 * Haalt het prijsverloop (laagste prijs per dag) op voor de aanbiedings-urls
 * van het huidige product. Geeft een lege lijst zolang er nog te weinig
 * metingen zijn — de aanroeper verbergt de grafiek dan.
 */
export function usePriceHistory(urls: string[]): PricePoint[] {
  const sorted = [...urls].sort();
  const key = sorted.length > 0 ? ["price-history", sorted.join("|")] : null;
  const { data } = useSWR(key, () => fetcher(sorted), {
    revalidateOnFocus: false,
    dedupingInterval: 3_600_000,
  });
  return data ?? [];
}
