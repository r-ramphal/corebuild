import type { ComponentType } from "./types";

/**
 * Echte product-foto per kerncategorie (license-free, met sharp geoptimaliseerd
 * naar webp in public/images/cat). Alleen de 8 build-slots hebben een foto;
 * randapparatuur/accessoires vallen terug op het categorie-icoon.
 *
 * Gecentraliseerd zodat de homepage-bento (GiastCategories) en de
 * categorie-header dezelfde bron delen.
 */
export const CATEGORY_IMAGES: Partial<Record<ComponentType, string>> = {
  cpu: "/images/cat/cpu.webp",
  gpu: "/images/cat/gpu.webp",
  motherboard: "/images/cat/motherboard.webp",
  ram: "/images/cat/ram.webp",
  storage: "/images/cat/storage.webp",
  psu: "/images/cat/psu.webp",
  case: "/images/cat/case.webp",
  cooling: "/images/cat/cooling.webp",
};
