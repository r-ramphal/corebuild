"use client";

import type { BuildComponents } from "@/lib/store/build";
import type { ComponentType } from "@/lib/types";

/**
 * Lichte 2.5D-weergave van de build: een gestileerd zijaanzicht van een
 * behuizing dat zich vult zodra je onderdelen kiest. Geen 3D-engine — puur
 * SVG, zodat het snel laadt en bij het CoreBuild-design past.
 */
export function BuildPreview2D({ components }: { components: BuildComponents }) {
  const has = (t: ComponentType) => Boolean(components[t]);

  // Klassen voor een gevuld vs. leeg onderdeel
  const fill = (on: boolean, tint: string) =>
    on ? `${tint} stroke-[1.5]` : "fill-surface-container/50 stroke-outline-variant/60 [stroke-dasharray:4_3]";

  const label = (on: boolean) => (on ? "fill-on-surface-variant" : "fill-outline-variant/0");

  const caseOn = has("case");

  return (
    <div className="relative bg-surface-container-low border border-outline-variant rounded-xl p-4 overflow-hidden">
      <div className="absolute top-3 left-4 font-label-technical text-label-technical uppercase tracking-wider text-on-surface-variant">
        Jouw build
      </div>

      <svg viewBox="0 0 420 340" className="w-full h-auto mt-4" role="img" aria-label="Visuele weergave van je build">
        {/* 2.5D-diepte: licht verschoven achterplaat */}
        <rect x="34" y="20" width="372" height="296" rx="12" className="fill-surface-container/60" />

        {/* Behuizing-shell */}
        <rect
          x="20" y="28" width="372" height="296" rx="12"
          className={caseOn ? "fill-surface-container-lowest stroke-primary stroke-[1.5]" : "fill-surface-container-lowest/70 stroke-outline-variant [stroke-dasharray:5_4]"}
        />

        {/* PSU-shroud-scheiding */}
        <line x1="34" y1="262" x2="378" y2="262" className="stroke-outline-variant/60" strokeWidth="1" />

        {/* Moederbord */}
        <rect x="150" y="46" width="216" height="206" rx="6" className={fill(has("motherboard"), "fill-secondary/15 stroke-secondary")} />
        <text x="258" y="60" textAnchor="middle" className={`${label(has("motherboard"))} font-mono`} fontSize="9">
          {has("motherboard") ? "Moederbord" : ""}
        </text>

        {/* CPU-socket */}
        <rect x="250" y="78" width="38" height="38" rx="3" className={fill(has("cpu"), "fill-primary/20 stroke-primary")} />
        <text x="269" y="101" textAnchor="middle" className={`${label(has("cpu"))} font-mono`} fontSize="8">
          {has("cpu") ? "CPU" : ""}
        </text>

        {/* CPU-koeler (toren boven de socket) */}
        <rect x="244" y="120" width="50" height="58" rx="4" className={fill(has("cooling"), "fill-primary/15 stroke-primary")} />
        <text x="269" y="153" textAnchor="middle" className={`${label(has("cooling"))} font-mono`} fontSize="8">
          {has("cooling") ? "Koeler" : ""}
        </text>

        {/* RAM-reepjes */}
        {[0, 1, 2, 3].map((n) => (
          <rect
            key={n} x={300 + n * 16} y="74" width="9" height="78" rx="2"
            className={fill(has("ram"), "fill-success-emerald/25 stroke-success-emerald")}
          />
        ))}
        <text x="332" y="166" textAnchor="middle" className={`${label(has("ram"))} font-mono`} fontSize="8">
          {has("ram") ? "RAM" : ""}
        </text>

        {/* Videokaart (horizontaal in PCIe) */}
        <rect x="60" y="196" width="306" height="40" rx="5" className={fill(has("gpu"), "fill-primary/20 stroke-primary")} />
        <text x="213" y="221" textAnchor="middle" className={`${label(has("gpu"))} font-mono`} fontSize="10">
          {has("gpu") ? "Videokaart" : ""}
        </text>

        {/* Opslag */}
        <rect x="44" y="120" width="86" height="30" rx="4" className={fill(has("storage"), "fill-secondary/15 stroke-secondary")} />
        <text x="87" y="139" textAnchor="middle" className={`${label(has("storage"))} font-mono`} fontSize="8">
          {has("storage") ? "Opslag" : ""}
        </text>

        {/* Voeding (in de shroud) */}
        <rect x="44" y="276" width="170" height="34" rx="5" className={fill(has("psu"), "fill-warning-amber/20 stroke-warning-amber")} />
        <text x="129" y="297" textAnchor="middle" className={`${label(has("psu"))} font-mono`} fontSize="9">
          {has("psu") ? "Voeding" : ""}
        </text>
      </svg>
    </div>
  );
}
