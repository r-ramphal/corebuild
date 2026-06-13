/**
 * Zoeksuggesties (typeahead): typ "ryzen" en krijg meteen concrete opties.
 * De index wordt één keer opgebouwd uit de spec-databases + categorieën +
 * populaire zoektermen, zodat suggesties zonder netwerkverzoek verschijnen.
 */
import { CPUS } from "@/lib/specs/cpu-data";
import { GPUS } from "@/lib/specs/gpu-data";
import { CATALOG_TYPES, COMPONENT_META } from "@/lib/categories";

export type SuggestionKind = "cpu" | "gpu" | "category" | "term";

export interface Suggestion {
  label: string;
  sub: string;
  href: string;
  kind: SuggestionKind;
}

const INDEX: Suggestion[] = [
  ...CPUS.map((c) => ({
    label: c.label,
    sub: "Processor",
    href: `/zoeken?q=${encodeURIComponent(c.label)}`,
    kind: "cpu" as const,
  })),
  ...GPUS.map((g) => ({
    label: g.label,
    sub: "Videokaart",
    href: `/zoeken?q=${encodeURIComponent(g.label)}`,
    kind: "gpu" as const,
  })),
  ...CATALOG_TYPES.map((t) => ({
    label: COMPONENT_META[t].pageTitle,
    sub: "Categorie",
    href: `/categorie/${t}`,
    kind: "category" as const,
  })),
  ...CATALOG_TYPES.flatMap((t) =>
    COMPONENT_META[t].popularTags.map((tag) => ({
      label: tag,
      sub: COMPONENT_META[t].shortLabel,
      href: `/zoeken?q=${encodeURIComponent(tag)}`,
      kind: "term" as const,
    }))
  ),
];

/** Suggesties voor een (deel)zoekterm: prefix-matches eerst, daarna bevat-matches. */
export function getSuggestions(query: string, limit = 7): Suggestion[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const starts: Suggestion[] = [];
  const contains: Suggestion[] = [];
  const seen = new Set<string>();

  for (const s of INDEX) {
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
