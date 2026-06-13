/**
 * Sanity-check voor de dimensie-matcher (src/lib/specs/dimensions.ts) tegen
 * realistische NL-retailernamen. Gebruik: npx tsx scripts/test-dimensions.ts
 */
import { matchCase, matchCooler, gpuLength } from "../src/lib/specs/dimensions";

let failed = 0;
function check(label: string, cond: boolean, got: unknown) {
  if (!cond) {
    failed++;
    console.log(`FAIL ${label}\n  got: ${JSON.stringify(got)}`);
  } else {
    console.log(`ok   ${label}  ->  ${JSON.stringify(got)}`);
  }
}

// — Behuizingen: naam moet matchen en clearances leveren —
const caseCases: { q: string; needle: RegExp }[] = [
  { q: "Fractal Design North Charcoal Black TG", needle: /north/i },
  { q: "NZXT H9 Flow Wit (2024)", needle: /h9 flow/i },
  { q: "Lian Li O11 Dynamic EVO Zwart", needle: /o11 dynamic/i },
  { q: "Corsair 4000D Airflow Tempered Glass Zwart", needle: /4000d/i },
  { q: "be quiet! Pure Base 500DX Black", needle: /pure base 500/i },
];
for (const { q, needle } of caseCases) {
  const m = matchCase(q);
  check(`case "${q}"`, !!m && needle.test(m.name) && (m.maxGpu ?? 0) > 0, m);
}
// Onzin → geen valse match
const junk = matchCase("Willekeurige onzinnaam zonder echt model 9999");
check("case junk -> null", junk === null, junk);

// — Koelers: hoogte of waterkoeling + sockets —
const coolerCases: { q: string; needle: RegExp; water?: boolean }[] = [
  { q: "Noctua NH-D15 chromax.black", needle: /nh-d15/i },
  { q: "be quiet! Dark Rock Pro 5", needle: /dark rock pro 5/i },
  { q: "ARCTIC Liquid Freezer III 360 A-RGB Zwart", needle: /liquid freezer iii 360/i, water: true },
  { q: "Cooler Master Hyper 212 Black Edition", needle: /hyper 212/i },
];
for (const { q, needle, water } of coolerCases) {
  const m = matchCooler(q);
  const ok = !!m && needle.test(m.name) && (water ? m.water : (m.height ?? 0) > 0) && m.sockets.length > 0;
  check(`cooler "${q}"`, ok, m);
}

// — GPU: chipset-lengterange —
const gpuCases: { q: string; chipset: RegExp }[] = [
  { q: "ASUS Dual GeForce RTX 4070 EVO OC 12GB GDDR6X", chipset: /rtx 4070$/i },
  { q: "Gigabyte Radeon RX 7800 XT Gaming OC 16GB", chipset: /rx 7800 xt/i },
  { q: "Intel Arc B580 Limited Edition 12GB", chipset: /arc b580/i },
];
for (const { q, chipset } of gpuCases) {
  const g = gpuLength(q);
  const ok = !!g && chipset.test(g.chipset) && g.min > 0 && g.max >= g.min && g.n > 0;
  check(`gpu "${q}"`, ok, g);
}

console.log(`\n${failed === 0 ? "ALLE" : failed + " GEFAALDE"} cases — ${failed === 0 ? "OK" : "zie hierboven"}`);
if (failed > 0) process.exit(1);
