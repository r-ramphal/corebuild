import type { ComponentType } from "./types";

/** Kerncomponenten die in de PC Builder als slot verschijnen. */
export const COMPONENT_TYPES: ComponentType[] = [
  "cpu",
  "gpu",
  "motherboard",
  "ram",
  "storage",
  "psu",
  "case",
  "cooling",
];

/** Randapparatuur — wel te vergelijken in de catalogus, geen build-slot. */
export const PERIPHERAL_TYPES: ComponentType[] = [
  "monitor",
  "keyboard",
  "mouse",
  "headset",
];

/** Alle browsbare categorieën (kerncomponenten + randapparatuur). */
export const CATALOG_TYPES: ComponentType[] = [...COMPONENT_TYPES, ...PERIPHERAL_TYPES];

export const COMPONENT_META: Record<
  ComponentType,
  {
    label: string;
    shortLabel: string;
    pageTitle: string;
    description: string;
    emptyText: string;
    searchTerm: string;
    popularTags: string[];
    wattage: number;
    /** Randapparaat: verschijnt niet als build-slot en telt niet mee in wattage. */
    peripheral?: boolean;
  }
> = {
  cpu: {
    label: "Processor",
    shortLabel: "CPU",
    pageTitle: "Processors (CPU)",
    description:
      "Vind de beste prijzen voor de nieuwste processors van AMD en Intel. Vergelijk specificaties, voorraad en prijzen van alle grote retailers.",
    emptyText: "Selecteer een processor",
    searchTerm: "processor",
    popularTags: ["Ryzen 7 9700X", "Core i7-14700K", "Ryzen 5 9600X", "Core i5-14600K", "Ryzen 9 9900X"],
    wattage: 95,
  },
  gpu: {
    label: "Videokaart",
    shortLabel: "GPU",
    pageTitle: "Videokaarten (GPU)",
    description:
      "Vind de beste prijzen voor de nieuwste videokaarten van NVIDIA en AMD. Vergelijk specificaties, voorraad en prijzen van alle grote retailers.",
    emptyText: "Nog geen videokaart geselecteerd",
    searchTerm: "videokaart RTX",
    popularTags: ["RTX 4070", "RTX 4080 Super", "RTX 4060 Ti", "RX 7900 XTX", "RX 7800 XT"],
    wattage: 220,
  },
  motherboard: {
    label: "Moederbord",
    shortLabel: "Moederbord",
    pageTitle: "Moederborden",
    description:
      "Vind de beste prijzen voor moederborden van ASUS, MSI en Gigabyte. Vergelijk specificaties, voorraad en prijzen van alle grote retailers.",
    emptyText: "Selecteer een moederbord",
    searchTerm: "moederbord ATX motherboard",
    popularTags: ["B650 ATX", "Z790 ATX", "B760M DDR5", "X670E", "B650E"],
    wattage: 30,
  },
  ram: {
    label: "RAM",
    shortLabel: "RAM",
    pageTitle: "Werkgeheugen (RAM)",
    description:
      "Vind de beste prijzen voor DDR4- en DDR5-werkgeheugen. Vergelijk specificaties, voorraad en prijzen van alle grote retailers.",
    emptyText: "Voeg werkgeheugen toe",
    searchTerm: "DDR5 RAM geheugen",
    popularTags: ["32GB DDR5-6000", "16GB DDR5-5200", "32GB DDR4-3200", "Corsair Vengeance DDR5"],
    wattage: 10,
  },
  storage: {
    label: "Opslag",
    shortLabel: "Opslag",
    pageTitle: "Opslag (SSD & HDD)",
    description:
      "Vind de beste prijzen voor NVMe SSD's en harde schijven. Vergelijk specificaties, voorraad en prijzen van alle grote retailers.",
    emptyText: "Selecteer een SSD of HDD",
    searchTerm: "NVMe SSD M.2",
    popularTags: ["Samsung 990 Pro 2TB", "WD Black SN850X 2TB", "Crucial P3 Plus 2TB", "Seagate Barracuda"],
    wattage: 7,
  },
  psu: {
    label: "Voeding",
    shortLabel: "PSU",
    pageTitle: "Voedingen (PSU)",
    description:
      "Vind de beste prijzen voor betrouwbare voedingen. Vergelijk specificaties, voorraad en prijzen van alle grote retailers.",
    emptyText: "Kies een voeding",
    searchTerm: "voeding PSU 850W ATX",
    popularTags: ["Corsair RM850x", "Seasonic Focus GX-850", "be quiet! 850W", "750W 80+ Gold"],
    wattage: 0,
  },
  case: {
    label: "Behuizing",
    shortLabel: "Behuizing",
    pageTitle: "Behuizingen",
    description:
      "Vind de beste prijzen voor pc-behuizingen in elk formaat. Vergelijk specificaties, voorraad en prijzen van alle grote retailers.",
    emptyText: "Selecteer een case",
    searchTerm: "pc behuizing ATX tower",
    popularTags: ["Fractal Design North", "NZXT H9 Flow", "Lian Li O11 Dynamic", "be quiet! Pure Base 500"],
    wattage: 5,
  },
  cooling: {
    label: "Koeling",
    shortLabel: "Koeling",
    pageTitle: "Koeling",
    description:
      "Vind de beste prijzen voor luchtkoelers en AIO-waterkoeling. Vergelijk specificaties, voorraad en prijzen van alle grote retailers.",
    emptyText: "Kies een CPU koeler",
    searchTerm: "CPU koeler AIO waterkoeling",
    popularTags: ["Noctua NH-D15", "be quiet! Dark Rock Pro 5", "Corsair H150i Elite", "Arctic Liquid Freezer III"],
    wattage: 10,
  },
  monitor: {
    label: "Monitor",
    shortLabel: "Monitor",
    pageTitle: "Monitoren",
    description:
      "Maak je build af met het juiste scherm. Vergelijk gaming- en werkmonitoren op resolutie, refreshrate en prijs.",
    emptyText: "Kies een monitor",
    searchTerm: "gaming monitor",
    popularTags: ["1440p 144Hz", "27 inch", "4K monitor", "ultrawide", "240Hz"],
    wattage: 0,
    peripheral: true,
  },
  keyboard: {
    label: "Toetsenbord",
    shortLabel: "Toetsenbord",
    pageTitle: "Toetsenborden",
    description:
      "Van mechanisch tot draadloos: vergelijk toetsenborden van de grote retailers op prijs en voorraad.",
    emptyText: "Kies een toetsenbord",
    searchTerm: "mechanisch toetsenbord",
    popularTags: ["mechanisch toetsenbord", "draadloos toetsenbord", "60% keyboard", "gaming toetsenbord"],
    wattage: 0,
    peripheral: true,
  },
  mouse: {
    label: "Muis",
    shortLabel: "Muis",
    pageTitle: "Muizen",
    description:
      "Vergelijk gaming- en kantoormuizen op prijs en voorraad bij alle grote retailers.",
    emptyText: "Kies een muis",
    searchTerm: "gaming muis",
    popularTags: ["draadloze muis", "gaming muis", "lichtgewicht muis", "Logitech muis"],
    wattage: 0,
    peripheral: true,
  },
  headset: {
    label: "Headset",
    shortLabel: "Headset",
    pageTitle: "Headsets",
    description:
      "Vergelijk gaming-headsets en koptelefoons op prijs en voorraad bij alle grote retailers.",
    emptyText: "Kies een headset",
    searchTerm: "gaming headset",
    popularTags: ["draadloze headset", "gaming headset", "7.1 surround", "Bluetooth koptelefoon"],
    wattage: 0,
    peripheral: true,
  },
};
