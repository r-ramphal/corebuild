"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Sparkles, Bell } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import type { BuildComponents } from "@/lib/store/build";
import { COMPONENT_TYPES } from "@/lib/categories";
import { useBuildPricing, type BuildPricingPart } from "@/lib/use-build-pricing";
import { BuildPricingResult } from "@/components/builder/BuildPricingResult";

export function BuildCheckout({ components }: { components: BuildComponents }) {
  const { data, loading, error, run } = useBuildPricing();
  const { data: session } = useSession();

  // Alleen échte (niet-demo) aanbiedingen met een link kunnen we live prijzen.
  const parts = useMemo<BuildPricingPart[]>(
    () =>
      COMPONENT_TYPES.filter((t) => components[t]).map((t) => {
        const c = components[t]!;
        return { slot: t, name: c.name, url: c.url, retailer: c.retailer, priceEur: c.priceEur, mock: c.mock };
      }),
    [components]
  );
  const realParts = parts.filter((p) => p.url && !p.mock);

  return (
    <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 px-5 sm:px-6 py-3.5 border-b border-outline-variant bg-gradient-to-r from-primary/[0.05] to-transparent">
        <span className="inline-flex items-center gap-1.5 font-label-technical text-label-technical uppercase tracking-wider text-on-surface">
          <Sparkles className="w-4 h-4 text-primary" /> Slim kopen
        </span>
        <span className="font-body-sm text-[12px] text-on-surface-variant">
          Slimste verdeling over winkels en het prijsverloop van je build
        </span>
      </div>

      <div className="p-5 sm:p-6">
        {realParts.length === 0 ? (
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Voeg onderdelen met een live aanbieding toe, dan berekenen we de goedkoopste manier om deze
            build te kopen en het prijsverloop.
          </p>
        ) : !data ? (
          <div className="flex flex-col items-start gap-3">
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              We vergelijken de prijzen van je {realParts.length} onderdelen over alle winkels en zoeken de
              voordeligste verdeling, plus of dit een goed moment is om te kopen.
            </p>
            <button
              onClick={() => run(realParts)}
              disabled={loading}
              className="px-4 py-2.5 rounded-lg bg-primary text-on-primary font-label-technical text-label-technical hover:opacity-90 transition-opacity inline-flex items-center gap-2 disabled:opacity-60"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? "Berekenen..." : "Bereken de slimste manier om te kopen"}
            </button>
            {error && (
              <p className="font-label-technical text-label-technical text-error-crimson">
                Kon de prijzen even niet ophalen. Probeer het zo nog eens.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <BuildPricingResult data={data} />

            {/* CTA naar de hele-build prijsalert */}
            <div className="rounded-lg border border-outline-variant bg-surface-container-low/40 p-3.5 flex flex-wrap items-center gap-2">
              <Bell className="w-4 h-4 text-primary shrink-0" />
              {session ? (
                <span className="font-body-sm text-[12px] text-on-surface-variant">
                  Wil je een seintje als deze build goedkoper wordt? Bewaar &lsquo;m en zet een prijsalert op{" "}
                  <Link href="/builds" className="text-primary hover:underline">Mijn builds</Link>.
                </span>
              ) : (
                <span className="font-body-sm text-[12px] text-on-surface-variant">
                  <Link href="/inloggen" className="text-primary hover:underline">Log in</Link> om een prijsalert
                  op deze build te zetten en een mail te krijgen bij een prijsdaling.
                </span>
              )}
            </div>

            <button
              onClick={() => run(realParts)}
              disabled={loading}
              className="font-label-technical text-label-technical text-primary hover:underline disabled:opacity-60"
            >
              {loading ? "Berekenen..." : "Opnieuw berekenen"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
