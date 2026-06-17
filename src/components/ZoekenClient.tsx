"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { SlidersHorizontal, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { PriceList } from "./PriceList";
import { SearchSuggest } from "@/components/SearchSuggest";
import { FacetFilters } from "@/components/FacetFilters";
import { useBuildStore } from "@/lib/store/build";
import { useSearch } from "@/lib/use-search";
import { getSuggestions } from "@/lib/search-suggestions";
import { matchesCategory } from "@/lib/relevance";
import { CATALOG_TYPES, COMPONENT_META } from "@/lib/categories";
import {
  getFacetGroups,
  itemMatchesFacets,
  itemMatchesTiers,
  priceTiersFor,
  DEFAULT_PRICE_TIERS,
  type FacetSelection,
} from "@/lib/specs/facets";
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
type CategoryFilter = ComponentType | "all";

/** Bovengrens van de prijs-slider; daarboven = "geen limiet". */
const PRICE_CAP = 2500;

export function ZoekenClient() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const { setComponent } = useBuildStore();

  // Categorie + sortering werken direct (categorie bepaalt welke facetten tonen).
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [sortBy, setSortBy] = useState<SortMode>("asc");

  // Concept-selectie (gebonden aan de inputs).
  const [selectedRetailers, setSelectedRetailers] = useState<Retailer[]>(ALL_RETAILERS);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(PRICE_CAP);
  const [facetSel, setFacetSel] = useState<FacetSelection>({});
  const [selectedTiers, setSelectedTiers] = useState<string[]>([]);

  // Toegepaste filters (sturen de resultaten) — pas na "Filters toepassen".
  const [appliedRetailers, setAppliedRetailers] = useState<Retailer[]>(ALL_RETAILERS);
  const [appliedInStock, setAppliedInStock] = useState(false);
  const [appliedMax, setAppliedMax] = useState(PRICE_CAP);
  const [appliedSel, setAppliedSel] = useState<FacetSelection>({});
  const [appliedTiers, setAppliedTiers] = useState<string[]>([]);

  // Mobiel: filters openen als bottom-sheet (op desktop = vaste zijbalk).
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Vergrendel achtergrond-scroll zolang de mobiele filtersheet open is.
  useEffect(() => {
    if (!filtersOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [filtersOpen]);

  const { results, loading } = useSearch(
    query ? `/api/search?q=${encodeURIComponent(query)}` : null,
    query
  );

  function toggleRetailer(retailer: Retailer) {
    setSelectedRetailers((prev) =>
      prev.includes(retailer) ? prev.filter((r) => r !== retailer) : [...prev, retailer]
    );
  }

  function toggleFacet(key: string, value: string) {
    setFacetSel((prev) => {
      const cur = prev[key] ?? [];
      const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
      const out = { ...prev, [key]: next };
      if (next.length === 0) delete out[key];
      return out;
    });
  }

  function toggleTier(id: string) {
    setSelectedTiers((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  }

  // Wisselen van categorie reset de (categorie-specifieke) facet-/tier-selectie,
  // anders zou een oude socket-keuze de nieuwe categorie leegfilteren.
  function changeCategory(value: CategoryFilter) {
    setCategory(value);
    setFacetSel({});
    setSelectedTiers([]);
    setAppliedSel({});
    setAppliedTiers([]);
  }

  function applyFilters() {
    setAppliedRetailers(selectedRetailers);
    setAppliedInStock(inStockOnly);
    setAppliedMax(maxPrice);
    setAppliedSel(facetSel);
    setAppliedTiers(selectedTiers);
  }

  function clearAll() {
    setCategory("all");
    setSelectedRetailers(ALL_RETAILERS);
    setInStockOnly(false);
    setMaxPrice(PRICE_CAP);
    setFacetSel({});
    setSelectedTiers([]);
    setAppliedRetailers(ALL_RETAILERS);
    setAppliedInStock(false);
    setAppliedMax(PRICE_CAP);
    setAppliedSel({});
    setAppliedTiers([]);
    setSortBy("asc");
  }

  // Facetten alleen tonen bij een specifieke categorie (binnen die subset).
  const facetGroups = useMemo(() => {
    if (category === "all" || !results) return [];
    const scoped = results.results.filter((i) => matchesCategory(i.name, category));
    return getFacetGroups(category, scoped);
  }, [results, category]);

  const tiers = useMemo(
    () => (category === "all" ? DEFAULT_PRICE_TIERS : priceTiersFor(category)),
    [category]
  );

  const filteredResults: SearchResults | null = useMemo(() => {
    if (!results) return null;
    const list = results.results
      .filter((i) => category === "all" || matchesCategory(i.name, category))
      .filter((i) => appliedRetailers.includes(i.retailer))
      .filter((i) => !appliedInStock || i.inStock)
      .filter((i) => category === "all" || itemMatchesFacets(category, i, appliedSel))
      .filter((i) => itemMatchesTiers(i, tiers, appliedTiers))
      .filter((i) => appliedMax >= PRICE_CAP || i.priceEur <= appliedMax)
      .sort((a, b) =>
        sortBy === "relevance" ? 0 : sortBy === "asc" ? a.priceEur - b.priceEur : b.priceEur - a.priceEur
      );
    return { ...results, results: list };
  }, [results, category, appliedRetailers, appliedInStock, appliedSel, tiers, appliedTiers, appliedMax, sortBy]);

  const sortOptions: { mode: SortMode; label: string }[] = [
    { mode: "asc", label: "Laagste prijs" },
    { mode: "desc", label: "Hoogste prijs" },
    { mode: "relevance", label: "Relevantie" },
  ];

  // Typefout-correctie voor de lege staat ("bedoelde je…?")
  const correction = useMemo(() => {
    const q = query.trim();
    if (q.length < 2) return null;
    const top = getSuggestions(q, 1)[0]?.label;
    return top && top.toLowerCase() !== q.toLowerCase() ? top : null;
  }, [query]);

  const noResults = !loading && !!filteredResults && filteredResults.results.length === 0 && !!query;

  // Aantal toegepaste filters (voor het mobiele "Filters (n)"-knopje).
  const activeFilterCount =
    (category !== "all" ? 1 : 0) +
    (appliedInStock ? 1 : 0) +
    (appliedMax < PRICE_CAP ? 1 : 0) +
    (appliedRetailers.length !== ALL_RETAILERS.length ? 1 : 0) +
    appliedTiers.length +
    Object.values(appliedSel).reduce((n, v) => n + v.length, 0);

  // Extra filters (categorie/retailers/voorraad) die boven de facetten tonen.
  // Eén keer gedefinieerd zodat de zijbalk (desktop) én de sheet (mobiel)
  // exact dezelfde inhoud delen.
  const filterExtras = (
    <>
      {/* Categorie-keuze (werkt direct) */}
      <div className="mb-8">
        <h4 className="font-label-technical text-label-technical uppercase tracking-wider text-outline mb-4">
          Categorie
        </h4>
        <select
          value={category}
          onChange={(e) => changeCategory(e.target.value as CategoryFilter)}
          aria-label="Filter op categorie"
          className="w-full h-11 px-3 bg-white border border-outline-variant rounded-lg font-body-sm text-body-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none cursor-pointer"
        >
          <option value="all">Alle categorieën</option>
          {CATALOG_TYPES.map((t) => (
            <option key={t} value={t}>
              {COMPONENT_META[t].label}
            </option>
          ))}
        </select>
      </div>

      {/* Retailers */}
      <div className="mb-8">
        <h4 className="font-label-technical text-label-technical uppercase tracking-wider text-outline mb-4">
          Retailers
        </h4>
        <div className="space-y-2.5">
          {ALL_RETAILERS.map((retailer) => (
            <label key={retailer} className="flex items-center gap-3 cursor-pointer group py-1">
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

      {/* Alleen op voorraad */}
      <div className="flex items-center justify-between mb-8">
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
    </>
  );

  // De volledige FacetFilters met de extra's; onAfterApply sluit de mobiele sheet.
  const filterPanel = (onAfterApply?: () => void) => (
    <FacetFilters
      groups={facetGroups}
      selected={facetSel}
      onToggle={toggleFacet}
      tiers={tiers}
      selectedTiers={selectedTiers}
      onToggleTier={toggleTier}
      maxPrice={maxPrice}
      priceCap={PRICE_CAP}
      onMaxPrice={setMaxPrice}
      onApply={() => {
        applyFilters();
        onAfterApply?.();
      }}
      onClear={clearAll}
    >
      {filterExtras}
    </FacetFilters>
  );

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 flex flex-col md:flex-row gap-8">
      {/* Filters: vaste zijbalk op desktop (≥768px); op mobiel via de
          "Filters"-knop als bottom-sheet (zie onder). */}
      <aside className="hidden md:block md:w-1/4 space-y-6 md:sticky md:top-24 h-fit">
        {filterPanel()}
      </aside>

      {/* Results Column */}
      <section className="w-full md:w-3/4">
        {/* Mobiele filter-trigger — opent de bottom-sheet (op desktop staat de
            zijbalk al vast, dus md:hidden). Toont het aantal actieve filters. */}
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          className="md:hidden w-full mb-4 flex items-center justify-center gap-2 h-11 border border-outline-variant bg-surface-container-lowest font-label-technical text-label-technical text-on-surface active:bg-surface-container transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ""}
        </button>

        {/* Sort Bar — stapelt op mobiel; de 3-knops segmented control past daar
            niet, dus wordt het onder ≥640px een compacte select. */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 bg-surface-container-low p-4 rounded-xl border border-outline-variant">
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
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <span className="font-label-technical text-label-technical text-on-surface-variant shrink-0">
              Sorteer op:
            </span>
            {/* Mobiel: compacte select (de segmented control overloopt op smal scherm) */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortMode)}
              aria-label="Sorteer resultaten"
              className="sm:hidden flex-1 h-9 px-2 bg-surface-container-lowest border border-outline-variant rounded-lg font-label-technical text-label-technical text-on-surface outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            >
              {sortOptions.map(({ mode, label }) => (
                <option key={mode} value={mode}>
                  {label}
                </option>
              ))}
            </select>
            {/* Desktop: segmented control */}
            <div className="hidden sm:flex bg-surface-container-high p-1 rounded-lg">
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

        {!loading && filteredResults && filteredResults.results.length > 0 && (
          <PriceList
            results={filteredResults}
            onAddToBuild={(item, slot: ComponentType) => setComponent(slot, item)}
          />
        )}

        {noResults && (
          <div className="text-center py-16">
            <p className="font-title-md text-title-md text-on-surface mb-2">
              Geen resultaten voor &ldquo;{query}&rdquo;
            </p>
            {correction ? (
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Bedoelde je{" "}
                <Link
                  href={`/zoeken?q=${encodeURIComponent(correction)}`}
                  className="text-primary font-medium hover:underline"
                >
                  {correction}
                </Link>
                ?
              </p>
            ) : (
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Probeer een andere zoekterm, categorie of filter.
              </p>
            )}
          </div>
        )}

        {!loading && !filteredResults && !query && (
          <div className="text-center py-16 sm:py-20">
            <p className="font-title-md text-title-md text-on-surface">Wat zoek je?</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 mb-6">
              Typ een component of merk, dan tonen we suggesties terwijl je typt.
            </p>
            <div className="max-w-md mx-auto text-left">
              <SearchSuggest variant="page" autoFocus />
            </div>
          </div>
        )}
      </section>

      {/* Mobiele filter-bottom-sheet (md:hidden). Zit boven de tabbar (z-60),
          vergrendelt achtergrond-scroll, en deelt dezelfde FacetFilters als de
          desktop-zijbalk. "Filters toepassen" sluit de sheet. */}
      {filtersOpen && (
        <div
          className="md:hidden fixed inset-0 z-[60]"
          role="dialog"
          aria-modal="true"
          aria-label="Filters"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setFiltersOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col bg-gp-bg border-t border-gp-line pb-safe animate-fade-in-up">
            <div className="relative border-b border-gp-line py-3 shrink-0">
              <span className="mx-auto block h-1 w-10 rounded-full bg-gp-line-strong" />
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                aria-label="Filters sluiten"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gp-ink-soft hover:text-gp-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto overscroll-contain p-4">
              {filterPanel(() => setFiltersOpen(false))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
