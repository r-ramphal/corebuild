"use client";

import { useSyncExternalStore } from "react";
import { BuildPreview2D } from "./BuildPreview2D";
import { BuildPreview3D } from "./BuildPreview3D";
import type { BuildComponents } from "@/lib/store/build";
import type { ComponentType } from "@/lib/types";

type View = "2d" | "3d";
const KEY = "corebuild-preview-view";
const listeners = new Set<() => void>();

/**
 * Voorkeur (2.5D/3D) in localStorage, via useSyncExternalStore zodat er geen
 * hydration-mismatch ontstaat: server + eerste client-render zijn altijd "2d".
 */
function read(): View {
  if (typeof window === "undefined") return "2d";
  return localStorage.getItem(KEY) === "3d" ? "3d" : "2d";
}
function setStored(v: View) {
  try {
    localStorage.setItem(KEY, v);
  } catch {
    // localStorage niet beschikbaar — keuze geldt alleen voor deze render
  }
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

/**
 * Wikkelt de buildvisualisatie met een 2.5D↔3D-keuze. 2.5D is de standaard
 * (licht, snel); 3D is een draaibaar CSS-aanzicht. De keuze blijft bewaard.
 */
export function BuildPreview({
  components,
  onSelectSlot,
}: {
  components: BuildComponents;
  onSelectSlot?: (type: ComponentType) => void;
}) {
  const view = useSyncExternalStore<View>(subscribe, read, () => "2d");

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <div
          role="group"
          aria-label="Weergave"
          className="inline-flex rounded-lg border border-outline-variant p-0.5 bg-surface-container-lowest"
        >
          {(["2d", "3d"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setStored(v)}
              aria-pressed={view === v}
              className={`px-3 py-1 rounded-md font-label-technical text-label-technical transition-colors ${
                view === v ? "bg-primary text-on-primary" : "text-on-surface-variant hover:text-primary"
              }`}
            >
              {v === "2d" ? "2.5D" : "3D"}
            </button>
          ))}
        </div>
      </div>
      {view === "3d" ? (
        <BuildPreview3D components={components} onSelectSlot={onSelectSlot} />
      ) : (
        <BuildPreview2D components={components} />
      )}
    </div>
  );
}
