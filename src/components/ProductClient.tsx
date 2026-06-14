"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ExternalLink, Package, Plus, Check, Zap } from "lucide-react";
import { useBuildStore } from "@/lib/store/build";
import { COMPONENT_META, COMPONENT_TYPES } from "@/lib/categories";
import { formatEur } from "@/lib/format";
import { ComponentSpecs } from "@/components/ComponentSpecs";
import { ProductDescription } from "@/components/ProductDescription";
import { inferCategory } from "@/lib/relevance";
import { useSearch } from "@/lib/use-search";
import { useProductInfo } from "@/lib/use-product-info";
import { usePriceHistory } from "@/lib/use-price-history";
import { PriceHistoryChart } from "@/components/PriceHistoryChart";
import { WatchButton } from "@/components/WatchButton";
import { RetailerLogo } from "@/components/RetailerLogo";
import type { ComponentType } from "@/lib/types";

const RETAILER_LABEL: Record<string, string> = {
  amazon: "Amazon",
  bol: "Bol.com",
  megekko: "Megekko",
  azerty: "Azerty",
  alternate: "Alternate",
};

/** Hoeveel van de zoektermen komen terug in de resultaatnaam? */
function matchScore(target: string[], resultName: string): number {
  if (target.length === 0) return 0;
  const hay = resultName.toLowerCase();
  const hits = target.filter((t) => hay.includes(t)).length;
  return hits / target.length;
}

