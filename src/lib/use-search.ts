"use client";

import useSWR from "swr";
import type { SearchResults } from "@/lib/types";

/**
 * Gedeelde SWR-fetcher. Ook gebruikt door `preload()` (builder-prefetch op hover),
 * zodat de cache-key + fetcher identiek zijn aan die van `useSearch`.
 */
export async function searchFetcher(url: string): Promise<SearchResults> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Zoeken mislukt (HTTP ${res.status})`);
  return res.json();
}

export interface UseSearchResult {
  results: SearchResults | null;
  loading: boolean;
}

/**
 * Haalt zoekresultaten op via SWR. `url` is `null` wanneer er (nog) niets te
 * zoeken valt — dan wordt er niet gefetcht. SWR dedupet en cachet, dus dezelfde
 * zoekterm/categorie opnieuw openen is meteen klaar. Bij een fout tonen we een
 * leeg-resultaat zodat de "geen resultaten"-UI verschijnt i.p.v. blijven laden.
 */
export function useSearch(url: string | null, fallbackQuery = ""): UseSearchResult {
  const { data, error, isLoading } = useSWR(url, searchFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });

  const results: SearchResults | null =
    data ?? (error ? { query: fallbackQuery, results: [], errors: [] } : null);

  return { results, loading: isLoading };
}
