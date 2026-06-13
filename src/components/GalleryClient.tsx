"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Scale, Check, FolderOpen } from "lucide-react";
import { COMPONENT_META, COMPONENT_TYPES } from "@/lib/categories";
import { formatEur } from "@/lib/format";
import type { BuildComponents } from "@/lib/store/build";

interface GalleryBuild {
  id: number;
  publicId: string;
  name: string;
  components: BuildComponents;
  createdAt: string;
}

function buildTotal(c: BuildComponents): number {
  return Object.values(c).reduce((s, x) => s + (x?.priceEur ?? 0), 0);
}

export function GalleryClient() {
  const router = useRouter();
  const [builds, setBuilds] = useState<GalleryBuild[] | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/builds/gallery")
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data) => setBuilds(data.builds))
      .catch(() => setBuilds([]));
  }, []);

  function toggleCompare(publicId: string) {
    setSelected((prev) => {
      if (prev.includes(publicId)) return prev.filter((p) => p !== publicId);
      if (prev.length >= 2) return [prev[1], publicId]; // hou de laatste twee
      return [...prev, publicId];
    });
  }

  return (
    <main className="pt-16 min-h-screen pb-28">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-12">
        <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Buildgalerij</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant mb-10 max-w-2xl">
          Builds die de community heeft gedeeld. Laad er een in de builder, of selecteer er twee om ze
          naast elkaar te vergelijken.
        </p>

        {builds === null && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 rounded-xl bg-surface-container animate-pulse" />
            ))}
          </div>
        )}

        {builds?.length === 0 && (
          <div className="text-center py-20 border border-dashed border-outline-variant rounded-xl">
            <p className="font-title-md text-title-md text-on-surface mb-2">Nog geen gedeelde builds</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-6">
              Stel een build samen, sla hem op en publiceer hem in de galerij.
            </p>
            <Link
              href="/builder"
              className="inline-block px-6 py-3 bg-primary text-on-primary rounded-lg font-label-technical text-label-technical hover:opacity-90"
            >
              Naar de PC Builder
            </Link>
          </div>
        )}

        {builds && builds.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {builds.map((b) => {
              const parts = COMPONENT_TYPES.filter((t) => b.components[t]);
              const isSelected = selected.includes(b.publicId);
              const headline = (["cpu", "gpu"] as const)
                .map((t) => b.components[t]?.name)
                .filter(Boolean)
                .join(" · ");
              return (
                <div
                  key={b.publicId}
                  className={`flex flex-col bg-surface-container-lowest border rounded-xl p-5 transition-all ${
                    isSelected ? "border-primary shadow-sm" : "border-outline-variant hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <h2 className="font-title-md text-title-md text-on-surface truncate">{b.name}</h2>
                    <span className="font-label-price text-[18px] text-primary flex-shrink-0">
                      {formatEur(buildTotal(b.components))}
                    </span>
                  </div>
                  <p className="font-label-technical text-label-technical text-on-surface-variant mb-2">
                    {parts.length} onderdelen
                  </p>
                  <p className="font-body-sm text-[13px] text-on-surface-variant line-clamp-2 mb-4 flex-grow">
                    {headline || parts.map((t) => COMPONENT_META[t].shortLabel).join(", ")}
                  </p>
                  <div className="flex gap-2">
                    <Link
                      href={`/build/${b.publicId}`}
                      className="flex-1 px-3 py-2 border border-outline-variant rounded-lg font-label-technical text-label-technical text-on-surface hover:border-primary hover:text-primary flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <FolderOpen className="w-3.5 h-3.5" /> Bekijk
                    </Link>
                    <button
                      onClick={() => toggleCompare(b.publicId)}
                      aria-pressed={isSelected}
                      className={`px-3 py-2 rounded-lg font-label-technical text-label-technical flex items-center justify-center gap-1.5 transition-colors ${
                        isSelected
                          ? "bg-primary text-on-primary"
                          : "border border-outline-variant text-on-surface hover:border-primary hover:text-primary"
                      }`}
                    >
                      {isSelected ? <Check className="w-3.5 h-3.5" /> : <Scale className="w-3.5 h-3.5" />}
                      Vergelijk
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Vergelijk-balk */}
      {selected.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-30 bg-surface-container-lowest border-t border-outline-variant shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
            <span className="font-label-technical text-label-technical text-on-surface-variant">
              {selected.length} van 2 builds geselecteerd om te vergelijken
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setSelected([])}
                className="px-4 py-2 font-label-technical text-label-technical text-on-surface-variant hover:text-primary"
              >
                Wis
              </button>
              <button
                disabled={selected.length !== 2}
                onClick={() => router.push(`/vergelijk?a=${selected[0]}&b=${selected[1]}`)}
                className="px-5 py-2 bg-primary text-on-primary font-label-technical text-label-technical rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Scale className="w-4 h-4" /> Vergelijk
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
