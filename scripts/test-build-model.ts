/**
 * Unit-test voor build-model.ts: controleert dat de 3D-geometrie maatvast is
 * (échte mm uit de open-db worden gevolgd) en dat onderdelen binnen de kast
 * vallen. Puur rekenwerk, geen three.js. Gebruik: npx tsx scripts/test-build-model.ts
 */
import { buildModel } from "../src/lib/specs/build-model";
import type { CompatData } from "../src/lib/specs/compat-types";
import type { BuildComponents } from "../src/lib/store/build";
import type { PriceResult } from "../src/lib/types";

function part(name: string): PriceResult {
  return { retailer: "megekko", name, priceEur: 100, url: "https://x.nl", inStock: true };
}

let failed = 0;
function check(label: string, cond: boolean, extra = "") {
  if (!cond) {
    failed++;
    console.log(`FAIL ${label} ${extra}`);
  } else {
    console.log(`ok   ${label} ${extra}`);
  }
}

const full: BuildComponents = {
  cpu: part("AMD Ryzen 7 9800X3D"),
  motherboard: part("MSI PRO B650 ATX Moederbord DDR5"),
  ram: part("Corsair Vengeance 2x16GB DDR5 6000"),
  gpu: part("ASUS GeForce RTX 4070 Dual OC"),
  cooling: part("Noctua NH-D15"),
  storage: part("Samsung 990 Pro 2TB"),
  psu: part("Corsair RM850e 850W"),
  case: part("Fractal Design Meshify C ATX Mid Tower"),
};

const compat: CompatData = {
  gpu: { chipset: "GeForce RTX 4070", min: 244, max: 336, med: 285, n: 40 },
  case: { name: "Meshify C", maxGpu: 315, maxCooler: 170, maxPsu: 175, formFactor: "ATX Mid Tower", mobo: ["ATX", "Micro-ATX", "Mini-ITX"] },
  cooler: { name: "NH-D15", height: 165, water: false, radiator: null, sockets: ["AM5"] },
};

const m = buildModel(full, compat);

// 1. Échte GPU-lengte wordt gevolgd (med = 285).
check("GPU-lengte = open-db med", m.gpu.lengthMm === 285, `(${m.gpu.lengthMm})`);
check("GPU-lengte gemarkeerd als 'real'", m.sources.gpuLength === "real");

// 2. Échte koelerhoogte wordt gevolgd (165mm, luchtkoeler → x-as = hoogte).
check("Koeler = lucht", m.cooler.kind === "air");
check("Koelerhoogte = open-db (165)", m.cooler.size[0] === 165, `(${m.cooler.size[0]})`);
check("Koelerhoogte gemarkeerd als 'real'", m.sources.coolerHeight === "real");

// 3. Kast-breedte volgt de maxCooler-clearance → caseSize 'real'.
check("Kastmaat gemarkeerd als 'real'", m.sources.caseSize === "real");
check("Kast-diepte ruimt de GPU (maxGpu 315 + marge)", m.case.depth >= 315, `(${m.case.depth})`);

// 4. RAM-kit "2x16GB" → 2 reepjes.
check("RAM = 2 reepjes", m.ram.sticks === 2, `(${m.ram.sticks})`);

// 5. Alle aanwezige onderdelen vallen binnen de kast-binnenruimte.
const hw = m.case.width / 2, hh = m.case.height / 2, hd = m.case.depth / 2;
const parts = [
  ["mobo", m.mobo], ["cpu", m.cpu], ["cooler", m.cooler],
  ["ram", m.ram], ["gpu", m.gpu], ["storage", m.storage], ["psu", m.psu],
] as const;
for (const [name, p] of parts) {
  const within =
    Math.abs(p.pos[0]) + p.size[0] / 2 <= hw + 6 &&
    Math.abs(p.pos[1]) + p.size[1] / 2 <= hh + 6 &&
    Math.abs(p.pos[2]) + p.size[2] / 2 <= hd + 6;
  check(`${name} past binnen de kast`, within, `pos=${p.pos.map(Math.round)} size=${p.size.map(Math.round)}`);
}

// 6. AIO-build: 360mm radiator → waterkoeler met radiator-maat.
const aio = buildModel(
  { ...full, cooling: part("Arctic Liquid Freezer III 360") },
  { ...compat, cooler: { name: "LF III 360", height: null, water: true, radiator: 360, sockets: ["AM5"] } }
);
check("AIO herkend", aio.cooler.kind === "aio");
check("AIO-radiator = 360", aio.cooler.radiator === 360, `(${aio.cooler.radiator})`);

// 7. Lege build: defaults zijn aanwezig en niets crasht.
const empty = buildModel({}, undefined);
check("Lege build: GPU-lengte = schatting", empty.sources.gpuLength === "estimate");
check("Lege build: kast heeft binnenmaten", empty.case.width > 0 && empty.case.height > 0 && empty.case.depth > 0);

console.log(`\n${failed === 0 ? "ALLE" : failed + " GEFAALDE"} cases — ${failed === 0 ? "OK" : "zie hierboven"}`);
if (failed > 0) process.exit(1);
