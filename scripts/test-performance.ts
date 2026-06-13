/**
 * Sanity-checks voor de build-intelligentie: detectie op echte productnamen +
 * FPS/bottleneck-uitkomsten. Gebruik: npx tsx scripts/test-performance.ts
 */
import { detectCpu, detectGpu, detectSocket, detectDdr, detectPsuWatts, detectRamGb } from "../src/lib/specs/detect";
import { estimateFps, analyzeBottleneck } from "../src/lib/specs/performance";

let failed = 0;
function check(label: string, cond: boolean, got?: unknown) {
  if (!cond) {
    failed++;
    console.log(`FAIL ${label}${got !== undefined ? `  (got: ${JSON.stringify(got)})` : ""}`);
  }
}

// — Detectie op echte namen uit de database —
const cpuCases: [string, string | null][] = [
  ["AMD Ryzen 7 9800X3D Processor 4,7 GHz 96 MB L3 Tray", "ryzen-7-9800x3d"],
  ["Intel Core i7-14700K", "core-i7-14700k"],
  ["Intel Core i7 14700K - Processor", "core-i7-14700k"],
  ["AMD Ryzen 5 8500G 3,50/5,00 GHz", "ryzen-5-8500g"],
  ["Core Ultra 7 265K - Processor", "core-ultra-7-265k"],
  ["AMD Ryzen 5 9600X Processor", "ryzen-5-9600x"],
  ["AMD Ryzen 7 5800X3D processor", "ryzen-7-5800x3d"],
  ["Fractal Design North Black", null],
];
for (const [name, expectId] of cpuCases) {
  check(`detectCpu("${name}")`, (detectCpu(name)?.id ?? null) === expectId, detectCpu(name)?.id ?? null);
}

const gpuCases: [string, string | null][] = [
  ["ASUS Dual GeForce RTX 5060 OC 8G GDDR7 Gaming grafische kaart", "rtx-5060"],
  ["ASUS Dual GeForce RTX 5060 Ti 16 GB GDDR7 OC Edition", "rtx-5060-ti"],
  ["Gigabyte AMD Radeon RX 9070 XT GAMING OC - Videokaart - 16GB", "rx-9070-xt"],
  ["ASUS PRIME AMD Radeon RX 9070 - Videokaart - 16GB", "rx-9070"],
  ["MSI GeForce RTX 4070 Ti Super Ventus", "rtx-4070-ti-super"],
  ["INNO3D GeForce RTX 3050 TWIN X2 grafische kaart", "rtx-3050"],
  ["Sapphire PULSE Radeon RX 7900 XTX 24GB", "rx-7900-xtx"],
  ["Sapphire Radeon RX 7900 XT 20GB", "rx-7900-xt"],
];
for (const [name, expectId] of gpuCases) {
  check(`detectGpu("${name}")`, (detectGpu(name)?.id ?? null) === expectId, detectGpu(name)?.id ?? null);
}

// — Signaaldetectie —
check("socket AM5", detectSocket("GIGABYTE B850 AORUS Socket AM5 ATX moederbord") === "AM5");
check("socket LGA1700", detectSocket("ASUS PRIME H770-PLUS Intel LGA 1700 ATX") === "LGA1700");
check("ddr5", detectDdr("Kingston FURY Beast DDR5 32GB 6000") === "DDR5");
check("psu watts", detectPsuWatts("Corsair RM850x 850W 80+ Gold") === 850);
check("ram kit 2x16", detectRamGb("Corsair Vengeance 32GB (2x16GB) DDR5") === 32);

// — FPS-model: relatieve uitkomsten moeten kloppen —
const gpu4070 = detectGpu("RTX 4070")!;
const gpu5090 = detectGpu("RTX 5090")!;
const cpu7700 = detectCpu("Ryzen 7 7700X")!;
const cpu5600 = detectCpu("Ryzen 5 5600")!;

const fps1080 = estimateFps(gpu4070, cpu7700, "1080p", "high", "balanced").fps;
const fps4k = estimateFps(gpu4070, cpu7700, "2160p", "high", "balanced").fps;
check("4070 1080p > 4K", fps1080 > fps4k, { fps1080, fps4k });
check("4070 1080p plausibel (90-180)", fps1080 >= 90 && fps1080 <= 180, fps1080);

const esports = estimateFps(gpu4070, cpu7700, "1080p", "high", "esports").fps;
const aaa = estimateFps(gpu4070, cpu7700, "1080p", "high", "aaa").fps;
check("esports > AAA", esports > aaa, { esports, aaa });

// Zware CPU-bottleneck: RTX 5090 + Ryzen 5 5600 op 1080p
const mismatch = estimateFps(gpu5090, cpu5600, "1080p", "high", "balanced");
check("5090+5600 1080p CPU-limited", mismatch.limitedBy === "cpu", mismatch);
const bn = analyzeBottleneck(cpu5600, gpu5090, "1080p");
check("5090+5600 1080p bottleneck=cpu", bn.type === "cpu", bn.type);
// Op 4K verdwijnt de bottleneck grotendeels
const bn4k = analyzeBottleneck(cpu5600, gpu5090, "2160p");
check("5090+5600 4K minder erg", bn4k.type !== "cpu" || bn4k.severityPct < bn.severityPct, bn4k);

// Uitgebalanceerd: 4070 + 7700X op 1440p
const balanced = analyzeBottleneck(cpu7700, gpu4070, "1440p");
check("4070+7700X 1440p ~balans/gpu", balanced.type === "balanced" || balanced.type === "gpu", balanced.type);

console.log(`\n${failed === 0 ? "✅ alle" : `❌ ${failed}`} performance-cases ${failed === 0 ? "OK" : "GEFAALD"}`);
console.log("Voorbeeld 4070+7700X 1080p high:", JSON.stringify(estimateFps(gpu4070, cpu7700, "1080p", "high", "balanced")));
console.log("Voorbeeld 4070+7700X 4K ultra AAA:", JSON.stringify(estimateFps(gpu4070, cpu7700, "2160p", "ultra", "aaa")));
if (failed > 0) process.exit(1);
