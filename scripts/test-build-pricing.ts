/**
 * Unit-tests voor de pure "Slim Kopen"-helpers: de split-cart-optimizer en de
 * build-prijsindex. Draait offline (geen DB/netwerk).
 * Run: npx tsx scripts/test-build-pricing.ts
 */
import {
  optimizeSplitCart,
  cheapestOffer,
  type PartOffers,
  type ShippingConfig,
} from "../src/lib/specs/split-cart";
import {
  computeBuildIndex,
  summarizeBuildIndex,
  type PartDayPoints,
} from "../src/lib/specs/build-index";
import { partsFromComponents } from "../src/lib/db/build-alerts";
import { productMatches } from "../src/lib/specs/match-product";

let failed = 0;
function check(label: string, cond: boolean) {
  console.log(`${cond ? "ok  " : "FAIL"} ${label}`);
  if (!cond) failed++;
}

// Verzending: gratis vanaf €100, anders €5; megekko gratis vanaf €75.
const cfg: ShippingConfig = {
  azerty: { freeFrom: 10000, fee: 500 },
  megekko: { freeFrom: 7500, fee: 595 },
  alternate: { freeFrom: 10000, fee: 500 },
};

// ── Split-cart ──────────────────────────────────────────────────────────────
const parts: PartOffers[] = [
  {
    slot: "cpu",
    name: "Ryzen 7 9800X3D",
    offers: [
      { retailer: "azerty", url: "https://azerty.nl/cpu", priceCents: 45000, inStock: true },
      { retailer: "megekko", url: "https://megekko.nl/cpu", priceCents: 46000, inStock: true },
    ],
  },
  {
    slot: "gpu",
    name: "RTX 5070 Ti",
    offers: [
      { retailer: "azerty", url: "https://azerty.nl/gpu", priceCents: 90000, inStock: true },
      { retailer: "megekko", url: "https://megekko.nl/gpu", priceCents: 88000, inStock: true },
    ],
  },
];

const r = optimizeSplitCart(parts, cfg);
check("split kiest goedkoopste per onderdeel (cpu azerty, gpu megekko)", r.split.itemsCents === 45000 + 88000);
check("split groepeert per winkel (2 winkels)", r.split.groups.length === 2);
check("beide split-subtotalen >= gratis-drempel → geen verzendkosten", r.split.shippingCents === 0);
check("single store: megekko voert alles, goedkoopste totaal", r.singleStore?.retailer === "megekko" && r.singleStore?.itemsCents === 46000 + 88000);
check("spreiden is goedkoper dan één winkel", (r.savingsCents ?? 0) > 0 && r.bestStrategy === "split");

// Verzendkosten kunnen spreiden onaantrekkelijk maken
const cheap: PartOffers[] = [
  { slot: "ram", name: "DDR5 16GB", offers: [
    { retailer: "azerty", url: "https://azerty.nl/ram", priceCents: 4000, inStock: true },
    { retailer: "megekko", url: "https://megekko.nl/ram", priceCents: 4500, inStock: true },
  ] },
  { slot: "storage", name: "SSD 1TB", offers: [
    { retailer: "megekko", url: "https://megekko.nl/ssd", priceCents: 6000, inStock: true },
    { retailer: "azerty", url: "https://azerty.nl/ssd", priceCents: 6200, inStock: true },
  ] },
];
const r2 = optimizeSplitCart(cheap, cfg);
// Split: ram azerty €40 (+€5 ship), ssd megekko €60 (+€5.95 ship) = €110.95
// Single megekko: €45 + €60 = €105 (+€5.95 ship onder €75) = €110.95 → gelijk/duurder → single wint of gelijk
check("bij lage bedragen telt verzending mee in de keuze", r2.bestStrategy === "single" || (r2.savingsCents ?? 1) <= 0);

// Single store null als geen enkele winkel alles voert
const exclusive: PartOffers[] = [
  { slot: "cpu", name: "x", offers: [{ retailer: "azerty", url: "https://a/1", priceCents: 1000, inStock: true }] },
  { slot: "gpu", name: "y", offers: [{ retailer: "megekko", url: "https://m/1", priceCents: 2000, inStock: true }] },
];
const r3 = optimizeSplitCart(exclusive, cfg);
check("single store = null als niemand alle onderdelen voert", r3.singleStore === null);
check("savings = null zonder single-store-alternatief", r3.savingsCents === null && r3.bestStrategy === "split");

