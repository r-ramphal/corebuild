/**
 * Unit-tests voor de pure prijsalert-helpers (cross-retailer + drempel-logica).
 * Draait offline (geen DB/netwerk). Run: npx tsx scripts/test-alerts.ts
 */
import {
  siblingUrls,
  lowestPrice,
  alertFires,
  type SiblingListing,
} from "../src/lib/db/alerts";

let failed = 0;
function check(label: string, cond: boolean) {
  console.log(`${cond ? "ok  " : "FAIL"} ${label}`);
  if (!cond) failed++;
}

// ── siblingUrls: cross-retailer matching ────────────────────────────────────
const listings: SiblingListing[] = [
  { category: "cpu", name: "AMD Ryzen 7 9800X3D Processor", url: "https://megekko.nl/a" },
  { category: "cpu", name: "AMD Ryzen 7 9800X3D (boxed)", url: "https://azerty.nl/b" },
  { category: "cpu", name: "Intel Core i7-14700K", url: "https://alternate.nl/c" },
  { category: "gpu", name: "AMD Ryzen 7 9800X3D bundel videokaart", url: "https://x.nl/d" },
];

const cpuAlert = { url: "https://bol.com/own", category: "cpu", name: "AMD Ryzen 7 9800X3D" };
const sib = siblingUrls(cpuAlert, listings);
check("eigen url zit er altijd in", sib.includes("https://bol.com/own"));
check("matcht zelfde product bij andere retailers", sib.includes("https://megekko.nl/a") && sib.includes("https://azerty.nl/b"));
check("matcht geen ander cpu-product", !sib.includes("https://alternate.nl/c"));
check("matcht niet over categorie heen", !sib.includes("https://x.nl/d"));

const shortAlert = { url: "https://r/own", category: "ram", name: "RAM" };
check("te korte naam → alleen eigen url", siblingUrls(shortAlert, listings).length === 1);

// ── lowestPrice ─────────────────────────────────────────────────────────────
const prices = new Map<string, number>([
  ["https://bol.com/own", 49900],
  ["https://megekko.nl/a", 47500],
  ["https://azerty.nl/b", 48200],
]);
const low = lowestPrice(["https://bol.com/own", "https://megekko.nl/a", "https://azerty.nl/b"], prices);
check("laagste prijs gekozen", low?.cents === 47500 && low?.url === "https://megekko.nl/a");
check("urls zonder prijs genegeerd", lowestPrice(["https://geen-prijs"], prices) === null);

// ── alertFires: drempel + anti-spam ─────────────────────────────────────────
check("vuurt op/onder drempel, nog niet gemaild", alertFires(50000, null, 47500) === true);
check("vuurt niet boven drempel", alertFires(45000, null, 47500) === false);
check("vuurt niet bij gelijke/hogere herhaalprijs", alertFires(50000, 47500, 47500) === false);
check("vuurt bij verdere daling na eerdere mail", alertFires(50000, 47500, 46000) === true);

console.log(failed === 0 ? "\nALLE cases — OK" : `\n${failed} FAILS`);
process.exit(failed === 0 ? 0 : 1);
