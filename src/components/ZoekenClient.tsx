"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PriceList } from "./PriceList";
import { useBuildStore } from "@/lib/store/build";
import type { SearchResults, Retailer, ComponentType } from "@/lib/types";

const ALL_RETAILERS: Retailer[] = ["amazon", "bol", "megekko", "azerty", "alternate"];

const RETAILER_LABEL: Record<Retailer, string> = {
  amazon: "Amazon",
  bol: "Bol.com",
  megekko: "Megekko",
  azerty: "Azerty",
  alternate: "Alternate",
};

type SortMode = "asc" | "desc" | "relevance";

export function ZoekenClient() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const { setComponent } = useBuildStore();

  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRetailers, setSelectedRetailers] = useState<Retailer[]>(ALL_RETAILERS);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(2000);
  const [sortBy, setSortBy] = useState<SortMode>("asc");

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

  function resetFilters() {
    setSelectedRetailers(ALL_RETAILERS);
    setInStockOnly(false);
    setMaxPrice(2000);
    setSortBy("asc");
  }

  const filteredResults: SearchResults | null = results
    ? {
        ...results,
        results: results.results
          .filter((item) => selectedRetailers.includes(item.retailer))
          .filter((item) => !inStockOnly || item.inStock)
          .filter((item) => maxPrice >= 2000 || item.priceEur <= maxPrice)
          .sort((a, b) =>
            sortBy === "relevance"
              ? 0
              : sortBy === "asc"
                ? a.priceEur - b.priceEur
                : b.priceEur - a.priceEur,
          ),
      }
    : null;

  const sortOptions: { mode: SortMode; label: string }[] = [
    { mode: "asc", label: "Laagste prijs" },
    { mode: "desc", label: "Hoogste prijs" },
    { mode: "relevance", label: "Relevantie" },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-8 pt-24 pb-16 flex flex-col md:flex-row gap-8">
      {/* Filters Sidebar */}
      <aside className="w-full md:w-1/4 space-y-8 md:sticky top-24 h-fit">
        <div className="flex justify-between items-center pb-4 border-b border-outline-variant">
          <h2 className="font-title-md text-title-md text-on-surface">Filters</h2>
          <button
            onClick={resetFilters}
            className="font-label-technical text-label-technical text-primary hover:underline"
          >
            Wissen
          </button>
        </div>

        {/* Price Range */}
        <div>
          <h3 className="font-label-technical text-label-technical text-on-surface-variant mb-4 uppercase tracking-wider">
            Prijsbereik
          </h3>
          <input
            type="range"
            min={0}
            max={2000}
            step={50}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="custom-slider mb-2"
          />
          <div className="flex justify-between items-center">
            <span className="font-body-sm text-body-sm border border-outline-variant px-3 py-1 rounded bg-surface-container-lowest">
              € 0
            </span>
            <span className="font-body-sm text-body-sm border border-outline-variant px-3 py-1 rounded bg-surface-container-lowest">
              {maxPrice >= 2000 ? "€ 2.000+" : `€ ${maxPrice.toLocaleString("nl-NL")}`}
            </span>
          </div>
        </div>

        {/* Retailers */}
        <div>
          <h3 className="font-label-technical text-label-technical text-on-surface-variant mb-4 uppercase tracking-wider">
            Retailers
          </h3>
          <div className="space-y-3">
            {ALL_RETAILERS.map((retailer) => (
              <label key={retailer} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedRetailers.includes(retailer)}
                  onChange={() => toggleRetailer(retailer)}
                  className="w-4 h-4 rounded text-primary border-outline-variant focus:ring-primary"
                />
                <span className="font-body-sm text-body-sm text-on-surface group-hover:text-primary transition-colors">
                  {RETAILER_LABEL[retailer]}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-between py-4 border-t border-outline-variant">
          <span className="font-body-sm text-body-sm text-on-surface">Alleen op voorraad</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-outline-variant rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
          </label>
        </div>
      </aside>

      {/* Results Column */}
      <section className="w-full md:w-3/4">
        {/* Sort Bar */}
        <div className="flex items-center justify-between mb-6 bg-surface-container-low p-4 rounded-xl border border-outline-variant">
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {loading ? (
              "Zoeken..."
            ) : filteredResults ? (
              <>
                {filteredResults.results.length} resultaten voor{" "}
                <span className="font-bold text-on-surface">&ldquo;{query}&rdquo;</span>
              </>
            ) : query ? (
              "Typ om te zoeken"
            ) : (
              "Voer een zoekopdracht in"
            )}
          </p>
          <div className="flex gap-4 items-center">
            <span className="hidden sm:inline font-label-technical text-label-technical text-on-surface-variant">
              Sorteer op:
            </span>
            <div className="flex bg-surface-container-high p-1 rounded-lg">
              {sortOptions.map(({ mode, label }) => (
                <button
                  key={mode}
                  onClick={() => setSortBy(mode)}
                  className={`px-4 py-1 rounded font-label-technical text-label-technical transition-colors ${
                    sortBy === mode
                      ? "bg-surface-container-lowest shadow-sm text-primary"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-xl bg-surface-container animate-pulse" />
            ))}
          </div>
        )}

        {!loading && filteredResults && (
          <PriceList
            results={filteredResults}
            onAddToBuild={(item, slot: ComponentType) => setComponent(slot, item)}
          />
        )}

        {!loading && !filteredResults && !query && (
          <div className="text-center py-20 text-on-surface-variant">
            <p className="font-title-md text-title-md text-on-surface">Wat zoek je?</p>
            <p className="font-body-sm text-body-sm mt-2">
              Gebruik de zoekbalk bovenaan om componenten te zoeken.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
