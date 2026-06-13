/**
 * GPU-prestatiedatabase voor de build-intelligentie.
 *
 * `index` is een relatieve gaming-prestatie-index (0–100, rasterization op
 * ~1440p), waarbij de RTX 5090 op 100 staat. De getallen zijn een *indicatie*
 * op basis van publieke benchmark-gemiddelden — niet exact, bedoeld om builds
 * te vergelijken en FPS te schatten, niet als absolute waarheid.
 *
 * `aliases` zijn lowercase-fragmenten die in productnamen voorkomen; de
 * detector (detect.ts) matcht het meest specifieke alias eerst.
 */
export interface GpuSpec {
  id: string;
  label: string;
  brand: "nvidia" | "amd" | "intel";
  /** Relatieve gaming-index (0–100, 5090 = 100). */
  index: number;
  /** Videogeheugen in GB. */
  vramGb: number;
  /** Typisch board-verbruik in watt. */
  tdp: number;
  /** Aanbevolen totale PSU-wattage voor een systeem met deze kaart. */
  recommendedPsu: number;
  releaseYear: number;
  aliases: string[];
}

export const GPUS: GpuSpec[] = [
  // — NVIDIA RTX 50-serie —
  { id: "rtx-5090", label: "GeForce RTX 5090", brand: "nvidia", index: 100, vramGb: 32, tdp: 575, recommendedPsu: 1000, releaseYear: 2025, aliases: ["rtx 5090"] },
  { id: "rtx-5080", label: "GeForce RTX 5080", brand: "nvidia", index: 79, vramGb: 16, tdp: 360, recommendedPsu: 850, releaseYear: 2025, aliases: ["rtx 5080"] },
  { id: "rtx-5070-ti", label: "GeForce RTX 5070 Ti", brand: "nvidia", index: 70, vramGb: 16, tdp: 300, recommendedPsu: 750, releaseYear: 2025, aliases: ["rtx 5070 ti"] },
  { id: "rtx-5070", label: "GeForce RTX 5070", brand: "nvidia", index: 58, vramGb: 12, tdp: 250, recommendedPsu: 700, releaseYear: 2025, aliases: ["rtx 5070"] },
  { id: "rtx-5060-ti", label: "GeForce RTX 5060 Ti", brand: "nvidia", index: 47, vramGb: 16, tdp: 180, recommendedPsu: 600, releaseYear: 2025, aliases: ["rtx 5060 ti"] },
  { id: "rtx-5060", label: "GeForce RTX 5060", brand: "nvidia", index: 39, vramGb: 8, tdp: 145, recommendedPsu: 550, releaseYear: 2025, aliases: ["rtx 5060"] },

  // — NVIDIA RTX 40-serie —
  { id: "rtx-4090", label: "GeForce RTX 4090", brand: "nvidia", index: 88, vramGb: 24, tdp: 450, recommendedPsu: 1000, releaseYear: 2022, aliases: ["rtx 4090"] },
  { id: "rtx-4080-super", label: "GeForce RTX 4080 Super", brand: "nvidia", index: 73, vramGb: 16, tdp: 320, recommendedPsu: 850, releaseYear: 2024, aliases: ["rtx 4080 super"] },
  { id: "rtx-4080", label: "GeForce RTX 4080", brand: "nvidia", index: 71, vramGb: 16, tdp: 320, recommendedPsu: 800, releaseYear: 2022, aliases: ["rtx 4080"] },
  { id: "rtx-4070-ti-super", label: "GeForce RTX 4070 Ti Super", brand: "nvidia", index: 64, vramGb: 16, tdp: 285, recommendedPsu: 750, releaseYear: 2024, aliases: ["rtx 4070 ti super"] },
  { id: "rtx-4070-ti", label: "GeForce RTX 4070 Ti", brand: "nvidia", index: 60, vramGb: 12, tdp: 285, recommendedPsu: 700, releaseYear: 2023, aliases: ["rtx 4070 ti"] },
  { id: "rtx-4070-super", label: "GeForce RTX 4070 Super", brand: "nvidia", index: 56, vramGb: 12, tdp: 220, recommendedPsu: 700, releaseYear: 2024, aliases: ["rtx 4070 super"] },
  { id: "rtx-4070", label: "GeForce RTX 4070", brand: "nvidia", index: 49, vramGb: 12, tdp: 200, recommendedPsu: 650, releaseYear: 2023, aliases: ["rtx 4070"] },
  { id: "rtx-4060-ti", label: "GeForce RTX 4060 Ti", brand: "nvidia", index: 40, vramGb: 8, tdp: 160, recommendedPsu: 550, releaseYear: 2023, aliases: ["rtx 4060 ti"] },
  { id: "rtx-4060", label: "GeForce RTX 4060", brand: "nvidia", index: 35, vramGb: 8, tdp: 115, recommendedPsu: 550, releaseYear: 2023, aliases: ["rtx 4060"] },

  // — NVIDIA RTX 30-serie —
  { id: "rtx-3090", label: "GeForce RTX 3090", brand: "nvidia", index: 60, vramGb: 24, tdp: 350, recommendedPsu: 800, releaseYear: 2020, aliases: ["rtx 3090"] },
  { id: "rtx-3080", label: "GeForce RTX 3080", brand: "nvidia", index: 51, vramGb: 10, tdp: 320, recommendedPsu: 750, releaseYear: 2020, aliases: ["rtx 3080"] },
  { id: "rtx-3070", label: "GeForce RTX 3070", brand: "nvidia", index: 42, vramGb: 8, tdp: 220, recommendedPsu: 650, releaseYear: 2020, aliases: ["rtx 3070"] },
  { id: "rtx-3060-ti", label: "GeForce RTX 3060 Ti", brand: "nvidia", index: 38, vramGb: 8, tdp: 200, recommendedPsu: 600, releaseYear: 2020, aliases: ["rtx 3060 ti"] },
  { id: "rtx-3060", label: "GeForce RTX 3060", brand: "nvidia", index: 29, vramGb: 12, tdp: 170, recommendedPsu: 550, releaseYear: 2021, aliases: ["rtx 3060"] },
  { id: "rtx-3050", label: "GeForce RTX 3050", brand: "nvidia", index: 20, vramGb: 8, tdp: 130, recommendedPsu: 500, releaseYear: 2022, aliases: ["rtx 3050"] },
  { id: "gtx-1660-super", label: "GeForce GTX 1660 Super", brand: "nvidia", index: 17, vramGb: 6, tdp: 125, recommendedPsu: 450, releaseYear: 2019, aliases: ["gtx 1660 super", "gtx 1660"] },

  // — AMD Radeon RX 9000-serie —
  { id: "rx-9070-xt", label: "Radeon RX 9070 XT", brand: "amd", index: 65, vramGb: 16, tdp: 304, recommendedPsu: 750, releaseYear: 2025, aliases: ["rx 9070 xt"] },
  { id: "rx-9070", label: "Radeon RX 9070", brand: "amd", index: 58, vramGb: 16, tdp: 220, recommendedPsu: 700, releaseYear: 2025, aliases: ["rx 9070"] },
  { id: "rx-9060-xt", label: "Radeon RX 9060 XT", brand: "amd", index: 42, vramGb: 16, tdp: 160, recommendedPsu: 550, releaseYear: 2025, aliases: ["rx 9060 xt"] },

  // — AMD Radeon RX 7000-serie —
  { id: "rx-7900-xtx", label: "Radeon RX 7900 XTX", brand: "amd", index: 72, vramGb: 24, tdp: 355, recommendedPsu: 800, releaseYear: 2022, aliases: ["rx 7900 xtx"] },
  { id: "rx-7900-xt", label: "Radeon RX 7900 XT", brand: "amd", index: 64, vramGb: 20, tdp: 315, recommendedPsu: 750, releaseYear: 2022, aliases: ["rx 7900 xt"] },
  { id: "rx-7900-gre", label: "Radeon RX 7900 GRE", brand: "amd", index: 57, vramGb: 16, tdp: 260, recommendedPsu: 700, releaseYear: 2024, aliases: ["rx 7900 gre"] },
  { id: "rx-7800-xt", label: "Radeon RX 7800 XT", brand: "amd", index: 52, vramGb: 16, tdp: 263, recommendedPsu: 700, releaseYear: 2023, aliases: ["rx 7800 xt"] },
  { id: "rx-7700-xt", label: "Radeon RX 7700 XT", brand: "amd", index: 45, vramGb: 12, tdp: 245, recommendedPsu: 650, releaseYear: 2023, aliases: ["rx 7700 xt"] },
  { id: "rx-7600-xt", label: "Radeon RX 7600 XT", brand: "amd", index: 36, vramGb: 16, tdp: 190, recommendedPsu: 550, releaseYear: 2024, aliases: ["rx 7600 xt"] },
  { id: "rx-7600", label: "Radeon RX 7600", brand: "amd", index: 33, vramGb: 8, tdp: 165, recommendedPsu: 550, releaseYear: 2023, aliases: ["rx 7600"] },

  // — AMD Radeon RX 6000-serie —
  { id: "rx-6800-xt", label: "Radeon RX 6800 XT", brand: "amd", index: 48, vramGb: 16, tdp: 300, recommendedPsu: 750, releaseYear: 2020, aliases: ["rx 6800 xt"] },
  { id: "rx-6700-xt", label: "Radeon RX 6700 XT", brand: "amd", index: 38, vramGb: 12, tdp: 230, recommendedPsu: 650, releaseYear: 2021, aliases: ["rx 6700 xt"] },
  { id: "rx-6600", label: "Radeon RX 6600", brand: "amd", index: 26, vramGb: 8, tdp: 132, recommendedPsu: 500, releaseYear: 2021, aliases: ["rx 6600"] },

  // — Intel Arc —
  { id: "arc-b580", label: "Arc B580", brand: "intel", index: 36, vramGb: 12, tdp: 190, recommendedPsu: 550, releaseYear: 2024, aliases: ["arc b580"] },
  { id: "arc-a770", label: "Arc A770", brand: "intel", index: 32, vramGb: 16, tdp: 225, recommendedPsu: 600, releaseYear: 2022, aliases: ["arc a770"] },
];
