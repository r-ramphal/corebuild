/**
 * Build-generator ("smart generate"): kies uit echte catalogus-producten een
 * compatibele PC voor een doel (gebruik, resolutie, budget). Geen persoonlijke
 * data — puur gebruiksprofiel + budget.
 *
 * Aanpak: verdeel het budget over de slots (afhankelijk van gebruik/resolutie),
 * kies per slot de beste kandidaat die past, en respecteer compatibiliteit
 * (CPU-socket ↔ moederbord, DDR-type, PSU-wattage). De detectie hergebruikt
 * detect.ts; de keuzes blijven indicatief en de gebruiker kan alles aanpassen.
 *
 * Pure functie: `generateBuild(input)` krijgt de kandidaten al mee, zodat de
 * logica zonder database getest kan worden. De /api/generate-route levert de
 * catalogus-kandidaten aan.
 */
import type { BuildComponents } from "@/lib/store/build";
import type { ComponentType, PriceResult } from "@/lib/types";
import type { CpuSpec, DdrGen, Socket } from "./cpu-data";
import type { GpuSpec } from "./gpu-data";
import {
  detectCpu, detectGpu, detectSocket, detectDdr, detectPsuWatts, detectRamGb,
} from "./detect";
import { isRecommended } from "./recommend";

export type UseCase = "gaming" | "creator" | "office" | "streaming" | "competitive";
export type Resolution = "1080p" | "1440p" | "4k";

export interface GenerateRequest {
  /** Totaalbudget in euro. */
  budget: number;
  useCase: UseCase;
  /** Doelresolutie (alleen relevant voor gaming/creator). */
  resolution: Resolution;
}

export interface GenerateInput extends GenerateRequest {
  /** Kandidaat-producten per slot (catalogus, op voorraad, prijs oplopend). */
  candidates: Partial<Record<ComponentType, PriceResult[]>>;
}

export interface GenerateResult {
  components: BuildComponents;
  /** Korte uitleg/waarschuwingen per keuze. */
  notes: string[];
  total: number;
  overBudget: boolean;
}

/** Budgetaandeel per slot. Som ≈ 1 (office heeft geen losse GPU). */
const ALLOC: Record<string, Partial<Record<ComponentType, number>>> = {
  "gaming-1080p": { gpu: 0.32, cpu: 0.20, motherboard: 0.10, ram: 0.08, storage: 0.09, psu: 0.07, case: 0.08, cooling: 0.06 },
  "gaming-1440p": { gpu: 0.40, cpu: 0.16, motherboard: 0.10, ram: 0.08, storage: 0.08, psu: 0.07, case: 0.06, cooling: 0.05 },
  "gaming-4k": { gpu: 0.48, cpu: 0.13, motherboard: 0.09, ram: 0.08, storage: 0.07, psu: 0.07, case: 0.05, cooling: 0.03 },
  creator: { gpu: 0.30, cpu: 0.26, motherboard: 0.10, ram: 0.12, storage: 0.08, psu: 0.06, case: 0.05, cooling: 0.03 },
  // Streamen/content: sterke multicore-CPU (encoden) + 32GB RAM, nog steeds een goede GPU.
  streaming: { gpu: 0.32, cpu: 0.24, motherboard: 0.10, ram: 0.10, storage: 0.08, psu: 0.06, case: 0.05, cooling: 0.05 },
  // Competitief/esports: hoge FPS → CPU-zwaar, snelle mid-high GPU, rest sober.
  competitive: { gpu: 0.34, cpu: 0.25, motherboard: 0.10, ram: 0.08, storage: 0.08, psu: 0.06, case: 0.05, cooling: 0.04 },
  office: { cpu: 0.34, motherboard: 0.16, ram: 0.14, storage: 0.16, psu: 0.08, case: 0.08, cooling: 0.04 },
};

const RES_LABEL: Record<Resolution, string> = { "1080p": "1080p", "1440p": "1440p", "4k": "4K" };

/** Iets boven het exacte budgetaandeel mag, zodat een slot niet onnodig leeg blijft. */
const SLACK = 1.18;

function allocKey(req: GenerateRequest): string {
  return req.useCase === "gaming" ? `gaming-${req.resolution}` : req.useCase;
}

/** Opslagcapaciteit in GB uit een productnaam (bv. "2TB", "1 TB", "500GB"). */
function parseStorageGb(name: string): number {
  const tb = name.match(/(\d+(?:[.,]\d+)?)\s*tb\b/i);
  if (tb) return Math.round(parseFloat(tb[1].replace(",", ".")) * 1000);
  const gb = name.match(/(\d{3,4})\s*gb\b/i);
  return gb ? Number(gb[1]) : 0;
}

/** Aanbevolen PSU-wattage voor de gekozen CPU+GPU (zelfde model als build-analysis). */
function recommendedPsu(cpu: CpuSpec | null, gpu: GpuSpec | null): number {
  const draw = (cpu?.tdp ?? 65) + (gpu?.tdp ?? 0) + 80;
  return Math.max(gpu?.recommendedPsu ?? 0, Math.ceil((draw * 1.5) / 50) * 50);
}

