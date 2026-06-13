"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Cpu, Monitor, Layers, Database, HardDrive, Zap, Server, Wind,
  Plus, Trash2, Share, Save, Check, Pencil,
} from "lucide-react";
import { useBuildStore } from "@/lib/store/build";
import { useSession } from "@/lib/auth-client";
import { COMPONENT_META, COMPONENT_TYPES } from "@/lib/categories";
import { formatEur } from "@/lib/format";
import { BuildIntelligence } from "@/components/builder/BuildIntelligence";
import {
  detectCpu, detectGpu, detectRamGb, detectDdr, detectSocket,
  detectPsuWatts, detectFormFactor,
} from "@/lib/specs/detect";
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

/** Korte spec-chips per slot, afgeleid uit de productnaam. */
function slotChips(type: ComponentType, name: string): string[] {
  switch (type) {
    case "cpu": {
      const c = detectCpu(name);
      if (!c) return [];
      return [`${c.cores}c / ${c.threads}t`, c.socket, c.ddr];
    }
    case "gpu": {
      const g = detectGpu(name);
      if (!g) return [];
      return [`${g.vramGb}GB VRAM`, `${g.tdp}W`];
    }
    case "ram": {
      const gb = detectRamGb(name);
      const ddr = detectDdr(name);
      return [gb ? `${gb}GB` : "", ddr ?? ""].filter(Boolean);
    }
    case "motherboard": {
      return [detectSocket(name) ?? "", detectDdr(name) ?? "", detectFormFactor(name) ?? ""].filter(Boolean);
    }
    case "psu": {
      const w = detectPsuWatts(name);
      return w ? [`${w}W`] : [];
    }
    case "case": {
      const f = detectFormFactor(name);
      return f ? [f] : [];
    }
    default:
      return [];
  }
}

