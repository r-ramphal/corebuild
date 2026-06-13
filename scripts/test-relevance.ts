/**
 * Sanity-check voor src/lib/relevance.ts tegen echte (junk-)namen uit de
 * listings-tabel. Gebruik: npx tsx scripts/test-relevance.ts
 */
import { matchesCategory, isJunk, inferCategory } from "../src/lib/relevance";
import { cleanName } from "../src/lib/clean-name";
import type { ComponentType } from "../src/lib/types";

const CASES: { name: string; cat: ComponentType; expect: boolean }[] = [
  // — cpu —
  { name: "AMD Ryzen 7 9800X3D Processor", cat: "cpu", expect: true },
  { name: "Intel Core i7 14700K - Processor", cat: "cpu", expect: true },
  { name: "Intel Core Ultra 7 265K - Processor", cat: "cpu", expect: true },
  { name: "AMD Ryzen 3 3200G socket AM4 processor", cat: "cpu", expect: true },
  { name: "Noble Collection Harry Potter: Professor Snape's Wand rollenspel", cat: "cpu", expect: false },
  { name: "Schleich Harry Potter - Professor Sneep & Patronus speelfiguur", cat: "cpu", expect: false },
  { name: "DeepCool AK500 CPU-koeler", cat: "cpu", expect: false },
  { name: "Noctua NH-L9i-17xx CPU-koeler", cat: "cpu", expect: false },
  // — gpu —
  { name: "ASUS Dual GeForce RTX 5060 OC 8G GDDR7 Gaming grafische kaart", cat: "gpu", expect: true },
  { name: "INNO3D GeForce RTX 3050 TWIN X2 grafische kaart", cat: "gpu", expect: true },
  { name: "Sapphire PULSE Radeon RX 7800 XT 16GB", cat: "gpu", expect: true },
  { name: "Alphacool Eisblock Aurora Geforce RTX 4070 Ti TUF Gaming waterkoeling", cat: "gpu", expect: false },
  { name: "EKWB EK-Quantum Vector FTW3 RTX 3080/3090 Active Backplate D-RGB - Acryl", cat: "gpu", expect: false },
  // — motherboard —
  { name: "MSI PRO B850-S WIFI6E - Moederbord - Socket AM5 - ATX", cat: "motherboard", expect: true },
  { name: "Motherboard Asus PRIME B760M-A-CSM DDR5 LGA1700 Intel B760", cat: "motherboard", expect: true },
  { name: "GIGABYTE X870E AERO X3D WOOD AMD X870E Socket AM5 ATX moederbord", cat: "motherboard", expect: true },
  // — ram —
  { name: "Corsair Vengeance - RAM-geheugen - 32GB - DDR5 - 6000 CL30", cat: "ram", expect: true },
  { name: "Kingston DDR5 FURY Beast 2x32GB 6000 KF560C36BBEK2-64 geheugenmodule", cat: "ram", expect: true },
  { name: "HP ProBook 4 G1i 14‑inch AI (AT6F2AV) - laptop", cat: "ram", expect: false },
  { name: "Corsair Dominator Titanium DDR5 Lighting Enhancement Kit ledverlichting", cat: "ram", expect: false },
  { name: "Crucial CT16G56C46S5 - Laptopgeheugen - 16GB - DDR5 - SODIMM", cat: "ram", expect: false },
  { name: "Motherboard Asus PRIME B760M-A-CSM DDR5 LGA1700 Intel B760", cat: "ram", expect: false },
  // — storage —
  { name: "Crucial P310 1TB PCIe Gen4 NVMe M.2 2280 Interne Gaming SSD", cat: "storage", expect: true },
  { name: "Patriot P300 128 GB SSD", cat: "storage", expect: true },
  { name: "Seagate Barracuda 2TB harde schijf", cat: "storage", expect: true },
  { name: "ICY BOX Mini M.2 NVMe SSD externe behuizing", cat: "storage", expect: false },
  { name: "ACT Connectivity M.2 NVMe/PCIe SSD dockingstation, USB-C 3.2 Gen2", cat: "storage", expect: false },
  { name: "DeLOCK Bevestigingskit voor SATA en NVMe M.2 SSD's schroevenset", cat: "storage", expect: false },
  // — psu —
  { name: "Corsair RM850x 850W 80+ Gold volledig modulaire voeding", cat: "psu", expect: true },
  { name: "be quiet! Pure Power 12 M 750W 80+ Gold ATX 3.0", cat: "psu", expect: true },
  { name: "Gamdias Mars E4M Desktop Micro Tower Case mATX INCLUSIEF 250W Voeding", cat: "psu", expect: false },
  // — case —
  { name: "Corsair 3000D RGB Airflow - Midtowermodel ATX - Gehard Glas - Zwart", cat: "case", expect: true },
  { name: "Lian Li PC-O11 Dynamic Mini V2 Black Behuizing", cat: "case", expect: true },
  { name: "PUTORSEN Hoogte Verstelbare PC Tower Standaard 2 Etages, met Wieltjes en Muismat", cat: "case", expect: false },
  // — cooling —
  { name: "ARCTIC Liquid Freezer III Pro 360 - Waterkoeling PC, CPU AIO Waterkoeler", cat: "cooling", expect: true },
  { name: "be quiet! Dark Rock Pro 5 CPU-koeler", cat: "cooling", expect: true },
  { name: "DeepCool LT520 waterkoeler", cat: "cooling", expect: true },
  { name: "Corsair iCUE LINK AIO LCD Screen Module White - LCD-display", cat: "cooling", expect: false },
  // CPU's die als "koeling" of andersom binnenkwamen
  { name: "AMD Ryzen 7 9800X3D Tray - Processor - 4.7 GHz - AM5 Socket - zonder koeler - OEM verpakking", cat: "cooling", expect: false },
  { name: "AMD Ryzen 7 9800X3D Tray - Processor - 4.7 GHz - AM5 Socket - zonder koeler - OEM verpakking", cat: "cpu", expect: true },
  { name: "Azerty Combokit ASUS 9800X3D - Combokit - AMD Ryzen 7 9800X3D - ASUS TUF Gaming B650-Plus WiFi", cat: "cpu", expect: false },
  // — microphone —
  { name: "HyperX QuadCast S RGB USB-microfoon", cat: "microphone", expect: true },
  { name: "Logitech G PRO X Gaming Headset", cat: "microphone", expect: false },
  // — webcam —
  { name: "Logitech C920 HD Pro Webcam 1080p", cat: "webcam", expect: true },
  { name: "Webcam privacy cover schuifje 3-pack", cat: "webcam", expect: false },
  // — speaker —
  { name: "Logitech Z313 2.1 Speakerset met subwoofer", cat: "speaker", expect: true },
  { name: "Sony WH-1000XM5 draadloze koptelefoon", cat: "speaker", expect: false },
  // — casefan —
  { name: "ARCTIC P12 PWM PST 120mm case fan", cat: "casefan", expect: true },
  { name: "be quiet! Dark Rock Pro 5 CPU-koeler", cat: "casefan", expect: false },
  // — thermalpaste —
  { name: "Thermal Grizzly Kryonaut 1g koelpasta", cat: "thermalpaste", expect: true },
  { name: "ARCTIC Thermal Pad 120x20mm 1.5mm", cat: "thermalpaste", expect: false },
  // — soundcard —
  { name: "Creative Sound Blaster Z SE interne geluidskaart", cat: "soundcard", expect: true },
  // — networkcard —
  { name: "TP-Link Archer TX55E Wifi 6 PCIe kaart", cat: "networkcard", expect: true },
  { name: "TP-Link Archer AX73 AX5400 router", cat: "networkcard", expect: false },
  // — capturecard —
  { name: "Elgato Game Capture HD60 X", cat: "capturecard", expect: true },
  { name: "Elgato Stream Deck MK.2", cat: "capturecard", expect: false },
  // — os —
  { name: "Microsoft Windows 11 Home NL licentie", cat: "os", expect: true },
  { name: "Microsoft Office 2021 Home & Student", cat: "os", expect: false },
  // — accessory —
  { name: "EZDIY-FAB PCIe 4.0 riser kabel verticaal", cat: "accessory", expect: true },
  { name: "Samsung 990 Pro 2TB NVMe M.2 SSD", cat: "accessory", expect: false },
];

