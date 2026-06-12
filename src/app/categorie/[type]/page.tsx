"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useBuildStore } from "@/lib/store/build";
import { COMPONENT_META } from "@/lib/categories";
import { PriceList } from "@/components/PriceList";
import type { ComponentType, SearchResults } from "@/lib/types";

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
          <p className="text-on-surface-variant mb-4">Categorie niet gevonden.</p>
          <Link href="/" className="text-primary hover:underline text-sm">
            ← Terug naar home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-16 pb-16 min-h-screen bg-surface">
      {/* Category header */}
      <div className="bg-surface-container-low border-b border-outline-variant">
        <div className="max-w-[1280px] mx-auto px-8 py-8">
          <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-3">
            <Link href="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <span>›</span>
            <span className="text-on-surface">{meta.label}</span>
          </div>

          <h1 className="font-heading font-bold text-3xl text-on-surface mb-4">
            {meta.label}
          </h1>

          <div className="flex flex-wrap gap-2">
            {meta.popularTags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-mono border transition-all ${
                  query === tag
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-on-surface-variant border-outline-variant hover:border-primary hover:text-primary"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search + results */}
      <div className="max-w-[1280px] mx-auto px-8 py-8">
        <form onSubmit={handleSearchSubmit} className="mb-6 max-w-xl flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Zoek in ${meta.label}…`}
            className="flex-1 h-11 px-4 bg-white border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
          />
          <button
            type="submit"
            className="px-5 h-11 bg-primary text-white rounded-xl font-mono text-xs hover:opacity-90 transition-opacity"
          >
            Zoeken
          </button>
        </form>

        {loading && (
          <div className="text-center py-16 text-on-surface-variant">
            <p className="text-sm">Laden…</p>
          </div>
        )}

        {!loading && results && (
          <PriceList
            results={results}
            categorySlot={componentType}
            onAddToBuild={(item, slot) => setComponent(slot, item)}
          />
        )}
      </div>
    </main>
  );
}