// Niet-gedekte onderdelen
const withGap: PartOffers[] = [
  { slot: "cpu", name: "x", offers: [{ retailer: "azerty", url: "https://a/1", priceCents: 1000, inStock: true }] },
  { slot: "case", name: "z", offers: [] },
];
const r4 = optimizeSplitCart(withGap, cfg);
check("onderdeel zonder aanbieding belandt in uncovered", r4.uncovered.length === 1 && r4.uncovered[0] === "case");
check("covered telt alleen gedekte onderdelen", r4.covered === 1 && r4.partsTotal === 2);

// Voorraad heeft voorrang op prijs
const stock: PartOffers[] = [
  { slot: "cpu", name: "x", offers: [
    { retailer: "azerty", url: "https://a/cheap-oos", priceCents: 1000, inStock: false },
    { retailer: "megekko", url: "https://m/instock", priceCents: 1200, inStock: true },
  ] },
];
const r5 = optimizeSplitCart(stock, cfg);
check("op voorraad wint van een goedkopere uitverkochte aanbieding", r5.split.groups[0].items[0].url === "https://m/instock");

// ── cheapestOffer (gedeeld door split-cart én de index-anker) ────────────────
check("cheapestOffer: op voorraad wint van goedkoper-uitverkocht", cheapestOffer([
  { retailer: "a", url: "u1", priceCents: 1000, inStock: false },
  { retailer: "b", url: "u2", priceCents: 1200, inStock: true },
])?.url === "u2");
check("cheapestOffer: goedkoopste binnen op-voorraad", cheapestOffer([
  { retailer: "a", url: "u1", priceCents: 1500, inStock: true },
  { retailer: "b", url: "u2", priceCents: 1200, inStock: true },
])?.url === "u2");
check("cheapestOffer: leeg → null", cheapestOffer([]) === null);

// ── Build-prijsindex (LOCF) ──────────────────────────────────────────────────
const idxParts: PartDayPoints[] = [
  { slot: "cpu", byDay: new Map([["2026-06-01", 45000], ["2026-06-03", 44000]]) },
  { slot: "gpu", byDay: new Map([["2026-06-02", 90000], ["2026-06-04", 88000]]) },
];
const idx = computeBuildIndex(idxParts, "2026-06-04");
check("index start op de dag dat álle onderdelen data hebben (06-02)", idx.points[0].day === "2026-06-02");
check("partsTracked telt onderdelen met historie", idx.partsTracked === 2);
// 06-02: cpu 45000 (laatste ≤ 06-02) + gpu 90000 = 135000
check("LOCF som op startdag klopt", idx.points[0].totalCents === 135000);
// 06-04: cpu 44000 (carry van 06-03) + gpu 88000 = 132000
check("LOCF draagt laatste prijs mee op latere dag", idx.points[idx.points.length - 1].totalCents === 132000);
check("dagelijkse grid 06-02 t/m 06-04 = 3 punten", idx.points.length === 3);

const sum = summarizeBuildIndex(idx.points);
check("summary: huidige prijs = laatste punt", sum?.currentCents === 132000);
check("summary: laagste = 132000 op 06-04 → signaal 'low'", sum?.minCents === 132000 && sum?.signal === "low");

const onlyOne: PartDayPoints[] = [{ slot: "cpu", byDay: new Map() }];
check("geen historie → lege index", computeBuildIndex(onlyOne, "2026-06-04").points.length === 0);
check("minder dan 2 punten → geen summary", summarizeBuildIndex([{ day: "2026-06-01", totalCents: 1 }]) === null);

