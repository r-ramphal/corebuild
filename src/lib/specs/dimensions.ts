/**
 * Fysieke dimensies uit de BuildCores OpenDB (ODC-By) — voor compatibiliteits-
 * checks die verder gaan dan socket/DDR/wattage: past de videokaart in de kast,
 * past de koeler, ondersteunt de koeler de socket.
 *
 * SERVER-ONLY: dit bestand importeert ~1 MB JSON. Importeer het alleen vanuit
 * server-code (de /api/compat-route), nooit vanuit een client-component, anders
 * belandt de hele dataset in de browser-bundle.
 *
 * - GPU: lengte hangt af van de board-partner, niet enkel de chip. We matchen
 *   daarom niet op exacte SKU (te onbetrouwbaar bij vrije retailer-namen) maar
 *   geven per chipset de lengte-RANGE (min/max), en oordelen daartegen.
 * - Behuizing/koeler: namen zijn onderscheidend en varianten delen dezelfde
 *   maten, dus een token-overlap-match is betrouwbaar genoeg.
 *
 * Datasets gegenereerd door scripts/build_dimensions.py.
 */
import gpuLengthsRaw from "./data/gpu-lengths.json";
import casesRaw from "./data/cases.json";
import coolersRaw from "./data/coolers.json";
import { detectGpu, type FormFactor } from "./detect";
import type { Socket } from "./cpu-data";
import type { GpuLengthInfo, CaseDims, CoolerDims } from "./compat-types";

export type { GpuLengthInfo, CaseDims, CoolerDims } from "./compat-types";

// — Rauwe dataset-vormen (zoals build_dimensions.py ze schrijft) —
type GpuRaw = Record<string, { min: number; max: number; med: number; n: number }>;
interface CaseRaw { name: string; m: string; maxGpu?: number; maxCooler?: number; maxPsu?: number; ff?: string; mobo?: string[]; }
interface CoolerRaw { name: string; m: string; h?: number; w?: boolean; rad?: number; sock?: string[]; }

// ── Normalisatie & tokenisatie ───────────────────────────────────────────────

/** Maateenheden en ruis die niets zeggen over modelidentiteit. */
const NOISE_UNITS = /\b\d+(?:[.,]\d+)?\s?(?:mm|cm|cfm|rpm|dba?|db|kg|g|ghz|mhz|w|watt|°c)\b/gi;
const NOISE_DECIMAL = /\b\d+[.,]\d+\b/g;
/** USB/poort-beschrijvingen ("USB 3.2 Gen 2x2 Type-C") laten anders ruis-cijfers achter. */
const NOISE_PORTS = /\btype[\s-]?[ac]\b|\bgen\s*\d+(?:\s*x\s*\d+)?\b|\busb\s*\d(?:\.\d)?\b|\b\d+\s*x\s*\d+\b/gi;

/** Woorden die kleur/uitvoering/algemene termen zijn — niet onderscheidend. */
const STOPWORDS = new Set([
  // kleuren
  "black", "white", "grey", "gray", "silver", "blue", "red", "green", "pink",
  "brown", "snow", "zwart", "wit", "grijs", "zilver", "blauw", "rood", "groen", "wood",
  // behuizing/koeler algemeen
  "case", "behuizing", "tower", "mid", "midi", "full", "mini", "chassis", "pc",
  "computer", "kast", "desktop", "atx", "eatx", "matx", "itx", "micro",
  // uitvoering/ruis
  "rgb", "argb", "led", "pwm", "gaming", "edition", "tempered", "glass", "gehard",
  "glas", "window", "windowed", "mesh", "airflow", "wifi", "side", "panel", "front",
  "usb", "type", "gen", "with", "and", "the", "for", "met", "voor", "de", "een",
  "version", "tinted", "momentum", "digital", "series",
  // koeler-typewoorden
  "air", "water", "aio", "liquid", "waterkoeling", "waterkoeler", "luchtkoeler",
  "koeler", "cooler", "cooling", "heatsink", "fan", "fans", "ventilator", "bearing",
  "rifle", "fluid", "dynamic",
]);

