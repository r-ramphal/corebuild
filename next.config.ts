import type { NextConfig } from "next";
import { OPTIMIZABLE_DOMAINS } from "./src/lib/optimizable-host";

const nextConfig: NextConfig = {
  images: {
    // Retailer-productafbeeldingen door de Next-optimizer halen: webp + op de
    // werkelijke weergavemaat → fors kleinere downloads op de afbeeldingszware
    // categorie-/zoek-/productpagina's. De hostlijst is gedeeld met
    // `RetailerImage` (src/lib/optimizable-host) zodat ze niet uit sync raken;
    // per domein zowel de apex als de subdomein-wildcard (de wildcard dekt de
    // apex niet). Onbekende hosts laadt `RetailerImage` direct (unoptimized).
    formats: ["image/webp"],
    // Geoptimaliseerde varianten lang cachen → minder her-optimalisaties (kosten).
    minimumCacheTTL: 2678400, // 31 dagen
    // Kleine maten toevoegen voor de thumbnails (56–96px) zodat de optimizer
    // echt kleine bestanden kan serveren i.p.v. naar 128 af te ronden.
    imageSizes: [16, 32, 48, 56, 64, 96, 128, 256, 384],
    remotePatterns: OPTIMIZABLE_DOMAINS.flatMap((hostname) => [
      { protocol: "https" as const, hostname },
      { protocol: "https" as const, hostname: `**.${hostname}` },
    ]),
  },
};

export default nextConfig;
