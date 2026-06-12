"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PriceList } from "./PriceList";
import type { SearchResults, Retailer } from "@/lib/types";

const ALL_RETAILERS: Retailer[] = ["amazon", "bol", "megekko", "azerty", "alternate"];

const RETAILER_LABEL: Record<Retailer, string> = {
  amazon: "Amazon.nl",
  bol: "Bol.com",
  megekko: "Megekko",
  azerty: "Azerty",
  alternate: "Alternate",
};

const RETAILER_COLOR: Record<Retailer, string> = {
  amazon: "#FF9900",
  bol: "#0000FF",
  megekko: "#00A651",
  azerty: "#E30613",
  alternate: "#00305F",
};

export function ZoekenClient() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";

  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRetailers, setSelectedRetailers] = useState<Retailer[]>(ALL_RETAILERS);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(2000);
  const [sortBy, setSortBy] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    setResults(null);
    fetch(`/api/search?q=${encodeURIComponent(query)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data: SearchResults) => setResults(data))
      .catch(() => setResults({ query, results: [], errors: [] }))
      .finally(() => setLoading(false));
  }, [query]);

  function toggleRetailer(retailer: Retailer) {
    setSelectedRetailers((prev) =>
      prev.includes(retailer)
        ? prev.filter((r) => r !== retailer)
        : [...prev, retailer],
    );
  }

  const filteredResults: SearchResults | null = results
    ? {
        ...results,
        results: results.results
          .filter((item) => selectedRetailers.includes(item.retailer))
          .filter((item) => !inStockOnly || item.inStock)
          .filter((item) => item.priceEur <= maxPrice)
          .sort((a, b) =>
            sortBy === "asc"
              ? a.priceEur - b.priceEur
              : b.priceEur - a.priceEur,
          ),
      }
    : null;

  return (
    <div className="max-w-[1280px] mx-auto px-8">
      {/* Breadcrumb */}
      <div className="py-4 text-sm text-on-surface-variant">
        <span>Zoeken</span>
        {query && (
          <>
            <span className="mx-2">›</span>
            <span className="text-on-surface font-medium">&ldquo;{query}&rdquo;</span>
          </>
        )}
      </div>

      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="w-[280px] flex-shrink-0">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 sticky top-20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-semibold text-on-surface">Filters</h2>
              <button
                onClick={() => {
                  setSelectedRetailers(ALL_RETAILERS);
                  setInStockOnly(false);
                  setMaxPrice(2000);
                  setSortBy("asc");
                }}
                className="text-xs text-primary hover:underline font-mono"
              >
                Reset
              </button>
            </div>

            {/* Price range */}
            <div className="mb-6">
              <label className="text-xs font-mono text-on-surface-variant uppercase tracking-wide block mb-2">
                Max. prijs: €{maxPrice === 2000 ? "2000+" : maxPrice}
              </label>
              <input
                type="range"
                min={0}
                max={2000}
                step={50}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-on-surface-variant mt-1">
                <span>€0</span>
                <span>€2000+</span>
              </div>
            </div>

            {/* Retailers */}
            <div className="mb-6">
              <p className="text-xs font-mono text-on-surface-variant uppercase tracking-wide mb-2">
                Retailers
              </p>
              <div className="flex flex-col gap-2">
                {ALL_RETAILERS.map((retailer) => (
                  <label
                    key={retailer}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRetailers.includes(retailer)}
                      onChange={() => toggleRetailer(retailer)}
                      className="sr-only"
                    />
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0 border-2"
                      style={{
                        backgroundColor: selectedRetailers.includes(retailer)
                          ? RETAILER_COLOR[retailer]
                          : "transparent",
                        borderColor: RETAILER_COLOR[retailer],
                      }}
                    />
                    <span className="text-sm text-on-surface">
                      {RETAILER_LABEL[retailer]}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* In stock */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setInStockOnly(!inStockOnly)}
                  className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                    inStockOnly ? "bg-primary" : "bg-surface-dim"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      inStockOnly ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </div>
                <span className="text-sm text-on-surface">Alleen op voorraad</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-on-surface-variant">
              {loading ? (
                "Zoeken..."
              ) : filteredResults ? (
                <>
                  <span className="font-medium text-on-surface">
                    {filteredResults.results.length}
                  </span>{" "}
                  resultaten voor &ldquo;{query}&rdquo;
                </>
              ) : query ? (
                "Typ om te zoeken"
              ) : (
                "Voer een zoekopdracht in"
              )}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-on-surface-variant font-mono">Sorteren:</span>
              <button
                onClick={() => setSortBy("asc")}
                className={`text-xs font-mono px-3 py-1 rounded-lg border transition-colors ${
                  sortBy === "asc"
                    ? "bg-primary text-white border-primary"
                    : "text-on-surface-variant border-outline-variant hover:border-primary"
                }`}
              >
                Prijs ↑
              </button>
              <button
                onClick={() => setSortBy("desc")}
                className={`text-xs font-mono px-3 py-1 rounded-lg border transition-colors ${
                  sortBy === "desc"
                    ? "bg-primary text-white border-primary"
                    : "text-on-surface-variant border-outline-variant hover:border-primary"
                }`}
              >
                Prijs ↓
              </button>
            </div>
          </div>

          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-32 rounded-xl bg-surface-container animate-pulse"
                />
              ))}
            </div>
          )}

          {!loading && filteredResults && (
            <PriceList results={filteredResults} />
          )}

          {!loading && !filteredResults && !query && (
            <div className="text-center py-20 text-on-surface-variant">
              <p className="text-lg font-heading font-semibold text-on-surface">
                Wat zoek je?
              </p>
              <p className="text-sm mt-2">
                Gebruik de zoekbalk bovenaan om componenten te zoeken.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
