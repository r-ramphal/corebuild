/**
 * Gedeelde types voor de dimensie-compatibiliteit. Bewust DATA-VRIJ: zowel de
 * server (dimensions.ts, met ~1 MB JSON) als de client (build-analysis.ts in de
 * builder) importeren hieruit, zodat de datasets nooit in de browserbundle komen.
 */
import type { FormFactor } from "./detect";
import type { Socket } from "./cpu-data";

export interface GpuLengthInfo {
  chipset: string;
  /** Kortste/langste board-partner-kaart voor deze chip (mm). */
  min: number;
  max: number;
  med: number;
  /** Aantal kaarten waarop de range is gebaseerd. */
  n: number;
}

export interface CaseDims {
  name: string;
  maxGpu: number | null;
  maxCooler: number | null;
  maxPsu: number | null;
  formFactor: string | null;
  mobo: FormFactor[];
}

export interface CoolerDims {
  name: string;
  height: number | null;
  water: boolean;
  radiator: number | null;
  sockets: Socket[];
}

/** Antwoord van /api/compat: gematchte maten voor de huidige build. */
export interface CompatData {
  gpu: GpuLengthInfo | null;
  case: CaseDims | null;
  cooler: CoolerDims | null;
}
