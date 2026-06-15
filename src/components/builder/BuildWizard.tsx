"use client";

import { useState, useEffect } from "react";
import { X, ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { useBuildStore } from "@/lib/store/build";
import { COMPONENT_META } from "@/lib/categories";
import { CATEGORY_ICONS as ICONS } from "@/lib/category-icons";
import { formatEur } from "@/lib/format";
import { detectSocket, detectDdr } from "@/lib/specs/detect";
import { SlotPicker } from "@/components/builder/SlotPicker";
import type { ComponentType } from "@/lib/types";

/**
 * Begeleide builder-wizard: loopt de onderdelen in logische bouwvolgorde langs,
 * legt per stap uit waarom het onderdeel telt, opent de inline picker en toont
 * compatibiliteitshints op basis van wat al gekozen is. Leert de gebruiker
 * spelenderwijs hoe de builder werkt en levert tegelijk een complete build op.
 */

const ORDER: ComponentType[] = [
  "cpu",
  "motherboard",
  "ram",
  "gpu",
  "storage",
  "psu",
  "case",
  "cooling",
];

const WHY: Record<string, string> = {
  cpu: "De processor is het rekenhart van je pc. Je keuze hier bepaalt de socket en het geheugentype van de rest van de build, dus we beginnen ermee.",
  motherboard:
    "Het moederbord verbindt alles. Het moet dezelfde socket hebben als je CPU en het juiste geheugentype ondersteunen.",
  ram: "Werkgeheugen (RAM) houdt actieve programma's snel bereikbaar. Let op de generatie (DDR4 of DDR5) die bij je platform past.",
  gpu: "De videokaart rendert games en beeld. Dit is meestal het duurste onderdeel en bepaalt grotendeels je prestaties en stroomverbruik.",
  storage:
    "Opslag (een SSD) bewaart je systeem, games en bestanden. Een NVMe-SSD is snel en tegenwoordig de standaard.",
  psu: "De voeding levert stroom aan alles. Kies genoeg wattage met wat marge; je videokaart bepaalt grotendeels hoeveel je nodig hebt.",
  case: "De behuizing huisvest alles. Let op dat het formaat van je moederbord en de lengte van je videokaart erin passen.",
  cooling:
    "Koeling houdt je CPU op temperatuur. Niet elke processor heeft een losse koeler nodig; sommige worden met een boxed koeler geleverd.",
};

export function BuildWizard({ onClose }: { onClose: () => void }) {
  const components = useBuildStore((s) => s.components);
  const [step, setStep] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !pickerOpen) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, pickerOpen]);

  const type = ORDER[step];
  const meta = COMPONENT_META[type];
  const Icon = ICONS[type];
  const chosen = components[type];
  const isLast = step === ORDER.length - 1;
  const filledCount = ORDER.filter((t) => components[t]).length;

  // Compatibiliteitshint op basis van eerdere keuzes
  const cpu = components.cpu;
  const mobo = components.motherboard;
  let hint: string | null = null;
  if (type === "motherboard" && cpu) {
    const s = detectSocket(cpu.name);
    if (s) hint = `Je CPU gebruikt socket ${s} — kies een moederbord met dezelfde socket.`;
  } else if (type === "ram") {
    const ddr = (mobo && detectDdr(mobo.name)) || (cpu && detectDdr(cpu.name));
    if (ddr) hint = `Je platform werkt met ${ddr} — kies geheugen van dezelfde generatie.`;
  } else if (type === "cooling" && cpu) {
    const s = detectSocket(cpu.name);
    if (s) hint = `Kies een koeler die socket ${s} ondersteunt (of gebruik de meegeleverde boxed koeler).`;
  }

  return (
    <div
      data-lenis-prevent=""
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center sm:p-4"
    >
      <button aria-label="Sluiten" onClick={onClose} className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Begeleid samenstellen"
        className="relative w-full sm:max-w-xl bg-surface border border-outline-variant rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[92vh]"
      >
        {/* Header + voortgang */}
        <div className="p-4 border-b border-outline-variant">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="font-title-md text-title-md text-on-surface">Begeleid samenstellen</h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Sluiten"
              className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            {ORDER.map((t, i) => (
              <div
                key={t}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i < step ? "bg-primary" : i === step ? "bg-primary/60" : "bg-surface-container-high"
                }`}
              />
            ))}
          </div>
          <p className="font-label-technical text-[11px] text-on-surface-variant mt-2">
            Stap {step + 1} van {ORDER.length} · {filledCount} onderdelen gekozen
          </p>
        </div>

        {/* Inhoud */}
        <div className="p-6 overflow-y-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-label-technical text-[11px] uppercase tracking-wider text-on-surface-variant">
                {meta.shortLabel}
              </p>
              <h3 className="font-title-md text-title-md text-on-surface">{meta.label} kiezen</h3>
            </div>
          </div>

          <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">{WHY[type]}</p>

          {hint && (
            <div className="rounded-lg border border-primary/30 bg-primary-container/10 px-3 py-2 mb-4">
              <p className="font-label-technical text-[12px] text-on-surface">{hint}</p>
            </div>
          )}

          {/* Huidige keuze */}
          {chosen ? (
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-success-emerald/50 bg-success-emerald/5 mb-2">
              <div className="min-w-0">
                <p className="font-body-sm text-[13px] text-on-surface truncate">{chosen.name}</p>
                <p className="font-label-technical text-[11px] text-success-emerald inline-flex items-center gap-1">
                  <Check className="w-3 h-3" /> gekozen · {formatEur(chosen.priceEur)}
                </p>
              </div>
              <button
                onClick={() => setPickerOpen(true)}
                className="px-3 py-1.5 rounded-lg border border-outline-variant font-label-technical text-label-technical text-on-surface-variant hover:border-primary hover:text-primary transition-colors shrink-0"
              >
                Wijzig
              </button>
            </div>
          ) : (
            <button
              onClick={() => setPickerOpen(true)}
              className="w-full py-3 rounded-xl bg-primary text-on-primary font-label-technical text-label-technical hover:opacity-90 transition-opacity"
            >
              Kies een {meta.label.toLowerCase()}
            </button>
          )}
        </div>

        {/* Navigatie */}
        <div className="p-4 border-t border-outline-variant flex items-center justify-between gap-3">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="px-4 py-2 rounded-lg font-label-technical text-label-technical text-on-surface-variant hover:text-primary disabled:opacity-40 inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Vorige
          </button>

          {isLast ? (
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg bg-primary text-on-primary font-label-technical text-label-technical hover:opacity-90 inline-flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Klaar, bekijk mijn build
            </button>
          ) : (
            <button
              onClick={() => setStep((s) => Math.min(ORDER.length - 1, s + 1))}
              className="px-5 py-2.5 rounded-lg bg-primary text-on-primary font-label-technical text-label-technical hover:opacity-90 inline-flex items-center gap-1.5"
            >
              {chosen ? "Volgende" : "Overslaan"} <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {pickerOpen && <SlotPicker type={type} onClose={() => setPickerOpen(false)} />}
    </div>
  );
}
