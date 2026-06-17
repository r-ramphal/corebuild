/**
 * Productmatcher (puur, getest): bepaalt of een retailer-listing hetzelfde
 * product is als een — mogelijk generiek benoemd — build-onderdeel.
 *
 * Twee lagen:
 *  1. CPU/GPU → de bestaande modeldetectie (`detect.ts`). De spec-objecten zijn
 *     referentie-gelijk per model, dus "zelfde model" = `===`. Dit onderscheidt
 *     varianten (RTX 5070 vs 5070 Ti, 9700X vs 9800X3D) betrouwbaar.
 *  2. Overige categorieën → onderscheidende tokens (merk, modelnummer, socket,
 *     DDR-generatie, capaciteit, wattage, 80+-rating, formfactor). Generieke/
 *     Nederlandstalige vulwoorden ("moederbord", "behuizing") worden genegeerd,
 *     zodat "B650 ATX moederbord" of "32GB DDR5-6000" toch matcht.
 *
 * Vervangt de oude naïeve substring-match (volledige naam moet voorkomen), die
 * generiek benoemde onderdelen miste.
 */
import { detectCpu, detectGpu } from "./detect";

/** Generieke categorie-/marketingwoorden zonder onderscheidend signaal (NL + EN). */
const STOP = new Set([
  "moederbord", "mainboard", "motherboard", "behuizing", "kast", "case", "voeding", "power", "supply",
  "psu", "geheugen", "werkgeheugen", "memory", "koeling", "koeler", "cooler", "cooling", "opslag",
  "storage", "processor", "videokaart", "graphics", "kaart", "card", "met", "voor", "van", "de", "het",
  "een", "en", "with", "for", "the", "and", "tower", "midi", "mid", "computer", "ventilator", "desktop",
  "gaming", "game", "zwart", "wit", "grijs", "black", "white", "grey", "gray", "edition", "retail",
  "boxed", "argb", "version", "versie", "nieuw", "new", "inch",
]);

function normName(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Normaliseer en tokeniseer een productnaam tot onderscheidende tokens. Voegt
 * losse eenheden samen ("750 watt" → "750w", "32 gb" → "32gb"), normaliseert
 * formfactors (micro-atx → matx) en 80+-rating, en mapt het opslagtype
 * (nvme/m.2) naar een "ssd"-marker zodat een SSD-onderdeel geen HDD matcht.
 */
export function tokenize(name: string): string[] {
  let s = name.toLowerCase();
  s = s.replace(/\be-?atx\b/g, "eatx");
  s = s.replace(/micro[\s-]?atx|\bm-?atx\b|µ-?atx/g, "matx");
  s = s.replace(/mini[\s-]?itx|\bitx\b/g, "itx");
  s = s.replace(/80\s*\+/g, "80plus").replace(/\b80\s*plus\b/g, "80plus");
  s = s.replace(/(\d+)\s*(?:watts|watt|w)\b/g, "$1w");
  s = s.replace(/(\d+)\s*gb\b/g, "$1gb");
  s = s.replace(/(\d+)\s*tb\b/g, "$1tb");
  s = s.replace(/\b(?:nvme|m\.?\s?2)\b/g, "ssd");
  return s.split(/[^a-z0-9]+/).filter((t) => t.length >= 2 && !STOP.has(t));
}

const hasDigit = (t: string) => /[0-9]/.test(t);

/**
 * Is part-token `t` gedekt door de listing-tokens? Gelijk, of een listing-token
 * begint met `t` gevolgd door een niet-cijfer — zo matcht "b650"→"b650m" en
 * "6000"→"6000mhz", maar "120"≠"1200" (geen valse capaciteit/maat-treffers).
 */
function tokenCovered(listingTokens: string[], t: string): boolean {
  return listingTokens.some(
    (u) => u === t || (u.startsWith(t) && !/[0-9]/.test(u.charAt(t.length)))
  );
}

export function productMatches(partName: string, listingName: string, category: string): boolean {
  if (category === "cpu") {
    const a = detectCpu(partName);
    if (a) return a === detectCpu(listingName);
  } else if (category === "gpu") {
    const a = detectGpu(partName);
    if (a) return a === detectGpu(listingName);
  }

  // Exacte substring = zeker een match (snelle, precieze route).
  if (normName(listingName).includes(normName(partName))) return true;

  const pt = tokenize(partName);
  if (pt.length === 0) return false;
  // Te generiek: zonder modelnummer en met < 2 tokens niet matchen.
  if (pt.length < 2 && !pt.some(hasDigit)) return false;
  const lt = tokenize(listingName);
  return pt.every((t) => tokenCovered(lt, t));
}
