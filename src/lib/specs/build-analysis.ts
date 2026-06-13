/**
 * Bindt detectie samen tot één analyse-object dat de builder direct kan tonen:
 * gedetecteerde specs, stroomverbruik en compatibiliteitschecks. Bewust géén
 * FPS/bottleneck-schattingen — alleen wat betrouwbaar uit de specs volgt.
 */
import type { BuildComponents } from "@/lib/store/build";
import type { CpuSpec } from "./cpu-data";
import type { GpuSpec } from "./gpu-data";
import {
  detectCpu,
  detectGpu,
  detectSocket,
  detectDdr,
  detectPsuWatts,
  detectFormFactor,
  detectRamGb,
  type FormFactor,
} from "./detect";
import type { DdrGen, Socket } from "./cpu-data";

export type CheckStatus = "ok" | "warn" | "bad" | "info";

export interface CompatCheck {
  id: string;
  status: CheckStatus;
  title: string;
  detail: string;
}

/** Geschat basisverbruik buiten CPU/GPU om (moederbord, RAM, fans, opslag). */
const BASE_WATTS = 80;

export interface BuildAnalysis {
  cpu: CpuSpec | null;
  gpu: GpuSpec | null;
  ramGb: number | null;
  ramDdr: DdrGen | null;
  moboSocket: Socket | null;
  moboDdr: DdrGen | null;
  moboForm: FormFactor | null;
  caseForm: FormFactor | null;
  psuWatts: number | null;
  hasStorage: boolean;
  hasCooling: boolean;
  power: {
    drawWatts: number;
    recommendedPsu: number;
    headroomPct: number | null;
  };
  /** Het geheugentype waarop de build draait (voor de DDR-badge). */
  ddr: DdrGen | null;
  /** False als er minstens één blokkerende ('bad') check is. */
  compatible: boolean;
  checks: CompatCheck[];
}

export function analyzeBuild(components: BuildComponents): BuildAnalysis {
  const cpu = components.cpu ? detectCpu(components.cpu.name) : null;
  const gpu = components.gpu ? detectGpu(components.gpu.name) : null;

  const moboName = components.motherboard?.name ?? "";
  const moboSocket = moboName ? detectSocket(moboName) : null;
  const moboDdr = moboName ? detectDdr(moboName) : null;
  const moboForm = moboName ? detectFormFactor(moboName) : null;

  const ramName = components.ram?.name ?? "";
  const ramGb = ramName ? detectRamGb(ramName) : null;
  const ramDdr = ramName ? detectDdr(ramName) : null;

  const caseForm = components.case ? detectFormFactor(components.case.name) : null;
  const psuWatts = components.psu ? detectPsuWatts(components.psu.name) : null;
  const hasStorage = Boolean(components.storage);
  const hasCooling = Boolean(components.cooling);

  // Stroomverbruik
  const drawWatts =
    (cpu?.tdp ?? (components.cpu ? 90 : 0)) +
    (gpu?.tdp ?? (components.gpu ? 200 : 0)) +
    (components.cpu || components.gpu ? BASE_WATTS : 0);
  const recommendedPsu = Math.max(
    gpu?.recommendedPsu ?? 0,
    Math.ceil((drawWatts * 1.5) / 50) * 50
  );
  const headroomPct =
    psuWatts && drawWatts > 0
      ? Math.round(((psuWatts - drawWatts) / psuWatts) * 100)
      : null;

  const checks = buildChecks({
    components,
    cpu,
    gpu,
    moboSocket,
    moboDdr,
    ramGb,
    ramDdr,
    moboForm,
    caseForm,
    psuWatts,
    drawWatts,
    recommendedPsu,
    hasStorage,
    hasCooling,
  });

  const compatible = !checks.some((c) => c.status === "bad");
  const ddr = ramDdr ?? moboDdr ?? cpu?.ddr ?? null;

  return {
    cpu,
    gpu,
    ramGb,
    ramDdr,
    moboSocket,
    moboDdr,
    moboForm,
    caseForm,
    psuWatts,
    hasStorage,
    hasCooling,
    power: { drawWatts, recommendedPsu, headroomPct },
    ddr,
    compatible,
    checks,
  };
}

interface CheckInput {
  components: BuildComponents;
  cpu: CpuSpec | null;
  gpu: GpuSpec | null;
  moboSocket: Socket | null;
  moboDdr: DdrGen | null;
  ramGb: number | null;
  ramDdr: DdrGen | null;
  moboForm: FormFactor | null;
  caseForm: FormFactor | null;
  psuWatts: number | null;
  drawWatts: number;
  recommendedPsu: number;
  hasStorage: boolean;
  hasCooling: boolean;
}

/** True als twee DDR-aanduidingen samen kunnen werken. */
function ddrCompatible(a: DdrGen, b: DdrGen): boolean {
  if (a === "DDR4/DDR5" || b === "DDR4/DDR5") return true;
  return a === b;
}

