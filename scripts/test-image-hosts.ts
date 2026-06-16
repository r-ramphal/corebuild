/**
 * Unit-test voor de optimize-allowlist (src/lib/optimizable-host.ts), die zowel
 * next.config's remotePatterns als RetailerImage aanstuurt.
 * Gebruik: npx tsx scripts/test-image-hosts.ts
 */
import { isOptimizableHost } from "../src/lib/optimizable-host";

let failed = 0;
function expect(label: string, cond: boolean) {
  if (cond) console.log(`ok   ${label}`);
  else {
    failed++;
    console.log(`FAIL ${label}`);
  }
}

// — Bekende retailer-(CDN-)hosts → optimaliseerbaar —
expect("bol product-CDN (media.s-bol.com)", isOptimizableHost("https://media.s-bol.com/abc/550x550.jpg"));
expect("amazon thumbnail (m.media-amazon.com)", isOptimizableHost("https://m.media-amazon.com/images/I/x.jpg"));
expect("azerty apex (azerty.nl)", isOptimizableHost("https://azerty.nl/media/catalog/x.jpg"));
expect("azerty www-subdomein", isOptimizableHost("https://www.azerty.nl/media/x.jpg"));
expect("alternate (www.alternate.nl)", isOptimizableHost("https://www.alternate.nl/p/x.jpg"));
expect("megekko (www.megekko.nl)", isOptimizableHost("https://www.megekko.nl/data/x.jpg"));

// — Onbekende / onveilige bronnen → niet optimaliseren (val terug op direct) —
expect("onbekende host niet", !isOptimizableHost("https://evil.example.com/x.jpg"));
expect("lookalike-domein niet (notbol.com)", !isOptimizableHost("https://cdn.notbol.com/x.jpg"));
expect("geen geldige URL niet", !isOptimizableHost("/relatief/pad.jpg"));
expect("lege string niet", !isOptimizableHost(""));

console.log(`\n${failed === 0 ? "ALLE" : failed + " GEFAALDE"} cases — ${failed === 0 ? "OK" : "zie hierboven"}`);
if (failed > 0) process.exit(1);
