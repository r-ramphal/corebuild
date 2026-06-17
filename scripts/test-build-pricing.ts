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

console.log(failed === 0 ? "\nALLE cases — OK" : `\n${failed} FAILS`);
process.exit(failed === 0 ? 0 : 1);
