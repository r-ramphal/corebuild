/**
 * Bouwt een MAATVAST 3D-model van de build: échte millimeters waar we ze kennen,
 * standaard-specs (ATX/DIMM/ATX-PSU) waar de maat vastligt, en nette schattingen
 * voor de rest. Puur en testbaar (geen three.js, geen DOM) zodat de geometrie
 * los te verifiëren is; BuildScene.tsx rendert er meshes uit.
 *
 * Bronnen van de "harde" maten:
 *  - GPU-lengte: open-db lengte-range per chipset (compat.gpu).
 *  - Koelerhoogte / AIO-radiator: open-db (compat.cooler).
 *  - Behuizing-clearances (max GPU-lengte, max koelerhoogte, PSU-diepte): open-db
 *    (compat.case) → bepalen de interne breedte/diepte van de kast.
 *  - Moederbord/RAM/PSU: vaste form-factor- en industriestandaarden.
 *
 * Assenstelsel (oorsprong = midden van de kast-binnenruimte), in mm:
 *  - x: -x = moederbordtray / achterkant van de kast, +x = glazen zijpaneel (kijkkant)
 *  - y: omhoog +
 *  - z: +z = voorkant van de kast, -z = achterkant (rear I/O, PCIe-brackets)
 */
import type { BuildComponents } from "@/lib/store/build";
import type { CompatData } from "./compat-types";
import {
  detectGpu,
  detectFormFactor,
  detectRamGb,
  type FormFactor,
} from "./detect";

export type Vec3 = [number, number, number];

export interface PartModel {
  present: boolean;
  /** Middelpunt in mm t.o.v. het midden van de kast-binnenruimte. */
  pos: Vec3;
  /** Afmeting in mm: [breedte x, hoogte y, diepte z]. */
  size: Vec3;
}

export interface CaseModel {
  present: boolean;
  formFactor: string | null;
  /** Binnenmaten in mm. */
  width: number;
  height: number;
  depth: number;
}

export interface CoolerModel extends PartModel {
  kind: "air" | "aio";
  /** AIO-radiator-montage (top of front) als het een waterkoeler is. */
  mount: "tower" | "top" | "front";
  /** Ventilatordiameter (mm) en aantal. */
  fanDia: number;
  fanCount: number;
  radiator: number | null;
}

export interface GpuModel extends PartModel {
  /** Aantal ventilatoren op de kijkkant. */
  fans: number;
  fanDia: number;
  /** Gebruikte lengte in mm. */
  lengthMm: number;
}

export interface RamModel extends PartModel {
  sticks: number;
}

