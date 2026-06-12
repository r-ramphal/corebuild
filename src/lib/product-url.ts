import type { ComponentType, PriceResult } from "./types";

/** Maak een URL-veilige slug van een productnaam. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Bouw de URL van de productdetailpagina. De exacte naam reist mee als
 * query-param zodat de pagina alle retailerprijzen kan opzoeken;
 * de categorie bepaalt het build-slot en de breadcrumb.
 */
export function productUrl(item: Pick<PriceResult, "name">, category?: ComponentType): string {
  const params = new URLSearchParams({ q: item.name });
  if (category) params.set("cat", category);
  return `/product/${slugify(item.name)}?${params.toString()}`;
}
