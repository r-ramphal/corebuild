import { and, eq, gt, inArray } from "drizzle-orm";
import type { Db } from "./index";
import { listings, type ListingRow } from "./schema";
import type { PriceResult, Retailer } from "@/lib/types";

/** Hoe lang cache-rijen als "vers" gelden. */
export const LISTING_TTL_MS = 30 * 60 * 1000; // 30 minuten

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
 * Sla scrape-resultaten op: vervang per retailer de oude rijen voor deze
 * zoekterm. Retailers die dit keer niets teruggaven blijven staan tot hun
 * rijen verouderen.
 */
export async function saveListings(
  db: Db,
  query: string,
  results: PriceResult[],
  source: string = "scraper"
): Promise<void> {
  if (results.length === 0) return;

  const retailers = [...new Set(results.map((r) => r.retailer))];

  await db.transaction(async (tx) => {
    await tx
      .delete(listings)
      .where(and(eq(listings.query, query), inArray(listings.retailer, retailers)));

    await tx.insert(listings).values(
      results.map((r) => ({
        query,
        retailer: r.retailer,
        name: r.name,
        priceCents: Math.round(r.priceEur * 100),
        url: r.url,
        imageUrl: r.imageUrl ?? null,
        inStock: r.inStock,
        mock: r.mock ?? false,
        source: r.mock ? "mock" : source,
      }))
    );
  });
}
