"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Check, ExternalLink, Package, TrendingUp } from "lucide-react";
import { useBuildStore } from "@/lib/store/build";
import { COMPONENT_META } from "@/lib/categories";
import { ComponentSpecs } from "@/components/ComponentSpecs";
import { RetailerLogo } from "@/components/RetailerLogo";
import { useSearch } from "@/lib/use-search";
import { formatEur } from "@/lib/format";
import type { ComponentType, PriceResult } from "@/lib/types";

/**
 * Inline onderdeel-kiezer voor de builder: kies of wijzig een component zonder
 * de builder te verlaten (modal i.p.v. wegnavigeren naar de categoriepagina).
 * Hergebruikt dezelfde zoek-/catalogusflow (`/api/search?cat=`) als de
 * categoriepagina. Een link onderaan opent alsnog de volledige pagina.
 */
export function SlotPicker({ type, onClose }: { type: ComponentType; onClose: () => void }) {
  const meta = COMPONENT_META[type];
  const { setComponent } = useBuildStore();
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");

  // Escape sluit de modal
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const sp = new URLSearchParams();
  if (activeQuery) sp.set("q", activeQuery);
  sp.set("cat", type);
  const { results, loading } = useSearch(`/api/search?${sp.toString()}`, activeQuery);

  const items = [...(results?.results ?? [])].sort((a, b) => a.priceEur - b.priceEur);
  const cheapest = items.find((i) => i.inStock)?.priceEur ?? items[0]?.priceEur;

  function choose(item: PriceResult) {
    setComponent(type, item);
    onClose();
  }

  function runTag(tag: string) {
    setQuery(tag);
    setActiveQuery(tag);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <button
        aria-label="Sluiten"
        onClick={onClose}
        className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Kies een ${meta.label}`}
        className="relative w-full sm:max-w-3xl max-h-[92vh] sm:max-h-[82vh] bg-surface border border-outline-variant rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 p-4 border-b border-outline-variant">
          <div>
            <h2 className="font-title-md text-title-md text-on-surface">Kies een {meta.label}</h2>
            <p className="font-body-sm text-[12px] text-on-surface-variant">
              {loading ? "Laden…" : `${items.length} resultaten — gesorteerd op prijs`}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Sluiten"
            className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Zoeken + populaire tags */}
        <div className="p-4 border-b border-outline-variant space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setActiveQuery(query);
            }}
            className="flex gap-2"
          >
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Zoek in ${meta.label.toLowerCase()}…`}
              className="flex-1 h-10 px-4 bg-white border border-outline-variant rounded-lg font-body-sm text-body-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            />
            <button
              type="submit"
              className="px-5 h-10 bg-primary text-on-primary rounded-lg font-label-technical text-label-technical hover:opacity-90 transition-opacity"
            >
              Zoeken
            </button>
          </form>
          <div className="flex flex-wrap gap-2">
            {meta.popularTags.slice(0, 5).map((tag) => (
              <button
                key={tag}
                onClick={() => runTag(tag)}
                className={`font-label-technical text-[11px] flex items-center gap-1 px-3 py-1 rounded-full transition-all ${
                  query === tag
                    ? "bg-primary-container text-on-primary"
                    : "bg-surface-container-high text-on-surface-variant hover:bg-primary-container hover:text-on-primary"
                }`}
              >
                <TrendingUp className="w-3 h-3" /> {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Resultaten */}
        <div className="overflow-y-auto p-4 space-y-2.5 flex-1">
          {loading ? (
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-surface-container animate-pulse" />
            ))
          ) : items.length === 0 ? (
            <p className="text-center font-body-sm text-body-sm text-on-surface-variant py-12">
              Geen resultaten. Probeer een andere zoekterm.
            </p>
          ) : (
            items.map((item, i) => (
              <div
                key={`${item.retailer}-${i}`}
                className={`flex items-center gap-3 p-3 bg-surface-container-lowest border rounded-xl transition-colors ${
                  item.priceEur === cheapest && item.inStock
                    ? "border-success-emerald"
                    : "border-outline-variant hover:border-primary"
                } ${!item.inStock ? "opacity-70" : ""}`}
              >
                <div className="w-14 h-14 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0 overflow-hidden">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      width={56}
                      height={56}
                      className="object-contain max-w-full max-h-full"
                      unoptimized
                    />
                  ) : (
                    <Package className="w-6 h-6 text-outline" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <RetailerLogo retailer={item.retailer} size="sm" />
                    {item.mock && (
                      <span className="font-label-technical text-[10px] text-on-surface-variant">demo</span>
                    )}
                    {!item.inStock && (
                      <span className="font-label-technical text-[10px] text-error-crimson">uitverkocht</span>
                    )}
                  </div>
                  <p className="font-body-sm text-[13px] text-on-surface truncate">{item.name}</p>
                  <ComponentSpecs name={item.name} category={type} className="mt-1" />
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="font-label-price text-label-price text-primary">
                    {formatEur(item.priceEur)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {item.url && !item.mock && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Bekijk bij ${item.retailer}`}
                        className="p-1.5 rounded-lg border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => choose(item)}
                      className="px-3 py-1.5 rounded-lg bg-primary-container text-on-primary-container font-label-technical text-label-technical hover:opacity-90 transition-opacity inline-flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Kies
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer: volledige pagina */}
        <div className="p-3 border-t border-outline-variant text-center">
          <Link
            href={`/categorie/${type}`}
            onClick={onClose}
            className="font-label-technical text-label-technical text-on-surface-variant hover:text-primary"
          >
            Open de volledige {meta.label}-pagina (filters, prijs-prestatie) →
          </Link>
        </div>
      </div>
    </div>
  );
}