interface Detected<S> { item: PriceResult; spec: S; }

function detectList<S>(cands: PriceResult[], fn: (name: string) => S | null): Detected<S>[] {
  const out: Detected<S>[] = [];
  for (const item of cands) {
    const spec = fn(item.name);
    if (spec) out.push({ item, spec });
  }
  return out;
}

/** Sterkste GPU/CPU binnen `cap`; valt terug op de goedkoopste herkende kaart. */
function pickByIndex<S>(detected: Detected<S>[], cap: number, score: (s: S) => number): Detected<S> | null {
  if (detected.length === 0) return null;
  const affordable = detected.filter((d) => d.item.priceEur <= cap);
  // Niets binnen budget → de goedkoopste herkende (blijft het dichtst bij budget),
  // niet de sterkste (dat zou juist de duurste kaart pakken).
  if (affordable.length === 0) {
    return detected.reduce((a, b) => (b.item.priceEur < a.item.priceEur ? b : a));
  }
  return affordable.reduce((best, d) =>
    score(d.spec) > score(best.spec) ||
    (score(d.spec) === score(best.spec) && d.item.priceEur < best.item.priceEur)
      ? d
      : best
  );
}

/**
 * Goedkoopste kandidaat die aan `ok` voldoet en binnen `cap` valt. Met `prefer`
 * krijgt een community-favoriet voorrang: de góédkoopste aanbevolen optie binnen
 * budget (anders gewoon de goedkoopste). Zo blijft de build budgetvast maar kiest
 * hij waar mogelijk een onderdeel dat ervaren bouwers zouden aanraden.
 */
function pickCheapest(
  cands: PriceResult[],
  cap: number,
  ok: (c: PriceResult) => boolean = () => true,
  prefer?: (c: PriceResult) => boolean
): PriceResult | null {
  const valid = cands.filter(ok); // cands komen al op prijs oplopend binnen
  if (valid.length === 0) return null;
  const within = valid.filter((c) => c.priceEur <= cap);
  // Voorkeur alleen binnen budget toepassen — een favoriet mag de build nooit
  // verder over budget duwen. Niets binnen budget → puur de goedkoopste.
  if (prefer && within.length > 0) {
    const recommended = within.find(prefer); // within is prijs-oplopend → goedkoopste favoriet
    if (recommended) return recommended;
  }
  return (within.length > 0 ? within : valid)[0];
}

