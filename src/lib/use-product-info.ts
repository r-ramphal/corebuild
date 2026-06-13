"use client";

import useSWR from "swr";

interface ProductInfoResponse {
  description: string | null;
  source?: string;
}

async function fetcher(url: string): Promise<ProductInfoResponse> {
  const res = await fetch(url);
  if (!res.ok) return { description: null };
  return res.json();
}

/**
 * Haalt de retailer-eigen productomschrijving op (via /api/product-info).
 * `offerUrl` is de productpagina van de goedkoopste scrapebare aanbieding.
 * Geeft null zolang er niets (bruikbaars) is.
 */
export function useProductInfo(offerUrl: string | null) {
  const key = offerUrl ? `/api/product-info?url=${encodeURIComponent(offerUrl)}` : null;
  const { data } = useSWR<ProductInfoResponse>(key, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 86_400_000,
  });
  return data?.description ? { description: data.description, source: data.source } : null;
}
