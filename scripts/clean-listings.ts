/**
 * Eenmalige opschoning van de listings-tabel:
 *  1. verwijder junk-rijen (Harry Potter-figuren e.d.) — altijd
 *  2. verwijder rijen die niet in de categorie van hun zoekterm passen
 *     (accessoires zoals waterblocks bij GPU's, behuizingen bij SSD's)
 *  3. backfill de nieuwe `category`-kolom voor de overgebleven rijen
 *
 * Vereist dat de category-kolom bestaat (`npm run db:push` eerst).
 * Gebruik: npx tsx scripts/clean-listings.ts
 */
import { config } from "dotenv";
import { Pool } from "pg";
import { COMPONENT_META, COMPONENT_TYPES } from "../src/lib/categories";
import { isJunk, matchesCategory, inferCategory } from "../src/lib/relevance";
import type { ComponentType } from "../src/lib/types";

config({ path: ".env.local" });

function normalizeQuery(q: string): string {
  return q.toLowerCase().trim().replace(/\s+/g, " ");
}

/** zoekterm → categorie, op basis van COMPONENT_META (searchTerm + populaire tags) */
function queryCategoryMap(): Map<string, ComponentType> {
  const map = new Map<string, ComponentType>();
  for (const type of COMPONENT_TYPES) {
    const meta = COMPONENT_META[type];
    map.set(normalizeQuery(meta.searchTerm), type);
    for (const tag of meta.popularTags) map.set(normalizeQuery(tag), type);
  }
  return map;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL ontbreekt in .env.local");
  const pool = new Pool({ connectionString: url, max: 1 });

  const { rows } = await pool.query<{
    id: number;
    query: string;
    name: string;
    category: string | null;
  }>("select id, query, name, category from listings");

  const catMap = queryCategoryMap();
  const toDelete: number[] = [];
  const toCategorize: { id: number; category: string }[] = [];

  for (const row of rows) {
    if (isJunk(row.name)) {
      toDelete.push(row.id);
      continue;
    }
    const queryCat = catMap.get(row.query);
    if (queryCat) {
      if (!matchesCategory(row.name, queryCat)) {
        toDelete.push(row.id);
      } else if (row.category !== queryCat) {
        toCategorize.push({ id: row.id, category: queryCat });
      }
    } else if (!row.category) {
      const inferred = inferCategory(row.name);
      if (inferred) toCategorize.push({ id: row.id, category: inferred });
    }
  }

  // Testrommel ("deploy check ...") mag ook weg
  const { rows: testRows } = await pool.query<{ id: number }>(
    "select id from listings where query like 'deploy check%'"
  );
  for (const r of testRows) if (!toDelete.includes(r.id)) toDelete.push(r.id);

  console.log(`${rows.length} rijen gescand`);
  console.log(`${toDelete.length} irrelevante/junk-rijen verwijderen`);
  console.log(`${toCategorize.length} rijen voorzien van categorie`);

  if (toDelete.length > 0) {
    await pool.query("delete from listings where id = any($1)", [toDelete]);
  }
  for (const { id, category } of toCategorize) {
    await pool.query("update listings set category = $1 where id = $2", [category, id]);
  }

  const { rows: summary } = await pool.query(
    "select coalesce(category, '(geen)') as category, count(*)::int as n from listings group by 1 order by 2 desc"
  );
  console.log("\nResultaat per categorie:");
  for (const s of summary) console.log(`  ${s.category}: ${s.n}`);

  await pool.end();
  console.log("\nKlaar.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
