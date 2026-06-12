import type { ComponentType } from "./types";

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

export const COMPONENT_META: Record<
  ComponentType,
  {
    label: string;
    searchTerm: string;
    popularTags: string[];
    wattage: number;
  }
> = {
  cpu: {
    label: "Processor",
    searchTerm: "processor",
    popularTags: ["Ryzen 7 9700X", "Core i7-14700K", "Ryzen 5 9600X", "Core i5-14600K", "Ryzen 9 9900X"],
    wattage: 95,
  },
  gpu: {
    label: "Videokaart",
    searchTerm: "videokaart RTX",
    popularTags: ["RTX 4070", "RTX 4080 Super", "RTX 4060 Ti", "RX 7900 XTX", "RX 7800 XT"],
    wattage: 220,
  },
  motherboard: {
    label: "Moederbord",
    searchTerm: "moederbord ATX motherboard",
    popularTags: ["B650 ATX", "Z790 ATX", "B760M DDR5", "X670E", "B650E"],
    wattage: 30,
  },
  ram: {
    label: "RAM",
    searchTerm: "DDR5 RAM geheugen",
    popularTags: ["32GB DDR5-6000", "16GB DDR5-5200", "32GB DDR4-3200", "Corsair Vengeance DDR5"],
    wattage: 10,
  },
  storage: {
    label: "Opslag",
    searchTerm: "NVMe SSD M.2",
    popularTags: ["Samsung 990 Pro 2TB", "WD Black SN850X 2TB", "Crucial P3 Plus 2TB", "Seagate Barracuda"],
    wattage: 7,
  },
  psu: {
    label: "Voeding",
    searchTerm: "voeding PSU 850W ATX",
    popularTags: ["Corsair RM850x", "Seasonic Focus GX-850", "be quiet! 850W", "750W 80+ Gold"],
    wattage: 0,
  },
  case: {
    label: "Behuizing",
    searchTerm: "pc behuizing ATX tower",
    popularTags: ["Fractal Design North", "NZXT H9 Flow", "Lian Li O11 Dynamic", "be quiet! Pure Base 500"],
    wattage: 5,
  },
  cooling: {
    label: "Koeling",
    searchTerm: "CPU koeler AIO waterkoeling",
    popularTags: ["Noctua NH-D15", "be quiet! Dark Rock Pro 5", "Corsair H150i Elite", "Arctic Liquid Freezer III"],
    wattage: 10,
  },
};
