import type { NextConfig } from "next";
import { OPTIMIZABLE_DOMAINS } from "./src/lib/optimizable-host";

/**
 * Content-Security-Policy. Afgestemd op wat CoreBuild daadwerkelijk laadt:
 * - 'self' dekt de app + next/font (self-hosted) + Vercel Analytics/Speed Insights
 *   (op Vercel served vanaf /_vercel/*, same-origin).
 * - Cloudflare Turnstile (login/registratie): script + iframe + fetch naar
 *   challenges.cloudflare.com.
 * - va.vercel-scripts.com: fallback-host voor de Vercel-telemetry buiten Vercel.
 * - img-src https: + de unoptimized RetailerImage-fallback laadt rechtstreeks bij
 *   de retailer; de optimizer zelf serveert same-origin (/_next/image).
 *
 * 'unsafe-inline' op script-src is (nog) nodig omdat Next inline bootstrap-/
 * hydration-scripts injecteert zonder nonce. Volgende verharding: nonce via
 * middleware → 'unsafe-inline' kan er dan af. JsonLd (application/ld+json) is
 * data en valt niet onder script-src.
 *
 * Enforcing (na een Report-Only-validatieperiode, deel 46). Bij een blokkade:
 * de header-key tijdelijk terugzetten op "Content-Security-Policy-Report-Only".
 */
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' https: data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://challenges.cloudflare.com https://va.vercel-scripts.com https://vitals.vercel-insights.com",
  "frame-src https://challenges.cloudflare.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
].join("; ");

/**
 * Beveiligingsheaders op elke route. De CSP is enforcing (geldig na de
 * Report-Only-validatie). Terugzetten naar Report-Only = de key hieronder
 * naar "Content-Security-Policy-Report-Only" hernoemen.
 */
const securityHeaders = [
  // 2 jaar HSTS. includeSubDomains is veilig: alle (sub)domeinen draaien op
  // Vercel over HTTPS. `preload` (+ submit op hstspreload.org) als latere stap.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy", value: csp },
];

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
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // De buildgalerij is opgegaan in /community; oude (geïndexeerde) links 301'en
  // we door zodat ze niet 404'en en de SEO-waarde behouden blijft.
  async redirects() {
    return [{ source: "/galerij", destination: "/community", permanent: true }];
  },
};

export default nextConfig;
