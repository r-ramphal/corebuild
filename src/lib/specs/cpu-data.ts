/**
 * CPU-prestatiedatabase voor de build-intelligentie.
 *
 * `gamingIndex` is een relatieve gaming-prestatie-index (0–100) waarbij de
 * Ryzen 7 9800X3D op 100 staat (huidige gaming-koning). `multiIndex` weegt
 * productiviteit/multicore. Beide zijn *indicaties* op basis van publieke
 * benchmark-gemiddelden, bedoeld om builds te vergelijken en FPS te schatten.
 */
export type Socket = "AM5" | "AM4" | "LGA1700" | "LGA1851" | "LGA1200";
export type DdrGen = "DDR4" | "DDR5" | "DDR4/DDR5";

export interface CpuSpec {
  id: string;
  label: string;
  brand: "amd" | "intel";
  /** Relatieve gaming-index (0–100, 9800X3D = 100). */
  gamingIndex: number;
  /** Relatieve multicore/productiviteits-index (0–100). */
  multiIndex: number;
  cores: number;
  threads: number;
  /** Typisch verbruik onder load in watt. */
  tdp: number;
  socket: Socket;
  /** Welk geheugentype het platform ondersteunt. */
  ddr: DdrGen;
  /** Heeft het model een geïntegreerde GPU (kan zonder losse videokaart). */
  igpu: boolean;
  releaseYear: number;
  aliases: string[];
}

