"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Gauge, Activity, Gamepad2, Zap, Info, Check, TriangleAlert,
  CircleAlert, CircleCheck, MonitorPlay, Sparkles, TrendingUp,
} from "lucide-react";
import type { BuildComponents } from "@/lib/store/build";
import { analyzeBuild } from "@/lib/specs/build-analysis";
import {
  estimateAllGames, analyzeBottleneck, recommendHz,
  RESOLUTIONS, PRESETS, type Resolution, type Preset,
  type CheckStatus, type GameFps,
} from "@/lib/specs/performance";

/* ─── Score-gauge (SVG-ring) ─────────────────────────────────────────── */

const TONE_COLOR: Record<"outline" | "primary" | "emerald", string> = {
  outline: "var(--cb-outline)",
  primary: "var(--cb-primary)",
  emerald: "var(--cb-success-emerald)",
};

function ScoreGauge({ score, tone }: { score: number; tone: "outline" | "primary" | "emerald" }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  return (
    <div className="relative w-[132px] h-[132px] flex-shrink-0">
      <svg viewBox="0 0 132 132" className="w-full h-full -rotate-90">
        <circle cx="66" cy="66" r={r} fill="none" stroke="var(--cb-surface-container-high)" strokeWidth="10" />
        <circle
          cx="66" cy="66" r={r} fill="none"
          stroke={TONE_COLOR[tone]} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          className="cb-gauge-ring"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display-lg text-display-lg leading-none text-on-surface">{score}</span>
        <span className="font-label-technical text-[10px] uppercase tracking-wider text-on-surface-variant mt-1">
          / 100
        </span>
      </div>
    </div>
  );
}

/* ─── Segmented control ──────────────────────────────────────────────── */

