"use client";

import { useMemo } from "react";
import {
  CircleCheck, TriangleAlert, CircleAlert, Info, Zap, MemoryStick, ShieldCheck,
} from "lucide-react";
import type { BuildComponents } from "@/lib/store/build";
import { analyzeBuild, type CheckStatus } from "@/lib/specs/build-analysis";

const CHECK_ICON: Record<CheckStatus, React.ReactNode> = {
  ok: <CircleCheck className="w-4 h-4 text-success-emerald flex-shrink-0" />,
  warn: <TriangleAlert className="w-4 h-4 text-warning-amber flex-shrink-0" />,
  bad: <CircleAlert className="w-4 h-4 text-error-crimson flex-shrink-0" />,
  info: <Info className="w-4 h-4 text-on-surface-variant flex-shrink-0" />,
};

export function BuildSummary({ components }: { components: BuildComponents }) {
  const a = useMemo(() => analyzeBuild(components), [components]);
  const { power, ddr, checks } = a;

  const hasParts = Object.keys(components).length > 0;
  const hasBlocking = checks.some((c) => c.status === "bad");
  const powerTone =
    power.headroomPct === null ? "ok" : power.headroomPct < 9 ? "bad" : power.headroomPct < 26 ? "warn" : "ok";
  const powerBar = power.recommendedPsu > 0 ? Math.min(100, Math.round((power.drawWatts / power.recommendedPsu) * 100)) : 0;

  return (
    <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
      {/* Statusbalk: compatibel-badge + wattage + DDR (BuildCores-stijl) */}
      <div className="flex flex-wrap items-center gap-2 px-5 sm:px-6 py-3.5 border-b border-outline-variant bg-gradient-to-r from-primary/[0.05] to-transparent">
        {hasParts ? (
          <span
            className={`inline-flex items-center gap-1.5 font-label-technical text-label-technical px-2.5 py-1 rounded-full ${
              hasBlocking
                ? "bg-error-crimson/10 text-error-crimson"
                : "bg-success-emerald/10 text-success-emerald"
            }`}
          >
            {hasBlocking ? <CircleAlert className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            {hasBlocking ? "Aandachtspunten" : "Compatibel"}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 font-label-technical text-label-technical px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant">
            <Info className="w-3.5 h-3.5" /> Nog leeg
          </span>
        )}

        <span className="inline-flex items-center gap-1.5 font-label-technical text-label-technical px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant">
          <Zap className="w-3.5 h-3.5 text-primary" /> {power.drawWatts > 0 ? `~${power.drawWatts}W` : "0W"}
        </span>

        {ddr && (
          <span className="inline-flex items-center gap-1.5 font-label-technical text-label-technical px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant">
            <MemoryStick className="w-3.5 h-3.5 text-primary" /> {ddr}
          </span>
        )}
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        {/* Voeding */}
        {power.drawWatts > 0 && (
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="font-label-technical text-label-technical uppercase tracking-wider text-on-surface-variant">
                Geschat verbruik
              </span>
              <span className="font-body-sm text-[12px] text-on-surface-variant">
                aanbevolen voeding <span className="font-medium text-on-surface">{power.recommendedPsu}W</span>
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mb-2">
              <span className="font-display-lg text-[26px] leading-none text-on-surface">~{power.drawWatts}W</span>
              {power.headroomPct !== null && (
                <span className="font-body-sm text-[12px] text-on-surface-variant">· {power.headroomPct}% marge</span>
              )}
            </div>
            <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
              <div
                className={`cb-bar-fill h-full rounded-full ${
                  powerTone === "bad" ? "bg-error-crimson" : powerTone === "warn" ? "bg-warning-amber" : "bg-primary"
                }`}
                style={{ width: `${powerBar}%` }}
              />
            </div>
          </div>
        )}

        {/* Compatibiliteitschecklist */}
        {checks.length > 0 ? (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4 text-primary" />
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
        ) : (
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Voeg onderdelen toe, dan controleren we automatisch of ze bij elkaar passen: socket, geheugentype,
            voeding en behuizing.
          </p>
        )}
      </div>
    </section>
  );
}