export const CPUS: CpuSpec[] = [
  // — AMD Ryzen 9000 (Zen 5) —
  { id: "ryzen-9-9950x3d", label: "Ryzen 9 9950X3D", brand: "amd", gamingIndex: 99, multiIndex: 100, cores: 16, threads: 32, tdp: 170, socket: "AM5", ddr: "DDR5", igpu: true, releaseYear: 2025, aliases: ["9950x3d", "ryzen 9 9950x3d"] },
  { id: "ryzen-9-9900x", label: "Ryzen 9 9900X", brand: "amd", gamingIndex: 84, multiIndex: 90, cores: 12, threads: 24, tdp: 120, socket: "AM5", ddr: "DDR5", igpu: true, releaseYear: 2024, aliases: ["9900x", "ryzen 9 9900x"] },
  { id: "ryzen-7-9800x3d", label: "Ryzen 7 9800X3D", brand: "amd", gamingIndex: 100, multiIndex: 78, cores: 8, threads: 16, tdp: 120, socket: "AM5", ddr: "DDR5", igpu: true, releaseYear: 2024, aliases: ["9800x3d", "ryzen 7 9800x3d"] },
  { id: "ryzen-7-9700x", label: "Ryzen 7 9700X", brand: "amd", gamingIndex: 82, multiIndex: 72, cores: 8, threads: 16, tdp: 65, socket: "AM5", ddr: "DDR5", igpu: true, releaseYear: 2024, aliases: ["9700x", "ryzen 7 9700x"] },
  { id: "ryzen-5-9600x", label: "Ryzen 5 9600X", brand: "amd", gamingIndex: 76, multiIndex: 55, cores: 6, threads: 12, tdp: 65, socket: "AM5", ddr: "DDR5", igpu: true, releaseYear: 2024, aliases: ["9600x", "ryzen 5 9600x"] },

  // — AMD Ryzen 7000 (Zen 4) —
  { id: "ryzen-9-7950x3d", label: "Ryzen 9 7950X3D", brand: "amd", gamingIndex: 95, multiIndex: 96, cores: 16, threads: 32, tdp: 120, socket: "AM5", ddr: "DDR5", igpu: true, releaseYear: 2023, aliases: ["7950x3d", "ryzen 9 7950x3d"] },
  { id: "ryzen-9-7900x", label: "Ryzen 9 7900X", brand: "amd", gamingIndex: 80, multiIndex: 86, cores: 12, threads: 24, tdp: 170, socket: "AM5", ddr: "DDR5", igpu: true, releaseYear: 2022, aliases: ["7900x", "ryzen 9 7900x"] },
  { id: "ryzen-7-7800x3d", label: "Ryzen 7 7800X3D", brand: "amd", gamingIndex: 94, multiIndex: 70, cores: 8, threads: 16, tdp: 120, socket: "AM5", ddr: "DDR5", igpu: true, releaseYear: 2023, aliases: ["7800x3d", "ryzen 7 7800x3d"] },
  { id: "ryzen-7-7700x", label: "Ryzen 7 7700X", brand: "amd", gamingIndex: 78, multiIndex: 68, cores: 8, threads: 16, tdp: 105, socket: "AM5", ddr: "DDR5", igpu: true, releaseYear: 2022, aliases: ["7700x", "ryzen 7 7700x"] },
  { id: "ryzen-5-7600x", label: "Ryzen 5 7600X", brand: "amd", gamingIndex: 73, multiIndex: 52, cores: 6, threads: 12, tdp: 105, socket: "AM5", ddr: "DDR5", igpu: true, releaseYear: 2022, aliases: ["7600x", "ryzen 5 7600x"] },
  { id: "ryzen-5-7600", label: "Ryzen 5 7600", brand: "amd", gamingIndex: 71, multiIndex: 50, cores: 6, threads: 12, tdp: 65, socket: "AM5", ddr: "DDR5", igpu: true, releaseYear: 2023, aliases: ["ryzen 5 7600", "7600"] },
  { id: "ryzen-5-8600g", label: "Ryzen 5 8600G", brand: "amd", gamingIndex: 58, multiIndex: 48, cores: 6, threads: 12, tdp: 65, socket: "AM5", ddr: "DDR5", igpu: true, releaseYear: 2024, aliases: ["8600g", "ryzen 5 8600g"] },
  { id: "ryzen-5-8500g", label: "Ryzen 5 8500G", brand: "amd", gamingIndex: 48, multiIndex: 40, cores: 6, threads: 12, tdp: 65, socket: "AM5", ddr: "DDR5", igpu: true, releaseYear: 2024, aliases: ["8500g", "ryzen 5 8500g"] },

  // — AMD Ryzen 5000 (Zen 3, AM4) —
  { id: "ryzen-7-5800x3d", label: "Ryzen 7 5800X3D", brand: "amd", gamingIndex: 80, multiIndex: 62, cores: 8, threads: 16, tdp: 105, socket: "AM4", ddr: "DDR4", igpu: false, releaseYear: 2022, aliases: ["5800x3d", "ryzen 7 5800x3d"] },
  { id: "ryzen-7-5700x", label: "Ryzen 7 5700X", brand: "amd", gamingIndex: 58, multiIndex: 58, cores: 8, threads: 16, tdp: 65, socket: "AM4", ddr: "DDR4", igpu: false, releaseYear: 2022, aliases: ["5700x", "ryzen 7 5700x"] },
  { id: "ryzen-5-5600x", label: "Ryzen 5 5600X", brand: "amd", gamingIndex: 55, multiIndex: 46, cores: 6, threads: 12, tdp: 65, socket: "AM4", ddr: "DDR4", igpu: false, releaseYear: 2020, aliases: ["5600x", "ryzen 5 5600x"] },
  { id: "ryzen-5-5600", label: "Ryzen 5 5600", brand: "amd", gamingIndex: 54, multiIndex: 45, cores: 6, threads: 12, tdp: 65, socket: "AM4", ddr: "DDR4", igpu: false, releaseYear: 2022, aliases: ["ryzen 5 5600", "5600"] },
  { id: "ryzen-5-5500", label: "Ryzen 5 5500", brand: "amd", gamingIndex: 45, multiIndex: 42, cores: 6, threads: 12, tdp: 65, socket: "AM4", ddr: "DDR4", igpu: false, releaseYear: 2022, aliases: ["5500", "ryzen 5 5500"] },

  // — Intel Core Ultra (Series 2, Arrow Lake, LGA1851) —
  { id: "core-ultra-9-285k", label: "Core Ultra 9 285K", brand: "intel", gamingIndex: 88, multiIndex: 98, cores: 24, threads: 24, tdp: 250, socket: "LGA1851", ddr: "DDR5", igpu: true, releaseYear: 2024, aliases: ["ultra 9 285k", "core ultra 9 285k", "285k"] },
  { id: "core-ultra-7-265k", label: "Core Ultra 7 265K", brand: "intel", gamingIndex: 84, multiIndex: 90, cores: 20, threads: 20, tdp: 250, socket: "LGA1851", ddr: "DDR5", igpu: true, releaseYear: 2024, aliases: ["ultra 7 265k", "core ultra 7 265k", "265k"] },
  { id: "core-ultra-5-245k", label: "Core Ultra 5 245K", brand: "intel", gamingIndex: 78, multiIndex: 74, cores: 14, threads: 14, tdp: 159, socket: "LGA1851", ddr: "DDR5", igpu: true, releaseYear: 2024, aliases: ["ultra 5 245k", "core ultra 5 245k", "245k"] },
  { id: "core-ultra-5-225", label: "Core Ultra 5 225", brand: "intel", gamingIndex: 72, multiIndex: 66, cores: 10, threads: 10, tdp: 65, socket: "LGA1851", ddr: "DDR5", igpu: true, releaseYear: 2025, aliases: ["ultra 5 225", "core ultra 5 225"] },

  // — Intel 14e generatie (Raptor Lake Refresh, LGA1700) —
  { id: "core-i9-14900k", label: "Core i9-14900K", brand: "intel", gamingIndex: 90, multiIndex: 95, cores: 24, threads: 32, tdp: 253, socket: "LGA1700", ddr: "DDR4/DDR5", igpu: true, releaseYear: 2023, aliases: ["i9 14900k", "i9-14900k", "14900k"] },
  { id: "core-i7-14700k", label: "Core i7-14700K", brand: "intel", gamingIndex: 85, multiIndex: 88, cores: 20, threads: 28, tdp: 253, socket: "LGA1700", ddr: "DDR4/DDR5", igpu: true, releaseYear: 2023, aliases: ["i7 14700k", "i7-14700k", "14700k"] },
  { id: "core-i5-14600k", label: "Core i5-14600K", brand: "intel", gamingIndex: 78, multiIndex: 72, cores: 14, threads: 20, tdp: 181, socket: "LGA1700", ddr: "DDR4/DDR5", igpu: true, releaseYear: 2023, aliases: ["i5 14600k", "i5-14600k", "14600k"] },
  { id: "core-i5-14400f", label: "Core i5-14400F", brand: "intel", gamingIndex: 68, multiIndex: 58, cores: 10, threads: 16, tdp: 148, socket: "LGA1700", ddr: "DDR4/DDR5", igpu: false, releaseYear: 2024, aliases: ["i5 14400f", "i5-14400f", "14400f"] },

  // — Intel 13e/12e generatie (LGA1700) —
  { id: "core-i5-13400f", label: "Core i5-13400F", brand: "intel", gamingIndex: 66, multiIndex: 56, cores: 10, threads: 16, tdp: 148, socket: "LGA1700", ddr: "DDR4/DDR5", igpu: false, releaseYear: 2023, aliases: ["i5 13400f", "i5-13400f", "13400f"] },
  { id: "core-i5-12400f", label: "Core i5-12400F", brand: "intel", gamingIndex: 60, multiIndex: 48, cores: 6, threads: 12, tdp: 117, socket: "LGA1700", ddr: "DDR4/DDR5", igpu: false, releaseYear: 2022, aliases: ["i5 12400f", "i5-12400f", "12400f"] },
];
