"use client";

import Image from "next/image";
import Link from "next/link";
import { Cpu, Monitor, Layers, Database, HardDrive, Zap, Server, Wind, Plus, X, TriangleAlert } from "lucide-react";
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

const RETAILER_BG: Record<string, string> = {
  amazon: "#FF9900",
  bol: "#0000FF",
  megekko: "#00A651",
  azerty: "#E30613",
  alternate: "#00305F",
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
        <div className="mb-6">
          <h1 className="font-heading font-bold text-3xl text-on-surface">PC Builder</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Stel je ideale build samen. Klik op een slot om te zoeken.
          </p>
        </div>

        {noGpuNoPsu && (
          <div className="mb-6 flex gap-3 items-start p-4 bg-warning-amber/10 border border-warning-amber rounded-xl">
            <TriangleAlert className="w-5 h-5 text-warning-amber flex-shrink-0 mt-0.5" />
            <p className="text-sm text-on-surface">
              Voeg een voeding (PSU) toe voor je videokaart. Minimaal 650W aanbevolen.
            </p>
          </div>
        )}

        <div className="grid md:grid-cols-[1fr,320px] gap-8 items-start">
          {/* Slots */}
          <div className="flex flex-col gap-3">
            {COMPONENT_TYPES.map((type) => {
              const meta = COMPONENT_META[type];
              const Icon = ICONS[type];
              const item = components[type];

              if (item) {
                return (
                  <div
                    key={type}
                    className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>

                    {item.imageUrl && (
                      <div className="relative w-14 h-10 flex-shrink-0 rounded overflow-hidden bg-white border border-outline-variant">
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-contain"
                          sizes="56px"
                          unoptimized
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-on-surface truncate">{item.name}</p>
                      <span
                        className="inline-block mt-1 text-[10px] font-mono uppercase px-1.5 py-0.5 rounded text-white"
                        style={{ backgroundColor: RETAILER_BG[item.retailer] ?? "#737687" }}
                      >
                        {item.retailer}
                      </span>
                    </div>

                    <span className="font-mono font-bold text-sm text-primary flex-shrink-0">
                      {formatEur(item.priceEur)}
                    </span>

                    <button
                      onClick={() => removeComponent(type)}
                      aria-label={`Verwijder ${meta.label}`}
                      className="flex-shrink-0 text-on-surface-variant hover:text-error-crimson transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              }

              return (
                <Link
                  key={type}
                  href={`/zoeken?q=${encodeURIComponent(meta.searchTerm)}&slot=${type}`}
                  className="bg-surface-container-lowest border-2 border-dashed border-outline-variant rounded-xl p-4 flex items-center gap-4 group hover:border-primary hover:bg-surface-container-low transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center flex-shrink-0 text-on-surface-variant group-hover:bg-primary group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-on-surface-variant group-hover:text-on-surface">
                      {meta.label}
                    </p>
                    <p className="text-xs text-outline">Klik om te zoeken</p>
                  </div>
                  <Plus className="w-4 h-4 text-outline group-hover:text-primary flex-shrink-0 transition-colors" />
                </Link>
              );
            })}
          </div>

          {/* Summary sidebar */}
          <aside className="sticky top-20">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
              <h2 className="font-heading font-semibold text-on-surface mb-4">Overzicht</h2>

              {filledCount === 0 ? (
                <p className="text-sm text-on-surface-variant text-center py-6">
                  Voeg componenten toe om een overzicht te zien.
                </p>
              ) : (
                <>
                  <div className="flex flex-col gap-2 mb-4">
                    {COMPONENT_TYPES.filter((t) => components[t]).map((type) => (
                      <div key={type} className="flex justify-between items-center text-sm">
                        <span className="text-on-surface-variant">{COMPONENT_META[type].label}</span>
                        <span className="font-medium text-on-surface">
                          {formatEur(components[type]!.priceEur)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-outline-variant pt-3 mb-4 flex justify-between items-center">
                    <span className="font-semibold text-on-surface">Totaal</span>
                    <span className="font-bold text-lg text-primary">{formatEur(totalPrice)}</span>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-on-surface-variant mb-1.5">
                      <span>Geschat verbruik</span>
                      <span className="font-mono">~{totalWatts}W</span>
                    </div>
                    <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
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
                      <p className="text-[10px] text-warning-amber mt-1">
                        Hoog verbruik — kies een PSU van {Math.ceil(totalWatts * 1.25 / 50) * 50}W of meer.
                      </p>
                    )}
                  </div>
                </>
              )}

              {filledCount > 0 && (
                <button
                  onClick={clearBuild}
                  className="w-full mt-2 py-2 text-xs font-mono text-on-surface-variant border border-outline-variant rounded-lg hover:border-error-crimson hover:text-error-crimson transition-colors"
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
