"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ExternalLink, Package, Plus, Check } from "lucide-react";
import { formatEur } from "@/lib/format";
import { COMPONENT_META, COMPONENT_TYPES } from "@/lib/categories";
import type { PriceResult, SearchResults, ComponentType } from "@/lib/types";

const RETAILER_LABEL: Record<string, string> = {
  amazon: "Amazon.nl",
  bol: "Bol.com",
  megekko: "Megekko",
  azerty: "Azerty",
  alternate: "Alternate",
};

const RETAILER_BG: Record<string, string> = {
  amazon: "#FF9900",
  bol: "#0000FF",
  megekko: "#00A651",
  azerty: "#E30613",
  alternate: "#00305F",
};

interface ResultRowProps {
  item: PriceResult;
  isCheapest: boolean;
  categorySlot?: ComponentType;
  onAddToBuild?: (item: PriceResult, slot: ComponentType) => void;
}

function ResultRow({ item, isCheapest, categorySlot, onAddToBuild }: ResultRowProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pickerOpen) return;
    function onOutsideClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, [pickerOpen]);

  function handleAdd(slot: ComponentType) {
    onAddToBuild?.(item, slot);
    setAdded(true);
    setPickerOpen(false);
    setTimeout(() => setAdded(false), 2500);
  }

  return (
    <div
      className={`relative bg-surface-container-lowest rounded-xl p-4 flex gap-4 transition-all ${
        isCheapest
          ? "border-2 border-success-emerald"
          : "border border-outline-variant hover:border-primary hover:shadow-md"
      }`}
    >
      {isCheapest && (
        <span className="absolute top-3 right-3 bg-success-emerald text-white text-[10px] font-mono uppercase px-2 py-0.5 rounded-full">
          Beste prijs
        </span>
      )}

      {/* Product image */}
      <div className="w-20 h-20 flex-shrink-0 rounded-lg border border-outline-variant bg-white flex items-center justify-center overflow-hidden">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            width={80}
            height={80}
            className="object-contain"
            unoptimized
          />
        ) : (
          <Package className="w-8 h-8 text-outline" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span
            className="text-[10px] font-mono uppercase text-white px-1.5 py-0.5 rounded flex-shrink-0"
            style={{ backgroundColor: RETAILER_BG[item.retailer] ?? "#737687" }}
          >
            {RETAILER_LABEL[item.retailer] ?? item.retailer}
          </span>
          {item.inStock ? (
            <span className="text-[10px] font-mono text-success-emerald">Op voorraad</span>
          ) : (
            <span className="text-[10px] font-mono text-outline">Niet beschikbaar</span>
          )}
        </div>

        <p className="text-sm font-medium text-on-surface line-clamp-2 mb-3 pr-16">
          {item.name}
        </p>

        <div className="flex items-center gap-2 flex-wrap">
          <p className={`text-lg font-bold ${isCheapest ? "text-primary" : "text-on-surface"}`}>
            {formatEur(item.priceEur)}
          </p>

          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1 text-xs font-mono px-3 py-1.5 rounded-lg border transition-all ${
              item.inStock
                ? "border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary"
                : "border-outline-variant text-outline opacity-50 pointer-events-none"
            }`}
          >
            <ExternalLink className="w-3 h-3" />
            Bekijk
          </a>

          {onAddToBuild && (
            <div ref={pickerRef} className="relative">
              {categorySlot ? (
                <button
                  onClick={() => handleAdd(categorySlot)}
                  className={`flex items-center gap-1 text-xs font-mono px-3 py-1.5 rounded-lg transition-all ${
                    added
                      ? "bg-success-emerald text-white"
                      : "bg-primary text-white hover:opacity-90"
                  }`}
                >
                  {added ? (
                    <>
                      <Check className="w-3 h-3" />
                      Toegevoegd
                    </>
                  ) : (
                    <>
                      <Plus className="w-3 h-3" />
                      Aan build
                    </>
                  )}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setPickerOpen((p) => !p)}
                    className={`flex items-center gap-1 text-xs font-mono px-3 py-1.5 rounded-lg transition-all ${
                      added
                        ? "bg-success-emerald text-white"
                        : "bg-primary text-white hover:opacity-90"
                    }`}
                  >
                    {added ? (
                      <>
                        <Check className="w-3 h-3" />
                        Toegevoegd
                      </>
                    ) : (
                      <>
                        <Plus className="w-3 h-3" />
                        Aan build
                      </>
                    )}
                  </button>

                  {pickerOpen && (
                    <div className="absolute bottom-full left-0 mb-1.5 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg z-20 py-2 min-w-[180px]">
                      <p className="text-[10px] font-mono text-on-surface-variant uppercase tracking-wide px-3 pb-1.5 border-b border-outline-variant mb-1">
                        Toevoegen als
                      </p>
                      {COMPONENT_TYPES.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => handleAdd(slot)}
                          className="w-full text-left text-xs px-3 py-2 hover:bg-surface-container-low text-on-surface transition-colors"
                        >
                          {COMPONENT_META[slot].label}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export interface PriceListProps {
  results: SearchResults;
  categorySlot?: ComponentType;
  onAddToBuild?: (item: PriceResult, slot: ComponentType) => void;
}

export function PriceList({ results, categorySlot, onAddToBuild }: PriceListProps) {
  const { results: items, errors } = results;
  const cheapestInStock = items.find((i) => i.inStock)?.priceEur;
  const cheapestPrice = cheapestInStock ?? items[0]?.priceEur;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-on-surface-variant">
          {items.length} resultaten voor{" "}
          <span className="font-medium text-on-surface">&ldquo;{results.query}&rdquo;</span>
        </p>
        {errors.length > 0 && (
          <p className="text-xs text-on-surface-variant">
            {errors.map((e) => RETAILER_LABEL[e.retailer] ?? e.retailer).join(", ")} niet
            beschikbaar
          </p>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-center text-on-surface-variant py-12 text-sm">
          Geen resultaten gevonden. Probeer een andere zoekterm.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <ResultRow
              key={`${item.retailer}-${i}`}
              item={item}
              isCheapest={item.priceEur === cheapestPrice}
              categorySlot={categorySlot}
              onAddToBuild={onAddToBuild}
            />
          ))}
        </div>
      )}
    </div>
  );
}
