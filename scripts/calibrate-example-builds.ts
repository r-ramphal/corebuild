/**
 * READ-ONLY kalibratie-hulp voor de voorbeeldbuild-richtprijzen.
 *
 * Toont per voorbeeldbuild-onderdeel de goedkoopste IN-STOCK kandidaten uit de
 * live catalogus (alleen SELECT — schrijft niets). Bedoeld om `budgetEur` in
 * src/lib/example-builds.ts periodiek met de markt te herijken: lees de
 * kandidaten, kies met oordeel een representatieve (legit, geen junk/verkeerd
 * model) prijs per onderdeel, tel op en rond conservatief naar boven af.
 *
 * Gebruik: npx tsx scripts/calibrate-example-builds.ts   (vereist DATABASE_URL in .env.local)
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { sql } from "drizzle-orm";
import { getDb } from "../src/lib/db";
import { EXAMPLE_BUILDS } from "../src/lib/example-builds";
import type { ComponentType } from "../src/lib/types";

/**
 * Onderscheidende zoek-substrings per onderdeel (ge-AND, ILIKE op de naam).
 * Bewust ruim: we tonen de goedkoopste kandidaten en kiezen met oordeel —
 * Ti/non-Ti en junk filteren we visueel, niet hard in SQL.
 */
const MATCH: Record<string, string[]> = {
  "budget-gamer:cpu": ["7600"],
  "budget-gamer:gpu": ["5060"],
  "budget-gamer:motherboard": ["b650"],
  "budget-gamer:ram": ["16gb", "ddr5"],
  "budget-gamer:storage": ["1tb"],
  "budget-gamer:psu": ["650w"],
  "budget-gamer:case": ["montech"],
  "budget-gamer:cooling": ["assassin x"],

  "esports-1080p:cpu": ["7700"],
  "esports-1080p:gpu": ["5060"],
  "esports-1080p:motherboard": ["b650"],
  "esports-1080p:ram": ["32gb", "ddr5"],
  "esports-1080p:storage": ["1tb"],
  "esports-1080p:psu": ["750w"],
  "esports-1080p:case": ["pop air"],
  "esports-1080p:cooling": ["peerless assassin"],

  "1440p-gamer:cpu": ["9800x3d"],
  "1440p-gamer:gpu": ["5070"],
  "1440p-gamer:motherboard": ["b650"],
  "1440p-gamer:ram": ["32gb", "ddr5"],
  "1440p-gamer:storage": ["2tb"],
  "1440p-gamer:psu": ["750w"],
  "1440p-gamer:case": ["north"],
  "1440p-gamer:cooling": ["phantom spirit"],

  "streamer:cpu": ["7900x"],
  "streamer:gpu": ["5070"],
  "streamer:motherboard": ["b650"],
  "streamer:ram": ["32gb", "ddr5"],
  "streamer:storage": ["2tb"],
  "streamer:psu": ["850w"],
  "streamer:case": ["h7"],
  "streamer:cooling": ["liquid freezer", "280"],

  "creator:cpu": ["9900x"],
  "creator:gpu": ["5070"],
  "creator:motherboard": ["x670e"],
  "creator:ram": ["64gb", "ddr5"],
  "creator:storage": ["2tb"],
  "creator:psu": ["850w"],
  "creator:case": ["define 7"],
  "creator:cooling": ["nh-d15"],

  "4k-powerhouse:cpu": ["9800x3d"],
  "4k-powerhouse:gpu": ["5080"],
  "4k-powerhouse:motherboard": ["x670e"],
  "4k-powerhouse:ram": ["32gb", "ddr5"],
  "4k-powerhouse:storage": ["2tb"],
  "4k-powerhouse:psu": ["1000w"],
  "4k-powerhouse:case": ["o11"],
  "4k-powerhouse:cooling": ["liquid freezer", "360"],
};

async function candidates(
  db: NonNullable<ReturnType<typeof getDb>>,
  category: ComponentType,
  includes: string[]
) {
  const conds = [sql`category = ${category}`, sql`in_stock = true`, sql`mock = false`];
  for (const inc of includes) conds.push(sql`lower(name) like ${"%" + inc.toLowerCase() + "%"}`);
  const where = sql.join(conds, sql` AND `);
  const res = await db.execute(sql`
    SELECT name, retailer, price_cents FROM listings
    WHERE ${where}
    ORDER BY price_cents ASC
    LIMIT 6
  `);
  return res.rows as { name: string; retailer: string; price_cents: number }[];
}

async function main() {
  const db = getDb();
  if (!db) {
    console.error("DATABASE_URL niet gezet — zet hem in .env.local");
    process.exit(1);
  }

  for (const build of EXAMPLE_BUILDS) {
    console.log(`\n========== ${build.name}  (huidige budgetEur €${build.budgetEur}, ${build.useCase}) ==========`);
    for (const part of build.parts) {
      const key = `${build.slug}:${part.type}`;
      const inc = MATCH[key] ?? [part.name.split(" ")[0].toLowerCase()];
      const rows = await candidates(db, part.type, inc);
      console.log(`\n  [${part.type}] ${part.name}   (match: ${inc.join(" + ")})`);
      if (rows.length === 0) {
        console.log("    (geen in-stock match)");
        continue;
      }
      for (const r of rows) {
        console.log(`    €${(r.price_cents / 100).toFixed(2).padStart(8)}  ${r.retailer.padEnd(10)} ${r.name}`);
      }
    }
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
