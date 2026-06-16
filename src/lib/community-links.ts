import type { ComponentType } from "./types";

/**
 * Verwijzing naar de bouw-community per categorie. Bewust **alleen linken** —
 * geen Reddit-content opgeslagen of getoond (conform de compliance-keuze in
 * deel 21). We linken naar een r/buildapc-zoekopdracht over compatibiliteit voor
 * dat onderdeeltype; een search-URL bestaat altijd, dus geen dode links.
 */
const COMMUNITY_TERMS: Partial<Record<ComponentType, string>> = {
  cpu: "cpu motherboard socket compatibility",
  motherboard: "motherboard cpu compatibility",
  ram: "ram compatibility ddr",
  gpu: "gpu case clearance fit",
  psu: "psu wattage how much",
  case: "case motherboard size fit",
  cooling: "cpu cooler clearance fit",
  storage: "ssd nvme compatibility",
};

export function communityLink(type: ComponentType): { label: string; href: string } {
  const term = COMMUNITY_TERMS[type] ?? "pc part compatibility";
  return {
    label: "Lees mee op r/buildapc",
    href: `https://www.reddit.com/r/buildapc/search/?q=${encodeURIComponent(term)}&restrict_sr=1&sort=relevance`,
  };
}
