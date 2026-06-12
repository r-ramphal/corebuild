"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Cpu, Monitor, Layers, Database, HardDrive, Zap, Server, Wind,
  TrendingUp, Plus, Check,
} from "lucide-react";
import { useBuildStore } from "@/lib/store/build";
import { COMPONENT_META } from "@/lib/categories";
import { formatEur } from "@/lib/format";
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

  const retailerInitial = (RETAILER_LABEL[item.retailer] ?? item.retailer)[0].toUpperCase();
  const retailerBg = RETAILER_BG[item.retailer] ?? "#737687";

  return (
    <div className="flex flex-col md:flex-row bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
      {/* Image area */}
      <div className="md:w-64 h-48 p-4 flex items-center justify-center bg-surface-container-low shrink-0 relative">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            width={200}
            height={160}
            className="max-w-full max-h-full object-contain"
            unoptimized
          />
        ) : (
          <div className="w-16 h-16 text-outline flex items-center justify-center">
            <HardDrive className="w-12 h-12" />
          </div>
        )}
        {isBestDeal && (
          <span className="absolute top-2 left-2 bg-success-emerald text-white text-[10px] px-2 py-0.5 rounded font-label-technical">
            BESTE DEAL
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-grow p-6 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start">
            <div>
              <span className="font-label-technical text-label-technical text-outline uppercase tracking-wider block mb-1">
                {item.retailer.toUpperCase()}
              </span>
              <h3 className="font-title-md text-title-md text-on-surface mb-1">
                {item.name}
              </h3>
            </div>
            <div className="text-right ml-4 flex-shrink-0">
              <span className="font-label-price text-label-price text-primary block">
                {formatEur(item.priceEur)}
              </span>
              <p className="text-[12px] text-on-surface-variant font-label-technical">
                bij {RETAILER_LABEL[item.retailer] ?? item.retailer}
              </p>
            </div>
          </div>

          {/* Stock indicator */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4">
            {item.inStock ? (
              <div className="flex items-center gap-1.5 text-success-emerald">
                <span className="w-2 h-2 rounded-full bg-success-emerald inline-block" />
                <span className="font-body-sm font-label-technical text-success-emerald">Op voorraad</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-outline">
                <span className="w-2 h-2 rounded-full bg-outline inline-block" />
                <span className="font-body-sm font-label-technical text-outline">Niet beschikbaar</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom actions */}
        <div className="flex justify-between items-center mt-6">
          {/* Retailer circle */}
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
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 border border-outline-variant rounded-lg font-label-technical text-label-technical hover:bg-surface-container transition-colors"
            >
              Vergelijken
            </a>
            <button
              onClick={handleAdd}
              className={`px-6 py-2 rounded-lg font-label-technical text-label-technical transition-all ${
                added
                  ? "bg-success-emerald text-white"
                  : "bg-primary-container text-on-primary-container hover:opacity-90"
              }`}
            >
              {added ? (
                <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Toegevoegd</span>
              ) : (
                "Toevoegen aan Build"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CategoriePage() {
  const params = useParams();
  const rawType = params.type as string;
  const componentType = rawType as ComponentType;
  const meta = COMPONENT_META[componentType];

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);

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
      <main className="pt-20 pb-16">
        <div className="max-w-[1280px] mx-auto px-8">
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">Categorie niet gevonden.</p>
          <Link href="/" className="text-primary hover:underline font-body-sm text-body-sm">
            ← Terug naar home
          </Link>
        </div>
      </main>
    );
  }

  const CategoryIcon = CATEGORY_ICONS[componentType] ?? HardDrive;

  const cheapestPrice = results?.results.find((i) => i.inStock)?.priceEur
    ?? results?.results[0]?.priceEur;

  return (
    <main className="pt-16 pb-16 min-h-screen bg-surface">
      <div className="max-w-[1280px] mx-auto px-8 py-8">
        {/* Category header */}
        <section className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-primary-container rounded-xl flex items-center justify-center text-on-primary flex-shrink-0">
              <CategoryIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-headline-lg text-headline-lg text-on-surface">{meta.label}</h1>
              <p className="font-body-sm text-body-sm text-on-surface-variant max-w-2xl">
                Vergelijk prijzen voor {meta.label.toLowerCase()} van de beste retailers.
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
          {/* Filter sidebar */}
          <aside className="col-span-12 md:col-span-3">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 sticky top-20">
              <h2 className="font-title-md text-title-md text-on-surface mb-4">Zoeken</h2>
              <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Zoek in ${meta.label}…`}
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
          </aside>

          {/* Results */}
          <div className="col-span-12 md:col-span-9 space-y-4">
            {loading && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-48 rounded-xl bg-surface-container animate-pulse" />
                ))}
              </div>
            )}

            {!loading && results && results.results.length === 0 && (
              <p className="text-center font-body-sm text-body-sm text-on-surface-variant py-12">
                Geen resultaten gevonden. Probeer een andere zoekterm.
              </p>
            )}

            {!loading && results && results.results.map((item, i) => (
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
      </div>
    </main>
  );
}
