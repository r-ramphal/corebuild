/**
 * Past één migratie-SQL-bestand toe op de database in DATABASE_URL.
 *
 * Bewust géén drizzle-kit migrate: de bestaande tabellen zijn via db:push
 * aangemaakt (geen __drizzle_migrations-journal in de DB), dus `migrate` zou
 * 0000..N opnieuw willen draaien. Dit script voert exact één bestand uit — onze
 * migraties zijn idempotent (IF NOT EXISTS / guarded constraints), dus veilig.
 *
 * Gebruik:
 *   npx tsx scripts/apply-migration.ts drizzle/0007_add_two_factor.sql
 */
import { readFileSync } from "node:fs";
import { config } from "dotenv";
import { Pool } from "pg";

config({ path: ".env.local" });
config();

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Geef het pad naar het .sql-bestand op.");
    process.exit(1);
  }
  const url = process.env.DATABASE_URL ?? process.env.STORAGE_DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL ontbreekt (zet 'm in .env.local).");
    process.exit(1);
  }

  const sql = readFileSync(file, "utf8");
  const pool = new Pool({
    connectionString: url,
    ssl: /localhost|127\.0\.0\.1/.test(url) ? undefined : { rejectUnauthorized: true },
  });

  try {
    console.log(`Toepassen: ${file}`);
    // node-postgres voert meerdere statements in één simple query uit; de
    // `--> statement-breakpoint`-regels zijn SQL-commentaar (--) en worden genegeerd.
    await pool.query(sql);
    console.log("✓ Migratie toegepast.");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("✗ Migratie mislukt:", err);
  process.exit(1);
});