export function generateBuild(input: GenerateInput): GenerateResult {
  const { budget, useCase, resolution, candidates } = input;
  const alloc = ALLOC[allocKey(input)];
  const cap = (slot: ComponentType) => budget * (alloc[slot] ?? 0) * SLACK;
  const get = (slot: ComponentType) => candidates[slot] ?? [];

  const components: BuildComponents = {};
  const notes: string[] = [];

  // 1. GPU (niet voor office: iGPU volstaat)
  let gpuSpec: GpuSpec | null = null;
  if (useCase !== "office") {
    const pick = pickByIndex(detectList(get("gpu"), detectGpu), cap("gpu"), (s) => s.index);
    if (pick) {
      components.gpu = pick.item;
      gpuSpec = pick.spec;
      notes.push(`Videokaart: ${pick.spec.label} — sterkste kaart binnen het budget voor ${RES_LABEL[resolution]}.`);
    } else {
      notes.push("Geen videokaart gevonden in de catalogus voor dit budget.");
    }
  }

  // 2. CPU — gaming/competitief weegt gaming-index, creator/streaming/office multicore.
  //    Office eist iGPU.
  const cpuScore = (s: CpuSpec) =>
    useCase === "gaming" || useCase === "competitive" ? s.gamingIndex : s.multiIndex;
  let cpuDetected = detectList(get("cpu"), detectCpu);
  if (useCase === "office") cpuDetected = cpuDetected.filter((d) => d.spec.igpu);
  const cpuPick = pickByIndex(cpuDetected, cap("cpu"), cpuScore);
  let cpuSpec: CpuSpec | null = null;
  if (cpuPick) {
    components.cpu = cpuPick.item;
    cpuSpec = cpuPick.spec;
    notes.push(
      useCase === "office"
        ? `Processor: ${cpuPick.spec.label} met geïntegreerde GPU — geen losse videokaart nodig.`
        : `Processor: ${cpuPick.spec.label}.`
    );
  }
  const socket: Socket | null = cpuSpec?.socket ?? null;
  const ddr: DdrGen | null = cpuSpec?.ddr ?? null;

  // 3. Moederbord — socket moet matchen, DDR mag niet conflicteren.
  if (get("motherboard").length > 0) {
    const compatible = (c: PriceResult) => {
      if (socket && detectSocket(c.name) !== socket) return false;
      const d = detectDdr(c.name);
      if (ddr && d && d !== ddr && d !== "DDR4/DDR5") return false;
      return true;
    };
    const mobo = pickCheapest(get("motherboard"), cap("motherboard"), compatible, (c) => isRecommended("motherboard", c.name))
      ?? pickCheapest(get("motherboard"), cap("motherboard"));
    if (mobo) {
      components.motherboard = mobo;
      if (socket && detectSocket(mobo.name) !== socket) {
        notes.push(`Let op: kon geen ${socket}-moederbord vinden, controleer de socket.`);
      }
    }
  }

  // 4. RAM — juist DDR-type, minimaal 16GB (creator/streaming 32GB).
  const minRam = useCase === "creator" || useCase === "streaming" ? 32 : 16;
  if (get("ram").length > 0) {
    const okRam = (c: PriceResult) => {
      const d = detectDdr(c.name);
      if (ddr && d && d !== ddr) return false;
      return (detectRamGb(c.name) ?? 0) >= minRam;
    };
    const ram = pickCheapest(get("ram"), cap("ram"), okRam, (c) => isRecommended("ram", c.name)) ?? pickCheapest(get("ram"), cap("ram"));
    if (ram) {
      components.ram = ram;
      notes.push(`Werkgeheugen: ${detectRamGb(ram.name) ?? "?"}GB${ddr ? ` ${ddr}` : ""}.`);
    }
  }

  // 5. Opslag — bij voorkeur een SSD/NVMe van minstens 1TB (geen trage HDD).
  if (get("storage").length > 0) {
    const isSsd = (c: PriceResult) =>
      /\b(ssd|nvme|m\.?2)\b/i.test(c.name) &&
      !/\bhdd\b|harde schijf|hard\s?drive|barracuda|7200|5400/i.test(c.name);
    const storage =
      pickCheapest(get("storage"), cap("storage"), (c) => isSsd(c) && parseStorageGb(c.name) >= 1000, (c) => isRecommended("storage", c.name))
      ?? pickCheapest(get("storage"), cap("storage"), isSsd)
      ?? pickCheapest(get("storage"), cap("storage"), (c) => parseStorageGb(c.name) >= 1000)
      ?? pickCheapest(get("storage"), cap("storage"));
    if (storage) components.storage = storage;
  }

  // 6. Voeding — wattage ≥ aanbevolen voor deze CPU+GPU.
  const recPsu = recommendedPsu(cpuSpec, gpuSpec);
  if (get("psu").length > 0) {
    const psu = pickCheapest(get("psu"), cap("psu"), (c) => (detectPsuWatts(c.name) ?? 0) >= recPsu, (c) => isRecommended("psu", c.name))
      ?? pickByIndex(detectList(get("psu"), detectPsuWatts), cap("psu"), (w) => w)?.item
      ?? pickCheapest(get("psu"), cap("psu"));
    if (psu) {
      components.psu = psu;
      const w = detectPsuWatts(psu.name);
      if (w && w < recPsu) notes.push(`Let op: voeding ${w}W is krap, ~${recPsu}W aanbevolen.`);
    }
  }

  // 7. Behuizing — goedkoopste binnen budget, met voorkeur voor een
  //    community-favoriet (goede luchtstroom/bouwkwaliteit).
  const caseItem = pickCheapest(get("case"), cap("case"), () => true, (c) => isRecommended("case", c.name));
  if (caseItem) components.case = caseItem;

  // 8. Koeling — alleen bij een warme CPU (X-serie); anders volstaat de boxed koeler.
  const needsCooler = useCase !== "office" && (cpuSpec?.tdp ?? 0) >= 95;
  if (needsCooler && get("cooling").length > 0) {
    // Weer accessoires (beugels, koelpasta, pads) die als 'koeling' binnenkwamen.
    const notAccessory = (c: PriceResult) =>
      !/beugel|bracket|\bmount\b|montage|backplate|koelpasta|thermal\s?(paste|pad)|stofkap|sticker|\bkabel\b/i.test(c.name);
    const cooler = pickCheapest(get("cooling"), cap("cooling"), notAccessory, (c) => isRecommended("cooling", c.name))
      ?? pickCheapest(get("cooling"), cap("cooling"));
    if (cooler) components.cooling = cooler;
  } else if (cpuSpec && (cpuSpec.tdp < 95)) {
    notes.push(`De ${cpuSpec.label} (${cpuSpec.tdp}W) komt meestal met een boxed koeler — losse koeler optioneel.`);
  }

  // Welke kwaliteitsslots werden een community-favoriet? (transparante toelichting)
  const FAV_LABEL: Partial<Record<ComponentType, string>> = {
    psu: "voeding", cooling: "koeler", case: "behuizing", motherboard: "moederbord", ram: "geheugen", storage: "opslag",
  };
  const favs = (Object.keys(FAV_LABEL) as ComponentType[])
    .filter((s) => components[s] && isRecommended(s, components[s]!.name))
    .map((s) => FAV_LABEL[s]!);
  if (favs.length >= 2) {
    notes.push(`Voor ${favs.join(", ")} koos ik community-favorieten — betrouwbare merken die ervaren bouwers aanraden, niet zomaar de goedkoopste.`);
  }

  const total = Object.values(components).reduce((sum, c) => sum + (c?.priceEur ?? 0), 0);
  return { components, notes, total, overBudget: total > budget };
}
