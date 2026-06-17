/**
 * Facet-engine voor de categorie- en zoekpagina: leid filterbare attributen
 * (merk, socket, DDR, capaciteit, wattage, …) af uit de productnaam met de
 * bestaande detect-functies, tel de beschikbare waarden, en filter de
 * resultaten client-side. Geen DB-/schemawijziging — alles uit de naam.
 */
import type { ComponentType, PriceResult } from "@/lib/types";
import {
  detectCpu, detectSocket, detectBoardSocket, detectDdr, detectFormFactor, detectPsuWatts, detectRamGb,
} from "./detect";
import { detectBrand } from "./detect-brand";

export type FacetKey =
  | "brand" | "socket" | "gpuChip" | "formFactor" | "ddr"
  | "ramCapacity" | "storageType" | "storageCapacity" | "wattage" | "rating" | "coolingType";

const FACET_LABEL: Record<FacetKey, string> = {
  brand: "Merk",
  socket: "Socket",
  gpuChip: "Chip",
  formFactor: "Form factor",
  ddr: "Geheugentype",
  ramCapacity: "Capaciteit",
  storageType: "Type",
  storageCapacity: "Capaciteit",
  wattage: "Vermogen",
  rating: "80+ certificering",
  coolingType: "Type",
};

/** Welke facetten gelden per categorie (volgorde = weergavevolgorde). */
const CATEGORY_FACETS: Partial<Record<ComponentType, FacetKey[]>> = {
  cpu: ["brand", "socket"],
  gpu: ["brand", "gpuChip"],
  motherboard: ["brand", "socket", "formFactor", "ddr"],
  ram: ["brand", "ddr", "ramCapacity"],
  storage: ["brand", "storageType", "storageCapacity"],
  psu: ["brand", "wattage", "rating"],
  case: ["brand", "formFactor"],
  cooling: ["brand", "coolingType"],
};

export function facetKeysFor(type: ComponentType): FacetKey[] {
  return CATEGORY_FACETS[type] ?? ["brand"];
}

function ratingLabel(name: string): string | null {
  if (!/80\s*\+|80\s*plus/i.test(name)) return null;
  const m = name.match(/\b(titanium|platinum|gold|silver|bronze|white)\b/i);
  return m ? `80+ ${m[1][0].toUpperCase()}${m[1].slice(1).toLowerCase()}` : "80+";
}

function gpuChipLabel(name: string): string | null {
  if (/\b(geforce|rtx|gtx|nvidia)\b/i.test(name)) return "NVIDIA";
  if (/\b(radeon|rx\s?\d{3,4})\b/i.test(name)) return "AMD";
  if (/\b(arc|intel)\b/i.test(name)) return "Intel";
  return null;
}

function storageTypeLabel(name: string): string | null {
  if (/\bhdd\b|harde schijf|7200\s?rpm|5400\s?rpm|barracuda|ironwolf/i.test(name)) return "HDD";
  if (/\bnvme\b|\bm\.?2\b/i.test(name)) return "NVMe SSD";
  if (/\bssd\b|\bsata\b/i.test(name)) return "SATA SSD";
  return null;
}

function coolingTypeLabel(name: string): string | null {
  if (/\baio\b|waterko|liquid|water\s?cool|\bradiator\b|liquid freezer|kraken|galahad/i.test(name)) {
    return "Waterkoeling (AIO)";
  }
  return "Luchtkoeling";
}

function storageCapacityLabel(name: string): string | null {
  const tb = name.match(/(\d+(?:[.,]\d+)?)\s*tb\b/i);
  if (tb) return `${tb[1].replace(",", ".")}TB`;
  const gb = name.match(/(\d{3,4})\s*gb\b/i);
  return gb ? `${gb[1]}GB` : null;
}