export interface BuildModel {
  case: CaseModel;
  mobo: PartModel & { formFactor: FormFactor };
  cpu: PartModel;
  cooler: CoolerModel;
  ram: RamModel;
  gpu: GpuModel;
  storage: PartModel;
  psu: PartModel;
  /** Welke maten op échte data berusten (voor eerlijke labeling in de UI). */
  sources: {
    gpuLength: "real" | "estimate";
    coolerHeight: "real" | "estimate";
    caseSize: "real" | "estimate";
  };
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// Moederbord-afmetingen per form-factor in mm: [hoogte y, diepte z].
// Het bord staat verticaal tegen de tray; de PCIe-brackets zitten aan -z (achter).
const MOBO_DIMS: Record<FormFactor, { h: number; d: number }> = {
  "E-ATX": { h: 305, d: 277 },
  ATX: { h: 305, d: 244 },
  "Micro-ATX": { h: 244, d: 244 },
  "Mini-ITX": { h: 170, d: 170 },
};

const MOBO_THK = 4; // PCB + standoffs
const TRAY_GAP = 22; // kabelruimte achter de tray
const TOP_GAP = 28; // ruimte boven het bord
const SHROUD_H = 86; // voedingsshroud-hoogte onderin

/** Kast-basismaten (binnen, mm) per "klasse", afgeleid uit de form-factor-tekst. */
function caseClass(ff: string | null, caseName: string): { w: number; h: number; d: number } {
  const t = `${ff ?? ""} ${caseName}`.toLowerCase();
  if (/full|big|super|xl\b/.test(t)) return { w: 230, h: 520, d: 470 };
  if (/mini[\s-]?itx|\bitx\b/.test(t)) return { w: 200, h: 350, d: 360 };
  if (/micro|matx|m-atx|mini tower/.test(t)) return { w: 205, h: 390, d: 400 };
  // default: ATX mid tower
  return { w: 210, h: 440, d: 430 };
}

/** Aantal RAM-reepjes uit een kit-aanduiding ("2x16GB" → 2), anders een schatting. */
function ramSticks(name: string, totalGb: number | null): number {
  const kit = name.match(/(\d)\s*[x×]\s*\d{1,3}\s*gb/i);
  if (kit) return clamp(Number(kit[1]), 1, 4);
  if (totalGb && totalGb >= 64) return 4;
  return 2;
}

function isWaterName(name: string): boolean {
  return /\b(aio|water|liquid|waterkoel|wak|rad(iator)?)\b/i.test(name);
}

export function buildModel(components: BuildComponents, compat?: CompatData): BuildModel {
  // ── Behuizing-binnenmaten ────────────────────────────────────────────────
  const caseName = components.case?.name ?? "";
  const caseFf = compat?.case?.formFactor ?? (components.case ? detectFormFactor(caseName) : null);
  const base = caseClass(caseFf, caseName);

  // Echte clearances laten de binnenmaten meelopen met de gekozen behuizing.
  const maxCooler = compat?.case?.maxCooler ?? null; // → breedte (loodrecht op het bord)
  const maxGpu = compat?.case?.maxGpu ?? null; //         → diepte (front-back)
  const maxPsuDepth = compat?.case?.maxPsu ?? null;

  let width = base.w;
  let depth = base.d;
  const height = base.h;
  let caseSizeReal = false;
  if (maxCooler) {
    width = clamp(maxCooler + TRAY_GAP + MOBO_THK + 26, 150, 320);
    caseSizeReal = true;
  }
  if (maxGpu) {
    depth = clamp(maxGpu + 70, 280, 560);
    caseSizeReal = true;
  }

  const halfW = width / 2;
  const halfH = height / 2;
  const halfD = depth / 2;

  // ── Moederbord ───────────────────────────────────────────────────────────
  const moboFf: FormFactor =
    (components.motherboard ? detectFormFactor(components.motherboard.name) : null) ??
    (caseFf ? detectFormFactor(caseFf) : null) ??
    "ATX";
  const dims = MOBO_DIMS[moboFf];
  const moboH = clamp(dims.h, 120, height - SHROUD_H - TOP_GAP);
  const moboD = clamp(dims.d, 120, depth - 40);

  const moboCenterX = -halfW + TRAY_GAP + MOBO_THK / 2;
  const moboFrontX = moboCenterX + MOBO_THK / 2; // oppervlak richting glas
  const moboCenterY = halfH - TOP_GAP - moboH / 2;
  const moboRearZ = -halfD + 16;
  const moboCenterZ = moboRearZ + moboD / 2;

  // ── CPU (socket, boven-midden van het bord) ───────────────────────────────
  const cpuY = moboCenterY + moboH * 0.26;
  const cpuZ = moboCenterZ - moboD * 0.04;
  const cpu: PartModel = {
    present: Boolean(components.cpu),
    size: [7, 40, 40],
    pos: [moboFrontX + 3.5, cpuY, cpuZ],
  };

  // ── CPU-koeler (op de CPU, steekt uit richting glas) ───────────────────────
  const coolerName = components.cooling?.name ?? "";
  const coolerData = compat?.cooler ?? null;
  const isWater = coolerData ? coolerData.water : isWaterName(coolerName);
  const coolerHeight = coolerData?.height ?? null; // mm, loodrecht op het bord (air)
  const coolerHeightReal = Boolean(coolerData?.height);
  const radiator = coolerData?.radiator ?? null;

  let cooler: CoolerModel;
  if (isWater) {
    // AIO: pompblok op de CPU + radiator (top als die past, anders voorkant).
    const radLen = radiator ?? 240;
    const topFits = radLen <= depth - 50;
    if (topFits) {
      const radY = halfH - 16;
      cooler = {
        present: Boolean(components.cooling),
        kind: "aio",
        mount: "top",
        size: [120, 27, clamp(radLen, 120, depth - 30)],
        pos: [moboFrontX + 70, radY, clamp(moboCenterZ, -halfD + radLen / 2 + 20, halfD - radLen / 2 - 20)],
        fanDia: 120,
        fanCount: clamp(Math.round(radLen / 120), 1, 4),
        radiator: radLen,
      };
    } else {
      const radZ = halfD - 16;
      cooler = {
        present: Boolean(components.cooling),
        kind: "aio",
        mount: "front",
        size: [120, clamp(radLen, 120, height - 60), 27],
        pos: [moboFrontX + 70, clamp(moboCenterY, -halfH + radLen / 2 + 20, halfH - radLen / 2 - 20), radZ],
        fanDia: 120,
        fanCount: clamp(Math.round(radLen / 120), 1, 4),
        radiator: radLen,
      };
    }
  } else {
    // Luchtkoeler: torentje op de CPU. Hoogte = loodrecht op het bord (+x).
    const h = clamp(coolerHeight ?? 152, 30, maxCooler ?? 170);
    cooler = {
      present: Boolean(components.cooling),
      kind: "air",
      mount: "tower",
      size: [h, 108, 88], // x = hoogte (uit het bord), y/z = footprint van de toren
      pos: [moboFrontX + h / 2, cpuY, cpuZ],
      fanDia: 84,
      fanCount: h > 120 ? 2 : 1,
      radiator: null,
    };
  }

  // ── RAM (rechtopstaande reepjes, vóór de socket richting voorkant) ─────────
  const ramTotal = components.ram ? detectRamGb(components.ram.name) : null;
  const sticks = ramSticks(components.ram?.name ?? "", ramTotal);
  const stickH = 92; // DIMM met heatspreader, verticaal (herkenbaar, niet overdreven)
  const ram: RamModel = {
    present: Boolean(components.ram),
    sticks,
    size: [7, stickH, 7],
    // duidelijk vóór de koelertoren (+z), op het bord
    pos: [moboFrontX + 5, cpuY - 16, cpuZ + 82],
  };

  // ── Videokaart (bovenste PCIe-slot, onder de CPU, naar voren) ──────────────
  const gpuName = components.gpu?.name ?? "";
  const gpuSpec = components.gpu ? detectGpu(gpuName) : null;
  const lenFromDb = compat?.gpu?.med ?? null;
  const gpuLenReal = Boolean(lenFromDb);
  // Schatting als de open-db de chip niet kent: zwaardere kaarten zijn langer.
  const estLen = gpuSpec ? clamp(170 + gpuSpec.tdp * 0.35, 180, 340) : 270;
  let gpuLen = Math.round(lenFromDb ?? estLen);
  gpuLen = clamp(gpuLen, 150, depth - 30);
  // Hoogte/dikte schalen met het verbruik (dikkere koeler bij meer watt).
  const tdp = gpuSpec?.tdp ?? 200;
  const gpuH = clamp(105 + (tdp - 150) * 0.12, 95, 150);
  const gpuThk = clamp(38 + (tdp - 150) * 0.06, 38, 62);
  const gpuRearZ = moboRearZ + 6;
  const gpuFans = gpuLen >= 260 ? 3 : 2;
  const gpu: GpuModel = {
    present: Boolean(components.gpu),
    size: [gpuThk, gpuH, gpuLen],
    // lager geplaatst → ruime tussenruimte met de koeler erboven
    pos: [moboFrontX + gpuThk / 2 + 6, moboCenterY - moboH * 0.13 - gpuH / 2, gpuRearZ + gpuLen / 2],
    fans: gpuFans,
    fanDia: clamp(Math.round(gpuLen * (gpuFans === 3 ? 0.26 : 0.34)), 60, 86),
    lengthMm: gpuLen,
  };

  // ── Voeding (onderin, in de shroud, achterin) ──────────────────────────────
  const psuDepth = clamp(maxPsuDepth ?? 160, 100, depth - 30);
  const psu: PartModel = {
    present: Boolean(components.psu),
    size: [150, SHROUD_H, psuDepth],
    pos: [-halfW + TRAY_GAP + 75, -halfH + SHROUD_H / 2 + 6, -halfD + psuDepth / 2 + 12],
  };

  // ── Opslag (2.5"-SSD bovenop de voeding, achterin → uit de drukke voorzone) ─
  const storage: PartModel = {
    present: Boolean(components.storage),
    size: [70, 8, 100],
    pos: [-halfW + TRAY_GAP + 55, -halfH + SHROUD_H + 6, -halfD + 100],
  };

  return {
    case: { present: Boolean(components.case), formFactor: caseFf, width, height, depth },
    mobo: {
      present: Boolean(components.motherboard),
      formFactor: moboFf,
      size: [MOBO_THK, moboH, moboD],
      pos: [moboCenterX, moboCenterY, moboCenterZ],
    },
    cpu,
    cooler,
    ram,
    gpu,
    storage,
    psu,
    sources: {
      gpuLength: gpuLenReal ? "real" : "estimate",
      coolerHeight: coolerHeightReal ? "real" : "estimate",
      caseSize: caseSizeReal ? "real" : "estimate",
    },
  };
}
