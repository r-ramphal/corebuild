/**
 * Unit-test voor de per-optie compat-check in de builder-kiezer
 * (src/lib/specs/slot-compat.ts). Gebruik: npx tsx scripts/test-slot-compat.ts
 */
import { analyzeBuild } from "../src/lib/specs/build-analysis";
import { slotCompat } from "../src/lib/specs/slot-compat";
import type { BuildComponents } from "../src/lib/store/build";
import type { ComponentType, PriceResult } from "../src/lib/types";

function part(name: string): PriceResult {
  return { retailer: "megekko", name, priceEur: 100, url: "https://x.nl", inStock: true };
}

let failed = 0;
function check(
  label: string,
  type: ComponentType,
  option: string,
  components: BuildComponents,
  expected: "ok" | "warn" | "bad" | null
) {
  const verdict = slotCompat(type, option, components, analyzeBuild(components));
  const got = verdict?.status ?? null;
  if (got === expected) console.log(`ok   ${label}${verdict ? ` (${verdict.label})` : ""}`);
  else {
    failed++;
    console.log(`FAIL ${label}: verwacht ${expected}, kreeg ${got}`);
  }
}

const am5Cpu: BuildComponents = { cpu: part("AMD Ryzen 7 9800X3D") };
const am5Board: BuildComponents = { motherboard: part("MSI MAG B650 Tomahawk WiFi ATX") };

// — moederbord ↔ CPU-socket (chipset-naam, geen expliciete socket) —
check("B650-bord past op AM5-CPU", "motherboard", "MSI MAG B650 Tomahawk ATX", am5Cpu, "ok");
check("B760-bord past niet op AM5-CPU", "motherboard", "MSI PRO B760-P DDR5 ATX", am5Cpu, "bad");
check("moederbord zonder gekozen CPU → geen oordeel", "motherboard", "MSI B650 ATX", {}, null);

// — CPU ↔ moederbord-socket —
check("AM5-CPU past op B650-bord", "cpu", "AMD Ryzen 5 9600X", am5Board, "ok");
check("Intel-CPU past niet op B650-bord", "cpu", "Intel Core i5-14600K", am5Board, "bad");

// — RAM ↔ platform-DDR —
check("DDR5-RAM past bij AM5-build", "ram", "Corsair Vengeance 32GB DDR5-6000", am5Cpu, "ok");
check("DDR4-RAM past niet bij AM5-build", "ram", "Corsair Vengeance LPX 16GB DDR4-3200", am5Cpu, "bad");
check("RAM zonder DDR-info → geen oordeel", "ram", "Corsair Vengeance geheugen", am5Cpu, null);

// — PSU ↔ aanbevolen wattage (Ryzen 7 9800X3D + RTX 4070 → ~650W aanbevolen) —
const powerBuild: BuildComponents = { cpu: part("AMD Ryzen 7 9800X3D"), gpu: part("ASUS GeForce RTX 4070 Dual OC") };
check("1000W is ruim voldoende", "psu", "Corsair RM1000x 1000W 80+ Gold", powerBuild, "ok");
check("550W is aan de krappe kant", "psu", "be quiet! System Power 550W", powerBuild, "warn");
check("400W is te krap", "psu", "EVGA 400W voeding", powerBuild, "bad");

// — behuizing ↔ moederbord-formfactor —
check("ATX-tower past ATX-bord", "case", "NZXT H7 Flow ATX Mid Tower", am5Board, "ok");
check("Mini-ITX-kast te klein voor ATX-bord", "case", "Cooler Master NR200 Mini-ITX", am5Board, "bad");

// — slot zonder per-optie oordeel —
check("GPU-slot heeft geen naam-only oordeel", "gpu", "ASUS GeForce RTX 4070", powerBuild, null);

console.log(`\n${failed === 0 ? "ALLE" : failed + " GEFAALDE"} cases — ${failed === 0 ? "OK" : "zie hierboven"}`);
if (failed > 0) process.exit(1);
