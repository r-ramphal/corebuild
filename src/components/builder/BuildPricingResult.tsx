"use client";

import { useState } from "react";
import { Store, Split, Truck, ExternalLink, Info, TrendingDown, Copy, Check } from "lucide-react";
import { COMPONENT_META } from "@/lib/categories";
import { RetailerLogo } from "@/components/RetailerLogo";
import { PriceHistoryChart } from "@/components/PriceHistoryChart";
import { formatEur } from "@/lib/format";
import type { BuildPricing } from "@/lib/use-build-pricing";
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

/**
 * Presentatie van een "Slim Kopen"-resultaat: de build-prijsindex + de slimste
 * verdeling over winkels. Herbruikt door de builder (BuildCheckout) en de
 * voorbeeldbuilds. Bevat geen knoppen/sessie-logica — puur de uitkomst van `data`.
 */
export function BuildPricingResult({ data }: { data: BuildPricing }) {
  const split = data.split;
  const index = data.index;

  const recommended = split
    ? split.bestStrategy === "single" && split.singleStore
      ? { total: split.singleStore.totalCents }
      : { total: split.split.totalCents }
    : null;
  const otherTotal =
    split && split.singleStore
      ? split.bestStrategy === "single"
        ? split.split.totalCents
        : split.singleStore.totalCents
      : null;
  const savingCents = recommended && otherTotal != null ? otherTotal - recommended.total : null;

  return (
    <>
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
                split.bestStrategy === "single" ? "border-primary bg-primary/[0.04]" : "border-outline-variant"
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
                  Geen enkele winkel voert al deze onderdelen.
                </p>
              )}
            </div>

            {/* Slim verdeeld */}
            <div
              className={`rounded-xl border p-4 ${
                split.bestStrategy === "split" ? "border-primary bg-primary/[0.04]" : "border-outline-variant"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="flex items-center gap-2 font-label-technical text-[11px] uppercase tracking-wider text-on-surface-variant">
                  <Split className="w-3.5 h-3.5" /> Slim verdeeld
                </span>
                {savingCents != null && savingCents > 0 && (
                  <span className="font-label-technical text-[10px] px-2 py-0.5 rounded-full bg-success-emerald/10 text-success-emerald">
                    bespaar {eur(savingCents)}
                  </span>
                )}
              </div>
              <p className="font-display-lg text-[24px] leading-none text-on-surface">
                {eur(split.split.totalCents)}
                {split.covered < split.partsTotal && (
                  <span className="font-body-sm text-[12px] font-normal text-on-surface-variant">
                    {" "}
                    voor {split.covered}/{split.partsTotal} onderdelen
                  </span>
                )}
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
                    <span className="font-medium text-on-surface">{eur(g.subtotalCents + g.shippingCents)}</span>
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
          Nog geen live aanbiedingen gevonden voor deze onderdelen. Probeer het later opnieuw, de catalogus
          ververst elke paar uur.
        </p>
      )}
    </>
  );
}
