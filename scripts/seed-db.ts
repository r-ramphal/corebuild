/**
 * Seed de database met demo-data uit de mock-catalogus.
 * Gebruik: npm run db:seed (vereist DATABASE_URL in .env.local)
 *
 * Dit script is tegelijk het sjabloon voor de toekomstige Python-scrapers:
 * schrijf rijen in `listings` met een genormaliseerde query, en de site
 * serveert ze direct uit de database.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { getDb, normalizeQuery } from "../src/lib/db";
import { saveListings } from "../src/lib/db/listings";
import { searchMock } from "../src/lib/mock/catalog";
import { COMPONENT_TYPES, COMPONENT_META } from "../src/lib/categories";

async function main() {
  const db = getDb();
  if (!db) {
    console.error("DATABASE_URL niet gezet — zet hem in .env.local");
    process.exit(1);
  }

  let total = 0;

  for (const type of COMPONENT_TYPES) {
    const meta = COMPONENT_META[type];
    const queries = [meta.searchTerm, ...meta.popularTags];

    for (const q of queries) {
      const nq = normalizeQuery(q);
      const results = [
        ...searchMock("bol", q),
        ...searchMock("amazon", q),
      ];
      if (results.length === 0) continue;
      await saveListings(db, nq, results, "seed");
      total += results.length;
      console.log(`✓ ${nq.padEnd(40)} ${results.length} rijen`);
    }
  }

  console.log(`\nKlaar — ${total} demo-aanbiedingen geseed.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
