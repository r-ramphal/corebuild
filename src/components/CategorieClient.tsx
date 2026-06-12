"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Cpu, Monitor, Layers, Database, HardDrive, Zap, Server, Wind,
  TrendingUp, Check,
} from "lucide-react";
import { useBuildStore } from "@/lib/store/build";
import { COMPONENT_META } from "@/lib/categories";
import { formatEur } from "@/lib/format";
import { productUrl } from "@/lib/product-url";
import type { ComponentType, SearchResults, PriceResult } from "@/lib/types";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  cpu: Cpu,
  gpu: Monitor,
  motherboard: Layers,
  ram: Database,
  storage: HardDrive,
  psu: Zap,
  case: Server,
  cooling: Wind,
};

const RETAILER_LABEL: Record<string, string> = {
  amazon: "Amazon",
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

interface CategoryResultCardProps {
  item: PriceResult;
  isBestDeal: boolean;
  componentType: ComponentType;
  onAddToBuild: (item: PriceResult, slot: ComponentType) => void;
}

function CategoryResultCard({ item, isBestDeal, componentType, onAddToBuild }: CategoryResultCardProps) {
  const [added, setAdded] = useState(false);

  function handleAdd() {
    onAddToBuild(item, componentType);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  const retailerInitial = (RETAILER_LABEL[item.retailer] ?? item.retailer)
    .slice(0, item.retailer === "azerty" || item.retailer === "alternate" ? 2 : 1);
  const retailerBg = RETAILER_BG[item.retailer] ?? "#737687";

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
              <span className="font-label-technical text-label-technical text-outline uppercase tracking-wider">
                {RETAILER_LABEL[item.retailer] ?? item.retailer}
                {item.mock ? " · demo" : ""}
              </span>
              <h3 className="font-title-md text-title-md text-on-surface mb-1">
                {item.name}
              </h3>
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
          <div className="flex justify-between items-center mt-6">
            <div className="flex -space-x-2">
              <div
                className="w-8 h-8 rounded-full border-2 border-surface-container-lowest flex items-center justify-center text-[10px] text-white font-bold"
                style={{ backgroundColor: retailerBg }}
                title={RETAILER_LABEL[item.retailer] ?? item.retailer}
              >
                {retailerInitial}
              </div>
            </div>

            <div className="flex gap-2">
              <Link
                href={productUrl(item, componentType)}
                className="px-4 py-2 border border-outline-variant rounded-lg font-label-technical text-label-technical hover:bg-surface-container transition-colors"
              >
                Vergelijken
              </Link>
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
            </div>
          </div>
        ) : (
          <div className="flex justify-end mt-6">
            <button
              disabled
              className="px-6 py-2 bg-surface-container-highest text-on-surface-variant rounded-lg font-label-technical text-label-technical cursor-not-allowed"
            >
              Stel Alert In
            </button>
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
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [maxPrice, setMaxPrice] = useState(2500);
  const [sortBy, setSortBy] = useState<"asc" | "desc">("asc");

  const { setComponent } = useBuildStore();

  const search = useCallback((q: string) => {
    if (!q) return;
    setLoading(true);
    setResults(null);
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: SearchResults) => setResults(data))
      .catch(() => setResults({ query: q, results: [], errors: [] }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (meta) {
      setQuery(meta.searchTerm);
      search(meta.searchTerm);
    }
  }, [meta, search]);

  function handleTagClick(tag: string) {
    setQuery(tag);
    search(tag);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    search(query);
  }

  if (!meta) {
    return (
      <main className="mt-16 max-w-[1280px] mx-auto px-8 py-8 min-h-screen">
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

  return (
    <main className="mt-16 max-w-[1280px] mx-auto px-8 py-8 min-h-screen">
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
                  setQuery(meta.searchTerm);
                  search(meta.searchTerm);
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
                  className="w-full h-10 px-4 bg-white border border-outline-variant rounded-lg font-body-sm text-body-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
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
                className="w-full h-1 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between mt-2 font-label-technical text-label-technical text-on-surface-variant">
                <span>€0</span>
                <span>{maxPrice >= 2500 ? "€2.500+" : `€${maxPrice.toLocaleString("nl-NL")}`}</span>
              </div>
            </div>
          </div>

          {/* Promo Card */}
          <div className="relative overflow-hidden rounded-xl h-48 bg-inverse-surface flex flex-col justify-end p-4 group cursor-pointer">
            <Image
              src="/images/promo-gpu.png"
              alt="High-performance gaming PC met verticale GPU"
              fill
              className="object-cover opacity-50 group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, 300px"
            />
            <div className="relative z-10">
              <span className="bg-primary text-on-primary text-[10px] px-2 py-0.5 rounded font-label-technical uppercase tracking-tighter mb-2 inline-block">
                Sponsor
              </span>
              <h5 className="text-on-primary font-title-md text-title-md">
                Nieuwe RTX 50-serie Geruchten
              </h5>
              <p className="text-surface-variant font-body-sm text-body-sm">
                Lees de laatste specs...
              </p>
            </div>
          </div>
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

          {!loading &&
            filtered.map((item, i) => (
              <CategoryResultCard
                key={`${item.retailer}-${i}`}
                item={item}
                isBestDeal={item.priceEur === cheapestPrice && item.inStock}
                componentType={componentType}
                onAddToBuild={(item, slot) => setComponent(slot, item)}
              />
            ))}
        </div>
      </div>
    </main>
  );
}
