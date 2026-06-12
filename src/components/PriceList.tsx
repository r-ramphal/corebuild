"use client";

import Image from "next/image";
import { ExternalLink, Package } from "lucide-react";
import { formatEur } from "@/lib/format";
import type { PriceResult, SearchResults } from "@/lib/types";

const RETAILER_LABEL: Record<string, string> = {
  amazon: "Amazon.nl",
  bol: "Bol.com",
  megekko: "Megekko",
  azerty: "Azerty",
  alternate: "Alternate",
};

const RETAILER_BG: Record<string, string> = {
  amazon: "bg-retailer-amazon",
  bol: "bg-retailer-bol",
  megekko: "bg-retailer-megekko",
  azerty: "bg-retailer-azerty",
  alternate: "bg-retailer-alternate",
};

function ResultCard({
  item,
  isCheapest,
}: {
  item: PriceResult;
  isCheapest: boolean;
}) {
  const outOfStock = !item.inStock;

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`relative block group bg-surface-container-lowest border rounded-xl p-4 flex gap-6 hover:border-primary hover:shadow-md transition-all ${
        isCheapest ? "border-2 border-success-emerald" : "border-outline-variant"
      } ${outOfStock ? "opacity-75" : ""}`}
    >
      {/* "Beste prijs" badge */}
      {isCheapest && (
        <span className="absolute -top-3 right-4 bg-success-emerald text-white text-[10px] font-mono font-medium px-3 py-0.5 rounded-full uppercase tracking-wide">
          Beste prijs
        </span>
      )}

      {/* Image area */}
      <div
        className={`w-48 flex-shrink-0 flex items-center justify-center bg-white rounded-lg border border-outline-variant overflow-hidden ${
          outOfStock ? "grayscale-[0.5]" : ""
        }`}
        style={{ minHeight: "9rem" }}
      >
        {item.imageUrl ? (
          <div className="relative w-full h-36">
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              className="object-contain p-2"
              sizes="192px"
              unoptimized
            />
          </div>
        ) : (
          <div className="flex items-center justify-center w-full h-36 bg-surface-container">
            <Package className="w-8 h-8 text-on-surface-variant" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between gap-3">
        {/* Top row: retailer badge + stock */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-white font-mono text-[10px] uppercase tracking-wide ${
              RETAILER_BG[item.retailer] ?? "bg-on-surface-variant"
            }`}
          >
            {RETAILER_LABEL[item.retailer] ?? item.retailer}
          </span>
          {outOfStock && (
            <span className="text-[10px] font-mono text-on-surface-variant border border-outline-variant rounded px-2 py-0.5">
              Niet op voorraad
            </span>
          )}
        </div>

        {/* Product name */}
        <div>
          <p className="text-base font-semibold leading-6 text-on-surface group-hover:text-primary transition-colors line-clamp-1">
            {item.name}
          </p>
        </div>

        {/* Bottom row: price + CTA */}
        <div className="flex items-center justify-between gap-4">
          <p
            className={`text-lg font-bold leading-6 ${
              isCheapest ? "text-primary" : "text-on-surface"
            }`}
          >
            {formatEur(item.priceEur)}
          </p>
          <span className="inline-flex items-center gap-1.5 text-xs font-mono text-on-surface-variant border border-outline-variant rounded-lg px-3 py-1.5 group-hover:border-primary group-hover:text-primary transition-colors flex-shrink-0">
            Bekijk bij retailer
            <ExternalLink className="w-3 h-3" />
          </span>
        </div>
      </div>
    </a>
  );
}

export function PriceList({
  results,
}: {
  results: SearchResults;
}) {
  const { results: items, errors } = results;
  const cheapestPrice = items[0]?.priceEur;

  return (
    <div className="space-y-4">
      {errors.length > 0 && (
        <p className="text-xs text-on-surface-variant">
          {errors.map((e) => RETAILER_LABEL[e.retailer] ?? e.retailer).join(", ")} niet beschikbaar
        </p>
      )}

      {items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-on-surface font-heading font-semibold text-lg">
            Geen resultaten gevonden
          </p>
          <p className="text-on-surface-variant text-sm mt-2">
            Probeer een andere zoekterm of pas de filters aan.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <ResultCard
              key={`${item.retailer}-${i}`}
              item={item}
              isCheapest={item.priceEur === cheapestPrice}
            />
          ))}
        </div>
      )}
    </div>
  );
}
