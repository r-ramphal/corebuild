/**
 * Unit-test voor de relevantie-ranking (src/lib/search-rank.ts).
 * Gebruik: npx tsx scripts/test-search-rank.ts
 */
import { rankResults, filterByQueryModel } from "../src/lib/search-rank";
import type { PriceResult } from "../src/lib/types";

function part(name: string, priceEur: number, inStock = true): PriceResult {
  return { retailer: "megekko", name, priceEur, url: "https://x.nl", inStock };
}

let failed = 0;
function expect(label: string, cond: boolean) {
  if (cond) console.log(`ok   ${label}`);
  else {
    failed++;
    console.log(`FAIL ${label}`);
  }
}

// — Exacte modeltreffer verslaat een goedkoper maar verkeerd model —
{
  const items = [
    part("Gigabyte GeForce RTX 4060 Windforce OC 8GB", 299),
    part("ASUS GeForce RTX 4070 Dual OC 12GB", 549),
    part("MSI GeForce RTX 4070 Ti Gaming X 12GB", 749),
  ];
  const ranked = rankResults(items, "rtx 4070");
  expect("RTX 4070 (exact) staat bovenaan, niet de goedkope 4060", /\b4070\b/.test(ranked[0].name) && !/ti/i.test(ranked[0].name));
  expect("De 4060 zakt naar onder (goedkoopst, maar minst relevant)", /4060/.test(ranked[ranked.length - 1].name));
}

// — Token-overlap wint van lage prijs (geen modeldetectie) —
{
  const items = [
    part("be quiet! System Power 10 550W 80+ Bronze", 59),
    part("Corsair RM850x 850W 80+ Gold modulair", 129),
  ];
  const ranked = rankResults(items, "850w gold voeding");
  expect("850W Gold matcht de query beter dan de goedkope 550W Bronze", /850w/i.test(ranked[0].name));
}

// — Op voorraad gaat vóór uitverkocht bij gelijke relevantie —
{
  const items = [
    part("Kingston Fury Beast 32GB DDR5-6000", 95, false),
    part("Kingston Fury Beast 32GB DDR5-6000", 105, true),
  ];
  const ranked = rankResults(items, "kingston fury beast 32gb ddr5-6000");
  expect("Op voorraad staat boven uitverkocht (ondanks hogere prijs)", ranked[0].inStock === true);
}

// — Lege/te-korte query → terugval op prijs asc —
{
  const items = [part("Product B", 200), part("Product A", 100)];
  const ranked = rankResults(items, "");
  expect("Zonder query sorteert het op prijs asc", ranked[0].priceEur === 100);
}

// — Muteert de input niet —
{
  const items = [part("RTX 4070", 500), part("RTX 4060", 300)];
  const before = items.map((i) => i.name).join("|");
  rankResults(items, "rtx 4070");
  expect("Input-array blijft ongewijzigd", items.map((i) => i.name).join("|") === before);
}

// — Model-precieze filter: 5070 Ti ≠ 5070 —
{
  const list = [
    part("MSI GeForce RTX 5070 Ti 16G Ventus 2X OC", 880),
    part("Palit GeForce RTX 5070 Infinity 12G", 600),
    part("Gaming videokaart (onbekend model)", 500),
  ];
  const out = filterByQueryModel(list, "GeForce RTX 5070 Ti");
  expect("5070 Ti-zoekterm houdt de 5070 Ti", out.some((r) => r.name.includes("Ventus")));
  expect("5070 Ti-zoekterm weert de gewone 5070", !out.some((r) => r.name.includes("Infinity")));
  expect("onbekend model blijft staan (niet aantoonbaar verkeerd)", out.some((r) => r.name.includes("onbekend")));
}

// — Omgekeerd: 5070-zoekterm weert de 5070 Ti —
{
  const list = [
    part("MSI GeForce RTX 5070 Ti 16G Ventus", 880),
    part("Palit GeForce RTX 5070 Infinity 12G", 600),
  ];
  const out = filterByQueryModel(list, "GeForce RTX 5070");
  expect("5070-zoekterm weert de 5070 Ti", !out.some((r) => r.name.includes("Ventus")));
  expect("5070-zoekterm houdt de gewone 5070", out.some((r) => r.name.includes("Infinity")));
}

// — Geen exacte treffer → niets strippen (geen lege lijst) —
{
  const list = [part("Palit GeForce RTX 5070 Infinity", 600), part("ASUS GeForce RTX 5060", 300)];
  const out = filterByQueryModel(list, "GeForce RTX 5070 Ti");
  expect("zonder exacte 5070 Ti blijft alles staan", out.length === 2);
}

// — Zonder model in de zoekterm verandert er niets —
{
  const list = [part("ASUS RTX 5070", 600), part("MSI RTX 5060", 300)];
  const out = filterByQueryModel(list, "videokaart");
  expect("generieke zoekterm laat de lijst ongemoeid", out.length === 2);
}

// — Werkt ook voor CPU's (9800X3D ≠ 9700X) —
{
  const list = [part("AMD Ryzen 7 9800X3D Processor", 480), part("AMD Ryzen 7 9700X", 320)];
  const out = filterByQueryModel(list, "Ryzen 7 9800X3D");
  expect("9800X3D-zoekterm weert de 9700X", !out.some((r) => r.name.includes("9700X")));
  expect("9800X3D-zoekterm houdt de 9800X3D", out.some((r) => r.name.includes("9800X3D")));
}

console.log(`\n${failed === 0 ? "ALLE" : failed + " GEFAALDE"} cases — ${failed === 0 ? "OK" : "zie hierboven"}`);
if (failed > 0) process.exit(1);
