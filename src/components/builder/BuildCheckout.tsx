"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Sparkles, Store, Split, Truck, ExternalLink, Info, TrendingDown, Copy, Check, Bell,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import type { BuildComponents } from "@/lib/store/build";
import { COMPONENT_META, COMPONENT_TYPES } from "@/lib/categories";
import { RetailerLogo } from "@/components/RetailerLogo";
import { PriceHistoryChart } from "@/components/PriceHistoryChart";
import { formatEur } from "@/lib/format";
import { useBuildPricing, type BuildPricingPart } from "@/lib/use-build-pricing";
import type { ComponentType } from "@/lib/types";
import type { BuildIndexSummary, BuildIndexSignal } from "@/lib/specs/build-index";

const eur = (cents: number) => formatEur(cents / 100);

function indexMessage(s: BuildIndexSummary): { text: string; tone: string } {
  const pct = Math.round(s.pctAboveLow);
  const map: Record<BuildIndexSignal, { text: string; tone: string }> = {
    low: { text: "Deze build staat nu op het laagste punt in deze periode. Goed moment om te kopen.", tone: "text-success-emerald" },
    near: { text: `Bijna op het laagste punt: ${pct}% boven de laagste prijs tot nu toe.`, tone: "text-success-emerald" },
    falling: { text: "De prijs daalt nog. Even wachten of een prijsalert zetten kan lonen.", tone: "text-on-surface" },
    neutral: { text: "De prijs schommelt. De slimme verdeling hieronder levert nu het meeste op.", tone: "text-on-surface" },
  };
  return map[s.signal];
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          /* clipboard niet beschikbaar (geen https) — stil falen */
        }
      }}
      className="font-label-technical text-[10px] text-on-surface-variant hover:text-primary inline-flex items-center gap-1 shrink-0"
    >
      {copied ? <Check className="w-3 h-3 text-success-emerald" /> : <Copy className="w-3 h-3" />}
      {copied ? "Gekopieerd" : "Kopieer lijstje"}
    </button>
  );
}

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

  const split = data?.split ?? null;
  const index = data?.index ?? null;

  const recommended = split
    ? split.bestStrategy === "single" && split.singleStore
      ? { label: "Alles bij één winkel", total: split.singleStore.totalCents }
      : { label: "Slim verdeeld", total: split.split.totalCents }
    : null;
  const otherTotal =
    split && split.singleStore
      ? split.bestStrategy === "single"
        ? split.split.totalCents
        : split.singleStore.totalCents
      : null;
  const savingCents = recommended && otherTotal != null ? otherTotal - recommended.total : null;

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
            {/* ── Build-prijsindex ── */}
            {index?.summary && index.points.length >= 2 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-primary" />
                  <span className="font-label-technical text-label-technical uppercase tracking-wider text-on-surface">
                    Prijsverloop van deze build
                  </span>
                </div>
                <p className={`font-title-md text-[15px] leading-snug ${indexMessage(index.summary).tone}`}>
                  {indexMessage(index.summary).text}
                </p>
                <div className="flex flex-wrap gap-x-5 gap-y-1 font-body-sm text-[12px] text-on-surface-variant">
                  <span>Nu <span className="font-medium text-on-surface">{eur(index.summary.currentCents)}</span></span>
                  <span>Laagste <span className="font-medium text-on-surface">{eur(index.summary.minCents)}</span></span>
                  <span>Hoogste <span className="font-medium text-on-surface">{eur(index.summary.maxCents)}</span></span>
                </div>
                <PriceHistoryChart
                  points={index.points.map((p) => ({ day: p.day, priceCents: p.totalCents }))}
                  caption="Laagste buildprijs per dag"
                />
                {index.partsTracked < index.partsTotal && (
                  <p className="font-label-technical text-[10px] text-on-surface-variant">
                    Gebaseerd op {index.partsTracked} van {index.partsTotal} onderdelen met prijshistorie.
                    Indicatief, schommelt met de dagprijzen.
                  </p>
                )}
              </div>
            )}

            {/* ── Slimste verdeling (split-cart) ── */}
            {split && split.covered > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Split className="w-4 h-4 text-primary" />
                  <span className="font-label-technical text-label-technical uppercase tracking-wider text-on-surface">
                    Slimste manier om te kopen
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Eén winkel */}
                  <div
                    className={`rounded-xl border p-4 ${
                      split.bestStrategy === "single"
                        ? "border-primary bg-primary/[0.04]"
                        : "border-outline-variant"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5 font-label-technical text-[11px] uppercase tracking-wider text-on-surface-variant">
                      <Store className="w-3.5 h-3.5" /> Alles bij één winkel
                    </div>
                    {split.singleStore ? (
                      <>
                        <p className="font-display-lg text-[24px] leading-none text-on-surface">
                          {eur(split.singleStore.totalCents)}
                        </p>
                        <p className="font-body-sm text-[12px] text-on-surface-variant mt-1.5">
                          bij <RetailerLogo retailer={split.singleStore.retailer} size="sm" />
                          {split.singleStore.shippingCents > 0
                            ? ` incl. ${eur(split.singleStore.shippingCents)} verzending`
                            : " gratis verzending"}
                        </p>
                      </>
                    ) : (
                      <p className="font-body-sm text-[13px] text-on-surface-variant">
                        Geen enkele winkel voert al je gekozen onderdelen.
                      </p>
                    )}
                  </div>

                  {/* Slim verdeeld */}
                  <div
                    className={`rounded-xl border p-4 ${
                      split.bestStrategy === "split"
                        ? "border-primary bg-primary/[0.04]"
                        : "border-outline-variant"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="flex items-center gap-2 font-label-technical text-[11px] uppercase tracking-wider text-on-surface-variant">
                        <Split className="w-3.5 h-3.5" /> Slim verdeeld
                      </span>
                      {recommended && savingCents != null && savingCents > 0 && (
                        <span className="font-label-technical text-[10px] px-2 py-0.5 rounded-full bg-success-emerald/10 text-success-emerald">
                          bespaar {eur(savingCents)}
                        </span>
                      )}
                    </div>
                    <p className="font-display-lg text-[24px] leading-none text-on-surface">
                      {eur(split.split.totalCents)}
                    </p>
                    <p className="font-body-sm text-[12px] text-on-surface-variant mt-1.5">
                      over {split.split.groups.length} winkels
                      {split.split.shippingCents > 0
                        ? ` incl. ${eur(split.split.shippingCents)} verzending`
                        : " gratis verzending"}
                    </p>
                  </div>
                </div>

                {/* Verdeling per winkel */}
                <div className="space-y-3">
                  {split.split.groups.map((g) => (
                    <div key={g.retailer} className="rounded-lg border border-outline-variant overflow-hidden">
                      <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 bg-surface-container-low/60 border-b border-outline-variant">
                        <RetailerLogo retailer={g.retailer} size="sm" />
                        <CopyButton
                          text={g.items
                            .map((i) => `${COMPONENT_META[i.slot as ComponentType].shortLabel}: ${i.url}`)
                            .join("\n")}
                        />
                      </div>
                      <ul className="divide-y divide-outline-variant/60">
                        {g.items.map((i) => (
                          <li key={i.slot} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                            <a
                              href={i.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="min-w-0 group inline-flex items-center gap-1.5"
                            >
                              <span className="font-label-technical text-[10px] uppercase tracking-wider text-on-surface-variant shrink-0">
                                {COMPONENT_META[i.slot as ComponentType].shortLabel}
                              </span>
                              <ExternalLink className="w-3 h-3 text-on-surface-variant group-hover:text-primary transition-colors shrink-0" />
                            </a>
                            <span className="font-label-technical text-label-technical text-on-surface shrink-0">
                              {eur(i.priceCents)}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex items-center justify-between gap-2 px-3.5 py-2 text-[12px] font-body-sm text-on-surface-variant border-t border-outline-variant/60">
                        <span className="inline-flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5" />
                          {g.shippingCents > 0 ? `${eur(g.shippingCents)} verzending` : "Gratis verzending"}
                        </span>
                        <span>
                          subtotaal{" "}
                          <span className="font-medium text-on-surface">
                            {eur(g.subtotalCents + g.shippingCents)}
                          </span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {split.uncovered.length > 0 && (
                  <p className="font-label-technical text-[10px] text-on-surface-variant">
                    Niet meegerekend (nog geen live prijs):{" "}
                    {split.uncovered.map((s) => COMPONENT_META[s as ComponentType].shortLabel).join(", ")}.
                  </p>
                )}
                <p className="flex items-start gap-1.5 font-label-technical text-[10px] text-on-surface-variant">
                  <Info className="w-3 h-3 mt-px shrink-0" /> {data.shippingNote} Prijzen zijn indicatief en
                  schommelen met de dagprijzen.
                </p>
              </div>
            ) : (
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Nog geen live aanbiedingen gevonden voor deze onderdelen. Probeer het later opnieuw, de
                catalogus ververst elke paar uur.
              </p>
            )}

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
