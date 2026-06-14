import { and, asc, eq, gt, inArray, sql } from "drizzle-orm";
import type { Db } from "./index";
import { listings, type ListingRow } from "./schema";
import { inferCategory } from "@/lib/relevance";
import type { ComponentType, PriceResult, Retailer } from "@/lib/types";

/** Hoe lang cache-rijen als "vers" gelden. */
export const LISTING_TTL_MS = 30 * 60 * 1000; // 30 minuten

/** Catalogus-rijen (categorie-browsen) mogen ouder zijn: scrape draait elke 6 uur. */
export const CATALOG_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dagen

function rowToResult(row: ListingRow): PriceResult {
  return {
    retailer: row.retailer as Retailer,
    name: row.name,
    priceEur: row.priceCents / 100,
    url: row.url,
    imageUrl: row.imageUrl ?? undefined,
    inStock: row.inStock,
    mock: row.mock || undefined,
  };
}

/** Haal verse aanbiedingen op voor een (genormaliseerde) zoekterm. */
export async function getFreshListings(
  db: Db,
  query: string,
  ttlMs: number = LISTING_TTL_MS
): Promise<PriceResult[]> {
  const cutoff = new Date(Date.now() - ttlMs);
  const rows = await db
    .select()
    .from(listings)
    .where(and(eq(listings.query, query), gt(listings.scrapedAt, cutoff)));
  return rows.map(rowToResult).sort((a, b) => a.priceEur - b.priceEur);
}

/**
 * Catalogus: alle verse, échte aanbiedingen voor één categorie, over alle
 * zoektermen heen. Ontdubbeld op URL (hetzelfde product kan onder meerdere
 * zoektermen zijn opgeslagen), gesorteerd op prijs.
 */
export async function getCatalogListings(
  db: Db,
  category: ComponentType,
  ttlMs: number = CATALOG_TTL_MS,
  limit: number = 100
): Promise<PriceResult[]> {
  const cutoff = new Date(Date.now() - ttlMs);
  const rows = await db
    .select()
    .from(listings)
    .where(
      and(
        eq(listings.category, category),
        eq(listings.mock, false),
        gt(listings.scrapedAt, cutoff)
      )
    )
    .orderBy(asc(listings.priceCents));

  const seen = new Set<string>();
  const unique: PriceResult[] = [];
  for (const row of rows) {
    const key = `${row.retailer}|${row.url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(rowToResult(row));
    if (unique.length >= limit) break;
  }
  return unique;
}

/**
 * Sla scrape-resultaten op: vervang per retailer de oude rijen voor deze
 * zoekterm. Retailers die dit keer niets teruggaven blijven staan tot hun
 * rijen verouderen. `category` komt van de aanroeper (categoriepagina's)
 * of wordt afgeleid uit de productnaam.
 */
export async function saveListings(
  db: Db,
  query: string,
  results: PriceResult[],
  source: string = "scraper",
  category?: ComponentType
): Promise<void> {
  if (results.length === 0) return;

  const retailers = [...new Set(results.map((r) => r.retailer))];

  const rows = results.map((r) => ({
    query,
    retailer: r.retailer,
    name: r.name,
    priceCents: Math.round(r.priceEur * 100),
    url: r.url,
    imageUrl: r.imageUrl ?? null,
    inStock: r.inStock,
    category: category ?? inferCategory(r.name),
    mock: r.mock ?? false,
    source: r.mock ? "mock" : source,
  }));

  await db.transaction(async (tx) => {
    await tx
      .delete(listings)
      .where(and(eq(listings.query, query), inArray(listings.retailer, retailers)));

    await tx.insert(listings).values(rows);

    // Prijshistorie: append een meetpunt per échte (niet-mock) aanbieding.
    // We slaan het over als het laatste punt voor deze (retailer, url) dezelfde
    // prijs heeft én jonger is dan 20 uur — zo blijft de tabel begrensd terwijl
    // elke prijswijziging wél wordt vastgelegd.
    for (const row of rows) {
      if (row.mock) continue;
      await tx.execute(sql`
        INSERT INTO price_history (retailer, url, name, price_cents, in_stock, category)
        SELECT ${row.retailer}, ${row.url}, ${row.name}, ${row.priceCents}, ${row.inStock}, ${row.category}
        WHERE NOT EXISTS (
          SELECT 1 FROM (
            SELECT price_cents, recorded_at FROM price_history
            WHERE retailer = ${row.retailer} AND url = ${row.url}
            ORDER BY recorded_at DESC LIMIT 1
          ) last
          WHERE last.price_cents = ${row.priceCents}
            AND last.recorded_at > now() - interval '20 hours'
        )
      `);
    }
  });
}

export interface PricePoint {
  /** Dag (YYYY-MM-DD) */
  day: string;
  /** Laagste gemeten prijs in centen op die dag, over alle meegegeven urls */
  priceCents: number;
}

/**
 * Prijsverloop voor een product: de laagste prijs per dag over een set
 * aanbiedings-urls (de retailers die de productpagina toont). Ontdubbeld op dag
 * zodat de grafiek één lijn "beste prijs over tijd" laat zien.
 */
export async function getPriceHistory(
  db: Db,
  urls: string[],
  days: number = 90
): Promise<PricePoint[]> {
  if (urls.length === 0) return [];
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const result = await db.execute(sql`
    SELECT to_char(date_trunc('day', recorded_at), 'YYYY-MM-DD') AS day,
           min(price_cents)::int AS price_cents
    FROM price_history
    WHERE url IN (${sql.join(urls.map((u) => sql`${u}`), sql`, `)})
      AND recorded_at > ${cutoff}
    GROUP BY 1
    ORDER BY 1
  `);
  const histRows = result.rows as { day: string; price_cents: number }[];
  return histRows.map((r) => ({ day: r.day, priceCents: Number(r.price_cents) }));
}
