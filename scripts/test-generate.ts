/**
 * Unit-test voor de build-generator (src/lib/specs/generate.ts) met synthetische
 * catalogus-kandidaten. Gebruik: npx tsx scripts/test-generate.ts
 */
import { generateBuild, type GenerateInput } from "../src/lib/specs/generate";
import { detectCpu, detectGpu, detectSocket, detectDdr, detectPsuWatts, detectRamGb } from "../src/lib/specs/detect";
import { isRecommended } from "../src/lib/specs/recommend";
import type { PriceResult } from "../src/lib/types";

const p = (name: string, priceEur: number): PriceResult => ({ retailer: "megekko", name, priceEur, url: "https://x.nl", inStock: true });

// Kandidaten per slot (prijs oplopend, zoals de catalogus levert)
const candidates: GenerateInput["candidates"] = {
  gpu: [
    p("Gigabyte GeForce RTX 4060 Windforce OC 8GB", 300),
    p("ASUS Dual GeForce RTX 4070 EVO OC 12GB", 600),
    p("MSI GeForce RTX 4070 Super Gaming X Slim 12GB", 700),
    p("ASUS ROG Strix GeForce RTX 4090 OC 24GB", 1900),
  ],
  cpu: [
    p("AMD Ryzen 5 7600 Processor", 180),
    p("AMD Ryzen 5 8600G Processor", 220),
    p("AMD Ryzen 7 9800X3D Processor", 480),
  ],
  motherboard: [
    p("Gigabyte B650M DS3H AM5 DDR5 Micro-ATX moederbord", 130),
    p("ASUS PRIME B650-PLUS AM5 DDR5 ATX moederbord", 170),
    p("MSI MAG B760 Tomahawk LGA1700 DDR5 ATX moederbord", 190),
  ],
  ram: [
    p("Corsair Vengeance 16GB DDR5-6000 CL30", 55),
    p("Corsair Vengeance 32GB DDR4-3600 CL18", 75),
    p("Kingston Fury Beast 32GB DDR5-6000", 110),
  ],
  storage: [
    p("Kingston A400 500GB SSD", 35),
    p("Crucial P3 Plus 1TB PCIe Gen4 NVMe M.2 SSD", 65),
    p("Samsung 990 Pro 2TB NVMe SSD", 150),
  ],
  psu: [
    p("Corsair CV650 650W", 70),
    p("be quiet! Pure Power 12 M 850W 80+ Gold", 120),
    p("Seasonic Focus GX 1000W 80+ Gold", 180),
  ],
  case: [
    p("Fractal Design Pop Air ATX Mid Tower Zwart", 75),
    p("NZXT H5 Flow ATX Mid Tower Wit", 95),
  ],
  cooling: [
    p("Thermalright Peerless Assassin 120 SE", 40),
    p("be quiet! Dark Rock Pro 5", 90),
  ],
};

let failed = 0;
function ok(label: string, cond: boolean, extra = "") {
  if (!cond) { failed++; console.log(`FAIL ${label} ${extra}`); }
  else console.log(`ok   ${label} ${extra}`);
}

// — Test 1: gaming 1440p €1500 —
{
  const r = generateBuild({ budget: 1500, useCase: "gaming", resolution: "1440p", candidates });
  const c = r.components;
  console.log("\n[gaming 1440p €1500] total €" + r.total + (r.overBudget ? " (OVER)" : ""));
  ok("GPU = RTX 4070 Super", /4070 Super/i.test(detectGpu(c.gpu?.name ?? "")?.label ?? ""), `(${c.gpu?.name})`);
  ok("CPU AM5 gekozen", detectCpu(c.cpu?.name ?? "")?.socket === "AM5", `(${c.cpu?.name})`);
  ok("Moederbord socket = CPU-socket (AM5)", detectSocket(c.motherboard?.name ?? "") === "AM5", `(${c.motherboard?.name})`);
  ok("RAM is DDR5 ≥16GB", detectDdr(c.ram?.name ?? "") === "DDR5" && (detectRamGb(c.ram?.name ?? "") ?? 0) >= 16, `(${c.ram?.name})`);
  ok("Voeding ≥700W", (detectPsuWatts(c.psu?.name ?? "") ?? 0) >= 700, `(${c.psu?.name})`);
  ok("Opslag ≥1TB", /\b(1|2|4)\s?tb\b/i.test(c.storage?.name ?? ""), `(${c.storage?.name})`);
  ok("Geen losse koeler (65W CPU)", c.cooling == null);
  ok("Binnen budget", !r.overBudget, `(€${r.total})`);
  ok("Voeding is community-favoriet", isRecommended("psu", c.psu?.name ?? ""), `(${c.psu?.name})`);
  ok("Behuizing is community-favoriet", isRecommended("case", c.case?.name ?? ""), `(${c.case?.name})`);
  ok("Community-favorieten-notitie aanwezig", r.notes.some((n) => /community-favoriet/i.test(n)));
}

// — Test: streaming €2000 (warme CPU → koeler, 32GB RAM, favoriet-koeler) —
{
  const r = generateBuild({ budget: 2000, useCase: "streaming", resolution: "1440p", candidates });
  const c = r.components;
  console.log("\n[streaming 1440p €2000] total €" + r.total + (r.overBudget ? " (OVER)" : ""));
  ok("Streaming: RAM ≥32GB", (detectRamGb(c.ram?.name ?? "") ?? 0) >= 32, `(${c.ram?.name})`);
  ok("Streaming: RAM is DDR5", detectDdr(c.ram?.name ?? "") === "DDR5", `(${c.ram?.name})`);
  ok("Streaming: koeler gekozen (warme CPU)", c.cooling != null, `(${c.cooling?.name})`);
  ok("Streaming: koeler is community-favoriet", isRecommended("cooling", c.cooling?.name ?? ""), `(${c.cooling?.name})`);
}

// — Test: competitive 1080p €1200 (GPU + CPU aanwezig) —
{
  const r = generateBuild({ budget: 1200, useCase: "competitive", resolution: "1080p", candidates });
  const c = r.components;
  console.log("\n[competitive 1080p €1200] total €" + r.total + (r.overBudget ? " (OVER)" : ""));
  ok("Competitive: GPU aanwezig", c.gpu != null, `(${c.gpu?.name})`);
  ok("Competitive: CPU aanwezig", c.cpu != null, `(${c.cpu?.name})`);
}

// — Test 2: office €800 (iGPU, geen losse GPU) —
{
  const r = generateBuild({ budget: 800, useCase: "office", resolution: "1080p", candidates });
  console.log("\n[office €800] total €" + r.total);
  ok("Geen videokaart (iGPU)", r.components.gpu == null);
  ok("CPU gekozen", r.components.cpu != null, `(${r.components.cpu?.name})`);
}

// — Test 3: budget gaming 1080p €700 (fallback naar goedkoopste GPU) —
{
  const r = generateBuild({ budget: 700, useCase: "gaming", resolution: "1080p", candidates });
  console.log("\n[gaming 1080p €700] total €" + r.total + (r.overBudget ? " (OVER)" : ""));
  ok("GPU = goedkoopste (RTX 4060)", /4060/i.test(detectGpu(r.components.gpu?.name ?? "")?.label ?? ""), `(${r.components.gpu?.name})`);
}

console.log(`\n${failed === 0 ? "ALLE" : failed + " GEFAALDE"} cases — ${failed === 0 ? "OK" : "zie hierboven"}`);
if (failed > 0) process.exit(1);
