"use client";

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { HardDrive, TrendingUp, Check, ExternalLink, SlidersHorizontal, X } from "lucide-react";
import { useBuildStore } from "@/lib/store/build";
import { COMPONENT_META } from "@/lib/categories";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import { CATEGORY_IMAGES } from "@/lib/category-images";
import { formatEur } from "@/lib/format";
import { productUrl } from "@/lib/product-url";
import { ComponentSpecs } from "@/components/ComponentSpecs";
import { RetailerLogo } from "@/components/RetailerLogo";
import { RetailerImage } from "@/components/RetailerImage";
import { SearchBox } from "@/components/SearchBox";
import { WatchButton } from "@/components/WatchButton";
import { bestValueIndex, hasValueMetric } from "@/lib/specs/value";
import { useSearch } from "@/lib/use-search";
import { FacetFilters } from "@/components/FacetFilters";
import {
  getFacetGroups,
  itemMatchesFacets,
  itemMatchesTiers,
  priceTiersFor,
  type FacetSelection,
} from "@/lib/specs/facets";
import type { ComponentType, PriceResult } from "@/lib/types";

const RETAILER_LABEL: Record<string, string> = {
  amazon: "Amazon",
  bol: "Bol.com",
  megekko: "Megekko",
  azerty: "Azerty",
  alternate: "Alternate",
};

/** Bovengrens van de prijs-slider; daarboven = "geen limiet". */
const PRICE_CAP = 2500;

interface CategoryResultCardProps {
  item: PriceResult;
  isBestDeal: boolean;
  isBestValue?: boolean;
  componentType: ComponentType;
  onAddToBuild: (item: PriceResult, slot: ComponentType) => void;
}