export function ProductClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const name = searchParams.get("q") ?? slug.replace(/-/g, " ");
  const cat = searchParams.get("cat") as ComponentType | null;
  const meta = cat ? COMPONENT_META[cat] : undefined;
  // Categorie voor de omschrijving: uit de URL, anders afgeleid uit de naam
  const resolvedCat = cat ?? inferCategory(name);

  const { setComponent } = useBuildStore();

  const [added, setAdded] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const catParam = cat ? `&cat=${encodeURIComponent(cat)}` : "";
  const { results, loading } = useSearch(
    `/api/search?q=${encodeURIComponent(name)}${catParam}`,
    name
  );

  useEffect(() => {
    if (!pickerOpen) return;
    function onOutsideClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setPickerOpen(false);
    }
    document.addEventListener("mousedown", onOutsideClick);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onOutsideClick);
      document.removeEventListener("keydown", onEscape);
    };
  }, [pickerOpen]);

  // Filter op relevantie: resultaat moet het merendeel van de naam-tokens bevatten
  const tokens = name.toLowerCase().split(/[^a-z0-9.]+/).filter((t) => t.length >= 2);
  const all = results?.results ?? [];
  let matches = all
    .filter((r) => matchScore(tokens, r.name) >= 0.6)
    .sort((a, b) => a.priceEur - b.priceEur);
  const isFuzzy = matches.length === 0 && all.length > 0;
  if (isFuzzy) {
    matches = [...all].sort((a, b) => a.priceEur - b.priceEur);
  }

  const best = matches.find((m) => m.inStock) ?? matches[0];
  const heroImage = matches.find((m) => m.imageUrl)?.imageUrl;

  // Retailer-eigen omschrijving ophalen van de goedkoopste scrapebare aanbieding
  // (Bol/Amazon blokkeren datacenter-IP's, dus die slaan we over voor de info-fetch)
  const SCRAPABLE = ["megekko", "azerty", "alternate"];
  const infoOffer =
    matches.find((m) => m.inStock && !m.mock && SCRAPABLE.includes(m.retailer)) ??
    matches.find((m) => !m.mock && SCRAPABLE.includes(m.retailer));
  const retailerInfo = useProductInfo(infoOffer?.url ?? null);

  // Prijsverloop: laagste prijs per dag over de échte aanbiedings-urls
  const historyUrls = matches.filter((m) => !m.mock).map((m) => m.url);
  const pricePoints = usePriceHistory(historyUrls);

  function handleAdd(slot: ComponentType) {
    if (!best) return;
    setComponent(slot, { ...best, name });
    setAdded(true);
    setPickerOpen(false);
    setTimeout(() => setAdded(false), 2500);
  }

  return (
    <main className="pt-16 min-h-screen">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 pt-8 pb-16">
        {/* Breadcrumb */}
        <div className="py-4 font-body-sm text-body-sm text-on-surface-variant">
          <Link href="/" className="hover:text-primary">Home</Link>
          {meta && (
            <>
              <span className="mx-2">›</span>
              <Link href={`/categorie/${cat}`} className="hover:text-primary">
                {meta.label}
              </Link>
            </>
          )}
          <span className="mx-2">›</span>
          <span className="text-on-surface font-medium">{name}</span>
        </div>

        {/* Product hero */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mt-4 mb-12">
          {/* Image */}
          <div className="md:col-span-5">
            <div className="bg-surface-container-high rounded-xl border border-outline-variant p-8 flex items-center justify-center aspect-square sticky top-24">
              {loading ? (
                <div className="w-full h-full rounded-lg bg-surface-container animate-pulse" />
              ) : heroImage ? (
                <Image
                  src={heroImage}
                  alt={name}
                  width={480}
                  height={480}
                  className="object-contain max-w-full max-h-full"
                  unoptimized
                />
              ) : (
                <Package className="w-24 h-24 text-outline" />
              )}
            </div>
          </div>

          {/* Info */}
          <div className="md:col-span-7">
            {meta && (
              <span className="font-label-technical text-label-technical text-outline uppercase tracking-wider block mb-2">
                {meta.label}
              </span>
            )}
            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-3">{name}</h1>

            <ComponentSpecs name={name} category={cat ?? undefined} className="mb-4" />

            {loading ? (
              <div className="space-y-3 mt-6">
                <div className="h-12 w-48 rounded bg-surface-container animate-pulse" />
                <div className="h-10 w-full rounded bg-surface-container animate-pulse" />
              </div>
            ) : best ? (
              <>
                <div className="mb-1">
                  <span className="font-label-technical text-label-technical text-on-surface-variant">
                    Laagste prijs{best.mock ? " · demo" : ""}
                  </span>
                </div>
                <div className="flex items-end gap-3 mb-2">
                  <span className="font-display-lg text-display-lg text-primary">
                    {formatEur(best.priceEur)}
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant pb-2">
                    bij {RETAILER_LABEL[best.retailer] ?? best.retailer}
                  </span>
                </div>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-6">
                  Inclusief BTW &bull; Indicatief
                </p>

                <div className="flex flex-wrap gap-3">
                  <a
                    href={best.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-primary text-on-primary px-8 py-3 rounded-lg font-label-technical text-label-technical flex items-center gap-2 hover:opacity-90 transition-opacity"
                  >
                    Bekijk bij {RETAILER_LABEL[best.retailer] ?? best.retailer}
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <div ref={pickerRef} className="relative">
                    <button
                      onClick={() => (cat ? handleAdd(cat) : setPickerOpen((p) => !p))}
                      aria-expanded={cat ? undefined : pickerOpen}
                      aria-haspopup={cat ? undefined : "menu"}
                      className={`px-6 py-3 rounded-lg font-label-technical text-label-technical flex items-center gap-2 transition-all ${
                        added
                          ? "bg-success-emerald text-white"
                          : "bg-primary-container text-on-primary-container hover:opacity-90"
                      }`}
                    >
                      {added ? (
                        <>
                          <Check className="w-4 h-4" /> Toegevoegd
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" /> Toevoegen aan Build
                        </>
                      )}
                    </button>

                    {pickerOpen && (
                      <div className="absolute top-full left-0 mt-1.5 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg z-20 py-2 min-w-[180px]">
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
                  </div>

                  {resolvedCat && (
                    <WatchButton
                      variant="full"
                      name={name}
                      category={resolvedCat}
                      url={best.url}
                      retailer={best.retailer}
                      priceEur={best.priceEur}
                      imageUrl={best.imageUrl}
                    />
                  )}
                </div>

                {meta && meta.wattage > 0 && (
                  <div className="mt-8 inline-flex items-center gap-2 p-3 bg-surface-container-low rounded border border-outline-variant/30">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="font-label-technical text-label-technical text-on-surface-variant">
                      Geschat verbruik: ~{meta.wattage}W
                    </span>
                  </div>
                )}
              </>
            ) : (
              <p className="font-body-lg text-body-lg text-on-surface-variant mt-6">
                Geen prijzen gevonden voor dit product. Probeer{" "}
                <Link href={`/zoeken?q=${encodeURIComponent(name)}`} className="text-primary hover:underline">
                  een bredere zoekopdracht
                </Link>
                .
              </p>
            )}
          </div>
        </div>

        {/* Productomschrijving uit de specs + retailer-eigen info */}
        {resolvedCat && (
          <ProductDescription name={name} category={resolvedCat} retailerInfo={retailerInfo} />
        )}

        {/* Prijsverloop (laagste prijs per dag) — verschijnt zodra er genoeg metingen zijn */}
        {pricePoints.length >= 2 && (
          <section className="mb-12">
            <h2 className="font-title-md text-title-md text-on-surface mb-2">
              Prijsverloop
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-6">
              De laagste prijs die we de afgelopen periode bij de retailers maten.
            </p>
            <PriceHistoryChart points={pricePoints} />
          </section>
        )}

        {/* Price comparison table */}
        {!loading && matches.length > 0 && (
          <section>
            <h2 className="font-title-md text-title-md text-on-surface mb-2">
              Prijsvergelijking
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-6">
              {isFuzzy
                ? "Geen exacte match gevonden. Dit zijn de meest vergelijkbare resultaten."
                : `${matches.length} aanbieding${matches.length === 1 ? "" : "en"} gevonden, gesorteerd op prijs.`}
            </p>

            <div className="space-y-3">
              {matches.map((item, i) => {
                const isBest = item === best;
                return (
                  <div
                    key={`${item.retailer}-${i}`}
                    className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-surface-container-lowest rounded-xl transition-all ${
                      isBest
                        ? "border-2 border-success-emerald"
                        : "border border-outline-variant hover:border-primary"
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:w-40 flex-shrink-0">
                      <RetailerLogo retailer={item.retailer} />
                      {item.mock && (
                        <span className="font-label-technical text-[10px] text-on-surface-variant">demo</span>
                      )}
                      {isBest && (
                        <span className="bg-success-emerald text-white px-2 py-0.5 rounded-full font-label-technical text-[10px]">
                          Beste prijs
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-body-sm text-body-sm text-on-surface truncate">{item.name}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span
                          className={`w-2 h-2 rounded-full inline-block ${
                            item.inStock ? "bg-success-emerald" : "bg-error-crimson"
                          }`}
                        />
                        <span
                          className={`font-label-technical text-label-technical ${
                            item.inStock ? "text-success-emerald" : "text-error-crimson"
                          }`}
                        >
                          {item.inStock ? "Op voorraad" : "Niet op voorraad"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                      <span
                        className={`font-label-price text-label-price ${
                          isBest ? "text-primary" : "text-on-surface"
                        }`}
                      >
                        {formatEur(item.priceEur)}
                      </span>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 border border-outline-variant rounded-lg font-label-technical text-label-technical hover:bg-surface-container transition-colors flex items-center gap-1.5"
                      >
                        Bekijk <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-surface-container animate-pulse" />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
