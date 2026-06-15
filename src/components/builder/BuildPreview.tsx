"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { RotateCcw, Box } from "lucide-react";
import type { BuildComponents } from "@/lib/store/build";
import type { ComponentType } from "@/lib/types";
import { buildModel } from "@/lib/specs/build-model";
import { useCompat } from "@/lib/use-compat";

// three.js is zwaar → lui laden, alleen client. Houdt de builder-bundle licht.
const BuildScene = dynamic(() => import("./BuildScene"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-on-surface-variant">
      <Box className="w-6 h-6 animate-pulse text-primary" />
      <span className="font-label-technical text-[11px]">3D-weergave laden…</span>
    </div>
  ),
});

const LEGEND: { type: ComponentType; label: string }[] = [
  { type: "case", label: "Behuizing" },
  { type: "motherboard", label: "Moederbord" },
  { type: "cpu", label: "CPU" },
  { type: "cooling", label: "Koeler" },
  { type: "ram", label: "RAM" },
  { type: "gpu", label: "Videokaart" },
  { type: "storage", label: "Opslag" },
  { type: "psu", label: "Voeding" },
];

// prefers-reduced-motion, hydration-veilig (server + eerste render = false).
function subscribeRM(cb: () => void) {
  const m = window.matchMedia("(prefers-reduced-motion: reduce)");
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
}
function getRM() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Maatvaste 3D-weergave van de build (three.js). Onderdelen lichten op als je ze
 * kiest; sleep om te draaien, idle draait hij zachtjes (tenzij reduced-motion).
 * Klik een onderdeel in de scène of in de legenda om het te kiezen/wijzigen.
 */
export function BuildPreview({
  components,
  onSelectSlot,
}: {
  components: BuildComponents;
  onSelectSlot?: (type: ComponentType) => void;
}) {
  const compat = useCompat(components);
  const model = useMemo(() => buildModel(components, compat), [components, compat]);
  const [hot, setHot] = useState<ComponentType | null>(null);
  const [resetSignal, setResetSignal] = useState(0);
  const reduced = useSyncExternalStore(subscribeRM, getRM, () => false);

  const has = (t: ComponentType) => Boolean(components[t]);
  const realDims = [
    model.sources.gpuLength === "real" && "GPU-lengte",
    model.sources.coolerHeight === "real" && "koelerhoogte",
    model.sources.caseSize === "real" && "behuizing",
  ].filter(Boolean) as string[];

  return (
    <div className="relative bg-surface-container-low border border-outline-variant rounded-xl p-4 overflow-hidden">
      <div className="absolute top-3 left-4 z-10 font-label-technical text-label-technical uppercase tracking-wider text-on-surface-variant">
        Jouw build
      </div>
      <div className="absolute top-2.5 right-3 z-10 flex items-center gap-2">
        <span className="font-label-technical text-[10px] text-outline hidden sm:inline">sleep om te draaien</span>
        <button
          onClick={() => setResetSignal((n) => n + 1)}
          title="Aanzicht herstellen"
          aria-label="Aanzicht herstellen"
          className="p-1.5 rounded-lg border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary transition-colors bg-surface-container-lowest"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div
        role="img"
        aria-label="Draaibaar 3D-aanzicht van je build, op schaal van de echte onderdelen"
        className="h-[340px] mt-4 touch-none select-none"
      >
        <BuildScene
          model={model}
          hot={hot}
          setHot={setHot}
          onSelectSlot={onSelectSlot}
          reducedMotion={reduced}
          resetSignal={resetSignal}
        />
      </div>

      {/* Legenda — klik om te kiezen/wijzigen, hover om te markeren in de scène */}
      <div className="relative z-10 flex flex-wrap gap-x-2 gap-y-1.5 mt-2 justify-center">
        {LEGEND.map(({ type, label }) => {
          const on = has(type);
          const active = hot === type;
          return (
            <button
              key={type}
              onClick={() => onSelectSlot?.(type)}
              onMouseEnter={() => setHot(type)}
              onMouseLeave={() => setHot(null)}
              onFocus={() => setHot(type)}
              onBlur={() => setHot(null)}
              title={on ? `${label} wijzigen` : `${label} kiezen`}
              className={`inline-flex items-center gap-1.5 font-label-technical text-[10px] px-1.5 py-0.5 rounded transition-colors hover:bg-surface-container ${
                active ? "text-primary" : on ? "text-on-surface-variant" : "text-outline-variant"
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-[2px] inline-block"
                style={{
                  background: on ? (active ? "var(--cb-primary)" : "color-mix(in srgb, var(--cb-primary) 55%, transparent)") : "transparent",
                  border: `1px ${on ? "solid" : "dashed"} ${on ? "var(--cb-primary)" : "var(--cb-outline-variant)"}`,
                }}
              />
              {label}
            </button>
          );
        })}
      </div>

      {realDims.length > 0 && (
        <p className="relative z-10 mt-2 text-center font-label-technical text-[10px] text-outline">
          Op schaal: {realDims.join(", ")} uit de onderdelen-database.
        </p>
      )}
    </div>
  );
}
