import type { Retailer } from "@/lib/types";

/**
 * Consistente retailer-wordmark in de merkkleur. Geeft de vergelijking een
 * officiëlere, uniforme uitstraling dan losse gekleurde initialen.
 */
const RETAILERS: Record<Retailer, { label: string; bg: string; fg: string }> = {
  amazon: { label: "amazon", bg: "#232F3E", fg: "#FF9900" },
  bol: { label: "bol.com", bg: "#0000FF", fg: "#FFFFFF" },
  megekko: { label: "Megekko", bg: "#00A651", fg: "#FFFFFF" },
  azerty: { label: "Azerty", bg: "#E30613", fg: "#FFFFFF" },
  alternate: { label: "Alternate", bg: "#00305F", fg: "#FFFFFF" },
};

const SIZES = {
  sm: "text-[11px] px-2 py-0.5",
  md: "text-[13px] px-2.5 py-1",
} as const;

export function RetailerLogo({
  retailer,
  size = "sm",
  className = "",
}: {
  retailer: Retailer | string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const r = RETAILERS[retailer as Retailer] ?? { label: String(retailer), bg: "#737687", fg: "#fff" };
  return (
    <span
      style={{ backgroundColor: r.bg, color: r.fg }}
      className={`inline-flex items-center font-bold rounded tracking-tight leading-none ${SIZES[size]} ${className}`}
    >
      {r.label}
    </span>
  );
}