function buildChecks(i: CheckInput): CompatCheck[] {
  const checks: CompatCheck[] = [];

  // 1. CPU ↔ moederbord socket
  if (i.cpu && i.moboSocket) {
    const ok = i.cpu.socket === i.moboSocket;
    checks.push({
      id: "socket",
      status: ok ? "ok" : "bad",
      title: ok ? "CPU past op het moederbord" : "Socket komt niet overeen",
      detail: ok
        ? `Beide gebruiken ${i.cpu.socket}.`
        : `De ${i.cpu.label} heeft socket ${i.cpu.socket}, maar het moederbord is ${i.moboSocket}. Deze passen niet samen.`,
    });
  } else if (i.components.cpu && !i.components.motherboard) {
    checks.push({
      id: "socket",
      status: "info",
      title: "Voeg een moederbord toe",
      detail: i.cpu
        ? `De ${i.cpu.label} heeft een ${i.cpu.socket}-moederbord nodig.`
        : "Kies een moederbord met de juiste socket voor je CPU.",
    });
  }

  // 2. Geheugentype (DDR4/DDR5)
  const cpuDdr = i.cpu?.ddr ?? null;
  const ddrCandidates = [cpuDdr, i.moboDdr, i.ramDdr].filter(Boolean) as DdrGen[];
  if (ddrCandidates.length >= 2) {
    let conflict = false;
    for (let a = 0; a < ddrCandidates.length; a++) {
      for (let b = a + 1; b < ddrCandidates.length; b++) {
        if (!ddrCompatible(ddrCandidates[a], ddrCandidates[b])) conflict = true;
      }
    }
    checks.push({
      id: "ddr",
      status: conflict ? "bad" : "ok",
      title: conflict ? "Geheugentype klopt niet" : "Geheugentype komt overeen",
      detail: conflict
        ? `Je onderdelen mengen ${[...new Set(ddrCandidates)].join(" en ")}. Kies overal hetzelfde DDR-type.`
        : `Alles draait op ${i.ramDdr ?? i.moboDdr ?? cpuDdr}.`,
    });
  }

  // 3. Voeding: wattage vs verbruik
  if (i.psuWatts && i.drawWatts > 0) {
    const ratio = i.psuWatts / i.drawWatts;
    let status: CompatCheck["status"] = "ok";
    let title = "Voeding ruim voldoende";
    let detail = `Geschat verbruik ~${i.drawWatts}W, je voeding levert ${i.psuWatts}W. Een comfortabele marge.`;
    if (ratio < 1.1) {
      status = "bad";
      title = "Voeding te krap";
      detail = `Geschat verbruik ~${i.drawWatts}W bij een ${i.psuWatts}W voeding. Kies minstens ${i.recommendedPsu}W.`;
    } else if (ratio < 1.35) {
      status = "warn";
      title = "Voeding aan de krappe kant";
      detail = `~${i.drawWatts}W op ${i.psuWatts}W werkt, maar ${i.recommendedPsu}W geeft meer marge en stillere werking.`;
    }
    checks.push({ id: "psu", status, title, detail });
  } else if ((i.components.gpu || i.components.cpu) && !i.components.psu) {
    checks.push({
      id: "psu",
      status: "info",
      title: "Voeding nog niet gekozen",
      detail: `Reken op ~${i.recommendedPsu}W voor deze onderdelen.`,
    });
  }

  // 4. Behuizing vs moederbord-formfactor
  if (i.caseForm && i.moboForm) {
    const order: FormFactor[] = ["Mini-ITX", "Micro-ATX", "ATX", "E-ATX"];
    const fits = order.indexOf(i.moboForm) <= order.indexOf(i.caseForm);
    checks.push({
      id: "formfactor",
      status: fits ? "ok" : "bad",
      title: fits ? "Moederbord past in de behuizing" : "Moederbord mogelijk te groot",
      detail: fits
        ? `Een ${i.moboForm}-bord past in een ${i.caseForm}-behuizing.`
        : `Een ${i.moboForm}-bord past meestal niet in een ${i.caseForm}-behuizing.`,
    });
  }

  // 5. RAM-capaciteit
  if (i.ramGb !== null) {
    if (i.ramGb < 16) {
      checks.push({
        id: "ram",
        status: "warn",
        title: "Weinig werkgeheugen",
        detail: `${i.ramGb}GB is krap voor moderne games. 16GB (of 32GB) is de zoete plek.`,
      });
    } else {
      checks.push({
        id: "ram",
        status: "ok",
        title: `${i.ramGb}GB werkgeheugen`,
        detail: i.ramGb >= 32 ? "Ruim voldoende, ook voor multitasking en streaming." : "Prima voor gaming.",
      });
    }
  }

  // 6. Koeling bij een hete CPU
  if (i.cpu && i.cpu.tdp >= 150 && !i.hasCooling) {
    checks.push({
      id: "cooling",
      status: "warn",
      title: "Sterke koeling aanbevolen",
      detail: `De ${i.cpu.label} kan ~${i.cpu.tdp}W aan warmte produceren. Reken op een stevige luchtkoeler of AIO.`,
    });
  }

  // 7. Opslag
  if (i.components.cpu && i.components.gpu && !i.hasStorage) {
    checks.push({
      id: "storage",
      status: "warn",
      title: "Nog geen opslag",
      detail: "Een NVMe-SSD zorgt voor snelle laadtijden. Voeg er minstens één toe.",
    });
  }

  return checks;
}