function Segmented<T extends string>({
  options, value, onChange, ariaLabel,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  return (
    <div role="group" aria-label={ariaLabel} className="flex bg-surface-container-high p-1 rounded-lg gap-1">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          aria-pressed={value === o.id}
          className={`flex-1 px-2.5 py-1.5 rounded font-label-technical text-label-technical transition-all ${
            value === o.id
              ? "bg-surface-container-lowest shadow-sm text-primary"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ─── FPS-balk per game ──────────────────────────────────────────────── */

const LIMIT_COLOR = {
  gpu: { bar: "bg-primary", tag: "text-primary", label: "GPU-limiet" },
  cpu: { bar: "bg-warning-amber", tag: "text-warning-amber", label: "CPU-limiet" },
  balanced: { bar: "bg-success-emerald", tag: "text-success-emerald", label: "in balans" },
} as const;

function FpsRow({ game, maxFps }: { game: GameFps; maxFps: number }) {
  const { fps, limitedBy } = game.estimate;
  const c = LIMIT_COLOR[limitedBy];
  const width = Math.max(4, Math.round((fps / maxFps) * 100));
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-title-md text-[15px] text-on-surface truncate">{game.label}</span>
          <span className="font-body-sm text-[11px] text-on-surface-variant truncate hidden sm:inline">
            {game.examples}
          </span>
        </div>
        <div className="flex items-baseline gap-1.5 flex-shrink-0">
          <span className="font-display-lg text-[22px] leading-none text-on-surface tabular-nums">{fps}</span>
          <span className="font-label-technical text-[11px] text-on-surface-variant">fps</span>
        </div>
      </div>
      <div className="h-2.5 w-full bg-surface-container rounded-full overflow-hidden">
        <div className={`cb-bar-fill h-full rounded-full ${c.bar}`} style={{ width: `${width}%` }} />
      </div>
      <span className={`font-label-technical text-[10px] uppercase tracking-wider ${c.tag}`}>{c.label}</span>
    </div>
  );
}

/* ─── Bottleneck-balansbalk ──────────────────────────────────────────── */

const TONE_BADGE = {
  good: "bg-success-emerald/10 text-success-emerald",
  warn: "bg-warning-amber/10 text-warning-amber",
  bad: "bg-error-crimson/10 text-error-crimson",
} as const;

/* ─── Compatibiliteitscheck-rij ──────────────────────────────────────── */

const CHECK_ICON: Record<CheckStatus, React.ReactNode> = {
  ok: <CircleCheck className="w-4 h-4 text-success-emerald flex-shrink-0" />,
  warn: <TriangleAlert className="w-4 h-4 text-warning-amber flex-shrink-0" />,
  bad: <CircleAlert className="w-4 h-4 text-error-crimson flex-shrink-0" />,
  info: <Info className="w-4 h-4 text-on-surface-variant flex-shrink-0" />,
};

/* ─── Hoofdpaneel ────────────────────────────────────────────────────── */

export function BuildIntelligence({ components }: { components: BuildComponents }) {
  const [res, setRes] = useState<Resolution>("1440p");
  const [preset, setPreset] = useState<Preset>("high");
  const [showMethod, setShowMethod] = useState(false);

  const analysis = useMemo(() => analyzeBuild(components), [components]);
  const { cpu, gpu, score, power, checks } = analysis;

  const games = useMemo(
    () => (gpu ? estimateAllGames(gpu, cpu, res, preset) : []),
    [gpu, cpu, res, preset]
  );
  const maxFps = useMemo(() => Math.max(60, ...games.map((g) => g.estimate.fps)), [games]);
  const bottleneck = cpu && gpu ? analyzeBottleneck(cpu, gpu, res) : null;
  // Monitor-advies op basis van de "populaire games" op de gekozen resolutie
  const balancedFps = games.find((g) => g.profile === "balanced")?.estimate.fps ?? 0;
  const hz = balancedFps > 0 ? recommendHz(balancedFps) : null;

  // USP: prijs-prestatie — fps per €100 van de totale build
  const totalPrice = Object.values(components).reduce((s, c) => s + (c?.priceEur ?? 0), 0);
  const fpsPer100 = balancedFps > 0 && totalPrice > 0 ? (balancedFps / totalPrice) * 100 : null;

  const hasGpuSlot = Boolean(components.gpu);
  const hasCpuSlot = Boolean(components.cpu);

  return (
    <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 bg-gradient-to-r from-primary/[0.07] to-transparent border-b border-outline-variant">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="font-title-md text-title-md text-on-surface leading-tight">Build-intelligentie</h2>
            <p className="font-label-technical text-[11px] text-on-surface-variant">
              FPS · bottleneck · monitor-advies
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowMethod((s) => !s)}
          aria-expanded={showMethod}
          className="flex items-center gap-1 font-label-technical text-[11px] text-on-surface-variant hover:text-primary transition-colors flex-shrink-0"
        >
          <Info className="w-3.5 h-3.5" /> Indicatie
        </button>
      </div>

      {showMethod && (
        <p className="px-5 sm:px-6 py-3 bg-surface-container-low font-body-sm text-[12px] text-on-surface-variant border-b border-outline-variant">
          Schattingen op basis van relatieve benchmark-indexen per model. We rekenen met{" "}
          <span className="font-medium text-on-surface">min(GPU-fps, CPU-fps)</span> per resolutie en game-zwaarte —
          de zwakste schakel bepaalt het resultaat. Werkelijke prestaties verschillen per game, driver en instelling.
        </p>
      )}

      {/* Empty state */}
      {!hasGpuSlot && !hasCpuSlot ? (
        <div className="px-6 py-10 text-center">
          <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-4">
            <Gauge className="w-7 h-7 text-outline" />
          </div>
          <p className="font-title-md text-title-md text-on-surface mb-1">Begin met een CPU en videokaart</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm mx-auto mb-5">
            Zodra je een processor en videokaart kiest, berekenen we de verwachte FPS, de bottleneck en welke
            monitor erbij past.
          </p>
          <div className="flex justify-center gap-2">
            <Link href="/categorie/cpu" className="px-4 py-2 border border-primary text-primary rounded-lg font-label-technical text-label-technical hover:bg-primary hover:text-white transition-all">
              Kies CPU
            </Link>
            <Link href="/categorie/gpu" className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-technical text-label-technical hover:opacity-90 transition-opacity">
              Kies videokaart
            </Link>
          </div>
        </div>
      ) : (
        <div className="p-5 sm:p-6 space-y-7">
          {/* Score + tier */}
          {score ? (
            <div className="flex items-center gap-5">
              <ScoreGauge score={score.score} tone={score.tone} />
              <div className="min-w-0">
                <span className={`inline-block font-label-technical text-label-technical px-2.5 py-1 rounded-full mb-2 ${
                  score.tone === "emerald" ? "bg-success-emerald/10 text-success-emerald"
                  : score.tone === "primary" ? "bg-primary/10 text-primary"
                  : "bg-surface-container text-on-surface-variant"
                }`}>
                  {score.tierLabel}
                </span>
                <p className="font-body-sm text-body-sm text-on-surface">{score.blurb}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-container-low">
              <Info className="w-5 h-5 text-on-surface-variant flex-shrink-0 mt-0.5" />
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {hasGpuSlot && !hasCpuSlot && "Voeg een CPU toe voor een volledige build-score en bottleneck-analyse."}
                {!hasGpuSlot && hasCpuSlot && "Voeg een videokaart toe voor FPS-schattingen en een build-score."}
                {hasGpuSlot && hasCpuSlot && !gpu && "We herkennen deze videokaart nog niet — FPS-schatting is beperkt."}
              </p>
            </div>
          )}

          {/* FPS-sectie */}
          {gpu && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4 text-primary" />
                  <span className="font-label-technical text-label-technical uppercase tracking-wider text-on-surface">
                    Verwachte FPS
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
                  <Segmented options={RESOLUTIONS.map((r) => ({ id: r.id, label: r.short }))} value={res} onChange={setRes} ariaLabel="Resolutie" />
                  <Segmented options={PRESETS} value={preset} onChange={setPreset} ariaLabel="Grafische instellingen" />
                </div>
              </div>
              <div className="space-y-3.5">
                {games.map((g) => (
                  <FpsRow key={g.profile} game={g} maxFps={maxFps} />
                ))}
              </div>
              {fpsPer100 !== null && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/[0.07] border border-secondary/20">
                  <TrendingUp className="w-4 h-4 text-secondary flex-shrink-0" />
                  <p className="font-body-sm text-[12px] text-on-surface">
                    Prijs-prestatie: <span className="font-bold text-secondary">~{fpsPer100.toFixed(1)} fps per €100</span>
                    <span className="text-on-surface-variant"> besteed ({RESOLUTIONS.find((r) => r.id === res)?.short}, populaire games)</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Bottleneck-balans */}
          {bottleneck && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  <span className="font-label-technical text-label-technical uppercase tracking-wider text-on-surface">
                    Balans op {RESOLUTIONS.find((r) => r.id === res)?.short}
                  </span>
                </div>
                <span className={`font-label-technical text-[11px] px-2 py-0.5 rounded-full ${TONE_BADGE[bottleneck.tone]}`}>
                  {bottleneck.severityPct > 0 ? `~${bottleneck.severityPct}% verlies` : "geen verlies"}
                </span>
              </div>
              <div className="relative h-2.5 rounded-full overflow-hidden bg-gradient-to-r from-warning-amber/50 via-success-emerald/50 to-primary/50">
                <div
                  className="cb-bar-fill absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-on-surface border-2 border-surface-container-lowest shadow"
                  style={{ left: `calc(${bottleneck.balancePos}% - 7px)` }}
                />
              </div>
              <div className="flex justify-between font-label-technical text-[10px] uppercase tracking-wider text-on-surface-variant">
                <span>CPU-limiet</span>
                <span>balans</span>
                <span>GPU-limiet</span>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-surface-container-low">
                {bottleneck.tone === "good"
                  ? <CircleCheck className="w-4 h-4 text-success-emerald flex-shrink-0 mt-0.5" />
                  : <TriangleAlert className={`w-4 h-4 flex-shrink-0 mt-0.5 ${bottleneck.tone === "bad" ? "text-error-crimson" : "text-warning-amber"}`} />}
                <div>
                  <p className="font-title-md text-[14px] text-on-surface">{bottleneck.title}</p>
                  <p className="font-body-sm text-[12px] text-on-surface-variant mt-0.5">{bottleneck.detail}</p>
                </div>
              </div>
            </div>
          )}

          {/* Monitor-advies + power, naast elkaar */}
          <div className="grid sm:grid-cols-2 gap-3">
            {hz && (
              <div className="p-4 rounded-lg border border-outline-variant bg-surface-container-low">
                <div className="flex items-center gap-2 mb-2">
                  <MonitorPlay className="w-4 h-4 text-primary" />
                  <span className="font-label-technical text-label-technical uppercase tracking-wider text-on-surface-variant">
                    Monitor-advies
                  </span>
                </div>
                <p className="font-display-lg text-[26px] leading-none text-on-surface mb-1.5">{hz.hz} Hz</p>
                <p className="font-body-sm text-[12px] text-on-surface-variant">{hz.detail}</p>
              </div>
            )}
            <PowerBar power={power} />
          </div>

          {/* Compatibiliteitschecks */}
          {checks.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2 mb-1">
                <Check className="w-4 h-4 text-primary" />
                <span className="font-label-technical text-label-technical uppercase tracking-wider text-on-surface">
                  Compatibiliteit
                </span>
              </div>
              {checks.map((c) => (
                <div key={c.id} className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-surface-container-low transition-colors">
                  {CHECK_ICON[c.status]}
                  <div className="min-w-0">
                    <p className="font-title-md text-[13px] text-on-surface leading-tight">{c.title}</p>
                    <p className="font-body-sm text-[12px] text-on-surface-variant mt-0.5">{c.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function PowerBar({ power }: { power: { drawWatts: number; recommendedPsu: number; headroomPct: number | null } }) {
  const { drawWatts, recommendedPsu, headroomPct } = power;
  const tone = headroomPct === null ? "info" : headroomPct < 9 ? "bad" : headroomPct < 26 ? "warn" : "ok";
  const barColor = tone === "bad" ? "bg-error-crimson" : tone === "warn" ? "bg-warning-amber" : "bg-primary";
  // Balk tov aanbevolen voeding
  const pct = Math.min(100, Math.round((drawWatts / recommendedPsu) * 100));
  return (
    <div className="p-4 rounded-lg border border-outline-variant bg-surface-container-low">
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-4 h-4 text-primary" />
        <span className="font-label-technical text-label-technical uppercase tracking-wider text-on-surface-variant">
          Stroomverbruik
        </span>
      </div>
      <div className="flex items-baseline gap-1.5 mb-2">
        <span className="font-display-lg text-[26px] leading-none text-on-surface">~{drawWatts}W</span>
        <span className="font-body-sm text-[12px] text-on-surface-variant">geschat</span>
      </div>
      <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden mb-1.5">
        <div className={`cb-bar-fill h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="font-body-sm text-[12px] text-on-surface-variant">
        Aanbevolen voeding: <span className="font-medium text-on-surface">{recommendedPsu}W</span>
        {headroomPct !== null && ` · ${headroomPct}% marge`}
      </p>
    </div>
  );
}
