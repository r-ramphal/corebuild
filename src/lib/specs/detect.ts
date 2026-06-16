/**
 * Modeldetectie: leid hardware-specs af uit een (vrije) productnaam.
 *
 * Retailers leveren alleen productnamen, geen gestructureerde specs. Deze
 * module matcht die namen tegen de spec-databases (cpu-data / gpu-data) en
 * haalt losse signalen (socket, DDR-generatie, PSU-wattage, formfactor) uit
 * de tekst. Het meest specifieke alias wint, zodat "RTX 5060 Ti" niet als
 * "RTX 5060" wordt herkend.
 */
import { CPUS, type CpuSpec, type DdrGen, type Socket } from "./cpu-data";
import { GPUS, type GpuSpec } from "./gpu-data";

/** Bouw een word-boundary-regex met flexibele scheidingstekens (spatie/streepje). */
function aliasToRegex(alias: string): RegExp {
  const escaped = alias
    .toLowerCase()
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/[\s-]+/g, "[\\s-]*");
  return new RegExp(`(?<![\\w])${escaped}(?![\\w])`, "i");
}

interface CompiledEntry<T> {
  spec: T;
  matchers: RegExp[];
  /** Lengte van het langste alias — voor specifiek-eerst sortering. */
  weight: number;
}

function compile<T extends { aliases: string[] }>(entries: T[]): CompiledEntry<T>[] {
  return entries
    .map((spec) => ({
      spec,
      matchers: spec.aliases.map(aliasToRegex),
      weight: Math.max(...spec.aliases.map((a) => a.length)),
    }))
    .sort((a, b) => b.weight - a.weight);
}

const COMPILED_CPUS = compile(CPUS);
const COMPILED_GPUS = compile(GPUS);

export function detectCpu(name: string): CpuSpec | null {
  for (const entry of COMPILED_CPUS) {
    if (entry.matchers.some((re) => re.test(name))) return entry.spec;
  }
  return null;
}

export function detectGpu(name: string): GpuSpec | null {
  for (const entry of COMPILED_GPUS) {
    if (entry.matchers.some((re) => re.test(name))) return entry.spec;
  }
  return null;
}

/** Socket uit een moederbord- of CPU-naam. */
export function detectSocket(name: string): Socket | null {
  if (/\bam5\b/i.test(name)) return "AM5";
  if (/\bam4\b/i.test(name)) return "AM4";
  if (/\b(lga\s?1851|socket\s?1851)\b/i.test(name)) return "LGA1851";
  if (/\b(lga\s?1700|socket\s?1700)\b/i.test(name)) return "LGA1700";
  if (/\b(lga\s?1200|socket\s?1200)\b/i.test(name)) return "LGA1200";
  return null;
}

/**
 * Chipset → socket. Moederbordnamen noemen vaak alleen de chipset (B650, Z790)
 * en niet de socket. Deze mapping vult dat gat zodat de socket-check ook zonder
 * expliciete "AM5"/"LGA1700" in de naam werkt.
 */
const CHIPSET_SOCKET: { re: RegExp; socket: Socket }[] = [
  { re: /\b(x870e|x870|b850|b840)\b/i, socket: "AM5" },
  { re: /\b(x670e|x670|b650e|b650|a620)\b/i, socket: "AM5" },
  { re: /\b(x570|b550|a520|b450|x470|b350|a320)\b/i, socket: "AM4" },
  { re: /\b(z890|b860|h810)\b/i, socket: "LGA1851" },
  { re: /\b(z790|z690|b760|b660|h770|h670|h610)\b/i, socket: "LGA1700" },
  { re: /\b(z590|z490|b560|b460|h510|h470)\b/i, socket: "LGA1200" },
];

/** Socket van een moederbord: eerst de expliciete socket, anders via de chipset. */
export function detectBoardSocket(name: string): Socket | null {
  return detectSocket(name) ?? CHIPSET_SOCKET.find(({ re }) => re.test(name))?.socket ?? null;
}

/** DDR-generatie uit een moederbord- of RAM-naam. */
export function detectDdr(name: string): DdrGen | null {
  const ddr4 = /\bddr4\b/i.test(name);
  const ddr5 = /\bddr5\b/i.test(name);
  if (ddr4 && ddr5) return "DDR4/DDR5";
  if (ddr5) return "DDR5";
  if (ddr4) return "DDR4";
  return null;
}

/** Eerste wattage-getal (PSU). */
export function detectPsuWatts(name: string): number | null {
  const m = name.match(/(\d{3,4})\s*w(att)?\b/i);
  return m ? Number(m[1]) : null;
}

export type FormFactor = "E-ATX" | "ATX" | "Micro-ATX" | "Mini-ITX";

/** Formfactor uit een behuizing- of moederbordnaam (grootste eerst). */
export function detectFormFactor(name: string): FormFactor | null {
  if (/\be-?atx\b/i.test(name)) return "E-ATX";
  if (/mini[\s-]?itx|\bitx\b/i.test(name)) return "Mini-ITX";
  if (/micro[\s-]?atx|\bm-?atx\b|\bmatx\b|µatx|µ-atx/i.test(name)) return "Micro-ATX";
  if (/\batx\b/i.test(name)) return "ATX";
  return null;
}

/** RAM-capaciteit in GB uit een geheugennaam (bv. "32GB", "2x16GB"). */
export function detectRamGb(name: string): number | null {
  const kit = name.match(/(\d)\s*[x×]\s*(\d{1,2})\s*gb/i);
  if (kit) return Number(kit[1]) * Number(kit[2]);
  const single = name.match(/(\d{1,3})\s*gb/i);
  return single ? Number(single[1]) : null;
}