// ── partsFromComponents (build-snapshot → BuildParts voor de alert) ───────────
const comps = {
  cpu: { name: "Ryzen 7 9800X3D", url: "https://a/cpu", retailer: "azerty", priceEur: 450 },
  gpu: { name: "RTX 5070 Ti", url: "https://a/gpu", retailer: "megekko", priceEur: 900, mock: true },
  ram: { name: "DDR5 32GB", url: "", retailer: "bol", priceEur: 110 }, // geen url
  monitor: { name: "27 inch", url: "https://a/mon", retailer: "bol", priceEur: 300 }, // geen build-slot
};
const fp = partsFromComponents(comps);
check("partsFromComponents: alleen geldige build-slots (cpu)", fp.length === 1 && fp[0].slot === "cpu");
check("partsFromComponents: priceEur → priceCents", fp[0].priceCents === 45000);
check("partsFromComponents: mock wordt overgeslagen", !fp.some((p) => p.slot === "gpu"));
check("partsFromComponents: zonder url overgeslagen", !fp.some((p) => p.slot === "ram"));
check("partsFromComponents: randapparaat (monitor) is geen build-slot", !fp.some((p) => p.slot === "monitor"));
check("partsFromComponents: lege input → []", partsFromComponents(null).length === 0 && partsFromComponents({}).length === 0);

// ── productMatches (model/token-matcher) ─────────────────────────────────────
const M = (p: string, l: string, c: string) => productMatches(p, l, c);
// CPU/GPU via modeldetectie (onderscheidt varianten)
check("cpu: zelfde model matcht ondanks extra woorden", M("AMD Ryzen 7 9800X3D", "AMD Ryzen 7 9800X3D Processor (boxed)", "cpu"));
check("cpu: ander model matcht niet", !M("AMD Ryzen 7 9800X3D", "AMD Ryzen 7 9700X", "cpu"));
check("gpu: zelfde model matcht", M("GeForce RTX 5070", "GIGABYTE GeForce RTX 5070 AERO OC 12G", "gpu"));
check("gpu: Ti-variant matcht niet de non-Ti", !M("GeForce RTX 5070", "MSI GeForce RTX 5070 Ti Gaming", "gpu"));
// Moederbord: chipset + formfactor
check("mobo: B650 ATX matcht een B650 ATX-bord", M("B650 ATX moederbord", "ASUS PRIME B650-PLUS ATX", "motherboard"));
check("mobo: B650 ATX matcht GEEN micro-ATX-bord", !M("B650 ATX moederbord", "ASUS PRIME B650M-A Micro-ATX", "motherboard"));
// RAM: capaciteit + DDR + snelheid
check("ram: 32GB DDR5-6000 matcht gelijkwaardige kit", M("32GB DDR5-6000", "Corsair Vengeance 32GB (2x16GB) DDR5 6000MHz", "ram"));
check("ram: andere capaciteit matcht niet", !M("32GB DDR5-6000", "Corsair Vengeance 16GB DDR5 6000MHz", "ram"));
check("ram: andere snelheid matcht niet", !M("32GB DDR5-6000", "Corsair Vengeance 32GB DDR5 5600MHz", "ram"));
// PSU: wattage + rating
check("psu: 750W 80+ Gold matcht", M("750W 80+ Gold", "Corsair RM750x 750W 80+ Gold", "psu"));
check("psu: andere rating matcht niet", !M("750W 80+ Gold", "Corsair CV750 750W 80+ Bronze", "psu"));
check("psu: ander wattage matcht niet", !M("750W 80+ Gold", "Corsair RM650x 650W 80+ Gold", "psu"));
// Opslag: capaciteit + ssd-marker (geen HDD)
check("storage: 2TB NVMe SSD matcht een M.2 NVMe", M("2TB NVMe SSD", "Samsung 990 Pro 2TB M.2 NVMe", "storage"));
check("storage: matcht GEEN HDD met zelfde capaciteit", !M("2TB NVMe SSD", "Seagate Barracuda 2TB HDD", "storage"));
check("storage: andere capaciteit matcht niet", !M("2TB NVMe SSD", "Samsung 990 Pro 1TB NVMe SSD", "storage"));
// Case/cooling: merk + modelnaam
check("case: merk+model matcht ondanks kleur-suffix", M("Fractal Design North", "Fractal Design North Charcoal Black", "case"));
check("cooling: merk+model+maat matcht", M("Thermalright Phantom Spirit 120", "Thermalright Phantom Spirit 120 SE ARGB", "cooling"));
// Numerieke grens: "120" matcht niet "1200"
check("getal-grens: 120 matcht niet 1200", !M("Assassin X 120", "NZXT Kraken 1200 cooler", "cooling"));

console.log(failed === 0 ? "\nALLE cases — OK" : `\n${failed} FAILS`);
process.exit(failed === 0 ? 0 : 1);
