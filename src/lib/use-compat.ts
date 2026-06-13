"use client";

import useSWR from "swr";
import type { BuildComponents } from "@/lib/store/build";
import type { CompatData } from "@/lib/specs/compat-types";

const EMPTY: CompatData = { gpu: null, case: null, cooler: null };

async function fetcher(url: string): Promise<CompatData> {
  const res = await fetch(url);
  if (!res.ok) return EMPTY;
  return res.json();
}

/**
 * Haalt de fysieke maten op die bij de videokaart/behuizing/koeler in de build
 * horen (via /api/compat), zodat analyzeBuild() lengte- en hoogtechecks kan doen.
 * Server-side matching → de ~1 MB datasets blijven uit de client-bundle.
 */
export function useCompat(components: BuildComponents): CompatData {
  const gpu = components.gpu?.name ?? "";
  const caseName = components.case?.name ?? "";
  const cooler = components.cooling?.name ?? "";
  const key =
    gpu || caseName || cooler
      ? `/api/compat?gpu=${encodeURIComponent(gpu)}&case=${encodeURIComponent(caseName)}&cooler=${encodeURIComponent(cooler)}`
      : null;
  const { data } = useSWR<CompatData>(key, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 86_400_000,
  });
  return data ?? EMPTY;
}
