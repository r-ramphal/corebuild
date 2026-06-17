"use client";

import { Sparkles } from "lucide-react";
import { useBuildPricing, type BuildPricingPart } from "@/lib/use-build-pricing";
import { BuildPricingResult } from "@/components/builder/BuildPricingResult";
import type { ExampleBuildPart } from "@/lib/example-builds";

/**
 * "Slim Kopen" voor een curated voorbeeldbuild: op verzoek matcht de DB de
 * onderdeelnamen op echte aanbiedingen en tonen we de slimste verdeling over
 * winkels + het prijsverloop. On-demand (knop) zodat de pagina statisch blijft.
 */
export function ExampleBuildBuy({ parts }: { parts: ExampleBuildPart[] }) {
  const { data, loading, error, run } = useBuildPricing();
  const payload: BuildPricingPart[] = parts.map((p) => ({ slot: p.type, name: p.name }));

  return (
    <div className="border-t border-gp-line mt-6 pt-5">
      {!data ? (
        <div className="flex flex-col items-start gap-2">
          <button
            onClick={() => run(payload)}
            disabled={loading}
            className="font-plex text-[12px] uppercase tracking-wider text-gp-orange hover:text-gp-orange-dark inline-flex items-center gap-2 transition-colors disabled:opacity-60"
          >
            <Sparkles className="w-4 h-4" />
            {loading ? "Berekenen..." : "Slimste manier om te kopen"}
          </button>
          <p className="font-plex text-[11px] text-gp-ink-soft">
            We zoeken de goedkoopste verdeling over winkels op basis van de actuele prijzen.
          </p>
          {error && (
            <p className="font-plex text-[12px] text-error-crimson">
              Kon de prijzen even niet ophalen. Probeer het zo nog eens.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <BuildPricingResult data={data} />
          <button
            onClick={() => run(payload)}
            disabled={loading}
            className="font-plex text-[12px] uppercase tracking-wider text-gp-orange hover:text-gp-orange-dark transition-colors disabled:opacity-60"
          >
            {loading ? "Berekenen..." : "Opnieuw berekenen"}
          </button>
        </div>
      )}
    </div>
  );
}
