import type { ComponentType } from "./types";

/**
 * Curated voorbeeldbuilds — vaste, met de hand samengestelde complete pc's per
 * budget/gebruik. Bewust statisch (geen live catalogus): stabiel tegen voorraad,
 * makkelijk te onderhouden. Elk onderdeel linkt door naar /zoeken zodat de
 * bezoeker de ACTUELE prijs vergelijkt.
 *
 * `budgetEur` is een **indicatie**, geen belofte: de echte prijs schommelt met de
 * dagprijzen (vooral geheugen en videokaart). De bedragen zijn bewust iets
 * conservatief geschat zodat we niet te laag beloven; controleer ze periodiek
 * tegen de markt. De onderdeelnamen sluiten aan op cpu-data/gpu-data en de
 * FEATURED-build op de homepage. Bijwerken = een rij aanpassen.
 *
 * Laatst gekalibreerd 16 juni 2026 tegen de live catalogus (goedkoopste in-stock,
 * echte NVMe/legit listings) met `npx tsx scripts/calibrate-example-builds.ts`.
 * Onderdelen die toen niet in de catalogus zaten (RTX 5070 Ti, Montech AIR 903,
 * de specifieke Thermalright-koelers, full-size O11 Dynamic) zijn conservatief op
 * marktprijs geschat — vandaar dat sommige budgetten boven de pure catalogus-som liggen.
 */
export interface ExampleBuildPart {
  type: ComponentType;
  /** Concrete productnaam of -klasse (zoekterm voor /zoeken). */
  name: string;
}

export interface ExampleBuild {
  slug: string;
  /** Korte naam, bv. "Budget gamer". */
  name: string;
  /** Eén regel: voor wie / waarvoor. */
  tagline: string;
  /** Gebruiksprofiel-label, bv. "1080p gaming". */
  useCase: string;
  /** Indicatieve richtprijs in hele euro's — schommelt met de dagprijzen, geen belofte. */
  budgetEur: number;
  /** Acht kernonderdelen in bouwvolgorde. */
  parts: ExampleBuildPart[];
}

export const EXAMPLE_BUILDS: ExampleBuild[] = [
  {
    slug: "budget-gamer",
    name: "Budget gamer",
    tagline: "Vlot 1080p gamen zonder te veel uit te geven.",
    useCase: "1080p gaming",
    budgetEur: 1150,
    parts: [
      { type: "cpu", name: "AMD Ryzen 5 7600" },
      { type: "gpu", name: "GeForce RTX 5060" },
      { type: "motherboard", name: "B650 ATX moederbord" },
      { type: "ram", name: "16GB DDR5-6000" },
      { type: "storage", name: "1TB NVMe SSD" },
      { type: "psu", name: "650W 80+ Bronze" },
      { type: "case", name: "Montech AIR 903" },
      { type: "cooling", name: "Thermalright Assassin X 120" },
    ],
  },
  {
    slug: "esports-1080p",
    name: "Esports 1080p",
    tagline: "Hoge framerates voor competitieve shooters.",
    useCase: "1080p high-FPS",
    budgetEur: 1400,
    parts: [
      { type: "cpu", name: "AMD Ryzen 7 7700" },
      { type: "gpu", name: "GeForce RTX 5060 Ti" },
      { type: "motherboard", name: "B650 ATX moederbord" },
      { type: "ram", name: "32GB DDR5-6000" },
      { type: "storage", name: "1TB NVMe SSD" },
      { type: "psu", name: "750W 80+ Gold" },
      { type: "case", name: "Fractal Design Pop Air" },
      { type: "cooling", name: "Thermalright Peerless Assassin 120" },
    ],
  },
  {
    slug: "1440p-gamer",
    name: "1440p gamer",
    tagline: "De sweet spot: vloeiend gamen op 1440p ultra.",
    useCase: "1440p gaming",
    budgetEur: 1950,
    parts: [
      { type: "cpu", name: "AMD Ryzen 7 9800X3D" },
      { type: "gpu", name: "GeForce RTX 5070" },
      { type: "motherboard", name: "B650 ATX moederbord" },
      { type: "ram", name: "32GB DDR5-6000" },
      { type: "storage", name: "2TB NVMe SSD" },
      { type: "psu", name: "750W 80+ Gold" },
      { type: "case", name: "Fractal Design North" },
      { type: "cooling", name: "Thermalright Phantom Spirit 120" },
    ],
  },
  {
    slug: "streamer",
    name: "Streamer",
    tagline: "Gamen én livestreamen tegelijk, met multicore-power.",
    useCase: "gamen + streamen",
    budgetEur: 2200,
    parts: [
      { type: "cpu", name: "AMD Ryzen 9 7900X" },
      { type: "gpu", name: "GeForce RTX 5070 Ti" },
      { type: "motherboard", name: "B650 ATX moederbord" },
      { type: "ram", name: "32GB DDR5-6000" },
      { type: "storage", name: "2TB NVMe SSD" },
      { type: "psu", name: "850W 80+ Gold" },
      { type: "case", name: "NZXT H7 Flow" },
      { type: "cooling", name: "Arctic Liquid Freezer III 280" },
    ],
  },
  {
    slug: "creator",
    name: "Creator",
    tagline: "Editen, renderen en 3D-werk met veel geheugen en cores.",
    useCase: "creator / workstation",
    budgetEur: 2750,
    parts: [
      { type: "cpu", name: "AMD Ryzen 9 9900X" },
      { type: "gpu", name: "GeForce RTX 5070 Ti" },
      { type: "motherboard", name: "X670E ATX moederbord" },
      { type: "ram", name: "64GB DDR5-6000" },
      { type: "storage", name: "2TB NVMe SSD" },
      { type: "psu", name: "850W 80+ Gold" },
      { type: "case", name: "Fractal Design Define 7" },
      { type: "cooling", name: "Noctua NH-D15" },
    ],
  },
  {
    slug: "4k-powerhouse",
    name: "4K powerhouse",
    tagline: "Maximale beeldkwaliteit op 4K, alles op ultra.",
    useCase: "4K gaming",
    budgetEur: 2800,
    parts: [
      { type: "cpu", name: "AMD Ryzen 7 9800X3D" },
      { type: "gpu", name: "GeForce RTX 5080" },
      { type: "motherboard", name: "X670E ATX moederbord" },
      { type: "ram", name: "32GB DDR5-6000" },
      { type: "storage", name: "2TB NVMe SSD" },
      { type: "psu", name: "1000W 80+ Gold" },
      { type: "case", name: "Lian Li O11 Dynamic" },
      { type: "cooling", name: "Arctic Liquid Freezer III 360" },
    ],
  },
];

export function getExampleBuild(slug: string): ExampleBuild | null {
  return EXAMPLE_BUILDS.find((b) => b.slug === slug) ?? null;
}
