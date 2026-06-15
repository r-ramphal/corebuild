/**
 * Zoeksuggesties (typeahead): typ "ryzen" en krijg meteen concrete opties.
 * De index wordt één keer opgebouwd uit de spec-databases + categorieën +
 * populaire zoektermen, zodat suggesties zonder netwerkverzoek verschijnen.
 */
import { CPUS } from "@/lib/specs/cpu-data";
import { GPUS } from "@/lib/specs/gpu-data";
import { CATALOG_TYPES, COMPONENT_META } from "@/lib/categories";
import type { ComponentType } from "@/lib/types";

export type SuggestionKind = "cpu" | "gpu" | "category" | "term";

export interface Suggestion {
  label: string;
  sub: string;
  href: string;
  kind: SuggestionKind;
  /** Bij welke categorie hoort deze suggestie (voor het filteren per zoekveld). */
  category?: ComponentType;
}

const INDEX: Suggestion[] = [
  ...CPUS.map((c) => ({
    label: c.label,
    sub: "Processor",
    href: `/zoeken?q=${encodeURIComponent(c.label)}`,
    kind: "cpu" as const,
    category: "cpu" as ComponentType,
  })),
  ...GPUS.map((g) => ({
    label: g.label,
    sub: "Videokaart",
    href: `/zoeken?q=${encodeURIComponent(g.label)}`,
    kind: "gpu" as const,
    category: "gpu" as ComponentType,
  })),
  ...CATALOG_TYPES.map((t) => ({
    label: COMPONENT_META[t].pageTitle,
    sub: "Categorie",
    href: `/categorie/${t}`,
    kind: "category" as const,
    category: t,
  })),
  ...CATALOG_TYPES.flatMap((t) =>
    COMPONENT_META[t].popularTags.map((tag) => ({
      label: tag,
      sub: COMPONENT_META[t].shortLabel,
      href: `/zoeken?q=${encodeURIComponent(tag)}`,
      kind: "term" as const,
      category: t,
    }))
  ),
];

/**
 * Suggesties voor een (deel)zoekterm: prefix-matches eerst, daarna bevat-matches
 * (de getypte letters in dezelfde volgorde). Met `category` worden alleen de
 * suggesties van dat type getoond — handig voor een categorie-specifiek zoekveld;
 * de losse "ga naar categorie"-links vallen dan weg.
 */
export function getSuggestions(query: string, limit = 7, category?: ComponentType): Suggestion[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const pool = category
    ? INDEX.filter((s) => s.category === category && s.kind !== "category")
    : INDEX;

  const starts: Suggestion[] = [];
  const contains: Suggestion[] = [];
  const seen = new Set<string>();

  for (const s of pool) {
    const l = s.label.toLowerCase();
    if (seen.has(l)) continue;
    if (l.startsWith(q)) {
      starts.push(s);
      seen.add(l);
    } else if (l.includes(q)) {
      contains.push(s);
      seen.add(l);
    }
  }
  return [...starts, ...contains].slice(0, limit);
}
