"use client";

import { useState } from "react";
import { Info, GraduationCap, Check, ChevronDown } from "lucide-react";
import { describeProduct } from "@/lib/specs/describe";
import type { ComponentType } from "@/lib/types";

export function ProductDescription({
  name,
  category,
  retailerInfo,
}: {
  name: string;
  category: ComponentType;
  retailerInfo?: { description: string; source?: string } | null;
}) {
  const [showLearn, setShowLearn] = useState(false);
  const desc = describeProduct(name, category);

  return (
    <section className="mb-12 bg-surface-container-lowest border border-outline-variant rounded-xl p-5 sm:p-6">
      <h2 className="font-title-md text-title-md text-on-surface mb-3">Over dit product</h2>
      <p className="font-body-lg text-body-lg text-on-surface-variant mb-5">{desc.summary}</p>

      {retailerInfo && (
        <div className="mb-5 pl-4 border-l-2 border-primary/40">
          <p className="font-label-technical text-label-technical uppercase tracking-wider text-on-surface-variant mb-1.5">
            Productinformatie{retailerInfo.source ? ` via ${retailerInfo.source}` : ""}
          </p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">{retailerInfo.description}</p>
        </div>
      )}

      {desc.specs.length > 0 && (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5 mb-5">
          {desc.specs.map((s) => (
            <div key={s.label} className="flex justify-between gap-4 border-b border-outline-variant/60 pb-2">
              <dt className="font-body-sm text-body-sm text-on-surface-variant">{s.label}</dt>
              <dd className="font-body-sm text-body-sm text-on-surface font-medium text-right">{s.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {desc.goodFor.length > 0 && (
        <div className="mb-5">
          <p className="font-label-technical text-label-technical uppercase tracking-wider text-on-surface-variant mb-2">
            Goed voor
          </p>
          <div className="flex flex-wrap gap-2">
            {desc.goodFor.map((g) => (
              <span
                key={g}
                className="inline-flex items-center gap-1.5 font-body-sm text-[13px] bg-success-emerald/10 text-success-emerald px-2.5 py-1 rounded-full"
              >
                <Check className="w-3.5 h-3.5" /> {g}
              </span>
            ))}
          </div>
        </div>
      )}

      {desc.note && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-surface-container-low mb-2">
          <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p className="font-body-sm text-[13px] text-on-surface-variant">{desc.note}</p>
        </div>
      )}

      {desc.learn.length > 0 && (
        <div className="mt-4 border-t border-outline-variant pt-4">
          <button
            onClick={() => setShowLearn((s) => !s)}
            aria-expanded={showLearn}
            className="flex items-center justify-between w-full text-left group"
          >
            <span className="flex items-center gap-2 font-title-md text-[14px] text-on-surface">
              <GraduationCap className="w-4 h-4 text-primary" /> Uitleg voor wie nog leert
            </span>
            <ChevronDown className={`w-4 h-4 text-on-surface-variant transition-transform ${showLearn ? "rotate-180" : ""}`} />
          </button>
          {showLearn && (
            <dl className="mt-3 space-y-3">
              {desc.learn.map((l) => (
                <div key={l.term}>
                  <dt className="font-title-md text-[13px] text-on-surface">{l.term}</dt>
                  <dd className="font-body-sm text-[13px] text-on-surface-variant mt-0.5">{l.explain}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}
    </section>
  );
}