export function BuilderClient() {
  const { components, removeComponent, clearBuild } = useBuildStore();
  const { data: session } = useSession();

  const [saveOpen, setSaveOpen] = useState(false);
  const [buildName, setBuildName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [exported, setExported] = useState(false);

  const filledCount = Object.keys(components).length;
  const totalPrice = Object.values(components).reduce(
    (sum, c) => sum + (c?.priceEur ?? 0),
    0
  );

  async function handleExport() {
    const lines = COMPONENT_TYPES.filter((t) => components[t]).map(
      (t) =>
        `${COMPONENT_META[t].shortLabel}: ${components[t]!.name} — ${formatEur(components[t]!.priceEur)}`
    );
    const text = [
      "Mijn PC-build via CoreBuild (corebuildnl.com)",
      "",
      ...lines,
      "",
      `Totaal: ${formatEur(totalPrice)} (indicatief, incl. BTW)`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setExported(true);
      setTimeout(() => setExported(false), 2500);
    } catch {
      // clipboard niet beschikbaar (bijv. zonder https) — stil falen
    }
  }

  async function handleSave() {
    if (!buildName.trim()) return;
    setSaving(true);
    setSaveError(null);
    const res = await fetch("/api/builds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: buildName.trim(), components }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setSaveError(data?.error ?? "Opslaan mislukt");
      return;
    }
    setSaved(true);
    setSaveOpen(false);
    setBuildName("");
    setTimeout(() => setSaved(false), 4000);
  }

  return (
    <main className="flex-grow pt-24 pb-16 px-4 sm:px-8 max-w-[1280px] mx-auto w-full min-h-screen">
      <div className="mb-6">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">PC Builder</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
          Kies je onderdelen en zie meteen wat ze samen presteren — FPS, bottleneck en het juiste scherm.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: slots + intelligentie */}
        <div className="lg:col-span-7 space-y-5">
          <div className="space-y-3">
            {COMPONENT_TYPES.map((type) => {
              const meta = COMPONENT_META[type];
              const Icon = ICONS[type];
              const item = components[type];

              if (item) {
                const chips = slotChips(type, item.name);
                return (
                  <div
                    key={type}
                    className="group flex items-center justify-between gap-3 p-4 bg-surface-container-lowest border border-outline-variant rounded-xl hover:border-primary hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-label-technical text-[11px] uppercase tracking-wider text-on-surface-variant">
                          {meta.shortLabel}
                        </p>
                        <p className="font-title-md text-[15px] text-on-surface truncate">{item.name}</p>
                        {chips.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {chips.map((chip) => (
                              <span
                                key={chip}
                                className="font-label-technical text-[10px] px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant"
                              >
                                {chip}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <span className="font-label-price text-label-price text-primary block">
                          {formatEur(item.priceEur)}
                        </span>
                        <Link
                          href={`/categorie/${type}`}
                          className="font-label-technical text-[10px] text-on-surface-variant hover:text-primary inline-flex items-center gap-1"
                        >
                          <Pencil className="w-3 h-3" /> wijzig
                        </Link>
                      </div>
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
                  className="flex items-center justify-between p-4 bg-surface-container-low/40 border border-dashed border-outline-variant rounded-xl group hover:border-primary transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-surface-container-low flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-on-surface-variant group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <p className="font-label-technical text-[11px] uppercase tracking-wider text-on-surface-variant">
                        {meta.shortLabel}
                      </p>
                      <p className="font-body-lg text-body-lg text-on-surface-variant italic">{meta.emptyText}</p>
                    </div>
                  </div>
                  <Link
                    href={`/categorie/${type}`}
                    className="px-4 py-2 border border-primary text-primary font-label-technical text-label-technical rounded-lg hover:bg-primary hover:text-white transition-all flex items-center gap-2 flex-shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" /> Voeg toe
                  </Link>
                </div>
              );
            })}
          </div>

          <BuildIntelligence components={components} />
        </div>

        {/* Right: build-overzicht (sticky) */}
        <aside className="lg:col-span-5">
          <div className="sticky top-24 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-title-md text-title-md text-on-surface">Build-overzicht</h2>
              {filledCount > 0 && (
                <button
                  onClick={clearBuild}
                  className="font-label-technical text-label-technical text-primary hover:underline"
                >
                  Alles wissen
                </button>
              )}
            </div>

            <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">
              {filledCount} van {COMPONENT_TYPES.length} onderdelen gekozen
            </p>

            {filledCount > 0 && (
              <ul className="space-y-3 mb-5">
                {COMPONENT_TYPES.filter((t) => components[t]).map((type) => (
                  <li key={type} className="flex justify-between items-start text-sm">
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="font-bold text-on-surface truncate">{components[type]!.name}</span>
                      <span className="text-xs text-on-surface-variant">{COMPONENT_META[type].shortLabel}</span>
                    </div>
                    <span className="font-label-technical text-label-technical flex-shrink-0">
                      {formatEur(components[type]!.priceEur)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div className="pt-4 border-t border-outline-variant mb-5">
              <div className="flex justify-between items-end mb-1">
                <span className="font-label-technical text-label-technical text-on-surface-variant">Totaalprijs</span>
                <span className="font-display-lg text-display-lg text-primary">{formatEur(totalPrice)}</span>
              </div>
              <p className="text-[10px] text-on-surface-variant text-right uppercase tracking-wider">
                Inclusief BTW &bull; Indicatief
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleExport}
                disabled={filledCount === 0}
                className={`w-full py-3.5 font-bold font-label-technical text-label-technical rounded-lg transition-all flex items-center justify-center gap-2 ${
                  exported
                    ? "bg-success-emerald text-white"
                    : filledCount === 0
                      ? "bg-surface-container text-outline cursor-not-allowed border border-outline-variant/30"
                      : "bg-primary text-on-primary hover:opacity-90 active:scale-[0.98] shadow-lg shadow-primary/20"
                }`}
              >
                {exported ? (
                  <>
                    <Check className="w-4 h-4" /> Gekopieerd naar klembord
                  </>
                ) : (
                  <>
                    <Share className="w-4 h-4" /> Exporteer build
                  </>
                )}
              </button>
              {session ? (
                saveOpen ? (
                  <div className="flex flex-col gap-2 p-3 bg-surface-container-low rounded-lg border border-outline-variant/50">
                    <input
                      autoFocus
                      value={buildName}
                      onChange={(e) => setBuildName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSave()}
                      placeholder="Naam van je build…"
                      maxLength={80}
                      className="w-full h-10 px-3 bg-white border border-outline-variant rounded-lg font-body-sm text-body-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    />
                    {saveError && (
                      <p className="font-label-technical text-label-technical text-error-crimson">{saveError}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={handleSave}
                        disabled={saving || !buildName.trim()}
                        className="flex-1 py-2 bg-primary text-on-primary font-label-technical text-label-technical rounded-lg hover:opacity-90 disabled:opacity-50"
                      >
                        {saving ? "Opslaan..." : "Opslaan"}
                      </button>
                      <button
                        onClick={() => setSaveOpen(false)}
                        className="px-4 py-2 border border-outline-variant font-label-technical text-label-technical rounded-lg text-on-surface-variant hover:border-primary hover:text-primary"
                      >
                        Annuleer
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setSaveOpen(true)}
                    disabled={filledCount === 0}
                    className={`w-full py-3.5 font-bold font-label-technical text-label-technical rounded-lg flex items-center justify-center gap-2 transition-all ${
                      saved
                        ? "bg-success-emerald text-white"
                        : filledCount === 0
                          ? "bg-surface-container text-outline cursor-not-allowed border border-outline-variant/30"
                          : "bg-surface-container-lowest text-primary border border-primary hover:bg-primary hover:text-white"
                    }`}
                  >
                    {saved ? (
                      <>
                        <Check className="w-4 h-4" /> Opgeslagen — zie Mijn builds
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" /> Bewaar build
                      </>
                    )}
                  </button>
                )
              ) : (
                <Link
                  href="/inloggen"
                  className="w-full py-3.5 bg-surface-container text-on-surface-variant font-bold font-label-technical text-label-technical rounded-lg flex items-center justify-center gap-2 border border-outline-variant/30 hover:border-primary hover:text-primary transition-colors"
                >
                  <Save className="w-4 h-4" /> Log in om te bewaren
                </Link>
              )}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