function CategoryResultCard({ item, isBestDeal, isBestValue, componentType, onAddToBuild }: CategoryResultCardProps) {
  const [added, setAdded] = useState(false);

  function handleAdd() {
    onAddToBuild(item, componentType);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  return (
    <div
      className={`group/card flex flex-col md:flex-row bg-surface-container-lowest border border-outline-variant border-l-[3px] border-l-primary rounded-xl overflow-hidden hover:border-primary hover:shadow-sm transition-all ${
        !item.inStock ? "opacity-75 grayscale-[0.5]" : ""
      }`}
    >
      {/* Image area */}
      <div className="md:w-64 h-48 p-4 flex items-center justify-center bg-surface-container-low shrink-0 relative">
        {item.imageUrl ? (
          <RetailerImage
            src={item.imageUrl}
            alt={item.name}
            width={224}
            height={160}
            sizes="224px"
            className="max-w-full max-h-full object-contain"
            fallback={<HardDrive className="w-12 h-12 text-outline" />}
          />
        ) : (
          <HardDrive className="w-12 h-12 text-outline" />
        )}
        {isBestDeal && item.inStock && (
          <span className="absolute top-2 left-2 bg-success-emerald text-white text-[10px] px-2 py-0.5 rounded font-label-technical">
            BESTE DEAL
          </span>
        )}
        {isBestValue && item.inStock && (
          <span
            className="absolute left-2 bg-secondary text-on-secondary text-[10px] px-2 py-0.5 rounded font-label-technical"
            style={{ top: isBestDeal ? "1.85rem" : "0.5rem" }}
          >
            PRIJS-PRESTATIE
          </span>
        )}
        {!item.inStock && (
          <div className="absolute inset-0 bg-on-surface/10 flex items-center justify-center">
            <span className="bg-error text-white font-label-technical text-label-technical px-3 py-1 rounded">
              UITVERKOCHT
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-grow p-6 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <RetailerLogo retailer={item.retailer} />
                {item.mock && (
                  <span className="font-label-technical text-[10px] text-on-surface-variant">demo</span>
                )}
              </div>
              <h3 className="font-title-md text-title-md text-on-surface mb-1">
                {item.name}
              </h3>
              <ComponentSpecs name={item.name} category={componentType} className="mt-2" />
            </div>
            <div className="text-right ml-4 flex-shrink-0">
              <span
                className={`font-label-price text-label-price block ${
                  item.inStock ? "text-primary" : "text-outline-variant"
                }`}
              >
                {formatEur(item.priceEur)}
              </span>
              {item.inStock && (
                <p className="text-[12px] text-on-surface-variant font-label-technical">
                  bij {RETAILER_LABEL[item.retailer] ?? item.retailer}
                </p>
              )}
            </div>
          </div>

          {/* Stock indicator */}
          {item.inStock && (
            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4">
              <div className="flex items-center gap-1.5 text-success-emerald">
                <span className="w-2 h-2 rounded-full bg-success-emerald inline-block" />
                <span className="font-body-sm font-label-technical text-success-emerald">
                  Op voorraad
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom actions */}
        {item.inStock ? (
          <div className="flex justify-between items-center mt-6 gap-3 flex-wrap">
            <span className="font-body-sm text-[12px] text-on-surface-variant">
              Aangeboden door <span className="text-on-surface font-medium">{RETAILER_LABEL[item.retailer] ?? item.retailer}</span>
            </span>

            <div className="flex gap-2">
              <WatchButton
                variant="icon"
                name={item.name}
                category={componentType}
                url={item.url}
                retailer={item.retailer}
                priceEur={item.priceEur}
                imageUrl={item.imageUrl}
              />
              <Link
                href={productUrl(item, componentType)}
                className="px-4 py-2 border border-outline-variant rounded-lg font-label-technical text-label-technical hover:bg-surface-container transition-colors"
              >
                Vergelijken
              </Link>
              {COMPONENT_META[componentType]?.peripheral ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2 rounded-lg font-label-technical text-label-technical bg-primary-container text-on-primary-container hover:opacity-90 transition-all flex items-center gap-1.5"
                >
                  Bekijk <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <button
                  onClick={handleAdd}
                  className={`px-6 py-2 rounded-lg font-label-technical text-label-technical transition-all ${
                    added
                      ? "bg-success-emerald text-white"
                      : "bg-primary-container text-on-primary-container hover:opacity-90"
                  }`}
                >
                  {added ? (
                    <span className="flex items-center gap-1">
                      <Check className="w-3 h-3" /> Toegevoegd
                    </span>
                  ) : (
                    "Toevoegen aan Build"
                  )}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center mt-6 gap-3 flex-wrap">
            <span className="font-body-sm text-[12px] text-on-surface-variant">
              Tijdelijk uitverkocht. Volg de prijs om het in de gaten te houden.
            </span>
            <WatchButton
              variant="full"
              name={item.name}
              category={componentType}
              url={item.url}
              retailer={item.retailer}
              priceEur={item.priceEur}
              imageUrl={item.imageUrl}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function CategorieClient() {
  const params = useParams();
  const rawType = params.type as string;
  const componentType = rawType as ComponentType;
  const meta = COMPONENT_META[componentType];

  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [maxPrice, setMaxPrice] = useState(PRICE_CAP);
  const [sortBy, setSortBy] = useState<"asc" | "desc">("asc");
  const [facetSel, setFacetSel] = useState<FacetSelection>({});
  const [selectedTiers, setSelectedTiers] = useState<string[]>([]);
  // "Applied" = de filters die de resultaten echt sturen; bovenstaande zijn de
  // concept-selectie tot de gebruiker op "Filters toepassen" klikt.
  const [appliedSel, setAppliedSel] = useState<FacetSelection>({});
  const [appliedTiers, setAppliedTiers] = useState<string[]>([]);
  const [appliedMax, setAppliedMax] = useState(PRICE_CAP);
  // Toon eerst een beperkt aantal kaarten (sneller laden: minder DOM + minder
  // afbeeldingen tegelijk). "Toon meer" laadt de rest in stappen bij.
  const PAGE = 24;
  const [visible, setVisible] = useState(PAGE);

  // Mobiel: filters openen als bottom-sheet (op desktop = vaste zijbalk).
  const [filtersOpen, setFiltersOpen] = useState(false);
  useEffect(() => {
    if (!filtersOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [filtersOpen]);

  const { setComponent } = useBuildStore();

  // Lege zoekterm = catalogusmodus: alle bekende producten in deze categorie.
  // `cat` zorgt er server-side voor dat alleen relevante componenten terugkomen.
  // De pagina remount dit component per categorie (key={type}), dus bij
  // binnenkomst staat activeQuery op "" en laadt de catalogus vanzelf.
  const searchUrl = (() => {
    if (!meta) return null;
    const sp = new URLSearchParams();
    if (activeQuery) sp.set("q", activeQuery);
    sp.set("cat", componentType);
    return `/api/search?${sp.toString()}`;
  })();
  const { results, loading } = useSearch(searchUrl, activeQuery);

  function handleTagClick(tag: string) {
    setQuery(tag);
    setActiveQuery(tag);
    setVisible(PAGE);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setActiveQuery(query);
    setVisible(PAGE);
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

  function applyFilters() {
    setAppliedSel(facetSel);
    setAppliedTiers(selectedTiers);
    setAppliedMax(maxPrice);
    setVisible(PAGE);
  }

  function clearAll() {
    setFacetSel({});
    setSelectedTiers([]);
    setMaxPrice(PRICE_CAP);
    setAppliedSel({});
    setAppliedTiers([]);
    setAppliedMax(PRICE_CAP);
    setSortBy("asc");
    setQuery("");
    setActiveQuery("");
    setVisible(PAGE);
  }

  const facetGroups = useMemo(
    () => getFacetGroups(componentType, results?.results ?? []),
    [results, componentType]
  );
  const tiers = useMemo(() => priceTiersFor(componentType), [componentType]);
  const filtered = useMemo(() => {
    const list = results?.results ?? [];
    return list
      .filter((i) => itemMatchesFacets(componentType, i, appliedSel))
      .filter((i) => itemMatchesTiers(i, tiers, appliedTiers))
      .filter((i) => appliedMax >= PRICE_CAP || i.priceEur <= appliedMax)
      .sort((a, b) => (sortBy === "asc" ? a.priceEur - b.priceEur : b.priceEur - a.priceEur));
  }, [results, componentType, appliedSel, tiers, appliedTiers, appliedMax, sortBy]);

  if (!meta) {
    return (
      <main className="mt-16 max-w-[1280px] mx-auto px-4 sm:px-8 py-8 min-h-screen">
        <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">
          Categorie niet gevonden.
        </p>
        <Link href="/" className="text-primary hover:underline font-body-sm text-body-sm">
          ← Terug naar home
        </Link>
      </main>
    );
  }

  const CategoryIcon = CATEGORY_ICONS[componentType] ?? HardDrive;
  const heroImg = CATEGORY_IMAGES[componentType];

  const cheapestPrice =
    filtered.find((i) => i.inStock)?.priceEur ?? filtered[0]?.priceEur;

  // USP: het item met de beste prestatie-per-euro (alleen CPU/GPU)
  const bestValueIdx = bestValueIndex(filtered, componentType);

  // Aantal toegepaste filters (voor het mobiele "Filters (n)"-knopje).
  const activeFilterCount =
    (appliedMax < PRICE_CAP ? 1 : 0) +
    appliedTiers.length +
    Object.values(appliedSel).reduce((n, v) => n + v.length, 0);

  // Zoekterm-binnen-categorie als gedeelde FacetFilters-children (zijbalk + sheet).
  const filterExtras = (
    <div className="mb-8">
      <h4 className="font-label-technical text-label-technical uppercase tracking-wider text-outline mb-4">
        Zoekterm
      </h4>
      <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3">
        <SearchBox
          value={query}
          onChange={setQuery}
          onSubmit={(t) => {
            setQuery(t);
            setActiveQuery(t);
            setVisible(PAGE);
          }}
          category={componentType}
          placeholder={`Zoek in ${meta.label.toLowerCase()}…`}
          inputClassName="w-full h-11 pl-10 pr-4 bg-white border border-outline-variant rounded-lg font-body-sm text-body-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
        />
        <button
          type="submit"
          className="w-full h-11 bg-primary text-on-primary rounded-lg font-label-technical text-label-technical hover:opacity-90 transition-opacity"
        >
          Zoeken
        </button>
      </form>
    </div>
  );

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
    <main className="mt-16 max-w-[1280px] mx-auto px-4 sm:px-8 py-8 min-h-screen">
      {/* Category Header */}
      <section className="mb-12">
        <div
          className={`border border-gp-line bg-gp-bg-soft overflow-hidden grid grid-cols-1 ${
            heroImg ? "md:grid-cols-[minmax(0,1fr)_320px]" : ""
          }`}
        >
          <div className="flex items-center gap-4 p-6 sm:p-8">
            <div className="w-12 h-12 bg-primary-container rounded-xl flex items-center justify-center text-on-primary flex-shrink-0">
              <CategoryIcon className="w-6 h-6" />
            </div>
            <div className="border-l-2 border-primary pl-4">
              <span className="font-plex text-[11px] uppercase tracking-[0.2em] text-gp-orange block mb-1">
                _{meta.shortLabel.toLowerCase()}
              </span>
              <h1 className="font-headline-lg text-headline-lg text-on-surface">
                {meta.pageTitle}
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
                {meta.description}
              </p>
            </div>
          </div>

          {/* Hero-foto (alleen kerncategorieën; giastpc blueprint-hoeken) */}
          {heroImg && (
            <div className="relative hidden md:block bg-gp-ink min-h-[200px] border-l border-gp-line">
              <Image
                src={heroImg}
                alt={`${meta.label} vergelijken bij CoreBuild`}
                fill
                sizes="320px"
                className="object-cover grayscale-[0.35]"
              />
              <span className="absolute top-2 left-2 w-3.5 h-3.5 border-t border-l border-gp-orange" />
              <span className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b border-r border-gp-orange" />
            </div>
          )}
        </div>

        {/* Popular tags */}
        <div className="flex flex-wrap gap-3 mt-6">
          <span className="font-label-technical text-label-technical text-on-surface-variant px-2 py-1">
            Populaire zoekopdrachten:
          </span>
          {meta.popularTags.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className={`font-label-technical text-label-technical flex items-center gap-2 px-4 py-1.5 rounded-full transition-all ${
                query === tag
                  ? "bg-primary-container text-on-primary"
                  : "bg-surface-container-high hover:bg-primary-container hover:text-on-primary"
              }`}
            >
              <TrendingUp className="w-4 h-4" /> {tag}
            </button>
          ))}
        </div>
      </section>

      {/* Grid: filter sidebar (3 col) + results (9 col) */}
      <div className="grid grid-cols-12 gap-4">
        {/* Filter Sidebar — vaste zijbalk op desktop; op mobiel via de
            "Filters"-knop als bottom-sheet (zie onder). */}
        <aside className="hidden md:block md:col-span-3 space-y-6">
          {filterPanel()}

          {/* Builder CTA */}
          <Link
            href="/builder"
            className="relative overflow-hidden rounded-xl h-48 bg-inverse-surface flex flex-col justify-end p-4 group"
          >
            <Image
              src="/images/promo-gpu.png"
              alt=""
              fill
              className="object-cover opacity-50 group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, 300px"
            />
            <div className="relative z-10">
              <span className="bg-primary text-on-primary text-[10px] px-2 py-0.5 rounded font-label-technical uppercase tracking-tighter mb-2 inline-block">
                PC Builder
              </span>
              <h5 className="text-on-primary font-title-md text-title-md">
                Stel je volledige PC samen
              </h5>
              <p className="text-surface-variant font-body-sm text-body-sm">
                Alle onderdelen + wattage-check →
              </p>
            </div>
          </Link>
        </aside>

        {/* Results List */}
        <div className="col-span-12 md:col-span-9 space-y-4">
          {/* Mobiele filter-trigger — opent de bottom-sheet (md:hidden). */}
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="md:hidden w-full flex items-center justify-center gap-2 h-11 border border-outline-variant bg-surface-container-lowest font-label-technical text-label-technical text-on-surface active:bg-surface-container transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ""}
          </button>

          {/* Toolbar */}
          <div className="flex justify-between items-center mb-6 px-2">
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              <span className="font-bold text-primary">
                {loading ? "…" : filtered.length}
              </span>{" "}
              resultaten gevonden
            </span>
            <div className="flex items-center gap-2">
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Sorteer op:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "asc" | "desc")}
                aria-label="Sorteer resultaten"
                className="bg-surface border-none font-body-sm text-body-sm font-label-technical text-on-surface focus:ring-0 cursor-pointer"
              >
                <option value="asc">Laagste prijs</option>
                <option value="desc">Hoogste prijs</option>
              </select>
            </div>
          </div>

          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 rounded-xl bg-surface-container animate-pulse" />
              ))}
            </div>
          )}

          {!loading && results && filtered.length === 0 && (
            <p className="text-center font-body-sm text-body-sm text-on-surface-variant py-12">
              Geen resultaten gevonden. Probeer een andere zoekterm.
            </p>
          )}

          {!loading && filtered.length > 0 && hasValueMetric(componentType) && bestValueIdx !== null && (
            <p className="font-body-sm text-[13px] text-on-surface-variant -mt-1 mb-1">
              <span className="font-medium text-secondary">Beste prijs-prestatie</span> = meeste prestatie per
              euro, niet per se de goedkoopste.
            </p>
          )}

          {!loading &&
            filtered.slice(0, visible).map((item, i) => (
              <CategoryResultCard
                key={`${item.retailer}-${i}`}
                item={item}
                isBestDeal={item.priceEur === cheapestPrice && item.inStock}
                isBestValue={i === bestValueIdx}
                componentType={componentType}
                onAddToBuild={(item, slot) => setComponent(slot, item)}
              />
            ))}

          {!loading && filtered.length > visible && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => setVisible((v) => v + PAGE)}
                className="px-6 py-2.5 border border-outline-variant rounded-lg font-label-technical text-label-technical text-on-surface hover:border-primary hover:text-primary transition-colors"
              >
                Toon meer ({filtered.length - visible})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobiele filter-bottom-sheet (md:hidden). Deelt dezelfde FacetFilters
          als de desktop-zijbalk; "Filters toepassen" sluit de sheet. */}
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
    </main>
  );
}
