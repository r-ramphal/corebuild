import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export type Db = NodePgDatabase<typeof schema>;

let db: Db | null | undefined;

/**
 * Lazy database-client. Geeft `null` terug zolang DATABASE_URL niet gezet is —
 * de app draait dan volledig op live scrapers + mock-fallback (geen DB vereist).
 */
export function getDb(): Db | null {
  if (db !== undefined) return db;

  const url = process.env.DATABASE_URL;
  if (!url) {
    db = null;
    return db;
  }

  const pool = new Pool({
    connectionString: url,
    max: 3, // serverless: weinig connecties per instance
    // Neon/Supabase vereisen TLS; lokale Postgres niet
    ssl: /localhost|127\.0\.0\.1/.test(url) ? undefined : { rejectUnauthorized: false },
  });

  db = drizzle(pool, { schema });
  return db;
}

/** Normaliseer een zoekterm zodat cache-lookups consistent zijn. */
export function normalizeQuery(q: string): string {
  return q.toLowerCase().trim().replace(/\s+/g, " ");
}
