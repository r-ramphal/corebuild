/**
 * Eén bron van waarheid voor welke retailer-afbeeldingshosts door de
 * Next-optimizer mogen. `next.config.ts` bouwt hier de `remotePatterns` uit
 * (apex + subdomein-wildcard per domein) en `RetailerImage` beslist hiermee of
 * een afbeelding geoptimaliseerd of direct (unoptimized) geladen wordt. Door de
 * gedeelde lijst kunnen config en component niet uit elkaar lopen.
 *
 * Een host die hier NIET in staat valt veilig terug op een directe load, dus
 * een ontbrekend domein breekt nooit (geen "hostname not configured"-fout).
 */
export const OPTIMIZABLE_DOMAINS = [
  "bol.com",
  "s-bol.com", // media.s-bol.com (bol-productafbeeldingen)
  "media-amazon.com", // m.media-amazon.com
  "ssl-images-amazon.com",
  "alternate.nl",
  "azerty.nl",
  "megekko.nl",
] as const;

/** True als de host van `src` (apex of subdomein) in de optimize-allowlist zit. */
export function isOptimizableHost(src: string): boolean {
  try {
    const host = new URL(src).hostname.toLowerCase();
    return OPTIMIZABLE_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
  } catch {
    return false;
  }
}
