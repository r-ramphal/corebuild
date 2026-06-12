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
      className={`group relative bg-surface-container-lowest rounded-xl p-4 flex flex-col sm:flex-row gap-6 transition-all hover:shadow-lg ${
        isCheapest
          ? "border-2 border-success-emerald"
          : "border border-outline-variant"
      } ${!item.inStock ? "opacity-80" : ""}`}
    >
      {isCheapest && (
        <div className="absolute top-4 right-4 sm:-top-3 sm:right-6 bg-success-emerald text-on-primary px-3 py-1 rounded-full font-label-technical text-label-technical shadow-md z-10">
          Beste prijs
        </div>
      )}

      {/* Product image: 192x192 */}
      <div className="w-full sm:w-48 h-48 bg-white rounded-lg flex items-center justify-center p-4 border border-outline-variant overflow-hidden flex-shrink-0">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            width={192}
            height={192}
            className={`object-contain w-full h-full group-hover:scale-105 transition-transform duration-300 ${!item.inStock ? "grayscale" : ""}`}
            unoptimized
          />
        ) : (
          <Package className={`w-16 h-16 text-outline ${!item.inStock ? "grayscale" : ""}`} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          {/* Retailer badge + stock */}
          <div className="flex items-center gap-2 mb-2">
            <span
              className="font-label-technical text-[10px] uppercase tracking-tighter text-white px-2 py-0.5 rounded"
              style={{ backgroundColor: RETAILER_BG[item.retailer] ?? "#737687" }}
            >
              {RETAILER_LABEL[item.retailer] ?? item.retailer}
            </span>
            {item.inStock ? (
              <div className="flex items-center gap-1">
                <span className="text-success-emerald text-sm">✓</span>
                <span className="font-label-technical text-label-technical text-success-emerald">Op voorraad</span>
              </div>
            ) : (
              <span className="font-label-technical text-label-technical text-outline">Niet beschikbaar</span>
            )}
          </div>

          {/* Product name */}
          <h3 className="font-title-md text-title-md text-on-surface mb-2 group-hover:text-primary transition-colors">
            {item.name}
          </h3>
        </div>

        {/* Bottom: price + buttons */}
        <div className="flex items-end justify-between mt-4 flex-wrap gap-3">
          <div>
            <div className="font-label-price text-label-price text-primary">
              {formatEur(item.priceEur)}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Bekijk bij retailer */}
            {item.inStock ? (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary text-white px-6 py-2.5 rounded-lg font-label-technical text-label-technical flex items-center gap-2 hover:opacity-90"
              >
                Bekijk bij retailer <ExternalLink className="w-4 h-4" />
              </a>
            ) : (
              <button
                disabled
                className="bg-surface-dim text-on-surface-variant px-6 py-2.5 rounded-lg font-label-technical text-label-technical cursor-not-allowed flex items-center gap-2"
              >
                Niet beschikbaar
              </button>
            )}

            {/* Aan build */}
            {onAddToBuild && (
              <div ref={pickerRef} className="relative">
                {categorySlot ? (
                  <button
                    onClick={() => handleAdd(categorySlot)}
                    className={`flex items-center gap-1 font-label-technical text-label-technical px-3 py-2.5 rounded-lg transition-all ${
                      added
                        ? "bg-success-emerald text-white"
                        : "bg-surface-container border border-outline-variant text-on-surface hover:border-primary hover:text-primary"
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
                      className={`flex items-center gap-1 font-label-technical text-label-technical px-3 py-2.5 rounded-lg transition-all ${
                        added
                          ? "bg-success-emerald text-white"
                          : "bg-surface-container border border-outline-variant text-on-surface hover:border-primary hover:text-primary"
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
                        <p className="font-label-technical text-label-technical text-on-surface-variant uppercase tracking-wide px-3 pb-1.5 border-b border-outline-variant mb-1">
                          Toevoegen als
                        </p>
                        {COMPONENT_TYPES.map((slot) => (
                          <button
                            key={slot}
                            onClick={() => handleAdd(slot)}
                            className="w-full text-left font-body-sm text-body-sm px-3 py-2 hover:bg-surface-container-low text-on-surface transition-colors"
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
      {errors.length > 0 && (
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          {errors.map((e) => RETAILER_LABEL[e.retailer] ?? e.retailer).join(", ")} niet beschikbaar
        </p>
      )}

      {items.length === 0 ? (
        <p className="text-center text-on-surface-variant py-12 font-body-sm text-body-sm">
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
