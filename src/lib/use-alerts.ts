"use client";

import useSWR from "swr";

export interface AlertRow {
  id: number;
  productId: string;
  name: string;
  category: string;
  targetCents: number;
}

async function fetcher(url: string): Promise<AlertRow[]> {
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = (await res.json()) as { alerts?: AlertRow[] };
  return data.alerts ?? [];
}

/**
 * Server-side prijsalerts van de ingelogde gebruiker. Alleen ophalen wanneer
 * `enabled` (= ingelogd); anders geen request. `alertIds` bevat de productId's
 * (= `watchId`) waarvoor een e-mailalert aanstaat; `alertById` geeft de volledige
 * rij (incl. `targetCents`) per productId zodat de UI de drempel kan tonen/wijzigen.
 */
export function useAlerts(enabled: boolean) {
  const { data, mutate } = useSWR(enabled ? "/api/alerts" : null, fetcher, {
    revalidateOnFocus: false,
  });
  const rows = data ?? [];
  const alertIds = new Set(rows.map((a) => a.productId));
  const alertById = new Map(rows.map((a) => [a.productId, a]));
  return { alertIds, alertById, mutate };
}