function clean(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(NOISE_UNITS, " ")
    .replace(NOISE_DECIMAL, " ")
    .replace(NOISE_PORTS, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Onderscheidende tokens van een naam (zonder stopwoorden, geen losse letters). */
function tokenize(s: string, keep: Set<string> = new Set()): Set<string> {
  const out = new Set<string>();
  for (const t of clean(s).split(" ")) {
    if (!t) continue;
    if (keep.has(t)) { out.add(t); continue; }
    if (STOPWORDS.has(t)) continue;
    if (t.length === 1 && !/\d/.test(t)) continue; // losse letter, geen cijfer
    out.add(t);
  }
  return out;
}

const hasDigit = (t: string) => /\d/.test(t);

// ── Voor-gecompileerde index (één keer per server-start) ─────────────────────

interface Indexed<T> {
  rec: T;
  sig: Set<string>;
  brand: Set<string>;
  nums: Set<string>;
}

function indexEntries<T extends { name: string; m: string }>(rows: T[]): Indexed<T>[] {
  return rows.map((rec) => {
    const brand = tokenize(rec.m);
    const sig = tokenize(rec.name, brand);
    const nums = new Set([...sig].filter(hasDigit));
    return { rec, sig, brand, nums };
  });
}

const CASE_INDEX = indexEntries(casesRaw as CaseRaw[]);
const COOLER_INDEX = indexEntries(coolersRaw as CoolerRaw[]);

/**
 * Beste token-overlap-match, of null bij te weinig zekerheid. Eist merk-overlap
 * en — als de kandidaat modelnummers heeft — een numerieke overlap; die twee
 * poorten houden verkeerde modellen (4000D vs 5000D, H7 vs H9) tegen. Minstens
 * 60% dekking van de kandidaat-tokens. Bij gelijke score wint de hoogste dekking,
 * wat naar de schoonste/basisvariant neigt (varianten delen toch dezelfde maten).
 */
function bestMatch<T extends { name: string }>(query: string, index: Indexed<T>[]): T | null {
  const q = tokenize(query);
  if (q.size === 0) return null;

  let best: { rec: T; cov: number; inter: number } | null = null;
  for (const e of index) {
    if (e.sig.size === 0) continue;
    // merk-poort: minstens één merk-token moet voorkomen in de zoeknaam
    let brandHit = false;
    for (const b of e.brand) if (q.has(b)) { brandHit = true; break; }
    if (!brandHit) continue;
    // numerieke poort: als de kandidaat modelnummers heeft, moet er één matchen
    if (e.nums.size > 0) {
      let numHit = false;
      for (const n of e.nums) if (q.has(n)) { numHit = true; break; }
      if (!numHit) continue;
    }
    let inter = 0;
    for (const t of e.sig) if (q.has(t)) inter++;
    const cov = inter / e.sig.size;
    if (cov < 0.6 || inter < 2) continue;
    if (!best || cov > best.cov || (cov === best.cov && inter > best.inter)) {
      best = { rec: e.rec, cov, inter };
    }
  }
  return best ? best.rec : null;
}

// ── Publieke lookups ─────────────────────────────────────────────────────────

/** Lengte-range voor de chipset in deze (vrije) productnaam, of null. */
export function gpuLength(name: string): GpuLengthInfo | null {
  const spec = detectGpu(name);
  if (!spec) return null;
  const key = spec.label.toLowerCase().replace(/\s+/g, " ").trim();
  const e = (gpuLengthsRaw as GpuRaw)[key];
  return e ? { chipset: spec.label, ...e } : null;
}

export function matchCase(name: string): CaseDims | null {
  const rec = bestMatch(name, CASE_INDEX);
  if (!rec) return null;
  return {
    name: rec.name,
    maxGpu: rec.maxGpu ?? null,
    maxCooler: rec.maxCooler ?? null,
    maxPsu: rec.maxPsu ?? null,
    formFactor: rec.ff ?? null,
    mobo: (rec.mobo ?? []) as FormFactor[],
  };
}

export function matchCooler(name: string): CoolerDims | null {
  const rec = bestMatch(name, COOLER_INDEX);
  if (!rec) return null;
  return {
    name: rec.name,
    height: rec.h ?? null,
    water: Boolean(rec.w),
    radiator: rec.rad ?? null,
    sockets: (rec.sock ?? []) as Socket[],
  };
}
