"use client";

import Link from "next/link";
import { Cpu, Monitor, Layers, Database, HardDrive, Zap, Server, Wind, Plus, X, TriangleAlert, Download, Save } from "lucide-react";
import { useBuildStore } from "@/lib/store/build";
import { COMPONENT_META, COMPONENT_TYPES } from "@/lib/categories";
import { formatEur } from "@/lib/format";
import type { ComponentType } from "@/lib/types";

const ICONS: Record<ComponentType, React.ComponentType<{ className?: string }>> = {
  cpu: Cpu,
  gpu: Monitor,
  motherboard: Layers,
  ram: Database,
  storage: HardDrive,
  psu: Zap,
  case: Server,
  cooling: Wind,
};

function estimatedWatts(components: Partial<Record<ComponentType, unknown>>): number {
  return COMPONENT_TYPES.filter((t) => t !== "psu" && components[t]).reduce(
    (sum, t) => sum + COMPONENT_META[t].wattage,
    0
  );
}

export default function BuilderPage() {
  const { components, removeComponent, clearBuild } = useBuildStore();

  const filledCount = Object.keys(components).length;
  const totalPrice = Object.values(components).reduce(
    (sum, c) => sum + (c?.priceEur ?? 0),
    0
  );
  const totalWatts = estimatedWatts(components);
  const wattPercent = Math.min(100, (totalWatts / 700) * 100);

  const noGpuNoPsu = components.gpu && !components.psu;

  return (
    <main className="pt-20 pb-16 min-h-screen bg-surface">
      <div className="max-w-[1280px] mx-auto px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left: 8 columns */}
          <div className="lg:col-span-8 space-y-4">
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-6">PC Builder</h2>

            {noGpuNoPsu && (
              <div className="flex gap-3 items-start p-4 bg-warning-amber/10 border border-warning-amber rounded-lg">
                <TriangleAlert className="w-5 h-5 text-warning-amber flex-shrink-0 mt-0.5" />
                <p className="font-body-sm text-body-sm text-on-surface">
                  Voeg een voeding (PSU) toe voor je videokaart. Minimaal 650W aanbevolen.
                </p>
              </div>
            )}

            {COMPONENT_TYPES.map((type) => {
              const meta = COMPONENT_META[type];
              const Icon = ICONS[type];
              const item = components[type];

              if (item) {
                return (
                  <div
                    key={type}
                    className="flex items-center justify-between p-4 bg-surface-container-lowest border border-outline-variant rounded-lg hover:border-primary transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded bg-surface-container flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-label-technical text-label-technical text-on-surface-variant uppercase">
                          {meta.label}
                        </p>
                        <p className="font-title-md text-title-md text-on-surface">
                          {item.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="font-label-price text-label-price text-primary flex-shrink-0">
                        {formatEur(item.priceEur)}
                      </span>
                      <button
                        onClick={() => removeComponent(type)}
                        aria-label={`Verwijder ${meta.label}`}
                        className="p-2 text-on-surface-variant hover:text-error-crimson transition-colors flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={type}
                  className="flex items-center justify-between p-4 bg-surface-container-low/50 border border-dashed border-outline-variant rounded-lg group hover:border-primary transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded bg-surface-container-low flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-on-surface-variant group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <p className="font-label-technical text-label-technical text-on-surface-variant uppercase">
                        {meta.label}
                      </p>
                      <p className="font-body-lg text-body-lg text-on-surface-variant italic">
                        Nog geen {meta.label.toLowerCase()} geselecteerd
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/zoeken?q=${encodeURIComponent(meta.searchTerm)}&slot=${type}`}
                    className="px-4 py-2 border border-primary text-primary font-label-technical text-label-technical rounded hover:bg-primary hover:text-white transition-all flex items-center gap-2 flex-shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" /> Voeg toe
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Right: 4 columns — Build summary */}
          <aside className="lg:col-span-4">
            <div className="sticky top-24 bg-surface-container-lowest border border-outline-variant rounded-lg p-6 shadow-sm">
              <h3 className="font-title-md text-title-md text-on-surface mb-6">Build Overzicht</h3>

              {filledCount === 0 ? (
                <p className="font-body-sm text-body-sm text-on-surface-variant text-center py-6">
                  Voeg componenten toe om een overzicht te zien.
                </p>
              ) : (
                <div className="flex flex-col gap-2 mb-6">
                  {COMPONENT_TYPES.filter((t) => components[t]).map((type) => (
                    <div key={type} className="flex justify-between items-center">
                      <div>
                        <span className="font-body-sm text-body-sm font-bold text-on-surface block">
                          {components[type]!.name.length > 30
                            ? components[type]!.name.slice(0, 30) + "…"
                            : components[type]!.name}
                        </span>
                        <span className="font-label-technical text-label-technical text-on-surface-variant">
                          {COMPONENT_META[type].label}
                        </span>
                      </div>
                      <span className="font-body-sm text-body-sm font-medium text-on-surface ml-2 flex-shrink-0">
                        {formatEur(components[type]!.priceEur)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-outline-variant pt-4 mb-2">
                <div className="font-display-lg text-display-lg text-primary">
                  {formatEur(totalPrice)}
                </div>
                <p className="text-[10px] text-on-surface-variant text-right uppercase tracking-wider">
                  Inclusief BTW &bull; Indicatief
                </p>
              </div>

              <div className="flex flex-col gap-3 mt-6">
                <button className="w-full py-4 bg-primary text-on-primary font-bold font-label-technical text-label-technical rounded hover:opacity-90 flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                  <Download className="w-4 h-4" /> Exporteer build
                </button>
                <button
                  disabled
                  className="w-full py-4 bg-surface-container text-outline font-bold font-label-technical text-label-technical rounded cursor-not-allowed flex items-center justify-center gap-2 border border-outline-variant/30"
                >
                  <Save className="w-4 h-4" /> Bewaar build
                </button>
              </div>

              {/* Power consumption */}
              <div className="mt-8 p-4 bg-surface-container-low rounded border border-outline-variant/30">
                <p className="font-label-technical text-label-technical text-on-surface-variant mb-3 flex justify-between">
                  <span>Power Consumption</span>
                  <span className="text-primary">~{totalWatts}W est.</span>
                </p>
                <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${wattPercent}%`,
                      backgroundColor:
                        totalWatts > 500
                          ? "var(--cb-warning-amber)"
                          : "var(--cb-success-emerald)",
                    }}
                  />
                </div>
                {totalWatts > 500 && (
                  <p className="text-[10px] text-warning-amber mt-2">
                    Hoog verbruik — kies een PSU van {Math.ceil(totalWatts * 1.25 / 50) * 50}W of meer.
                  </p>
                )}
              </div>

              {filledCount > 0 && (
                <button
                  onClick={clearBuild}
                  className="w-full mt-4 py-2 font-label-technical text-label-technical text-on-surface-variant border border-outline-variant rounded-lg hover:border-error-crimson hover:text-error-crimson transition-colors"
                >
                  Wis build
                </button>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
