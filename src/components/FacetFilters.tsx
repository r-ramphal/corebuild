"use client";

/**
 * Herbruikbare filter-zijbalk: facet-checkboxes (merk/socket/DDR/…) met
 * aantallen, prijs-tier-checkboxes én een prijs-slider. Gebruikt door de
 * categoriepagina en de zoekpagina. Extra filters (retailers, op-voorraad)
 * kunnen via `children` bovenaan worden meegegeven.
 */
import type { ReactNode } from "react";
import type { FacetGroup, FacetSelection, PriceTier } from "@/lib/specs/facets";

interface Props {
  groups: FacetGroup[];
  selected: FacetSelection;
  onToggle: (key: string, value: string) => void;
  tiers: PriceTier[];
  selectedTiers: string[];
  onToggleTier: (id: string) => void;
  maxPrice: number;
  priceCap: number;
  onMaxPrice: (v: number) => void;
  onApply: () => void;
  onClear: () => void;
  children?: ReactNode;
}

export function FacetFilters({
  groups, selected, onToggle, tiers, selectedTiers, onToggleTier, maxPrice, priceCap, onMaxPrice, onApply, onClear, children,
}: Props) {
  return (
    <div className="p-6 bg-surface-container-lowest border border-outline-variant rounded-xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-title-md text-title-md text-on-surface">Filters</h3>
        <button onClick={onClear} className="text-primary font-label-technical text-label-technical hover:underline">
          Wis alles
        </button>
      </div>

      {children}

      {groups.map((g) => (
        <div key={g.key} className="mb-8">
          <h4 className="font-label-technical text-label-technical uppercase tracking-wider text-outline mb-4">
            {g.label}
          </h4>
          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {g.options.map((o) => (
              <label key={o.value} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selected[g.key]?.includes(o.value) ?? false}
                  onChange={() => onToggle(g.key, o.value)}
                  className="w-4 h-4 rounded text-primary border-outline-variant focus:ring-primary"
                />
                <span className="font-body-sm text-body-sm text-on-surface group-hover:text-primary transition-colors flex-1">
                  {o.value}
                </span>
                <span className="font-label-technical text-[11px] text-on-surface-variant">{o.count}</span>
              </label>
            ))}
          </div>
        </div>
      ))}

      {/* Prijs: tier-checkboxes + slider */}
      <div>
        <h4 className="font-label-technical text-label-technical uppercase tracking-wider text-outline mb-4">
          Prijs
        </h4>
        <div className="space-y-2.5 mb-5">
          {tiers.map((t) => (
            <label key={t.id} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedTiers.includes(t.id)}
                onChange={() => onToggleTier(t.id)}
                className="w-4 h-4 rounded text-primary border-outline-variant focus:ring-primary"
              />
              <span className="font-body-sm text-body-sm text-on-surface group-hover:text-primary transition-colors">
                {t.label}
              </span>
            </label>
          ))}
        </div>
        <input
          type="range"
          min={0}
          max={priceCap}
          step={50}
          value={maxPrice}
          onChange={(e) => onMaxPrice(Number(e.target.value))}
          aria-label="Maximale prijs"
          aria-valuetext={maxPrice >= priceCap ? "Geen limiet" : `€${maxPrice}`}
          className="w-full h-1 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between mt-2 font-label-technical text-label-technical text-on-surface-variant">
          <span>€0</span>
          <span>
            {maxPrice >= priceCap
              ? `€${priceCap.toLocaleString("nl-NL")}+`
              : `€${maxPrice.toLocaleString("nl-NL")}`}
          </span>
        </div>
      </div>

      {/* Filters gelden pas na klikken — laat de gebruiker eerst meerdere
          opties kiezen i.p.v. live filteren bij elke vink. */}
      <button
        onClick={onApply}
        className="mt-6 w-full h-11 bg-primary text-on-primary rounded-lg font-label-technical text-label-technical hover:opacity-90 transition-opacity"
      >
        Filters toepassen
      </button>
    </div>
  );
}
