"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FolderOpen, Trash2, Link as LinkIcon, Check, Upload } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { useBuildStore, type BuildComponents } from "@/lib/store/build";
import { COMPONENT_META, COMPONENT_TYPES } from "@/lib/categories";
import { formatEur } from "@/lib/format";

interface SavedBuild {
  id: number;
  publicId: string;
  name: string;
  components: BuildComponents;
  createdAt: string;
  updatedAt: string;
}

function buildTotal(components: BuildComponents): number {
  return Object.values(components).reduce((sum, c) => sum + (c?.priceEur ?? 0), 0);
}

export default function BuildsPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const { loadComponents } = useBuildStore();

  const [builds, setBuilds] = useState<SavedBuild[] | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchBuilds = useCallback(() => {
    fetch("/api/builds")
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data) => setBuilds(data.builds))
      .catch(() => setBuilds([]));
  }, []);

  useEffect(() => {
    if (session) fetchBuilds();
  }, [session, fetchBuilds]);

  useEffect(() => {
    if (!isPending && !session) router.push("/inloggen");
  }, [isPending, session, router]);

  function handleLoad(build: SavedBuild) {
    loadComponents(build.components);
    router.push("/builder");
  }

  async function handleDelete(build: SavedBuild) {
    setBuilds((prev) => prev?.filter((b) => b.id !== build.id) ?? null);
    await fetch(`/api/builds/${build.publicId}`, { method: "DELETE" });
  }

  async function handleCopyLink(build: SavedBuild) {
    const url = `${window.location.origin}/build/${build.publicId}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(build.publicId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (isPending || !session) {
    return (
      <main className="pt-16 min-h-screen">
        <div className="max-w-[1280px] mx-auto px-8 py-16 text-on-surface-variant">Laden...</div>
      </main>
    );
  }

  return (
    <main className="pt-16 min-h-screen">
      <div className="max-w-[1280px] mx-auto px-8 py-12">
        <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Mijn builds</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant mb-10">
          Je opgeslagen builds. Laad ze in de builder of deel een link.
        </p>

        {builds === null && (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-28 rounded-xl bg-surface-container animate-pulse" />
            ))}
          </div>
        )}

        {builds?.length === 0 && (
          <div className="text-center py-20 border border-dashed border-outline-variant rounded-xl">
            <p className="font-title-md text-title-md text-on-surface mb-2">
              Nog geen builds opgeslagen
            </p>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-6">
              Stel een build samen en klik op &ldquo;Bewaar build&rdquo;.
            </p>
            <Link
              href="/builder"
              className="inline-block px-6 py-3 bg-primary text-on-primary rounded-lg font-label-technical text-label-technical hover:opacity-90"
            >
              Naar de PC Builder
            </Link>
          </div>
        )}

        <div className="space-y-4">
          {builds?.map((build) => {
            const parts = COMPONENT_TYPES.filter((t) => build.components[t]);
            return (
              <div
                key={build.id}
                className="flex flex-col md:flex-row md:items-center gap-4 p-6 bg-surface-container-lowest border border-outline-variant rounded-xl hover:border-primary transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <h2 className="font-title-md text-title-md text-on-surface">{build.name}</h2>
                    <span className="font-label-price text-label-price text-primary">
                      {formatEur(buildTotal(build.components))}
                    </span>
                  </div>
                  <p className="font-label-technical text-label-technical text-on-surface-variant mt-1">
                    {parts.length} onderdelen &bull;{" "}
                    {parts.map((t) => COMPONENT_META[t].shortLabel).join(", ")}
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 truncate">
                    {parts
                      .slice(0, 3)
                      .map((t) => build.components[t]!.name)
                      .join(" · ")}
                    {parts.length > 3 ? " · …" : ""}
                  </p>
                </div>

                <div className="flex gap-2 flex-shrink-0 flex-wrap">
                  <button
                    onClick={() => handleLoad(build)}
                    className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-technical text-label-technical hover:opacity-90 flex items-center gap-2"
                  >
                    <Upload className="w-3.5 h-3.5" /> Laden
                  </button>
                  <button
                    onClick={() => handleCopyLink(build)}
                    className="px-4 py-2 border border-outline-variant rounded-lg font-label-technical text-label-technical text-on-surface hover:border-primary hover:text-primary flex items-center gap-2 transition-colors"
                  >
                    {copiedId === build.publicId ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-success-emerald" /> Gekopieerd
                      </>
                    ) : (
                      <>
                        <LinkIcon className="w-3.5 h-3.5" /> Delen
                      </>
                    )}
                  </button>
                  <Link
                    href={`/build/${build.publicId}`}
                    className="px-4 py-2 border border-outline-variant rounded-lg font-label-technical text-label-technical text-on-surface hover:border-primary hover:text-primary flex items-center gap-2 transition-colors"
                  >
                    <FolderOpen className="w-3.5 h-3.5" /> Bekijk
                  </Link>
                  <button
                    onClick={() => handleDelete(build)}
                    aria-label={`Verwijder ${build.name}`}
                    className="px-3 py-2 border border-outline-variant rounded-lg text-on-surface-variant hover:border-error-crimson hover:text-error-crimson transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
