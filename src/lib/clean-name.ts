/**
 * Titel-normalisatie voor scrape-resultaten.
 *
 * Vooral Bol-titels zijn vaak machinevertaald of door marketplace-verkopers
 * verminkt: "Wees Stil! ... Cpu-Koeler Voor Am4-Moederbord" (be quiet!),
 * "ATX Semi-tower Box Fractal North", "Amd ... 3,50/5,00 Ghz", of een twee
 * keer herhaalde productnaam. Deze module maakt daar leesbare titels van.
 *
 * Spiegel van scrapers/corebuild_scrapers/clean_name.py — bij wijzigingen
 * beide bestanden bijwerken.
 */

/** Verminkte merknamen (letterlijke vertalingen e.d.). */
const BRAND_FIXES: [RegExp, string][] = [
  [/\bwees stil!?/gi, "be quiet!"],
];

/** Beschrijvende categorie-prefixen die vóór de echte productnaam staan. */
const PREFIX_STRIP =
  /^(atx (semi-?tower )?box|box ventilator( pc)?|motherboard|processor|cpu -)\s+/i;

/** Vertaalde/nietszeggende marketing-fragmenten. */
const NOISE_FRAGMENTS: RegExp[] = [
  /\bbehuizing voor s-?am\d+ computer\b/gi, // "Box for S-AM5 computer" = boxed
  /,?\s*hoge prestaties\.?$/gi,
];

/** Correcte schrijfwijze van veelvoorkomende termen (case-insensitive match). */
const CASING: Record<string, string> = {
  amd: "AMD",
  intel: "Intel",
  ryzen: "Ryzen",
  nvidia: "NVIDIA",
  geforce: "GeForce",
  radeon: "Radeon",
  asus: "ASUS",
  msi: "MSI",
  ghz: "GHz",
  mhz: "MHz",
  cpu: "CPU",
  gpu: "GPU",
  psu: "PSU",
  ddr3: "DDR3",
  ddr4: "DDR4",
  ddr5: "DDR5",
  nvme: "NVMe",
  rtx: "RTX",
  gtx: "GTX",
  atx: "ATX",
  wifi: "WiFi",
  usb: "USB",
  hdmi: "HDMI",
  ssd: "SSD",
  hdd: "HDD",
  argb: "ARGB",
  rgb: "RGB",
  pwm: "PWM",
  aio: "AIO",
  oem: "OEM",
  am4: "AM4",
  am5: "AM5",
  lga: "LGA",
  pcie: "PCIe",
};

/** Verwijder een direct herhaalde woordreeks ("Fractal North Fractal North"). */
function dedupePhrases(name: string): string {
  const tokens = name.split(/\s+/);
  for (let len = Math.floor(tokens.length / 2); len >= 1; len--) {
    for (let i = 0; i + 2 * len <= tokens.length; i++) {
      const a = tokens.slice(i, i + len).join(" ").toLowerCase();
      const b = tokens.slice(i + len, i + 2 * len).join(" ").toLowerCase();
      if (a === b) {
        tokens.splice(i + len, len);
        return dedupePhrases(tokens.join(" "));
      }
    }
  }
  return tokens.join(" ");
}

export function cleanName(raw: string): string {
  let name = raw.replace(/\s+/g, " ").trim();

  for (const [re, fix] of BRAND_FIXES) name = name.replace(re, fix);
  name = name.replace(PREFIX_STRIP, "");
  for (const re of NOISE_FRAGMENTS) name = name.replace(re, "");

  // Schrijfwijze per term, alleen op woordgrenzen ("Ghz" → "GHz", "Cpu" → "CPU")
  for (const [key, value] of Object.entries(CASING)) {
    name = name.replace(new RegExp(`\\b${key}\\b`, "gi"), value);
  }
  // "120Mm" → "120mm", "Rx 7600" → "RX 7600" (alleen met cijfers erachter)
  name = name.replace(/\b(\d+)\s?mm\b/gi, "$1mm");
  name = name.replace(/\brx(?=\s?\d{3,4})/gi, "RX");

  name = dedupePhrases(name);

  // Losse scheidingstekens en restkomma's opruimen
  name = name
    .replace(/\s+([,.])/g, "$1")
    .replace(/,\s*,/g, ",")
    .replace(/\s{2,}/g, " ")
    .replace(/[\s,.\-–|]+$/g, "")
    .trim();

  return name.length >= 3 ? name : raw.trim();
}
