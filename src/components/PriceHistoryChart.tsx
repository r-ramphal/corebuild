"use client";

import { useId } from "react";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { formatEur } from "@/lib/format";
import type { PricePoint } from "@/lib/use-price-history";

const W = 720;
const H = 200;
const PAD = { top: 16, right: 12, bottom: 24, left: 12 };

function formatDay(day: string): string {
  const d = new Date(`${day}T00:00:00`);
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
}

/**
 * Dependency-vrije prijsverloop-grafiek (laagste prijs per dag). Toont een
 * area + lijn met de huidige, laagste en hoogste prijs in de periode. Bij minder
 * dan twee meetpunten rendert de aanroeper deze component niet.
 */
export function PriceHistoryChart({
  points,
  caption = "Laagste prijs per dag",
}: {
  points: PricePoint[];
  /** Bijschrift onder de grafiek (bv. "Laagste buildprijs per dag"). */
  caption?: string;
}) {
  const gradientId = useId();
  if (points.length < 2) return null;

  const prices = points.map((p) => p.priceCents);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const current = prices[prices.length - 1];
  const first = prices[0];
  // 10% marge zodat de lijn niet tegen de rand plakt; vlakke lijn → gecentreerd
  const span = max - min || Math.max(max, 100);
  const lo = min - span * 0.1;
  const hi = max + span * 0.1;

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i: number) =>
    PAD.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (cents: number) =>
    PAD.top + innerH - ((cents - lo) / (hi - lo || 1)) * innerH;

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.priceCents).toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L ${x(points.length - 1).toFixed(1)} ${(H - PAD.bottom).toFixed(
    1
  )} L ${x(0).toFixed(1)} ${(H - PAD.bottom).toFixed(1)} Z`;

  const delta = current - first;
  const Trend = delta < 0 ? TrendingDown : delta > 0 ? TrendingUp : Minus;
  const trendColor =
    delta < 0 ? "text-success-emerald" : delta > 0 ? "text-error-crimson" : "text-on-surface-variant";
  const trendLabel =
    delta < 0
      ? `${formatEur(Math.abs(delta) / 100)} goedkoper dan bij de eerste meting`
      : delta > 0
        ? `${formatEur(delta / 100)} duurder dan bij de eerste meting`
        : "Gelijk gebleven sinds de eerste meting";

  const lowestY = y(min);

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Trend className={`w-4 h-4 ${trendColor}`} />
          <span className={`font-label-technical text-label-technical ${trendColor}`}>
            {trendLabel}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            Laagste: <span className="text-on-surface font-medium">{formatEur(min / 100)}</span>
          </span>
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            Hoogste: <span className="text-on-surface font-medium">{formatEur(max / 100)}</span>
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Prijsverloop: laagste ${formatEur(min / 100)}, hoogste ${formatEur(
          max / 100
        )}, ${points.length} meetpunten.`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--cb-primary)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--cb-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Lijn op de laagste prijs als referentie */}
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={lowestY}
          y2={lowestY}
          stroke="var(--cb-success-emerald)"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.5"
        />

        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path
          d={linePath}
          fill="none"
          stroke="var(--cb-primary)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />

        {/* Markeer het huidige (laatste) punt */}
        <circle
          cx={x(points.length - 1)}
          cy={y(current)}
          r="4"
          fill="var(--cb-primary)"
          stroke="var(--cb-surface-container-lowest)"
          strokeWidth="2"
        />
      </svg>

      <div className="flex items-center justify-between mt-2 font-label-technical text-label-technical text-on-surface-variant">
        <span>{formatDay(points[0].day)}</span>
        <span>{caption}</span>
        <span>{formatDay(points[points.length - 1].day)}</span>
      </div>
    </div>
  );
}
