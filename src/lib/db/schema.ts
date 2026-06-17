import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  index,
  uniqueIndex,
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
 * Prijshistorie: één rij per gemeten prijs per aanbieding (retailer + url).
 * In tegenstelling tot `listings` worden deze rijen nooit overschreven, zodat
 * we het prijsverloop kunnen tonen. Schrijvers (de TS write-through én de
 * Python-scrapers) appenden alleen een punt als de prijs is veranderd of het
 * laatste punt ouder is dan ~20 uur — zo blijft de tabel begrensd.
 */
export const priceHistory = pgTable(
  "price_history",
  {
    id: serial("id").primaryKey(),
    retailer: text("retailer").notNull(),
    /** Stabiele product-identiteit: de retailer-productpagina-URL */
    url: text("url").notNull(),
    name: text("name").notNull(),
    priceCents: integer("price_cents").notNull(),
    inStock: boolean("in_stock").notNull().default(true),
    category: text("category"),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("price_history_url_idx").on(table.url, table.recordedAt),
    index("price_history_recorded_at_idx").on(table.recordedAt),
  ]
);

export type PriceHistoryRow = typeof priceHistory.$inferSelect;

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
    /** Opt-in: zichtbaar in de publieke build-community (/community). */
    published: boolean("published").notNull().default(false),
    /**
     * Hele-build prijsalert: mail de eigenaar zodra de actuele laagste totaalprijs
     * (onderdelen, excl. verzending) op/onder deze drempel komt. Null = geen alert.
     * `lastNotified*` = anti-spam (laatst gemailde prijs + tijdstip), net als price_alerts.
     */
    alertTargetCents: integer("alert_target_cents"),
    alertLastNotifiedCents: integer("alert_last_notified_cents"),
    alertLastNotifiedAt: timestamp("alert_last_notified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("builds_user_id_idx").on(table.userId),
    index("builds_published_idx").on(table.published),
  ]
);

export type BuildRow = typeof builds.$inferSelect;

/**
 * E-mail-prijsalerts (server-side, alleen voor ingelogde gebruikers). De
 * client-side volglijst (localStorage) blijft bestaan; dit is de opt-in om
 * een e-mail te krijgen zodra de prijs daalt. Een dagelijkse cron
 * (`/api/cron/price-alerts`) vergelijkt de laatste `price_history`-prijs met
 * `targetCents` en mailt via Resend.
 */
export const priceAlerts = pgTable(
  "price_alerts",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** Stabiele product-identiteit (categorie + genormaliseerde naam) */
    productId: text("product_id").notNull(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    /** De aanbieding waarvan we de prijs volgen (matcht price_history.url) */
    url: text("url").notNull(),
    retailer: text("retailer").notNull(),
    imageUrl: text("image_url"),
    /** Mail zodra de prijs op of onder deze drempel komt (in centen) */
    targetCents: integer("target_cents").notNull(),
    priceAtAddCents: integer("price_at_add_cents").notNull(),
    /** Anti-spam: laatst gemailde prijs + tijdstip (null = nog niet gemaild) */
    lastNotifiedCents: integer("last_notified_cents"),
    lastNotifiedAt: timestamp("last_notified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("price_alerts_user_idx").on(table.userId),
    // Eén alert per gebruiker per product
    uniqueIndex("price_alerts_user_product_idx").on(table.userId, table.productId),
  ]
);

export type PriceAlertRow = typeof priceAlerts.$inferSelect;