const NAME_CASES: { raw: string; want: string }[] = [
  {
    raw: "Amd Ryzen 5 8500G 3,50/5,00 Ghz Behuizing Voor S-Am5 Computer, Hoge Prestaties.",
    want: "AMD Ryzen 5 8500G 3,50/5,00 GHz",
  },
  {
    raw: "Wees Stil! Dark Rock Slim Bk024 120Mm Cpu-Koeler Voor Am4-Moederbord",
    want: "be quiet! Dark Rock Slim Bk024 120mm CPU-Koeler Voor AM4-Moederbord",
  },
  { raw: "ATX Semi-tower Box Fractal North Black", want: "Fractal North Black" },
  { raw: "Box Ventilator Noctua NH-D15 chromax.black", want: "Noctua NH-D15 chromax.black" },
  { raw: "ATX Box Hyte Y60 Black/White White", want: "Hyte Y60 Black/White White" },
  {
    raw: "Processor AMD Ryzen 7 7800X3D AMD Ryzen 7 7800X3D AMD AM5",
    want: "AMD Ryzen 7 7800X3D AMD AM5",
  },
  { raw: "Motherboard Asus PRIME Z790-A WIFI", want: "ASUS PRIME Z790-A WiFi" },
  // Nette namen moeten ongemoeid blijven
  { raw: "Intel Core i7-14700K", want: "Intel Core i7-14700K" },
  { raw: "Kingston FURY Beast Black - RAM-geheugen - DDR5 - 32GB", want: "Kingston FURY Beast Black - RAM-geheugen - DDR5 - 32GB" },
];

let failed = 0;
for (const { name, cat, expect } of CASES) {
  const got = matchesCategory(name, cat);
  if (got !== expect) {
    failed++;
    console.log(`FAIL [${cat}] expect=${expect} got=${got}  ${name}`);
  }
}

for (const { raw, want } of NAME_CASES) {
  const got = cleanName(raw);
  if (got !== want) {
    failed++;
    console.log(`FAIL cleanName\n  raw:  ${raw}\n  want: ${want}\n  got:  ${got}`);
  }
}

console.log(`\n${CASES.length + NAME_CASES.length - failed}/${CASES.length + NAME_CASES.length} cases OK`);
console.log("isJunk('Schleich Harry Potter speelfiguur'):", isJunk("Schleich Harry Potter speelfiguur"));
console.log("inferCategory('AMD Ryzen 7 9800X3D Processor'):", inferCategory("AMD Ryzen 7 9800X3D Processor"));
console.log("inferCategory('ASUS Dual GeForce RTX 5060 grafische kaart'):", inferCategory("ASUS Dual GeForce RTX 5060 grafische kaart"));
if (failed > 0) process.exit(1);
