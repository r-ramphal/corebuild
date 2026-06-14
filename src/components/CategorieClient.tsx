"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { HardDrive, TrendingUp, Check, ExternalLink } from "lucide-react";
import { useBuildStore } from "@/lib/store/build";
import { COMPONENT_META } from "@/lib/categories";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import { formatEur } from "@/lib/format";
import { productUrl } from "@/lib/product-url";
import { ComponentSpecs } from "@/components/ComponentSpecs";
import { RetailerLogo } from "@/components/RetailerLogo";
import { WatchButton } from "@/components/WatchButton";
import { bestValueIndex, hasValueMetric } from "@/lib/specs/value";
import { useSearch } from "@/lib/use-search";
import type { ComponentType, PriceResult } from "@/lib/types";

const RETAILER_LABEL: Record<string, string> = {
  amazon: "Amazon",
  bol: "Bol.com",
  megekko: "Megekko",
  azerty: "Azerty",
  alternate: "Alternate",
};

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
      className={`flex flex-col md:flex-row bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden hover:shadow-sm transition-shadow ${
        !item.inStock ? "opacity-75 grayscale-[0.5]" : ""
      }`}
    >
      {/* Image area */}
      <div className="md:w-64 h-48 p-4 flex items-center justify-center bg-surface-container-low shrink-0 relative">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            width={224}
            height={160}
            className="max-w-full max-h-full object-contain"
            unoptimized
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
  const [maxPrice, setMaxPrice] = useState(2500);
  const [sortBy, setSortBy] = useState<"asc" | "desc">("asc");

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
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setActiveQuery(query);
  }

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

  const filtered = (results?.results ?? [])
    .filter((i) => maxPrice >= 2500 || i.priceEur <= maxPrice)
    .sort((a, b) => (sortBy === "asc" ? a.priceEur - b.priceEur : b.priceEur - a.priceEur));

  const cheapestPrice =
    filtered.find((i) => i.inStock)?.priceEur ?? filtered[0]?.priceEur;

  // USP: het item met de beste prestatie-per-euro (alleen CPU/GPU)
  const bestValueIdx = bestValueIndex(filtered, componentType);

  return (
    <main className="mt-16 max-w-[1280px] mx-auto px-4 sm:px-8 py-8 min-h-screen">
      {/* Category Header */}
      <section className="mb-12">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-primary-container rounded-xl flex items-center justify-center text-on-primary flex-shrink-0">
            <CategoryIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface">
              {meta.pageTitle}
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
              {meta.description}
            </p>
          </div>
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
        {/* Filter Sidebar */}
        <aside className="col-span-12 md:col-span-3 space-y-6">
          <div className="p-6 bg-surface-container-lowest border border-outline-variant rounded-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-title-md text-title-md text-on-surface">Filters</h3>
              <button
                onClick={() => {
                  setMaxPrice(2500);
                  setSortBy("asc");
                  setQuery("");
                  setActiveQuery("");
                }}
                className="text-primary font-label-technical text-label-technical hover:underline"
              >
                Wis alles
              </button>
            </div>

            {/* Filter Group: Zoekterm */}
            <div className="mb-8">
              <h4 className="font-label-technical text-label-technical uppercase tracking-wider text-outline mb-4">
                Zoekterm
              </h4>
              <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Zoek in ${meta.label.toLowerCase()}…`}
                  className="w-full h-10 px-4 bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                />
                <button
                  type="submit"
                  className="w-full h-10 bg-primary text-on-primary rounded-lg font-label-technical text-label-technical hover:opacity-90 transition-opacity"
                >
                  Zoeken
                </button>
              </form>
            </div>

            {/* Filter Group: Prijs */}
            <div>
              <h4 className="font-label-technical text-label-technical uppercase tracking-wider text-outline mb-4">
                Prijs
              </h4>
              <input
                type="range"
                min={0}
                max={2500}
                step={50}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                aria-label="Maximale prijs"
                aria-valuetext={maxPrice >= 2500 ? "Geen limiet" : `€${maxPrice}`}
                className="w-full h-1 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between mt-2 font-label-technical text-label-technical text-on-surface-variant">
                <span>€0</span>
                <span>{maxPrice >= 2500 ? "€2.500+" : `€${maxPrice.toLocaleString("nl-NL")}`}</span>
              </div>
            </div>
          </div>

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
          {/* Toolbar */}
          <div className="flex justify-between items-center mb-6 px-2">
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              <span className="font-bold text-on-surface">
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
            filtered.map((item, i) => (
              <CategoryResultCard
                key={`${item.retailer}-${i}`}
                item={item}
                isBestDeal={item.priceEur === cheapestPrice && item.inStock}
                isBestValue={i === bestValueIdx}
                componentType={componentType}
                onAddToBuild={(item, slot) => setComponent(slot, item)}
              />
            ))}
        </div>
      </div>
    </main>
  );
}
