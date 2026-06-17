"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ShieldCheck, CircleAlert, Upload, ArrowLeft } from "lucide-react";
import { useBuildStore, type BuildComponents } from "@/lib/store/build";
import { COMPONENT_META, COMPONENT_TYPES } from "@/lib/categories";
import { analyzeBuild } from "@/lib/specs/build-analysis";
import { formatEur } from "@/lib/format";

interface PublicBuild {
  publicId: string;
  name: string;
  components: BuildComponents;
}

function buildTotal(c: BuildComponents): number {
  return Object.values(c).reduce((s, x) => s + (x?.priceEur ?? 0), 0);
}

function CompatBadge({ components }: { components: BuildComponents }) {
  const a = analyzeBuild(components);
  const blocking = a.checks.some((c) => c.status === "bad");
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-label-technical text-[11px] px-2 py-0.5 rounded-full ${
        blocking ? "bg-error-crimson/10 text-error-crimson" : "bg-success-emerald/10 text-success-emerald"
      }`}
    >
      {blocking ? <CircleAlert className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
      {blocking ? "Aandachtspunten" : "Compatibel"}
    </span>
  );
}

export function CompareClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const { loadComponents } = useBuildStore();
  const aId = sp.get("a");
  const bId = sp.get("b");

  const [pair, setPair] = useState<[PublicBuild, PublicBuild] | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const missing = !aId || !bId;

  useEffect(() => {
    if (missing) return;
    Promise.all(
      [aId, bId].map((id) =>
        fetch(`/api/builds/${id}`).then((r) => (r.ok ? r.json() : null))
      )
    )
      .then(([ra, rb]) => {
        if (!ra?.build || !rb?.build) {
          setFetchError("Een van de builds bestaat niet (meer).");
          return;
        }
        setPair([ra.build, rb.build]);
      })
      .catch(() => setFetchError("Vergelijken mislukt. Probeer het opnieuw."));
  }, [aId, bId, missing]);

  function loadIntoBuilder(c: BuildComponents) {
    loadComponents(c);
    router.push("/builder");
  }

  const error = missing ? "Kies twee builds om te vergelijken." : fetchError;
  if (error) {
    return (
      <main className="pt-16 min-h-screen">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-16">
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-4">{error}</p>
          <Link href="/community" className="text-primary hover:underline font-label-technical text-label-technical inline-flex items-center gap-1.5">
            <ArrowLeft className="w-4 h-4" /> Terug naar de community
          </Link>
        </div>
      </main>
    );
  }

  if (!pair) {
    return (
      <main className="pt-16 min-h-screen">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-16">
          <div className="h-64 rounded-xl bg-surface-container animate-pulse" />
        </div>
      </main>
    );
  }

  const [a, b] = pair;
  const totals = [buildTotal(a.components), buildTotal(b.components)] as const;
  const cheaper = totals[0] === totals[1] ? -1 : totals[0] < totals[1] ? 0 : 1;

  return (
    <main className="pt-16 min-h-screen pb-16">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-10">
        <Link href="/community" className="text-on-surface-variant hover:text-primary font-label-technical text-label-technical inline-flex items-center gap-1.5 mb-6">
          <ArrowLeft className="w-4 h-4" /> Community
        </Link>
        <h1 className="font-headline-lg text-headline-lg text-on-surface mb-8">Builds vergelijken</h1>

        {/* Kop met de twee builds */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3">
          {[a, b].map((build, i) => (
            <div
              key={build.publicId}
              className={`rounded-xl border p-4 sm:p-5 ${cheaper === i ? "border-primary bg-primary/[0.04]" : "border-outline-variant bg-surface-container-lowest"}`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h2 className="font-title-md text-title-md text-on-surface leading-tight">{build.name}</h2>
                <CompatBadge components={build.components} />
              </div>
              <p className="font-display-lg text-[26px] leading-none text-primary mb-1">
                {formatEur(totals[i])}
              </p>
              {cheaper === i && (
                <p className="font-label-technical text-[11px] text-success-emerald">
                  {formatEur(Math.abs(totals[0] - totals[1]))} goedkoper
                </p>
              )}
              <button
                onClick={() => loadIntoBuilder(build.components)}
                className="mt-3 w-full py-2 border border-outline-variant rounded-lg font-label-technical text-label-technical text-on-surface hover:border-primary hover:text-primary flex items-center justify-center gap-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" /> Laad in builder
              </button>
            </div>
          ))}
        </div>

        {/* Per-slot vergelijking */}
        <div className="rounded-xl border border-outline-variant overflow-hidden">
          {COMPONENT_TYPES.map((type, idx) => {
            const pa = a.components[type];
            const pb = b.components[type];
            if (!pa && !pb) return null;
            const cells = [pa, pb] as const;
            const prices = [pa?.priceEur, pb?.priceEur];
            const cheaperSide =
              pa && pb && prices[0] !== prices[1] ? (prices[0]! < prices[1]! ? 0 : 1) : -1;
            return (
              <div
                key={type}
                className={`grid grid-cols-[84px_1fr_1fr] sm:grid-cols-[140px_1fr_1fr] ${idx % 2 ? "bg-surface-container-low/40" : ""}`}
              >
                <div className="px-3 py-3 flex items-center font-label-technical text-[11px] uppercase tracking-wider text-on-surface-variant border-r border-outline-variant">
                  {COMPONENT_META[type].shortLabel}
                </div>
                {cells.map((part, side) => (
                  <div
                    key={side}
                    className={`px-3 py-3 min-w-0 ${side === 0 ? "border-r border-outline-variant" : ""}`}
                  >
                    {part ? (
                      <div className="min-w-0">
                        <p className="font-body-sm text-[13px] text-on-surface leading-tight line-clamp-2">{part.name}</p>
                        <p className={`font-label-technical text-[12px] mt-0.5 ${cheaperSide === side ? "text-success-emerald" : "text-on-surface-variant"}`}>
                          {formatEur(part.priceEur)}
                          {cheaperSide === side && " ↓"}
                        </p>
                      </div>
                    ) : (
                      <p className="font-body-sm text-[12px] text-outline italic">ontbreekt</p>
                    )}
                  </div>
                ))}
              </div>
            );
          })}

          {/* Totaalrij */}
          <div className="grid grid-cols-[84px_1fr_1fr] sm:grid-cols-[140px_1fr_1fr] border-t border-outline-variant bg-surface-container">
            <div className="px-3 py-3 font-label-technical text-[11px] uppercase tracking-wider text-on-surface border-r border-outline-variant">
              Totaal
            </div>
            {totals.map((t, side) => (
              <div key={side} className={`px-3 py-3 ${side === 0 ? "border-r border-outline-variant" : ""}`}>
                <span className={`font-label-price text-[16px] ${cheaper === side ? "text-success-emerald" : "text-on-surface"}`}>
                  {formatEur(t)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
