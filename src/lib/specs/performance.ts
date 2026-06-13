/**
 * Build-intelligentie: FPS-schatting, bottleneck-analyse, monitor-advies,
 * build-score en compatibiliteitschecks.
 *
 * Het model is bewust transparant en samenhangend: FPS en bottleneck delen
 * dezelfde logica. Een GPU produceert X fps bij een resolutie/preset; een CPU
 * kan maximaal Y fps aanleveren; je haalt min(X, Y). Welke van de twee de
 * limiet is, bepaalt de bottleneck. Alle uitkomsten zijn *indicaties* op basis
 * van relatieve benchmark-indexen, geen exacte metingen.
 */
import type { CpuSpec } from "./cpu-data";
import type { GpuSpec } from "./gpu-data";

export type Resolution = "1080p" | "1440p" | "2160p";
export type Preset = "low" | "medium" | "high" | "ultra";
export type GameProfileId = "esports" | "balanced" | "aaa";

export const RESOLUTIONS: { id: Resolution; label: string; short: string }[] = [
  { id: "1080p", label: "1080p (Full HD)", short: "1080p" },
  { id: "1440p", label: "1440p (QHD)", short: "1440p" },
  { id: "2160p", label: "2160p (4K UHD)", short: "4K" },
];

export const PRESETS: { id: Preset; label: string }[] = [
  { id: "low", label: "Laag" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "Hoog" },
  { id: "ultra", label: "Ultra" },
];

export const GAME_PROFILES: {
  id: GameProfileId;
  label: string;
  examples: string;
  gpuCoef: number;
  cpuCoef: number;
}[] = [
  { id: "esports", label: "Competitief", examples: "CS2, Valorant, LoL", gpuCoef: 6.0, cpuCoef: 3.4 },
  { id: "balanced", label: "Populair", examples: "Fortnite, GTA V, CoD", gpuCoef: 2.7, cpuCoef: 2.3 },
  { id: "aaa", label: "Zwaar AAA", examples: "Cyberpunk 2077, Alan Wake 2", gpuCoef: 1.6, cpuCoef: 1.6 },
];

const RES_MULT: Record<Resolution, number> = { "1080p": 1.0, "1440p": 0.66, "2160p": 0.42 };
const PRESET_MULT: Record<Preset, number> = { low: 1.5, medium: 1.2, high: 1.0, ultra: 0.82 };
/** Hoe zwaar de CPU relatief belast wordt per resolutie (lager = GPU-bound). */
const RES_CPU_RELEVANCE: Record<Resolution, number> = { "1080p": 1.0, "1440p": 0.7, "2160p": 0.45 };

export interface FpsEstimate {
  fps: number;
  gpuFps: number;
  cpuFps: number;
  limitedBy: "gpu" | "cpu" | "balanced";
}

/** Schat de FPS voor één resolutie/preset/game-profiel. */
export function estimateFps(
  gpu: GpuSpec,
  cpu: CpuSpec | null,
  res: Resolution,
  preset: Preset,
  profile: GameProfileId
): FpsEstimate {
  const p = GAME_PROFILES.find((g) => g.id === profile)!;
  const gpuFps = gpu.index * RES_MULT[res] * PRESET_MULT[preset] * p.gpuCoef;
  // Zonder bekende CPU nemen we een ruime aanname (geen CPU-limiet tonen).
  const cpuFps = cpu ? cpu.gamingIndex * p.cpuCoef : Infinity;

  const raw = Math.min(gpuFps, cpuFps);
  const fps = Math.round(Math.min(raw, 480));

  let limitedBy: FpsEstimate["limitedBy"] = "gpu";
  if (cpu) {
    const diff = (gpuFps - cpuFps) / Math.max(gpuFps, cpuFps);
    if (Math.abs(diff) < 0.08) limitedBy = "balanced";
    else limitedBy = cpuFps < gpuFps ? "cpu" : "gpu";
  }
  return { fps, gpuFps: Math.round(gpuFps), cpuFps: Math.round(cpuFps), limitedBy };
}

export interface GameFps {
  profile: GameProfileId;
  label: string;
  examples: string;
  estimate: FpsEstimate;
}

/** FPS voor alle game-profielen bij een resolutie/preset. */
export function estimateAllGames(
  gpu: GpuSpec,
  cpu: CpuSpec | null,
  res: Resolution,
  preset: Preset
): GameFps[] {
  return GAME_PROFILES.map((p) => ({
    profile: p.id,
    label: p.label,
    examples: p.examples,
    estimate: estimateFps(gpu, cpu, res, preset, p.id),
  }));
}

export type BottleneckType = "balanced" | "cpu" | "gpu";

export interface Bottleneck {
  type: BottleneckType;
  /** Geschat prestatieverlies door de zwakste schakel (0–100%). */
  severityPct: number;
  /** Marker-positie 0–100 voor de balansbalk (0 = CPU-bound, 100 = GPU-bound). */
  balancePos: number;
  title: string;
  detail: string;
  tone: "good" | "warn" | "bad";
}

/**
 * Bottleneck bij een resolutie. ratio = effectieve CPU-kracht / GPU-kracht.
 * Bij 4K telt de CPU "zwaarder mee" (wordt minder belast), dus bottlenecks
 * verschuiven naar hogere resoluties toe richting de GPU.
 */
