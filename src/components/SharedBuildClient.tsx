"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { useBuildStore, type BuildComponents } from "@/lib/store/build";
import { COMPONENT_META, COMPONENT_TYPES } from "@/lib/categories";
import { CATEGORY_ICONS as ICONS } from "@/lib/category-icons";
import { formatEur } from "@/lib/format";

interface SharedBuild {
  publicId: string;
  name: string;
  components: BuildComponents;
  createdAt: string;
}

export function SharedBuildClient() {
  const params = useParams();
  const router = useRouter();
  const publicId = params.publicId as string;
  const { loadComponents } = useBuildStore();

  const [build, setBuild] = useState<SharedBuild | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/builds/${publicId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data) => setBuild(data.build))
      .catch(() => setNotFound(true));
  }, [publicId]);

  function handleLoad() {
    if (!build) return;
    loadComponents(build.components);
    router.push("/builder");
  }

  if (notFound) {
    return (
      <main className="pt-16 min-h-screen">
        <div className="max-w-[1280px] mx-auto px-8 py-16 text-center">
          <p className="font-title-md text-title-md text-on-surface mb-2">Build niet gevonden</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-6">
            Deze link klopt niet of de build is verwijderd.
          </p>
          <Link href="/builder" className="text-primary hover:underline font-body-sm text-body-sm">
            → Naar de PC Builder
          </Link>
        </div>
      </main>
    );
  }

  if (!build) {
    return (
      <main className="pt-16 min-h-screen">
        <div className="max-w-[1280px] mx-auto px-8 py-16">
          <div className="h-64 rounded-xl bg-surface-container animate-pulse" />
        </div>
      </main>
    );
  }

  const parts = COMPONENT_TYPES.filter((t) => build.components[t]);
  const total = parts.reduce((sum, t) => sum + (build.components[t]?.priceEur ?? 0), 0);

  return (
    <main className="pt-16 min-h-screen">
      <div className="max-w-[800px] mx-auto px-8 py-12">
        <span className="font-label-technical text-label-technical text-outline uppercase tracking-wider block mb-2">
          Gedeelde build
        </span>
        <h1 className="font-headline-lg text-headline-lg text-on-surface mb-8">{build.name}</h1>

        <div className="space-y-3 mb-8">
          {parts.map((type) => {
            const item = build.components[type]!;
            const Icon = ICONS[type];
            return (
              <div
                key={type}
                className="flex items-center justify-between p-4 bg-surface-container-lowest border border-outline-variant rounded-lg"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded bg-surface-container flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-label-technical text-label-technical text-on-surface-variant">
                      {COMPONENT_META[type].shortLabel}
                    </p>
                    <p className="font-title-md text-title-md text-on-surface truncate">{item.name}</p>
                  </div>
                </div>
                <span className="font-label-price text-label-price text-primary flex-shrink-0 ml-4">
                  {formatEur(item.priceEur)}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between p-6 bg-surface-container-lowest border border-outline-variant rounded-xl">
          <div>
            <span className="font-label-technical text-label-technical text-on-surface-variant block">
              Totaalprijs
            </span>
            <span className="font-display-lg text-display-lg text-primary">{formatEur(total)}</span>
          </div>
          <button
            onClick={handleLoad}
            className="px-8 py-4 bg-primary text-on-primary rounded-lg font-label-technical text-label-technical hover:opacity-90 flex items-center gap-2"
          >
            <Upload className="w-4 h-4" /> Laad in builder
          </button>
        </div>

        <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mt-3 text-right">
          Prijzen op moment van opslaan &bull; Indicatief
        </p>
      </div>
    </main>
  );
}
