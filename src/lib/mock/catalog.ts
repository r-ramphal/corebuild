import { COMPONENT_META } from "@/lib/categories";
import type { ComponentType, PriceResult, Retailer } from "@/lib/types";

/**
 * Demo-catalogus voor retailers waarvan de API nog niet beschikbaar is
 * (Bol: KvK vereist, Amazon: 3 verkopen vereist voor PA-API).
 *
 * Zodra de database er is (fase 2 van het plan) verhuist deze data daarheen
 * en vullen de Python-scrapers / officiële API's dezelfde tabel.
 */

interface MockProduct {
  name: string;
  category: ComponentType;
  price: number;
  keywords?: string[];
}

export const MOCK_CATALOG: MockProduct[] = [
  // CPU
  { name: "AMD Ryzen 7 9800X3D", category: "cpu", price: 479, keywords: ["am5", "gaming"] },
  { name: "AMD Ryzen 5 9600X", category: "cpu", price: 229, keywords: ["am5"] },
  { name: "AMD Ryzen 7 7800X3D", category: "cpu", price: 389, keywords: ["am5", "gaming"] },
  { name: "Intel Core i7-14700K", category: "cpu", price: 365, keywords: ["lga1700"] },
  { name: "Intel Core i5-14600K", category: "cpu", price: 259, keywords: ["lga1700"] },
  { name: "AMD Ryzen 9 9950X", category: "cpu", price: 599, keywords: ["am5"] },

  // GPU
  { name: "MSI GeForce RTX 4070 GAMING X SLIM 12G", category: "gpu", price: 629, keywords: ["nvidia", "rtx 4070"] },
  { name: "ASUS Dual GeForce RTX 4070 SUPER EVO OC", category: "gpu", price: 649, keywords: ["nvidia", "rtx 4070"] },
  { name: "Gigabyte GeForce RTX 5070 WINDFORCE OC 12G", category: "gpu", price: 689, keywords: ["nvidia", "rtx 5070"] },
  { name: "ASUS TUF Gaming Radeon RX 7800 XT OC", category: "gpu", price: 519, keywords: ["amd", "radeon"] },
  { name: "MSI GeForce RTX 4060 VENTUS 2X BLACK 8G", category: "gpu", price: 309, keywords: ["nvidia", "rtx 4060"] },
  { name: "Sapphire NITRO+ Radeon RX 7900 XTX", category: "gpu", price: 929, keywords: ["amd", "radeon"] },

  // Moederbord
  { name: "ASUS TUF Gaming B650-Plus WiFi", category: "motherboard", price: 169, keywords: ["am5", "atx"] },
  { name: "MSI MAG B650 Tomahawk WiFi", category: "motherboard", price: 209, keywords: ["am5", "atx"] },
  { name: "Gigabyte Z790 AORUS Elite AX", category: "motherboard", price: 229, keywords: ["lga1700", "atx"] },
  { name: "ASRock B650M Pro RS WiFi", category: "motherboard", price: 139, keywords: ["am5", "matx"] },

  // RAM
  { name: "Corsair Vengeance 32GB DDR5-6000 CL30", category: "ram", price: 115, keywords: ["ddr5"] },
  { name: "G.Skill Trident Z5 Neo RGB 32GB DDR5-6400", category: "ram", price: 139, keywords: ["ddr5"] },
  { name: "Kingston FURY Beast 16GB DDR5-5200", category: "ram", price: 59, keywords: ["ddr5"] },
  { name: "Corsair Vengeance LPX 32GB DDR4-3200", category: "ram", price: 72, keywords: ["ddr4"] },

  // Opslag
  { name: "Samsung 990 PRO 2TB NVMe SSD", category: "storage", price: 169, keywords: ["m.2", "nvme"] },
  { name: "WD Black SN850X 2TB NVMe SSD", category: "storage", price: 149, keywords: ["m.2", "nvme"] },
  { name: "Crucial P3 Plus 2TB NVMe SSD", category: "storage", price: 115, keywords: ["m.2", "nvme"] },
  { name: "Samsung 990 EVO 1TB NVMe SSD", category: "storage", price: 84, keywords: ["m.2", "nvme"] },
  { name: "Seagate BarraCuda 4TB HDD", category: "storage", price: 92, keywords: ["3.5", "harde schijf"] },

  // PSU
  { name: "Corsair RM850x (2024) 850W 80+ Gold", category: "psu", price: 139, keywords: ["modulair", "850w"] },
  { name: "Seasonic FOCUS GX-850 850W 80+ Gold", category: "psu", price: 129, keywords: ["modulair", "850w"] },
  { name: "be quiet! Pure Power 12 M 750W 80+ Gold", category: "psu", price: 105, keywords: ["modulair", "750w"] },
  { name: "NZXT C650 650W 80+ Gold", category: "psu", price: 89, keywords: ["modulair", "650w"] },

  // Behuizing
  { name: "Fractal Design North Charcoal Black", category: "case", price: 139, keywords: ["atx", "tower"] },
  { name: "NZXT H9 Flow", category: "case", price: 159, keywords: ["atx", "tower"] },
  { name: "Lian Li O11 Dynamic EVO", category: "case", price: 149, keywords: ["atx", "tower"] },
  { name: "be quiet! Pure Base 500DX", category: "case", price: 99, keywords: ["atx", "tower"] },

  // Koeling
  { name: "Noctua NH-D15 chromax.black", category: "cooling", price: 109, keywords: ["luchtkoeler"] },
  { name: "be quiet! Dark Rock Pro 5", category: "cooling", price: 99, keywords: ["luchtkoeler"] },
  { name: "Arctic Liquid Freezer III 360", category: "cooling", price: 129, keywords: ["aio", "waterkoeling"] },
  { name: "Thermalright Peerless Assassin 120 SE", category: "cooling", price: 42, keywords: ["luchtkoeler"] },
];