export function analyzeBottleneck(
  cpu: CpuSpec,
  gpu: GpuSpec,
  res: Resolution
): Bottleneck {
  const effectiveCpu = cpu.gamingIndex / RES_CPU_RELEVANCE[res];
  const ratio = effectiveCpu / gpu.index;
  const balancePos = Math.round(Math.min(100, Math.max(0, 50 + (ratio - 1) * 55)));

  if (ratio < 0.72) {
    const severity = Math.round(Math.min(40, (1 - ratio) * 100));
    return {
      type: "cpu",
      severityPct: severity,
      balancePos,
      title: "CPU remt je videokaart af",
      detail: `Op ${resLabel(res)} kan de ${cpu.label} de ${gpu.label} niet volledig voeden. Een snellere CPU of een hogere resolutie haalt meer uit je videokaart.`,
      tone: "bad",
    };
  }
  if (ratio < 0.9) {
    const severity = Math.round(Math.min(20, (1 - ratio) * 100));
    return {
      type: "cpu",
      severityPct: severity,
      balancePos,
      title: "Lichte CPU-bottleneck",
      detail: `Op ${resLabel(res)} laat je een paar procent prestatie liggen. Op een hogere resolutie verdwijnt dit grotendeels.`,
      tone: "warn",
    };
  }
  if (ratio <= 1.18) {
    return {
      type: "balanced",
      severityPct: 0,
      balancePos,
      title: "Mooi uitgebalanceerd",
      detail: `De ${cpu.label} en ${gpu.label} passen goed bij elkaar op ${resLabel(res)}. Geen van beide remt de ander noemenswaardig af.`,
      tone: "good",
    };
  }
  if (ratio <= 1.6) {
    return {
      type: "gpu",
      severityPct: 0,
      balancePos,
      title: "CPU heeft ruimte over",
      detail: `Je CPU kan meer aan dan de ${gpu.label} vraagt op ${resLabel(res)}. Prima voor gaming, en er is ruimte voor een snellere videokaart in de toekomst.`,
      tone: "good",
    };
  }
  return {
    type: "gpu",
    severityPct: 0,
    balancePos,
    title: "Veel CPU-overschot",
    detail: `De ${cpu.label} is fors krachtiger dan de ${gpu.label} nodig heeft op ${resLabel(res)}. Overweeg het budget naar een snellere videokaart te verschuiven.`,
    tone: "warn",
  };
}

function resLabel(res: Resolution): string {
  return RESOLUTIONS.find((r) => r.id === res)?.short ?? res;
}

export interface HzAdvice {
  hz: number;
  title: string;
  detail: string;
}

/** Advies voor monitor-refreshrate op basis van haalbare FPS. */
export function recommendHz(fps: number): HzAdvice {
  let hz = 60;
  if (fps >= 300) hz = 360;
  else if (fps >= 200) hz = 240;
  else if (fps >= 150) hz = 165;
  else if (fps >= 115) hz = 144;
  else if (fps >= 90) hz = 120;
  else if (fps >= 68) hz = 75;
  else hz = 60;

  return {
    hz,
    title: `${hz} Hz monitor`,
    detail:
      fps >= 90
        ? `Je haalt zo'n ${fps} fps, dus een ${hz} Hz monitor maakt die soepelheid pas echt zichtbaar.`
        : `Bij ~${fps} fps is een ${hz} Hz monitor de logische keuze; hoger benut je toch niet.`,
  };
}

export interface BuildScore {
  score: number;
  tierLabel: string;
  blurb: string;
  /** Tailwind-kleurtoken-naam voor de gauge. */
  tone: "outline" | "primary" | "emerald";
}

function ramQuality(gb: number | null): number {
  if (gb === null) return 60; // onbekend → neutraal
  if (gb >= 32) return 100;
  if (gb >= 16) return 78;
  if (gb >= 8) return 45;
  return 25;
}

/**
 * Build-score (0–100) op basis van de gedetecteerde onderdelen. Vereist
 * minstens CPU + GPU voor een zinvolle score.
 */
export function buildScore(
  gpu: GpuSpec | null,
  cpu: CpuSpec | null,
  ramGb: number | null,
  hasStorage: boolean
): BuildScore | null {
  if (!gpu || !cpu) return null;

  const storageQ = hasStorage ? 100 : 50;
  const raw =
    gpu.index * 0.5 +
    cpu.gamingIndex * 0.3 +
    ramQuality(ramGb) * 0.12 +
    storageQ * 0.08;
  const score = Math.round(Math.min(100, raw));

  let tierLabel = "Instap";
  let blurb = "Geschikt voor e-sports en lichtere games op 1080p.";
  let tone: BuildScore["tone"] = "outline";
  if (score >= 88) {
    tierLabel = "Flagship";
    blurb = "Topklasse: 4K op hoge framerates en alles op ultra.";
    tone = "emerald";
  } else if (score >= 74) {
    tierLabel = "High-end";
    blurb = "Vlot 1440p/4K gamen op hoge instellingen, ruim voldoende marge.";
    tone = "emerald";
  } else if (score >= 58) {
    tierLabel = "Enthusiast";
    blurb = "Sterke 1440p-machine en high-fps 1080p gaming.";
    tone = "primary";
  } else if (score >= 40) {
    tierLabel = "Mainstream";
    blurb = "Prima 1080p gamen op hoog, instap voor 1440p.";
    tone = "primary";
  }
  return { score, tierLabel, blurb, tone };
}

export type CheckStatus = "ok" | "warn" | "bad" | "info";

export interface CompatCheck {
  id: string;
  status: CheckStatus;
  title: string;
  detail: string;
}
