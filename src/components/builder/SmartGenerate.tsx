"use client";

import { useState } from "react";
import {
  WandSparkles, Gamepad2, Clapperboard, Briefcase, LoaderCircle, CircleAlert, RotateCw,
} from "lucide-react";
import { useBuildStore } from "@/lib/store/build";
import { formatEur } from "@/lib/format";
import type { UseCase, Resolution, GenerateResult } from "@/lib/specs/generate";

const USE_CASES: { id: UseCase; label: string; icon: React.ComponentType<{ className?: string }>; desc: string }[] = [
  { id: "gaming", label: "Gamen", icon: Gamepad2, desc: "Hoge FPS in games" },
  { id: "creator", label: "Creator", icon: Clapperboard, desc: "Streamen, editen, renderen" },
  { id: "office", label: "Werk & thuis", icon: Briefcase, desc: "Kantoor, browsen, media" },
];

const RESOLUTIONS: { id: Resolution; label: string }[] = [
  { id: "1080p", label: "1080p" },
  { id: "1440p", label: "1440p" },
  { id: "4k", label: "4K" },
];

const TEMPLATES: { label: string; use: UseCase; res: Resolution; budget: number }[] = [
  { label: "Budget 1080p", use: "gaming", res: "1080p", budget: 800 },
  { label: "1440p gaming", use: "gaming", res: "1440p", budget: 1500 },
  { label: "4K gaming", use: "gaming", res: "4k", budget: 2500 },
  { label: "Creator", use: "creator", res: "1440p", budget: 2000 },
  { label: "Werk & thuis", use: "office", res: "1080p", budget: 700 },
];

export function SmartGenerate() {
  const { loadComponents } = useBuildStore();
  const [useCase, setUseCase] = useState<UseCase>("gaming");
  const [resolution, setResolution] = useState<Resolution>("1440p");
  const [budget, setBudget] = useState(1500);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate(u: UseCase, r: Resolution, b: number) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/generate?budget=${b}&use=${u}&res=${r}`);
      if (!res.ok) throw new Error("status " + res.status);
      const data: GenerateResult = await res.json();
      if (Object.keys(data.components).length === 0) {
        setResult(null);
        setError("Geen passende onderdelen gevonden in de catalogus. Pas het budget of profiel aan.");
        return;
      }
      loadComponents(data.components);
      setResult(data);
    } catch {
      setResult(null);
      setError("Genereren mislukt. Probeer het zo opnieuw.");
    } finally {
      setLoading(false);
    }
  }

  function applyTemplate(t: (typeof TEMPLATES)[number]) {
    setUseCase(t.use);
    setResolution(t.res);
    setBudget(t.budget);
    void generate(t.use, t.res, t.budget);
  }

  return (
    <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 sm:px-6 py-3.5 border-b border-outline-variant bg-gradient-to-r from-primary/[0.06] to-transparent">
        <WandSparkles className="w-4 h-4 text-primary" />
        <h2 className="font-title-md text-title-md text-on-surface">Smart generate</h2>
        <span className="font-body-sm text-[12px] text-on-surface-variant hidden sm:inline">
          — laat ons een passende build voorstellen
        </span>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        {/* Snelstart-templates */}
        <div>
          <p className="font-label-technical text-label-technical uppercase tracking-wider text-on-surface-variant mb-2">
            Snelstart
          </p>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.label}
                onClick={() => applyTemplate(t)}
                disabled={loading}
                className="font-label-technical text-label-technical px-3 py-1.5 rounded-full bg-surface-container-high text-on-surface hover:bg-primary-container hover:text-on-primary transition-colors disabled:opacity-50"
              >
                {t.label} · {formatEur(t.budget)}
              </button>
            ))}
          </div>
        </div>

        {/* Gebruiksprofiel */}
        <div>
          <p className="font-label-technical text-label-technical uppercase tracking-wider text-on-surface-variant mb-2">
            Waarvoor gebruik je de pc?
          </p>
          <div className="grid grid-cols-3 gap-2">
            {USE_CASES.map((uc) => {
              const active = useCase === uc.id;
              const Icon = uc.icon;
              return (
                <button
                  key={uc.id}
                  onClick={() => setUseCase(uc.id)}
                  aria-pressed={active}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition-all ${
                    active
                      ? "border-primary bg-primary/[0.06] text-primary"
                      : "border-outline-variant text-on-surface-variant hover:border-primary/50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-title-md text-[13px]">{uc.label}</span>
                  <span className="font-body-sm text-[11px] text-on-surface-variant leading-tight hidden sm:block">{uc.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Resolutie (niet voor office) + budget */}
        <div className="grid sm:grid-cols-2 gap-5">
          <div className={useCase === "office" ? "opacity-40 pointer-events-none" : ""}>
            <p className="font-label-technical text-label-technical uppercase tracking-wider text-on-surface-variant mb-2">
              Resolutie
            </p>
            <div className="flex gap-2">
              {RESOLUTIONS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setResolution(r.id)}
                  aria-pressed={resolution === r.id}
                  className={`flex-1 py-2 rounded-lg border font-label-technical text-label-technical transition-all ${
                    resolution === r.id
                      ? "border-primary bg-primary/[0.06] text-primary"
                      : "border-outline-variant text-on-surface-variant hover:border-primary/50"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="font-label-technical text-label-technical uppercase tracking-wider text-on-surface-variant">
                Budget
              </span>
              <span className="font-title-md text-title-md text-on-surface">{formatEur(budget)}</span>
            </div>
            <input
              type="range"
              min={500}
              max={4000}
              step={50}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              aria-label="Budget"
              aria-valuetext={formatEur(budget)}
              className="w-full h-1 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between mt-1 font-label-technical text-[11px] text-on-surface-variant">
              <span>€500</span>
              <span>€4.000</span>
            </div>
          </div>
        </div>

        {/* Genereer-knop */}
        <button
          onClick={() => void generate(useCase, resolution, budget)}
          disabled={loading}
          className="w-full py-3 bg-primary text-on-primary font-bold font-label-technical text-label-technical rounded-lg hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading ? (
            <>
              <LoaderCircle className="w-4 h-4 animate-spin" /> Bezig met samenstellen…
            </>
          ) : result ? (
            <>
              <RotateCw className="w-4 h-4" /> Genereer opnieuw
            </>
          ) : (
            <>
              <WandSparkles className="w-4 h-4" /> Genereer mijn build
            </>
          )}
        </button>

        {error && (
          <p className="flex items-start gap-2 font-body-sm text-[13px] text-error-crimson">
            <CircleAlert className="w-4 h-4 flex-shrink-0 mt-0.5" /> {error}
          </p>
        )}

        {/* Resultaat-toelichting */}
        {result && (
          <div className="rounded-lg bg-surface-container-low p-4 space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="font-title-md text-[13px] text-on-surface">Voorstel geladen in de builder</span>
              <span className="font-label-price text-[18px] text-primary">{formatEur(result.total)}</span>
            </div>
            {result.overBudget && (
              <p className="flex items-start gap-1.5 font-body-sm text-[12px] text-warning-amber">
                <CircleAlert className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                Net boven het budget — de catalogus had niets goedkopers dat past.
              </p>
            )}
            <ul className="space-y-1">
              {result.notes.map((n, i) => (
                <li key={i} className="font-body-sm text-[12px] text-on-surface-variant">· {n}</li>
              ))}
            </ul>
            <p className="font-body-sm text-[11px] text-on-surface-variant pt-1">
              Indicatief voorstel — pas gerust elk onderdeel hieronder aan.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
