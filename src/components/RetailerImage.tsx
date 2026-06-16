"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { isOptimizableHost } from "@/lib/optimizable-host";

/**
 * Afbeelding van een retailer-product.
 *
 * Hosts uit de gedeelde allowlist (`src/lib/optimizable-host`, ook de bron van
 * `next.config`'s `remotePatterns`) gaan door de Next-optimizer: webp op de
 * werkelijke weergavemaat (veel kleiner). Onbekende hosts vallen veilig terug op
 * een directe, onge-optimaliseerde load — zo geeft een niet-geconfigureerde host
 * nooit de "hostname not configured"-fout. Faalt de geoptimaliseerde load alsnog
 * (host blokkeert de optimizer), dan proberen we de directe load; faalt die ook,
 * dan tonen we de `fallback`.
 */
interface RetailerImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  sizes?: string;
  /** Getoond wanneer de afbeelding helemaal niet laadt (bijv. het bestaande icoon). */
  fallback?: ReactNode;
}

export function RetailerImage({ src, alt, width, height, className, sizes, fallback }: RetailerImageProps) {
  // "opt" = via de optimizer; "raw" = direct (unoptimized); "fail" = fallback.
  const [mode, setMode] = useState<"opt" | "raw" | "fail">(isOptimizableHost(src) ? "opt" : "raw");

  if (mode === "fail") return <>{fallback ?? null}</>;

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      className={className}
      unoptimized={mode === "raw"}
      onError={() => setMode((m) => (m === "opt" ? "raw" : "fail"))}
    />
  );
}