/** Deterministische hash zodat demo-prijzen stabiel blijven tussen requests. */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

const SEARCH_URL: Record<string, (name: string) => string> = {
  bol: (name) => `https://www.bol.com/nl/nl/s/?searchtext=${encodeURIComponent(name)}`,
  amazon: (name) => `https://www.amazon.nl/s?k=${encodeURIComponent(name)}`,
};

/**
 * Zoek in de demo-catalogus. Prijzen krijgen een kleine deterministische
 * variatie per retailer zodat de vergelijking realistisch oogt.
 */
export function searchMock(retailer: Retailer, query: string): PriceResult[] {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);

  const haystack = (p: MockProduct) =>
    [
      p.name,
      COMPONENT_META[p.category].label,
      COMPONENT_META[p.category].shortLabel,
      COMPONENT_META[p.category].searchTerm,
      ...(p.keywords ?? []),
    ]
      .join(" ")
      .toLowerCase();

  // Eerst: alle zoektermen matchen; anders: minstens één betekenisvolle term
  let matches = MOCK_CATALOG.filter((p) => tokens.every((t) => haystack(p).includes(t)));
  if (matches.length === 0) {
    matches = MOCK_CATALOG.filter((p) =>
      tokens.some((t) => t.length >= 3 && haystack(p).includes(t))
    );
  }

  return matches.slice(0, 8).map((p) => {
    const h = hash(`${retailer}:${p.name}`);
    const variance = 0.97 + (h % 9) / 100; // 0.97 – 1.05
    const priceEur = Math.round(p.price * variance * 100) / 100;
    const inStock = h % 8 !== 3; // ~1 op 8 niet leverbaar

    return {
      retailer,
      name: p.name,
      priceEur,
      url: (SEARCH_URL[retailer] ?? SEARCH_URL.bol)(p.name),
      inStock,
      mock: true,
    };
  });
}
