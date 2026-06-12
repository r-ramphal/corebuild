import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

/**
 * Centrale datalaag (database-first): alle prijsdata komt hier samen.
 *
 * Schrijvers: de Next.js zoekroute (write-through cache), straks de
 * Python-scrapers en de officiële API's (Bol Marketing API, Amazon PA-API).
 * Lezers: de Next.js frontend via /api/search.
 *
 * Eén rij = één aanbieding (retailer-listing) voor één zoekterm.
 * Verversing gebeurt per (query, retailer): oude rijen worden vervangen.
 */
export const listings = pgTable(
  "listings",
  {
    id: serial("id").primaryKey(),
    /** Genormaliseerde zoekterm (lowercase, enkele spaties) */
    query: text("query").notNull(),
    retailer: text("retailer").notNull(),
    name: text("name").notNull(),
    /** Prijs in centen — voorkomt floating-point-gedoe */
    priceCents: integer("price_cents").notNull(),
    url: text("url").notNull(),
    imageUrl: text("image_url"),
    inStock: boolean("in_stock").notNull().default(true),
    /** Demo-data (mock-catalogus) zolang de retailer-API ontbreekt */
    mock: boolean("mock").notNull().default(false),
    /** Bron van de rij: "scraper" | "mock" | straks "api" / "python" */
    source: text("source").notNull().default("scraper"),
    scrapedAt: timestamp("scraped_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("listings_query_retailer_idx").on(table.query, table.retailer),
    index("listings_scraped_at_idx").on(table.scrapedAt),
  ]
);

export type ListingRow = typeof listings.$inferSelect;
export type NewListing = typeof listings.$inferInsert;
