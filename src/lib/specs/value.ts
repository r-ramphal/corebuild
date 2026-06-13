/**
 * Prijs-prestatie (de USP): hoeveel prestatie krijg je per euro?
 *
 * Combineert de prijsdata met de prestatie-index uit de spec-engine. Voor
 * CPU's en GPU's kunnen we zo de béste deal qua bang-for-buck aanwijzen —
 * niet simpelweg de goedkoopste, maar de meeste prestatie per euro.
 */
import { detectCpu, detectGpu } from "./detect";
import type { ComponentType } from "@/lib/types";

/** Prestatie-index (0–100) van een product, als de categorie dat ondersteunt. */
export function perfIndex(name: string, category: ComponentType): number | null {
  if (category === "gpu") return detectGpu(name)?.index ?? null;
  if (category === "cpu") return detectCpu(name)?.gamingIndex ?? null;
  return null;
}

/** Prestatie per €100 — hoger is beter. Null als prijs/index ontbreekt. */
export function valuePer100(name: string, category: ComponentType, priceEur: number): number | null {
  const idx = perfIndex(name, category);
  if (idx === null || priceEur <= 0) return null;
  return (idx / priceEur) * 100;
}

/** True als prijs-prestatie zinvol is voor deze categorie. */
export function hasValueMetric(category: ComponentType): boolean {
  return category === "gpu" || category === "cpu";
}

interface Priceable {
  name: string;
  priceEur: number;
  inStock: boolean;
}

/**
 * Index van het item met de beste prijs-prestatie in de lijst (alleen op
 * voorraad, met herkende prestatie-index). Null als geen kandidaat.
 */
export function bestValueIndex<T extends Priceable>(items: T[], category: ComponentType): number | null {
  if (!hasValueMetric(category)) return null;
  let bestIdx: number | null = null;
  let bestVal = -Infinity;
  items.forEach((item, i) => {
    if (!item.inStock) return;
    const v = valuePer100(item.name, category, item.priceEur);
    if (v !== null && v > bestVal) {
      bestVal = v;
      bestIdx = i;
    }
  });
  return bestIdx;
}
