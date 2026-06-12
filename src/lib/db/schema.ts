import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export * from "./auth-schema";

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
    /** Componentcategorie (cpu/gpu/…) — gevuld door scrapers of afgeleid uit de naam */
    category: text("category"),
    /** Demo-data (mock-catalogus) zolang de retailer-API ontbreekt */
    mock: boolean("mock").notNull().default(false),
    /** Bron van de rij: "scraper" | "mock" | straks "api" / "python" */
    source: text("source").notNull().default("scraper"),
    scrapedAt: timestamp("scraped_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("listings_query_retailer_idx").on(table.query, table.retailer),
    index("listings_scraped_at_idx").on(table.scrapedAt),
    index("listings_category_idx").on(table.category),
  ]
);

export type ListingRow = typeof listings.$inferSelect;
export type NewListing = typeof listings.$inferInsert;

/**
 * Opgeslagen PC-builds. `components` is een JSON-snapshot van het
 * Zustand-buildstore-formaat: Partial<Record<ComponentType, PriceResult>>.
 * `publicId` is de deelbare identifier voor /build/[publicId].
 */
export const builds = pgTable(
  "builds",
  {
    id: serial("id").primaryKey(),
    publicId: text("public_id").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    components: jsonb("components").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("builds_user_id_idx").on(table.userId)]
);

export type BuildRow = typeof builds.$inferSelect;
