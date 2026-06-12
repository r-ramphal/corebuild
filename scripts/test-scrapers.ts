/**
 * Test alle scrapers tegen de echte retailer-sites.
 * Gebruik: npx tsx scripts/test-scrapers.ts "rtx 4070"
 */
import { searchAmazon } from "../src/lib/scrapers/amazon";
import { searchBol } from "../src/lib/scrapers/bol";
import { searchMegekko } from "../src/lib/scrapers/megekko";
import { searchAzerty } from "../src/lib/scrapers/azerty";
import { searchAlternate } from "../src/lib/scrapers/alternate";
import type { PriceResult } from "../src/lib/types";

const query = process.argv[2] ?? "rtx 4070";

const scrapers: [string, (q: string) => Promise<PriceResult[]>][] = [
  ["amazon", searchAmazon],
  ["bol", searchBol],
  ["megekko", searchMegekko],
  ["azerty", searchAzerty],
  ["alternate", searchAlternate],
];

async function main() {
  console.log(`Zoekterm: "${query}"\n`);

  for (const [name, fn] of scrapers) {
    const start = Date.now();
    try {
      const results = await fn(query);
      const ms = Date.now() - start;
      console.log(`✅ ${name.padEnd(10)} ${String(results.length).padStart(2)} resultaten (${ms}ms)`);
      for (const r of results.slice(0, 3)) {
        const stock = r.inStock ? "op voorraad" : "NIET op voorraad";
        const img = r.imageUrl ? "img✓" : "img✗";
        console.log(`     €${String(r.priceEur).padEnd(8)} ${stock} ${img}  ${r.name.slice(0, 60)}`);
        console.log(`       ${r.url.slice(0, 100)}`);
      }
    } catch (err) {
      const ms = Date.now() - start;
      console.log(`❌ ${name.padEnd(10)} FOUT (${ms}ms): ${err instanceof Error ? err.message : err}`);
    }
    console.log();
  }
}

main();
