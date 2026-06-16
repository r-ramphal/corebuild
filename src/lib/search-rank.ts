/**
 * Relevantie-ranking voor zoekresultaten.
 *
 * `/api/search` gaf resultaten puur op prijs asc terug, waardoor een vaag maar
 * goedkoop product bovenaan kon staan in plaats van de beste match op de
 * zoekvraag. `rankResults` ordent op relevantie: hoeveel van de getypte woorden
 * in de naam zitten, of het herkende model exact overeenkomt (hergebruikt de
 * modeldetectie uit specs/detect), en of het op voorraad is. Prijs blijft de
 * tiebreaker. Puur en deterministisch → de edge-cache per (q+cat) blijft geldig.
 */
import type { PriceResult } from "./types";
import { detectCpu, detectGpu } from "./specs/detect";

/** Normaliseer naar losse tokens (≥2 tekens), zonder leestekens. */
function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

/** Aandeel van de query-woorden dat in de naam voorkomt (0..1). */
function tokenOverlap(queryTokens: string[], nameNorm: string): number {
  if (queryTokens.length === 0) return 0;
  let hit = 0;
  for (const t of queryTokens) {
    if (nameNorm.includes(t)) hit++;
  }
  return hit / queryTokens.length;
}

/**
 * Relevantiescore. Hoger = relevanter. Token-overlap weegt het zwaarst; een
 * exacte modeltreffer (bv. query "rtx 5070" ↔ een echte RTX 5070, niet de Ti)
 * geeft een stevige bonus; op voorraad een kleine bonus.
 */
function scoreItem(
  item: PriceResult,
  queryTokens: string[],
  qCpuLabel: string | null,
  qGpuLabel: string | null
): number {
  const nameNorm = tokenize(item.name).join(" ");
  let score = tokenOverlap(queryTokens, nameNorm) * 3;

  if (qGpuLabel) {
    const g = detectGpu(item.name);
    if (g) score += g.label === qGpuLabel ? 2 : 0.4;
  } else if (qCpuLabel) {
    const c = detectCpu(item.name);
    if (c) score += c.label === qCpuLabel ? 2 : 0.4;
  }

  if (item.inStock) score += 0.3;
  return score;
}

/**
 * Sorteer resultaten op relevantie t.o.v. `query`, prijs als tiebreaker.
 * Geeft een nieuwe array terug (muteert de input niet).
 */
export function rankResults(results: PriceResult[], query: string): PriceResult[] {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) {
    return [...results].sort((a, b) => a.priceEur - b.priceEur);
  }

  const qCpuLabel = detectCpu(query)?.label ?? null;
  const qGpuLabel = detectGpu(query)?.label ?? null;

  return results
    .map((item) => ({ item, score: scoreItem(item, queryTokens, qCpuLabel, qGpuLabel) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.item.inStock !== b.item.inStock) return a.item.inStock ? -1 : 1;
      return a.item.priceEur - b.item.priceEur;
    })
    .map((x) => x.item);
}
