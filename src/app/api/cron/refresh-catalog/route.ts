import { NextRequest, NextResponse } from "next/server";
import { searchMegekko } from "@/lib/scrapers/megekko";
import { searchAzerty } from "@/lib/scrapers/azerty";
import { searchAlternate } from "@/lib/scrapers/alternate";
import { getDb, normalizeQuery } from "@/lib/db";
import { saveListings } from "@/lib/db/listings";
import { matchesCategory } from "@/lib/relevance";
import { cleanName } from "@/lib/clean-name";
import { COMPONENT_TYPES, COMPONENT_META } from "@/lib/categories";
import type { ComponentType, PriceResult, Retailer } from "@/lib/types";

/**
 * Periodieke catalogus-verversing (Vercel Cron, zie vercel.json — elke 6 uur op
 * 02/08/14/20 UTC, 3 uur verschoven t.o.v. de GitHub-Action-scrape op 05/11/17/23).
 * Gecombineerd ververst dit de catalogus-prijzen elke ~3 uur i.p.v. elke 6.
 *
 * Scope (bewust licht gehouden, raakt de scrape-architectuur):
 * - Alleen de 3 datacenter-IP-vriendelijke retailers (megekko/azerty/alternate) —
 *   exact dezelfde set als de GitHub Action; Bol/Amazon vereisen een residentieel
 *   IP en blijven buiten beschouwing.
 * - Alleen de hoofd-`searchTerm` van de 8 kerncategorieën (de meest-bekeken
 *   catalogus-browsepagina's). De model-specifieke tag-queries blijven op de
 *   6-uurs Action-cadans en vallen anders terug op live scrapen.
 *
 * Hergebruikt dezelfde TS-scrapers + relevantiefilter + `saveListings`
 * (write-through naar `listings` + append naar `price_history`) als `/api/search`.
 * Beveiligd met CRON_SECRET (Vercel stuurt die als Bearer mee); ook handmatig te
 * testen met `GET /api/cron/refresh-catalog` + `Authorization: Bearer $CRON_SECRET`.
 */
export const runtime = "nodejs";
// Worst case: 8 termen serieel, elke scrape-fetch kan tot 15s aanlopen → ruim nemen.
export const maxDuration = 300;

const SCRAPE_RETAILERS: Retailer[] = ["megekko", "azerty", "alternate"];

/** Korte pauze tussen termen zodat we de retailers niet in een burst raken. */
const TERM_DELAY_MS = 800;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Alleen http(s)-URL's doorlaten — scrape-bronnen zijn extern en onvertrouwd. */
function hasSafeUrl(item: PriceResult): boolean {
  try {
    const u = new URL(item.url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

function scrape(retailer: Retailer, term: string): Promise<PriceResult[]> {
  switch (retailer) {
    case "megekko":
      return searchMegekko(term);
    case "azerty":
      return searchAzerty(term);
    case "alternate":
      return searchAlternate(term);
    default:
      return Promise.resolve([]);
  }
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET niet geconfigureerd" }, { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
  }

  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database niet beschikbaar" }, { status: 503 });

  const startedAt = Date.now();
  const perCategory: Partial<Record<ComponentType, number>> = {};
  const errors: { category: ComponentType; retailer: Retailer; message: string }[] = [];
  let totalSaved = 0;

  for (const cat of COMPONENT_TYPES) {
    const term = COMPONENT_META[cat].searchTerm;

    const settled = await Promise.allSettled(SCRAPE_RETAILERS.map((r) => scrape(r, term)));

    const fresh: PriceResult[] = [];
    settled.forEach((s, i) => {
      if (s.status === "fulfilled") fresh.push(...s.value);
      else errors.push({ category: cat, retailer: SCRAPE_RETAILERS[i], message: String(s.reason) });
    });

    // Relevantiefilter zoals de catalogusmodus van /api/search: naam opschonen,
    // veilige URL en alleen producten die echt in deze categorie thuishoren.
    const filtered = fresh
      .map((r) => ({ ...r, name: cleanName(r.name) }))
      .filter((r) => hasSafeUrl(r) && matchesCategory(r.name, cat));

    if (filtered.length > 0) {
      try {
        await saveListings(db, normalizeQuery(term), filtered, "cron", cat);
        totalSaved += filtered.length;
        perCategory[cat] = filtered.length;
      } catch (err) {
        console.error(`Catalogus-cron: opslaan mislukt voor ${cat}:`, err);
        errors.push({ category: cat, retailer: "megekko", message: `opslaan: ${String(err)}` });
      }
    }

    await sleep(TERM_DELAY_MS);
  }

  return NextResponse.json({
    categories: COMPONENT_TYPES.length,
    retailers: SCRAPE_RETAILERS,
    saved: totalSaved,
    perCategory,
    errors,
    ms: Date.now() - startedAt,
  });
}
