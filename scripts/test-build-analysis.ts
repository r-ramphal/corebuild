/**
 * Unit-test voor de dimensie-checks in build-analysis.ts. Voedt synthetische
 * CompatData zodat puur de verdict-logica getest wordt (los van de datasets).
 * Gebruik: npx tsx scripts/test-build-analysis.ts
 */
import { analyzeBuild } from "../src/lib/specs/build-analysis";
import type { CompatData } from "../src/lib/specs/compat-types";
import type { BuildComponents } from "../src/lib/store/build";
import type { PriceResult } from "../src/lib/types";

function part(name: string): PriceResult {
  return { retailer: "megekko", name, priceEur: 100, url: "https://x.nl", inStock: true };
}

let failed = 0;
function expectCheck(label: string, components: BuildComponents, compat: CompatData, id: string, status: string) {
  const a = analyzeBuild(components, compat);
  const c = a.checks.find((x) => x.id === id);
  const ok = c?.status === status;
  if (!ok) {
    failed++;
    console.log(`FAIL ${label}: check '${id}' verwacht '${status}', kreeg '${c?.status ?? "(geen)"}'`);
  } else {
    console.log(`ok   ${label}: ${id} = ${status}  (${c!.title})`);
  }
}

const gpuPart: BuildComponents = { gpu: part("ASUS GeForce RTX 4070 Dual OC"), case: part("Een behuizing") };
const gpuRange = (min: number, max: number): CompatData => ({
  gpu: { chipset: "GeForce RTX 4070", min, max, med: Math.round((min + max) / 2), n: 50 },
  case: { name: "Test Case", maxGpu: null, maxCooler: null, maxPsu: null, formFactor: null, mobo: [] },
  cooler: null,
});

// — GPU-lengte vs behuizing —
expectCheck("GPU past (kast ruim)", gpuPart, { ...gpuRange(300, 340), case: { name: "C", maxGpu: 360, maxCooler: null, maxPsu: null, formFactor: null, mobo: [] } }, "gpu-length", "ok");
expectCheck("GPU past niet (kast te klein)", gpuPart, { ...gpuRange(300, 340), case: { name: "C", maxGpu: 280, maxCooler: null, maxPsu: null, formFactor: null, mobo: [] } }, "gpu-length", "bad");
expectCheck("GPU twijfel (range overlapt)", gpuPart, { ...gpuRange(300, 340), case: { name: "C", maxGpu: 320, maxCooler: null, maxPsu: null, formFactor: null, mobo: [] } }, "gpu-length", "warn");

// — Koelerhoogte vs behuizing —
const coolerComp: BuildComponents = { cpu: part("AMD Ryzen 7 9800X3D"), cooling: part("Een luchtkoeler"), case: part("Een behuizing") };
const coolerCompat = (height: number, maxCooler: number): CompatData => ({
  gpu: null,
  case: { name: "C", maxGpu: null, maxCooler, maxPsu: null, formFactor: null, mobo: [] },
  cooler: { name: "Koeler", height, water: false, radiator: null, sockets: ["AM5", "LGA1700"] },
});
expectCheck("Koeler past qua hoogte", coolerComp, coolerCompat(160, 180), "cooler-height", "ok");
expectCheck("Koeler te hoog", coolerComp, coolerCompat(170, 160), "cooler-height", "bad");

// — Koeler-socket (CPU = AM5, koeler kent alleen LGA1700) —
expectCheck("Koeler mist socket", coolerComp, {
  gpu: null,
  case: { name: "C", maxGpu: null, maxCooler: null, maxPsu: null, formFactor: null, mobo: [] },
  cooler: { name: "Koeler", height: 150, water: false, radiator: null, sockets: ["LGA1700"] },
}, "cooler-socket", "warn");

// — Formfactor met echte open-db-lijst (ATX-bord, kast steunt geen ATX) —
const ffComp: BuildComponents = { motherboard: part("MSI PRO B650 ATX Moederbord"), case: part("Mini behuizing") };
expectCheck("ATX past niet in mini-kast", ffComp, {
  gpu: null,
  case: { name: "C", maxGpu: null, maxCooler: null, maxPsu: null, formFactor: "Mini ITX Tower", mobo: ["Micro-ATX", "Mini-ITX"] },
  cooler: null,
}, "formfactor", "bad");

console.log(`\n${failed === 0 ? "ALLE" : failed + " GEFAALDE"} cases — ${failed === 0 ? "OK" : "zie hierboven"}`);
if (failed > 0) process.exit(1);
