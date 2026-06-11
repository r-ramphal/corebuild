"use client";

import Image from "next/image";
import { ExternalLink, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatEur } from "@/lib/format";
import type { PriceResult, SearchResults } from "@/lib/types";

const RETAILER_LABEL: Record<string, string> = {
  amazon: "Amazon.nl",
  megekko: "Megekko",
  azerty: "Azerty",
  alternate: "Alternate",
};

function ResultRow({ item, isCheapest }: { item: PriceResult; isCheapest: boolean }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
    >
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="flex items-center gap-4 p-4">
          {item.imageUrl ? (
            <div className="relative w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-muted">
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                className="object-contain"
                sizes="64px"
                unoptimized
              />
            </div>
          ) : (
            <div className="w-16 h-16 flex-shrink-0 rounded bg-muted flex items-center justify-center">
              <Package className="w-6 h-6 text-muted-foreground" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm leading-tight line-clamp-2 group-hover:underline">
              {item.name}
            </p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {RETAILER_LABEL[item.retailer] ?? item.retailer}
              </Badge>
              {!item.inStock && (
                <Badge variant="destructive" className="text-xs">
                  Niet op voorraad
                </Badge>
              )}
            </div>
          </div>

          <div className="flex-shrink-0 text-right">
            <p className={`text-lg font-bold ${isCheapest ? "text-green-600 dark:text-green-400" : ""}`}>
              {formatEur(item.priceEur)}
            </p>
            {isCheapest && (
              <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                Goedkoopst
              </p>
            )}
          </div>

          <ExternalLink className="w-4 h-4 flex-shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
        </CardContent>
      </Card>
    </a>
  );
}

export function PriceList({ results }: { results: SearchResults }) {
  const { results: items, errors } = results;
  const cheapestPrice = items[0]?.priceEur;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {items.length} resultaten voor <span className="font-medium text-foreground">&ldquo;{results.query}&rdquo;</span>
        </p>
        {errors.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {errors.map((e) => RETAILER_LABEL[e.retailer]).join(", ")} niet beschikbaar
          </p>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          Geen resultaten gevonden. Probeer een andere zoekterm.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => (
            <ResultRow
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
