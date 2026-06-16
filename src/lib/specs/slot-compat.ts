/**
 * Per-optie compatibiliteit in de builder-kiezer.
 *
 * Anders dan de volledige `analyzeBuild` (die o.a. de open-db-maten via /api/compat
 * gebruikt) is dit een lichte, **naam-only** check zodat we hem per resultaatrij
 * (~30 opties) instant kunnen draaien zonder netwerkverzoek. We beoordelen een
 * kandidaat tegen de al gekozen onderdelen: socket, DDR-type, wattage en formfactor.
 * Maten die per exact product verschillen (GPU-lengte, koelerhoogte) blijven in
 * `BuildSummary` (daar is wél één compat-fetch voor de gekozen build).
 */
import type { BuildComponents } from "@/lib/store/build";
import type { BuildAnalysis } from "./build-analysis";
import { detectBoardSocket, detectCpu, detectDdr, detectFormFactor, detectPsuWatts, type FormFactor } from "./detect";
import type { DdrGen } from "./cpu-data";
import type { ComponentType } from "@/lib/types";

export type SlotCompatStatus = "ok" | "warn" | "bad";
export interface SlotCompatVerdict {
  status: SlotCompatStatus;
  label: string;
}

const FORM_ORDER: FormFactor[] = ["Mini-ITX", "Micro-ATX", "ATX", "E-ATX"];

function ddrOk(a: DdrGen, b: DdrGen): boolean {
  if (a === "DDR4/DDR5" || b === "DDR4/DDR5") return true;
  return a === b;
}

/** Geheugentype waarop de huidige build draait (moederbord of CPU). */
function platformDdr(a: BuildAnalysis): DdrGen | null {
  return a.moboDdr ?? a.cpu?.ddr ?? null;
}

/**
 * Oordeel over één kandidaat (`optionName`) voor slot `type`, gegeven de huidige
 * build (`analysis` = `analyzeBuild(components)`, één keer berekend door de caller).
 * `null` als er (nog) niets te checken valt — dan tonen we geen chip.
 */
export function slotCompat(
  type: ComponentType,
  optionName: string,
  components: BuildComponents,
  analysis: BuildAnalysis
): SlotCompatVerdict | null {
  switch (type) {
    case "motherboard": {
      const socket = detectBoardSocket(optionName);
      if (!analysis.cpu || !socket) return null;
      if (analysis.cpu.socket !== socket) {
        return { status: "bad", label: `past niet op je ${analysis.cpu.label}` };
      }
      const ddr = detectDdr(optionName);
      if (ddr && analysis.cpu.ddr && !ddrOk(ddr, analysis.cpu.ddr)) {
        return { status: "warn", label: `let op: ${ddr} vs ${analysis.cpu.ddr}` };
      }
      return { status: "ok", label: "past op je CPU" };
    }

    case "cpu": {
      const cpu = detectCpu(optionName);
      const boardSocket = components.motherboard ? detectBoardSocket(components.motherboard.name) : null;
      if (!cpu || !boardSocket) return null;
      return cpu.socket === boardSocket
        ? { status: "ok", label: "past op je moederbord" }
        : { status: "bad", label: `past niet op je moederbord (${boardSocket})` };
    }

    case "ram": {
      const ddr = detectDdr(optionName);
      const plat = platformDdr(analysis);
      if (!ddr || !plat) return null;
      return ddrOk(ddr, plat)
        ? { status: "ok", label: `${ddr} past bij je build` }
        : { status: "bad", label: `je build gebruikt ${plat}` };
    }

    case "psu": {
      const w = detectPsuWatts(optionName);
      const { drawWatts, recommendedPsu } = analysis.power;
      if (!w || drawWatts <= 0) return null;
      if (w >= recommendedPsu) return { status: "ok", label: `${w}W ruim voldoende` };
      if (w >= Math.ceil(drawWatts * 1.1)) return { status: "warn", label: `${w}W aan de krappe kant` };
      return { status: "bad", label: `${w}W te krap (≥${recommendedPsu}W)` };
    }

    case "case": {
      const caseForm = detectFormFactor(optionName);
      if (!caseForm || !analysis.moboForm) return null;
      const fits = FORM_ORDER.indexOf(analysis.moboForm) <= FORM_ORDER.indexOf(caseForm);
      return fits
        ? { status: "ok", label: `past je ${analysis.moboForm}-bord` }
        : { status: "bad", label: `te klein voor ${analysis.moboForm}` };
    }

    default:
      return null;
  }
}
