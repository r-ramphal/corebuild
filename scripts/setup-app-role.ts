/**
 * Maakt/ververst de least-privilege applicatierol `corebuild_app` en verifieert
 * 'm tegen de live DB — ZONDER productie te raken (de draaiende app blijft op de
 * owner-rol tot je de Vercel-env omzet).
 *
 * Wat het doet:
 *  1. genereert een sterk wachtwoord (komt nooit in de output of de repo);
 *  2. CREATE/ALTER ROLE corebuild_app (login, geen superuser/createdb/createrole);
 *  3. past scripts/sql/least-privilege-grants.sql toe (als owner);
 *  4. verbindt ALS corebuild_app en test: SELECT, INSERT/UPDATE/DELETE (in een
 *     teruggedraaide transactie → niets blijft staan) en dat DDL (CREATE TABLE)
 *     GEWEIGERD wordt;
 *  5. schrijft de nieuwe connection string naar het gitignored `.app-role-url`.
 *
 * Gebruik (owner-URL uit .env.local):
 *   npx tsx scripts/setup-app-role.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { config } from "dotenv";
import { Pool } from "pg";

config({ path: ".env.local" });
config();

const APP_ROLE = "corebuild_app";

function ownerUrl(): string {
  const url = process.env.DATABASE_URL ?? process.env.STORAGE_DATABASE_URL;
  if (!url) throw new Error("Geen owner-DATABASE_URL in .env.local");
  return url;
}

/** Bouw de app-rol-URL: zelfde host/db/params, andere user + wachtwoord. */
function appUrl(owner: string, password: string): string {
  const u = new URL(owner);
  u.username = APP_ROLE;
  u.password = password;
  return u.toString();
}

function mask(url: string): string {
  const u = new URL(url);
  return `${u.protocol}//${u.username}:***@${u.host}${u.pathname}`;
}

async function main() {
  const owner = ownerUrl();
  // base64url → alleen [A-Za-z0-9-_], veilig in zowel een SQL-literal als een URL.
  const password = randomBytes(24).toString("base64url");

  const ownerPool = new Pool({
    connectionString: owner,
    ssl: { rejectUnauthorized: true },
  });

  try {
    const exists = await ownerPool.query("SELECT 1 FROM pg_roles WHERE rolname = $1", [APP_ROLE]);
    const verb = exists.rowCount ? "ALTER" : "CREATE";
    await ownerPool.query(
      `${verb} ROLE ${APP_ROLE} WITH LOGIN PASSWORD '${password}' NOSUPERUSER NOCREATEDB NOCREATEROLE`
    );
    console.log(`✓ Rol ${APP_ROLE} ${verb === "CREATE" ? "aangemaakt" : "wachtwoord ververst"}.`);

    const grants = readFileSync("scripts/sql/least-privilege-grants.sql", "utf8");
    await ownerPool.query(grants);
    console.log("✓ Grants toegepast (SELECT/INSERT/UPDATE/DELETE + sequences, geen DDL).");
  } finally {
    await ownerPool.end();
  }

  // ---- Verificatie als de nieuwe rol ----
  const url = appUrl(owner, password);
  const appPool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: true } });
  const results: string[] = [];
  let ok = true;

  try {
    const who = await appPool.query("SELECT current_user");
    results.push(`verbonden als: ${who.rows[0].current_user}`);

    // SELECT op alle tabellen (leesrecht)
    await appPool.query("SELECT count(*) FROM listings");
    await appPool.query('SELECT count(*) FROM "user"');
    results.push("SELECT op listings + user: OK");

    // INSERT/UPDATE/DELETE in een teruggedraaide transactie → niets blijft staan
    const c = await appPool.connect();
    try {
      await c.query("BEGIN");
      await c.query(
        "INSERT INTO listings (query, retailer, name, price_cents, url) VALUES ($1,$2,$3,$4,$5)",
        ["__perm_test__", "test", "permcheck", 1, "http://example.com/permcheck"]
      );
      await c.query("UPDATE listings SET name = $1 WHERE query = $2", ["permcheck2", "__perm_test__"]);
      await c.query("DELETE FROM listings WHERE query = $1", ["__perm_test__"]);
      await c.query("ROLLBACK");
      results.push("INSERT/UPDATE/DELETE (rolled back): OK");
    } catch (e) {
      await c.query("ROLLBACK").catch(() => {});
      ok = false;
      results.push(`INSERT/UPDATE/DELETE: GEFAALD — ${(e as Error).message}`);
    } finally {
      c.release();
    }

    // DDL moet GEWEIGERD worden. In een transactie + rollback → ongevaarlijk,
    // óók als het onverwacht zou slagen.
    const d = await appPool.connect();
    try {
      await d.query("BEGIN");
      await d.query("CREATE TABLE __perm_test_ddl__ (x int)");
      await d.query("ROLLBACK");
      ok = false;
      results.push("DDL (CREATE TABLE): TOEGESTAAN — grants te ruim! (teruggedraaid)");
    } catch {
      await d.query("ROLLBACK").catch(() => {});
      results.push("DDL (CREATE TABLE): correct GEWEIGERD ✓");
    } finally {
      d.release();
    }
  } finally {
    await appPool.end();
  }

  console.log("\n--- Verificatie ---");
  for (const r of results) console.log("  " + r);

  if (!ok) {
    console.error("\n✗ Verificatie NIET volledig groen — NIET naar productie omzetten.");
    process.exit(1);
  }

  writeFileSync(".app-role-url", url + "\n", { mode: 0o600 });
  console.log(`\n✓ Alles groen. Connection string weggeschreven naar .app-role-url (gitignored).`);
  console.log(`  ${mask(url)}`);
  console.log("\nVolgende (gated) stap: deze als DATABASE_URL in Vercel-Production zetten + redeploy.");
}

main().catch((e) => {
  console.error("FOUT:", e.message);
  process.exit(1);
});
