"use client";

import Link from "next/link";
import {
  Cpu, Monitor, Layers, Database, HardDrive, Zap, Server, Wind,
  Plus, Trash2, TriangleAlert, Share, Save,
} from "lucide-react";
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

function psuCapacity(name: string | undefined): number {
  if (!name) return 0;
  const match = name.match(/(\d{3,4})\s*W/i);
  return match ? Number(match[1]) : 0;
}

export default function BuilderPage() {
  const { components, removeComponent, clearBuild } = useBuildStore();

  const filledCount = Object.keys(components).length;
  const totalPrice = Object.values(components).reduce(
    (sum, c) => sum + (c?.priceEur ?? 0),
    0
  );
  const totalWatts = estimatedWatts(components);
  const psuWatts = psuCapacity(components.psu?.name);
  const wattPercent =
    totalWatts === 0
      ? 0
      : Math.min(100, (totalWatts / (psuWatts > 0 ? psuWatts : 700)) * 100);

  const noGpuNoPsu = components.gpu && !components.psu;

  return (
    <main className="flex-grow pt-24 pb-16 px-8 max-w-[1280px] mx-auto w-full min-h-screen">
      {/* Compatibility Warning Banner */}
      {noGpuNoPsu && (
        <div className="mb-8 p-4 bg-warning-amber/10 border border-warning-amber rounded-lg flex items-center gap-3">
          <TriangleAlert className="w-6 h-6 text-warning-amber flex-shrink-0" />
          <p className="font-body-lg text-body-lg text-on-surface font-semibold">
            Let op: voeg een voeding (PSU) toe voor je videokaart. Minimaal 650W aanbevolen.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left: Component Slots */}
        <div className="lg:col-span-8">
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-6">PC Builder</h2>

          <div className="space-y-3">
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
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded bg-surface-container flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-label-technical text-label-technical text-on-surface-variant">
                          {meta.shortLabel}
                        </p>
                        <p className="font-title-md text-title-md text-on-surface truncate">
                          {item.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 flex-shrink-0">
                      <span className="font-label-price text-label-price text-primary">
                        {formatEur(item.priceEur)}
                      </span>
                      <button
                        onClick={() => removeComponent(type)}
                        aria-label={`Verwijder ${meta.label}`}
                        className="p-2 text-on-surface-variant hover:text-error-crimson transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
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
                      <Icon className="w-6 h-6 text-on-surface-variant group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <p className="font-label-technical text-label-technical text-on-surface-variant">
                        {meta.shortLabel}
                      </p>
                      <p className="font-body-lg text-body-lg text-on-surface-variant italic">
                        {meta.emptyText}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/categorie/${type}`}
                    className="px-4 py-2 border border-primary text-primary font-label-technical text-label-technical rounded hover:bg-primary hover:text-white transition-all flex items-center gap-2 flex-shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" /> Voeg toe
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Sidebar: Build Overview */}
        <aside className="lg:col-span-4">
          <div className="sticky top-24 bg-surface-container-lowest border border-outline-variant rounded-lg p-6 shadow-sm">
            <h3 className="font-title-md text-title-md text-on-surface mb-6">Build Overzicht</h3>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center pb-4 border-b border-outline-variant">
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Geselecteerde onderdelen ({filledCount})
                </span>
                {filledCount > 0 && (
                  <button
                    onClick={clearBuild}
                    className="font-label-technical text-label-technical text-primary hover:underline"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {filledCount > 0 && (
                <ul className="space-y-3">
                  {COMPONENT_TYPES.filter((t) => components[t]).map((type) => (
                    <li key={type} className="flex justify-between items-start text-sm">
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="font-bold text-on-surface truncate">
                          {components[type]!.name}
                        </span>
                        <span className="text-xs text-on-surface-variant">
                          {COMPONENT_META[type].shortLabel}
                        </span>
                      </div>
                      <span className="font-label-technical text-label-technical flex-shrink-0">
                        {formatEur(components[type]!.priceEur)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="pt-4 mt-6 border-t border-outline-variant">
                <div className="flex justify-between items-end mb-1">
                  <span className="font-label-technical text-label-technical text-on-surface-variant">
                    Totaalprijs
                  </span>
                  <span className="font-display-lg text-display-lg text-primary">
                    {formatEur(totalPrice)}
                  </span>
                </div>
                <p className="text-[10px] text-on-surface-variant text-right uppercase tracking-wider">
                  Inclusief BTW &bull; Indicatief
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <button className="w-full py-4 bg-primary text-on-primary font-bold font-label-technical text-label-technical rounded hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                <Share className="w-4 h-4" /> Exporteer build
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
                <span className="text-primary">
                  {totalWatts}W / {psuWatts}W est.
                </span>
              </p>
              <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${wattPercent}%` }}
                />
              </div>
              {psuWatts > 0 && totalWatts > psuWatts * 0.8 && (
                <p className="text-[10px] text-warning-amber mt-2">
                  Hoog verbruik — kies een PSU van {Math.ceil((totalWatts * 1.25) / 50) * 50}W of meer.
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
