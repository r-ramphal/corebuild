import {
  detectCpu, detectGpu, detectRamGb, detectDdr, detectSocket,
  detectPsuWatts, detectFormFactor,
} from "@/lib/specs/detect";
import type { ComponentType } from "@/lib/types";

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-label-technical text-[10px] px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant whitespace-nowrap">
      {children}
    </span>
  );
}

function PerfBar({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-center gap-2 w-full max-w-[280px]">
      <span className="font-label-technical text-[10px] uppercase tracking-wider text-on-surface-variant w-[92px] flex-shrink-0">
        {label}
      </span>
      <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden">
        <div className="cb-bar-fill h-full bg-primary rounded-full" style={{ width: `${value}%` }} />
      </div>
      <span className="font-label-technical text-[11px] text-on-surface tabular-nums w-6 text-right">{value}</span>
    </div>
  );
}

/**
 * Toont herkende specs + relatieve prestatie-index voor een product.
 * Met `category` wordt gericht gedetecteerd; zonder valt het terug op
 * automatische herkenning (gpu → cpu → ram → psu → moederbord → behuizing).
 */
export function ComponentSpecs({
  name,
  category,
  className = "",
}: {
  name: string;
  category?: ComponentType;
  className?: string;
}) {
  const tryGpu = category === "gpu" || !category;
  const tryCpu = category === "cpu" || !category;
  const tryRam = category === "ram" || !category;
  const tryPsu = category === "psu" || !category;
  const tryMobo = category === "motherboard" || !category;
  const tryCase = category === "case" || !category;

  if (tryGpu) {
    const g = detectGpu(name);
    if (g) {
      return (
        <div className={`space-y-2 ${className}`}>
          <div className="flex flex-wrap gap-1.5">
            <Chip>{g.vramGb}GB VRAM</Chip>
            <Chip>{g.tdp}W</Chip>
            <Chip>{g.brand === "nvidia" ? "NVIDIA" : g.brand === "amd" ? "AMD" : "Intel"}</Chip>
          </div>
          <PerfBar value={g.index} label="Prestatie" />
        </div>
      );
    }
  }
  if (tryCpu) {
    const c = detectCpu(name);
    if (c) {
      return (
        <div className={`space-y-2 ${className}`}>
          <div className="flex flex-wrap gap-1.5">
            <Chip>{c.cores}c / {c.threads}t</Chip>
            <Chip>{c.socket}</Chip>
            <Chip>{c.ddr}</Chip>
          </div>
          <PerfBar value={c.gamingIndex} label="Gaming" />
        </div>
      );
    }
  }

  const chips: string[] = [];
  if (tryRam) {
    const gb = detectRamGb(name);
    const ddr = detectDdr(name);
    if (gb) chips.push(`${gb}GB`);
    if (ddr) chips.push(ddr);
  }
  if (tryMobo && chips.length === 0) {
    const socket = detectSocket(name);
    const ddr = detectDdr(name);
    const form = detectFormFactor(name);
    if (socket) chips.push(socket);
    if (ddr) chips.push(ddr);
    if (form) chips.push(form);
  }
  if (tryPsu && chips.length === 0) {
    const w = detectPsuWatts(name);
    if (w) chips.push(`${w}W`);
  }
  if (tryCase && chips.length === 0) {
    const form = detectFormFactor(name);
    if (form) chips.push(form);
  }

  if (chips.length === 0) return null;
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {chips.map((c) => (
        <Chip key={c}>{c}</Chip>
      ))}
    </div>
  );
}