/** De facet-waarde(n) van één item voor een facet-key (null = onbekend/n.v.t.). */
function deriveValue(type: ComponentType, key: FacetKey, item: PriceResult): string | null {
  const n = item.name;
  switch (key) {
    case "brand":
      return detectBrand(n);
    case "socket":
      return type === "cpu" ? (detectCpu(n)?.socket ?? detectSocket(n)) : detectBoardSocket(n);
    case "gpuChip":
      return gpuChipLabel(n);
    case "formFactor":
      return detectFormFactor(n);
    case "ddr":
      return detectDdr(n);
    case "ramCapacity": {
      const gb = detectRamGb(n);
      return gb ? `${gb}GB` : null;
    }
    case "storageType":
      return storageTypeLabel(n);
    case "storageCapacity":
      return storageCapacityLabel(n);
    case "wattage": {
      const w = detectPsuWatts(n);
      return w ? `${w}W` : null;
    }
    case "rating":
      return ratingLabel(n);
    case "coolingType":
      return coolingTypeLabel(n);
  }
}

export interface FacetOption {
  value: string;
  count: number;
}
export interface FacetGroup {
  key: FacetKey;
  label: string;
  options: FacetOption[];
}

/** Beschikbare facetgroepen + aantallen, afgeleid uit de huidige resultaten. */
export function getFacetGroups(type: ComponentType, items: PriceResult[]): FacetGroup[] {
  const groups: FacetGroup[] = [];
  for (const key of facetKeysFor(type)) {
    const counts = new Map<string, number>();
    for (const item of items) {
      const v = deriveValue(type, key, item);
      if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    if (counts.size === 0) continue;
    const options = [...counts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, "nl"));
    groups.push({ key, label: FACET_LABEL[key], options });
  }
  return groups;
}

export type FacetSelection = Record<string, string[]>;

/** True als het item aan álle geselecteerde facetgroepen voldoet (OF binnen groep). */
export function itemMatchesFacets(type: ComponentType, item: PriceResult, selected: FacetSelection): boolean {
  for (const [key, values] of Object.entries(selected)) {
    if (!values || values.length === 0) continue;
    const v = deriveValue(type, key as FacetKey, item);
    if (!v || !values.includes(v)) return false;
  }
  return true;
}

export interface PriceTier {
  id: string;
  label: string;
  min: number;
  max: number | null;
}

function tier(min: number, max: number | null): PriceTier {
  const id = `${min}-${max ?? "max"}`;
  const label = max === null ? `€${min}+` : min === 0 ? `< €${max}` : `€${min}–${max}`;
  return { id, label, min, max };
}

export const DEFAULT_PRICE_TIERS: PriceTier[] = [tier(0, 100), tier(100, 250), tier(250, 500), tier(500, null)];

const CATEGORY_TIERS: Partial<Record<ComponentType, PriceTier[]>> = {
  cpu: [tier(0, 100), tier(100, 200), tier(200, 350), tier(350, null)],
  gpu: [tier(0, 300), tier(300, 600), tier(600, 1000), tier(1000, null)],
  motherboard: [tier(0, 120), tier(120, 200), tier(200, 350), tier(350, null)],
  ram: [tier(0, 60), tier(60, 120), tier(120, 250), tier(250, null)],
  storage: [tier(0, 60), tier(60, 120), tier(120, 250), tier(250, null)],
  psu: [tier(0, 80), tier(80, 130), tier(130, 200), tier(200, null)],
  case: [tier(0, 80), tier(80, 150), tier(150, 250), tier(250, null)],
  cooling: [tier(0, 40), tier(40, 80), tier(80, 150), tier(150, null)],
};

export function priceTiersFor(type: ComponentType): PriceTier[] {
  return CATEGORY_TIERS[type] ?? DEFAULT_PRICE_TIERS;
}

/** True als de prijs in minstens één geselecteerde tier valt (leeg = alles). */
export function itemMatchesTiers(item: PriceResult, tiers: PriceTier[], selectedIds: string[]): boolean {
  if (selectedIds.length === 0) return true;
  return tiers.some(
    (t) => selectedIds.includes(t.id) && item.priceEur >= t.min && (t.max === null || item.priceEur < t.max)
  );
}
